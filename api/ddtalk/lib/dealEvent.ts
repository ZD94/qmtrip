/*
 *   time  @ 2017.3.10
 *   conten@钉钉事件处理函数
 */

'use strict';
import fs = require("fs");
import cache from "common/cache";
const C = require("config");

const config = {
    token: 'jingli2016',
    encodingAESKey: '8nf2df6n0hiifsgg521mmjl6euyxoy3y6d9d3mt1laq',
    suiteid: 'suitezutlhpvgyvgakcdo',
    secret: 'pV--T2FZj-3QCjJzcQd5OnzDBAe6rRKRQGEmc8iVCvdtc2FUOS5icq1gVfkbqiTx',
    appid: '2156',
}

var Logger = require('common/logger');
var logger = new Logger('main');
import request = require('request');
import ISVApi from "./isvApi";
import CorpApi from "./corpApi";
import {reqProxy} from "./reqProxy";
import {Company} from "_types/company";
import {Staff, EStaffRole} from "_types/staff";
import {Models} from "_types/index";
import L from 'common/language';

import {md5} from "common/utils";
import {DDTalkCorp , DDTalkDepartment , DDTalkUser} from "_types/ddtalk";



const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;
const DEFAULT_PWD = '000000';

let moment = require("moment");
/* get after 30 days date */
function getDate(){
    let oneDay = 60 * 60 * 24 * 1000;
    let now    = +new Date();
    return moment(now + oneDay*30).format('YYYY-MM-DD');
}


export async function tmpAuthCode(msg) {
    const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
    let isExist = await cache.read(TMP_CODE_KEY);
    if (isExist) {
        console.log("exist ?");
        return;
    }

    //暂时缓存，防止重复触发
    await cache.write(TMP_CODE_KEY, true, 60 * 2);
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token'];

    //永久授权码和企业名称及id
    let permanentAuthMsg: any = await _getPermanentCode(suiteToken, msg.AuthCode);
    let permanentCode = permanentAuthMsg['permanent_code'];

    let corp_name = permanentAuthMsg.auth_corp_info.corp_name;

    //test
    // let corp_name = "鲸力测试3.16";
    // let permanentCode = "MiWZd0Ja6qRtHydnRjavun3Hv6xEjSQ0oyaAkGO2bP2wAQb0L6NeLvOQ1KQPrABD";
    //
    // let corpid = "ding3c92322d23dbbbfa35c2f4657eb6378f";
    //test end.

    let corpid = permanentAuthMsg.auth_corp_info.corpid;
    let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, permanentCode);

    //获取企业授权的授权数据 , 拿到管理员信息
    let authInfo: any = await isvApi.getCorpAuthInfo();
    let authUserInfo = authInfo.auth_user_info;

    //agentID每次都会变,所以每次授权都要获取我们对应的agentid
    let agents = authInfo.auth_info.agent || [];
    let agentid = '';
    for (let agent of agents) {
        if (agent['appid'] == config.appid) {
            agentid = agent['agentid'];
            break;
        }
    }

    //生成获取该企业信息api对象
    let corpAccessToken = await isvApi.getCorpAccessToken();
    let corpApi = new CorpApi(corpid, corpAccessToken);

    //拿到管理员的个人信息
    let userInfo: any = await corpApi.getUser(authUserInfo.userId);

    //查找本地记录的企业信息
    let corps = await Models.ddtalkCorp.find({where: {corpId: corpid}});
    if (corps && corps.length) {
        //有记录，曾经授权过
        let corp = corps[0];
        let company = await corp.getCompany(corp['company_id']);
        //修改状态，可能解除过
        company.status = 1;
        company.name = corp_name;
        company = await company.save();

        //解绑 == false
        corp.isSuiteRelieve = false;
        corp.permanentCode = permanentCode;
        corp.agentid = agentid;
        //更新企业对照表
        corp = await corp.save();


        // console.log("企业信息有记录 , 已经更新");
    } else {
        // console.log("企业信息没有记录 , 创建企业");
        //创建企业
        let company = Company.create({name: corp_name , expiryDate : getDate() });
        company = await company.save();
        console.log("company created");

        let travelPolicy = await company.getDefaultTravelPolicy();
        let corp = Models.ddtalkCorp.create({
            id: company.id,
            corpId: corpid,
            permanentCode: permanentCode,
            companyId: company.id,
            isSuiteRelieve: false,
            agentid: agentid
        });
        await corp.save();
        // console.log("ddtalkCorp  created");

        /* ====== 单独处理 创建者信息 ====== */
        //在staff中新增一个员工
        let staff = Staff.create({
            name: userInfo.name,
            status: 1,
            roleId: EStaffRole.OWNER,
            travelPolicyId: travelPolicy.id
        });
        staff.pwd = md5(DEFAULT_PWD);
        staff.company = company;
        staff = await staff.save();
        // console.log("staff  owner staff created.");

        //更新公司信息 ，保存创建者id
        company.createUser = staff.id;
        await company.save();

        //修改对照表
        let ddtalkUser = Models.ddtalkUser.create({
            id: staff.id,
            dingId: userInfo.dingId,
            ddUserId: userInfo.userid,
            isAdmin: userInfo.isAdmin,
            name: userInfo.name,
            avatar: userInfo.avatar,
            corpid: corpid,   //钉钉企业id
        });
        await ddtalkUser.save();

        /* ====== 单独处理 创建者信息 ===  END  === */

        //保存部门信息
        // console.log(userInfo , "创建结束");
        try {
            dealCompanyOrganization(corpApi, corp);
        } catch (err) {
            console.error("导入企业组织结构出错", err)
            throw err;
        }
    }

    await isvApi.activeSuite();
    await corpApi.registryContractChangeLister(config.token, config.encodingAESKey, C.host + '/ddtalk/isv/receive');
}


interface suiteTokenCached {
    suite_access_token: string;
    expire_at: number;
}

export async function _getSuiteToken(): Promise<any> {

    let ticketObj: any = await cache.read(CACHE_KEY);
    if (typeof ticketObj == 'string') {
        ticketObj = JSON.parse(ticketObj);
    }
    if (!ticketObj || !ticketObj.ticket ) {
        throw new Error(`还没有ticket`);
    }
    let ticket = ticketObj.ticket;

    if (!ticket) {
        throw new Error('不存在ticket');
    }
    let key = `ddtalk:suite_access_token:${config.suiteid}`;
    let d = await cache.readAs<suiteTokenCached>(key)
    if (d && d.expire_at > Date.now()) {
        return d;
    }

    let url = `https://oapi.dingtalk.com/service/get_suite_token`;
    let ret: any = await reqProxy(url, {
        name: '获取套件Token',
        body: {
            suite_key: config.suiteid,
            suite_secret: config.secret,
            suite_ticket: ticket
        }
    });


    d = {suite_access_token: ret.suite_access_token, expire_at: (ret.expires_in - 30) * 1000 + Date.now() };
    cache.write(key, JSON.stringify(d))
    return d;


    // return {"suite_access_token": "52cbe90c68de31b6b6ffa881dd0b8b6b", "expire_at": 1489560379128}
}


async function _getPermanentCode(suiteToken, tmpAuthCode) {
    let url = 'https://oapi.dingtalk.com/service/get_permanent_code';
    return reqProxy(url, {
        name: '获取永久授权码',
        qs: {
            suite_access_token: suiteToken,
        },
        body: {
            tmp_auth_code: tmpAuthCode,
        }
    })
}

interface getISVandCorp {
    isvApi: any;
    corpApi: any;
}

//提供isv , corp 的api对象
async function getISVandCorp(corp : DDTalkCorp): Promise<getISVandCorp> {
    let corpId = corp.corpId;
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token']

    let isvApi = new ISVApi(config.suiteid, suiteToken, corpId, corp.permanentCode);
    let corpApi = await isvApi.getCorpApi();

    return {
        isvApi: isvApi,
        corpApi: corpApi
    }
}

/*
 * 从钉钉导入企业部门
 *  corpApi : 获取对应企业的各项信息对象
 *  corp    : ddtalk.corps 对象
 */
export async function dealCompanyOrganization(corpApi: CorpApi, corp : DDTalkCorp) {
    console.log("enter dealCompanyOrganization");
    //拿到部门列表
    let DDdepartments = await corpApi.getDepartments(),
        company = await corp.getCompany(corp['company_id']),
        corpId  = corp.corpId,
        rootLocalDepartmentId,
        localDepartments = [],
        localDepartment_ids = [],
        Translate = {},
        Translate2 = {};

    for(let d of DDdepartments){
        let isDefault = false;
        let ddtalkDepart , localDepart;

        if(d["parentid"] == undefined){
            isDefault = true;
        }

        let ddtalkDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : corpId , DdDepartmentId : d.id+'' }
        });

        console.log("for : " , d.name);
        if(ddtalkDeparts && ddtalkDeparts[0]){
            //有这个部门的钉钉对应关系
            ddtalkDepart = ddtalkDeparts[0];
            localDepart  = await Models.department.get(ddtalkDepart.localDepartmentId);
            if(localDepart){
                localDepart.name = d.name;
                localDepart = await localDepart.save();
            }else{
                //创建这个部门
                localDepart = Models.department.create({
                    name : d.name,
                    isDefault : isDefault
                });
                localDepart.company = company;
                localDepart = await localDepart.save();
            }
        }else{
            //没有这个部门的钉钉对应关系

            //创建这个部门
            localDepart = Models.department.create({
                name : d.name,
                isDefault : isDefault
            });
            localDepart.company = company;
            localDepart = await localDepart.save();

            //create ddtalk.department
            ddtalkDepart = Models.ddtalkDepartment.create({
                localDepartmentId: localDepart.id,
                DdDepartmentId: d.id+'',
                corpId: corpId
            });
            ddtalkDepart = await ddtalkDepart.save();
        }

        //保存本地部门对象
        localDepartments.push(localDepart);
        localDepartment_ids.push(localDepart.id);

        //处理部门间关系
        rootLocalDepartmentId = isDefault ? localDepart.id : undefined;
        // dd_id : local_id
        Translate[d.id] = localDepart.id;
        // local_id : dd_parentid
        Translate2[localDepart.id] = d.parentid;
    }

    /* ========   清除钉钉中没有的部门  ======== */
    console.log("some problem");
    let deleDeparts = await Models.department.find({
        where : {companyId : company.id, id : { $notIn : localDepartment_ids}}
    });
    console.log("some problem2");
    let deleDdtalkDeparts = await Models.ddtalkDepartment.find({
        where : { corpId : corpId , localDepartmentId:{ $notIn : localDepartment_ids} }
    });

    //将要清除的钉钉部门，删除staffDepartment关系
    deleDeparts.map(async (item)=>{
        let staffDeparts = await Models.staffDepartment.find({
            where : { localDepartmentId : item.id }
        });
        await arrDestroy(staffDeparts);
    });
    await arrDestroy(deleDdtalkDeparts);
    await arrDestroy(deleDeparts);

    /* ==========  END   ====== */

    /*  ========== 追加部门层级关系 ========  */
    for(let item of localDepartments){
        if (Translate2[item.id] == 1) {
            //根部门
            item.parentId = rootLocalDepartmentId;
        } else if (Translate2[item.id] == undefined) {
            item.parentId = null;
        } else {
            item.parentId = Translate[Translate2[item.id]];
        }

        await item.save();
    }

    /*  ========== 追加部门层级关系 ===  END   =====  */

    for (let d of DDdepartments) {
        //添加用户
        await addCompanyStaffs(corpApi, d.id, corp);
    }
}

/*
 *   从钉钉导入一个部门的员工
 *   corpApi : 获取对应企业的各项信息对象
 *   corp    : ddtalk.corps 对象
 */

export async function addCompanyStaffs(corpApi: CorpApi, DdDepartmentId: any, corp) {
    console.log("enter addCompanyStaffs");
    let company = await corp.getCompany(corp["company_id"]);
    let corpid = corp.corpId;
    let dingUsers = await corpApi.getUserListByDepartment(DdDepartmentId);
    let travelPolicy = await company.getDefaultTravelPolicy();

    // 处理该员工与部门的关系
    let itemDepart = await Models.ddtalkDepartment.find({
        where: {DdDepartmentId: DdDepartmentId.toString(), corpId: corpid}
    });
    if(!itemDepart || !itemDepart[0]){
        logger.warn("这个部门不存在  dd_department_id :" , DdDepartmentId , "corpid : " , corpid)
        throw new Error("这个部门不存在");
    }
    let localDepartId = itemDepart[0].localDepartmentId;



    let localStaff_ids = [];
    for (let u of dingUsers) {
        console.log("u.name  " , u.name);
        let ddtalkUserInfos = await Models.ddtalkUser.find({
            where: {corpid: corpid, ddUserId: u.userid}
        });
        let dd_info = JSON.stringify(u);

        console.log("go");
        let _staff , ddtalkUser;
        if (ddtalkUserInfos && ddtalkUserInfos.length) {
            let ddtalkUser = ddtalkUserInfos[0];

            //更新dd_info
            ddtalkUser.ddInfo = dd_info;

            ddtalkUser = await ddtalkUser.save();

            _staff = await Models.staff.get(ddtalkUser.id);
            if (_staff) {
                console.log("s : ");
                _staff.company = company;
                _staff.email = u.email;
                _staff.mobile = u.mobile;
                _staff.avatar = u.avatar;
                _staff = await _staff.save();
            }else{
                console.log("ddtalkUser 有， staff中没有")
            }
        }else{
            // staff 中新加入员工
            _staff = Models.staff.create({name: u.name, travelPolicyId: travelPolicy.id});
            _staff.company = company;
            _staff.pwd = md5(DEFAULT_PWD);
            _staff.status = 1;
            _staff.email = u.email;
            _staff.mobile = u.mobile;
            _staff.avatar = u.avatar;
            _staff = await _staff.save();

            console.log("staff 中新加入员工");

            //ddtalkUser 中新加入员工
            let ddtalkUser = Models.ddtalkUser.create({
                id: _staff.id,
                avatar: u.avatar,
                dingId: u.dingId,
                isAdmin: u.isAdmin,
                name: u.name,
                ddUserId: u.userid,
                corpid: corpid,
                ddInfo: dd_info
            });
            await ddtalkUser.save();
            console.log("ddtalkUser 中新加入员工");
        }

        localStaff_ids.push(_staff.id);

        let staffDepart = await Models.staffDepartment.find({ where : {
            staffId: _staff.id,
            departmentId: localDepartId
        } });

        if(staffDepart && staffDepart.length){
            //a ready have
            continue;
        }else{
            let staffDepart = Models.staffDepartment.create({
                staffId: _staff.id,
                departmentId: localDepartId
            });
            await staffDepart.save();
        }
    }



    //针对这个部门的staffDepartment清理该部门下没有的 staff_department
    let staffDeparts = await Models.staffDepartment.find({
        where : { departmentId : localDepartId , staffId : { $notIn : localStaff_ids } }
    });
    await Promise.all(staffDeparts.map((item)=>item.destroy()));

    console.log("addCompanyStaffs  over");
}

/*
 *  手动触发同步钉钉组织架构
 *
 */

export async function synchroDDorganization() {
    let current = await Staff.getCurrent();
    if(current.roleId != EStaffRole.OWNER && current.roleId != EStaffRole.ADMIN){
        throw L.ERR.PERMISSION_DENY();
    }
    /*let test = await Models.ddtalkCorp.find({where : { "companyId" : "658cd3a0-bde4-11e6-997b-a9af9a42d08a" }});
     test.map(async (item)=>{
         await item.destroy();
     });

     test = Models.ddtalkCorp.create({
        "companyId" : "658cd3a0-bde4-11e6-997b-a9af9a42d08a",
        "corpId"    : "ding3c92322d23dbbbfa35c2f4657eb6378f",
        "permanentCode" : "MiWZd0Ja6qRtHydnRjavun3Hv6xEjSQ0oyaAkGO2bP2wAQb0L6NeLvOQ1KQPrABD",
        "isSuiteRelieve" : false,
        "agentid" : "81524283"
     });
     test = await test.save();

     return "good";*/

    // let current = {
    //     company: {
    //         id: "658cd3a0-bde4-11e6-997b-a9af9a42d08a"
    //     }
    // }

    let corps = await Models.ddtalkCorp.find({where: {companyId: current.company.id}});
    if (!corps || !corps.length) {
        throw new Error("您的钉钉账户没有授权");
    }

    let corp = corps[0];

    let {corpApi} = await getISVandCorp(corp);
    await dealCompanyOrganization(corpApi, corp);
    // console.log("yes , hello");
}



// setTimeout(async () => {
    // synchroDDorganization();
    // deleteCompanyOrganization("658cd3a0-bde4-11e6-997b-a9af9a42d08a");
    // tmpAuthCode();


    //更新钉钉监听事件列表
    // let corps = await Models.ddtalkCorp.find({where : { companyId : "658cd3a0-bde4-11e6-997b-a9af9a42d08a" }});
    // let corp  = corps[0];
    // let { isvApi , corpApi } = await getISVandCorp(corp);
    // console.log("what");
    // // await isvApi.activeSuite();
    //
    // let url = "https://j.jingli365.com/ddtalk/isv/receive";
    //
    // let eventTypes = [
    //     "user_add_org",
    //     "user_modify_org",
    //     "user_leave_org"  ,
    //     "org_dept_create" ,
    //     "org_dept_modify" ,
    //     "org_dept_remove" ,
    //     "org_remove"
    // ]
    // await corpApi.updateContractChangeLister(config.token, config.encodingAESKey, url , eventTypes);
    // console.log("good");
// }, 8000);


/* do arr destroy */
async function arrDestroy(arr: any, callback?: Function) {
    if (!arr || !arr[0]) {
        return;
    }
    Promise.all(arr.map((item)=>item.destroy()));
    return callback && callback();
}


/*
*   删除某一企业的所有员工部门关系
*/
export async function deletStaffDepartment(companyId: string){
    let Departs = await Models.department.find({ where : {companyId: companyId} });
    let Depart_ids = [];
    Departs.map((item)=>{
        Depart_ids.push(item.id);
    });

    let staffDeparts = await Models.staffDepartment.find({
        where : { departmentId : { $in : Depart_ids } }
    });
    await arrDestroy(staffDeparts);
}



/*
 *   EventType : suite_relieve
 *   解除授权信息 处理事件
 */

export async function suiteRelieve(msg) {
    let corpId = msg.AuthCorpId;
    let corps = await Models.ddtalkCorp.find({where: {corpId: corpId}});
    if (corps && corps.length) {
        let corp = corps[0];
        corp.isSuiteRelieve = true;
        corp.permanentCode = null;
        corp = await corp.save()

        //禁用企业
        let company = await corp.getCompany(corp['company_id']);
        company.status = -1;
        await company.save();
        let isvApi = new ISVApi(config.suiteid, '', corpId, '');
        await isvApi.removeCorpAccessToken();
    }
}




/*
*   钉钉通讯录事件处理，公共函数
*   msg :{
*         "EventType": "user_add_org",
*         "TimeStamp": 43535463645,
*         "UserId": ["efefef" , "111111"],
*         "DeptId": ["111" ,"222"],
*         "CorpId": "corpid"
*    }
*/

async function ddEventCommon(msg){
    let corpId = msg.CorpId;
    let corps = await Models.ddtalkCorp.find({where: {corpId: corpId}});
    if(!corps || !corps.length){
        logger.info("DDEvent : ddtalk.corp没有这条记录 : " , corpId);
        throw new Error(`ddtalk.corp没有这条记录`)
    }
    let corp = corps[0];

    let result = await getISVandCorp(corp);
    return {
        corpApi : result.corpApi,
        isvApi: result.isvApi,
        corp  : corp
    };
}


/*
 *   EventType : user_add_org
 *   企业增加员工
 *
 *   EventType : user_modify_org
 *   通讯录用户更改
 */
export async function userAddOrg(msg) {
    // let {corpApi , corp} = await ddEventCommon(msg);
    // let userIds = msg.UserId;
    // let userInfos = userIds.map(async (userId)=>{
    //     return await corpApi.getUser(userId);
    // });
    // await addCompanyStaffs(corpApi , userInfos , corp);
}

/*
 *  EventType : org_dept_create
 *  通讯录企业部门创建
 */
export async function orgDeptCreate(msg) : Promise<void>{
    // let {DeptId, CorpId} = msg;
    // let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    // let corp = corps && corps[0];
    // if (!corp || !corp.permanentCode) {
    //     return;
    // }
    //
    // let { corpApi } = getISVandCorp(corp);
    //
    // for (let item of DeptId) {
    //     let deptInfo = await corpApi.getDepartmentInfo(item);
    //     if (!deptInfo)
    //         continue;
    //     //创建一个新的部门
    //     let localNewDepartment = {"name": deptInfo.name, "companyId": corp["companyId"], "parentId": null}
    //     if (deptInfo.parentId != 1) {
    //         //has parentId department
    //         let ParentDepartment = await Models.ddtalkDepartment.find({where: {ddDepartmentId: deptInfo.parentId}});
    //         if (ParentDepartment && ParentDepartment[0]) {
    //             localNewDepartment.parentId = ParentDepartment[0].local_department_id;
    //         }
    //     }
    //
    //     let department = Models.department.create(localNewDepartment);
    //     await department.save();
    // }
}

/*
 *  EventType : org_dept_modify
 *  通讯录企业部门创建
 */
export async function orgDeptModify(msg) : Promise<any> {
    // let {DeptId, CorpId} = msg;
    // let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    // let corp = corps && corps[0];
    // if (!corp || !corp.permanentCode) {
    //     return;
    // }
    //
    // let {isvApi, corpApi} = getISVandCorp(corp);
    // for (let item of DeptId) {
    //     let deptInfo = await corpApi.getDepartmentInfo(item);
    //     if (!deptInfo)
    //         continue;
    //     //name changed or staff changed.
    //     let localAndDD = await Models.ddtalkDepartment.find({where: {dd_department_id: item}});
    //     if (localAndDD && localAndDD[0]) {
    //         let localDeptInfo = await Models.department.get(localAndDD.localDepartmentId);
    //     } else {
    //         //本地还没有这个部门
    //     }
    // }
}

/*
 *  EventType : org_dept_remove
 *  通讯录企业部门删除
 */
export async function orgDeptRemove(msg) : Promise<any> {

}