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

import request = require('request');
import ISVApi from "./isvApi";
import CorpApi from "./corpApi";
import {reqProxy} from "./reqProxy";
import {Company} from "api/_types/company";
import {Staff, EStaffRole} from "api/_types/staff";
import {Models} from "api/_types/index";
import L from 'common/language';

import {md5} from "common/utils";


const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;
const DEFAULT_PWD = '000000';


export async function tmpAuthCode(msg) {
    console.log("yes", msg);

    const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
    let isExist = await cache.read(TMP_CODE_KEY);
    if (isExist) {
        console.log("exist ?");
        return;
    }

    console.log("ok , here");
    //暂时缓存，防止重复触发
    await cache.write(TMP_CODE_KEY, true, 60 * 2);
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token'];

    //永久授权码和企业名称及id
    let permanentAuthMsg: any = await _getPermanentCode(suiteToken, msg.AuthCode);
    let permanentCode = permanentAuthMsg['permanent_code'];

    let corp_name = permanentAuthMsg.auth_corp_info.corp_name;
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
        company = await company.save();

        //解绑 == false
        corp.isSuiteRelieve = false;
        corp.permanentCode = permanentCode;
        corp.agentid = agentid;
        //更新企业对照表
        corp = await corp.save();
    } else {
        //创建企业
        let company = Company.create({name: corp_name});
        company = await company.save();
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
        console.log(userInfo);
        try {
            createCompanyOrganization(corpApi, corp);
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

    // let ticketObj: any = await cache.read(CACHE_KEY);
    // if (typeof ticketObj == 'string') {
    //     ticketObj = JSON.parse(ticketObj);
    // }
    // if (!ticketObj || !ticketObj.ticket ) {
    //     throw new Error(`还没有ticket`);
    // }
    // let ticket = ticketObj.ticket;
    //
    // // ticket = "mWuJweSFdTWhiN8JErc6clkg1kjR2v54ojV7UOcic1oja2xBmEjvfQqsafPvzrtEyYBzovNaeU160IYy9FaB2V";
    //
    //
    // if (!ticket) {
    //     throw new Error('不存在ticket');
    // }
    // let key = `ddtalk:suite_access_token:${config.suiteid}`;
    // let d = await cache.readAs<suiteTokenCached>(key)
    // if (d && d.expire_at > Date.now()) {
    //     return d;
    // }
    //
    // console.log(2);
    //
    //
    // let url = `https://oapi.dingtalk.com/service/get_suite_token`;
    // let ret: any = await reqProxy(url, {
    //     name: '获取套件Token',
    //     body: {
    //         suite_key: config.suiteid,
    //         suite_secret: config.secret,
    //         suite_ticket: ticket
    //     }
    // });
    //
    //
    // d = {suite_access_token: ret.suite_access_token, expire_at: (ret.expires_in - 30) * 1000 + Date.now() };
    // cache.write(key, JSON.stringify(d))
    // return d;


    return {"suite_access_token": "366a45abe28b37b29dae0fe4694e0a86", "expire_at": 1489560379128}
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

//提供isv , corp 的api对象
async function getISVandCorp(permanentCode: string, corp): Promise<any> {
    let corpId = corp.corpId;
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token']

    console.log("yar");
    let isvApi = new ISVApi(config.suiteid, suiteToken, corpId, corp.permanentCode);

    console.log("yar1");

    let corpApi = await isvApi.getCorpApi();

    console.log("yar2");

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
export async function createCompanyOrganization(corpApi: CorpApi, corp: object) {
    console.log("createCompanyOrganization");
    //拿到部门列表
    let departments = await corpApi.getDepartments();
    let company = await corp.getCompany(corp['company_id']);
    console.log(company.name);
    let Translate = {}, Translate2 = {}, localDepartments = [];

    console.log("I am saying : ", departments.length);

    let rootLocalDepartmentId;
    for (let d of departments) {
        let isDefault = false;
        if (d["parentid"] == undefined) {
            isDefault = true;
        }

        //创建一条部门数据
        let _d = Models.department.create({
            name: d.name,
            isDefault: isDefault
        });
        _d.company = company;
        if (_d.name == company.name) {
            _d.isDefault = true;
        }
        _d = await _d.save();

        if (isDefault) {
            rootLocalDepartmentId = _d.id;
        }

        console.log("d.name", d.name);

        //修改部门id 与 钉钉部门id 对照表
        let ddtalkDepartment = Models.ddtalkDepartment.create({
            localDepartmentId: _d.id,
            DdDepartmentId: d.id,
            corpId: corp.corpId
        });
        await ddtalkDepartment.save();

        // dd_id : local_id
        Translate[d.id] = _d.id;
        // local_id : dd_parentid
        Translate2[_d.id] = d.parentid;
        localDepartments.push(_d);
    }

    for (let d of departments) {
        //添加用户
        await addCompanyStaffs(corpApi, d.id, corp);
    }


    //追加部门层级关系
    for (let item of localDepartments) {
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

    //若企业没有默认部门添加默认部门
    // let defaultDept = await company.getDefaultDepartment();
    // if(!defaultDept){
    //     let dd = Models.department.create({name: company.name, isDefault: true});
    //     dd.company = company;
    //     await dd.save();
    // }
}

/*
 *   从钉钉导入一个部门的员工
 *   corpApi : 获取对应企业的各项信息对象
 *   corp    : ddtalk.corps 对象
 */

export async function addCompanyStaffs(corpApi: CorpApi, DdDepartmentId: any, corp) {
    console.log("yes ,in the addCompanyStaffs");
    console.log(typeof DdDepartmentId, DdDepartmentId)


    let company = await corp.getCompany(corp["company_id"]);

    console.log("company ");

    let corpid = corp.corpId;
    let dingUsers;
    if (DdDepartmentId instanceof Array) {
        dingUsers = DdDepartmentId;
    } else {
        dingUsers = await corpApi.getUserListByDepartment(DdDepartmentId);
    }

    console.log("dingUsers", dingUsers);


    let travelPolicy = await company.getDefaultTravelPolicy();
    for (let u of dingUsers) {
        let ddtalkUserInfos = await Models.ddtalkUser.find({
            where: {corpid: corpid, ddUserId: u.userid}
        });
        let dd_info = JSON.stringify(u);

        let _staff;
        if (ddtalkUserInfos && ddtalkUserInfos.length) {
            let ddtalkUserInfo = ddtalkUserInfos[0];

            //更新dd_info
            ddtalkUserInfo.ddInfo = dd_info;

            ddtalkUserInfo = await ddtalkUserInfo.save();

            console.log("ddtalkUserInfo.id : ", ddtalkUserInfo.id)
            _staff = await Models.staff.get(ddtalkUserInfo.id);
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

        // 处理该员工与部门的关系
        for (let item of u.department) {
            console.log("let item of u.department  :   ", item, corpid);
            let itemDepart = await Models.ddtalkDepartment.find({
                where: {DdDepartmentId: item.toString(), corpId: corpid}
            });

            if(!itemDepart || !itemDepart[0]){
                console.log("这个部门不存在  dd_department_id :" , u.department);
                continue;
            }

            console.log("itemDepart", itemDepart.length);
            let staffDepart = await Models.staffDepartment.find({ where : {
                staffId: _staff.id,
                departmentId: itemDepart[0].localDepartmentId
            } });

            if(staffDepart && staffDepart.length){
                //a ready have
                continue;
            }else{
                let staffDepart = Models.staffDepartment.create({
                    staffId: _staff.id,
                    departmentId: itemDepart[0].localDepartmentId
                });
                await staffDepart.save();
            }
        }
    }
}

/*
 *  手动触发同步钉钉组织架构
 *
 */

export async function synchroDDorganization() {
    // let current = await Staff.getCurrent();
    // if(current.roleId != EStaffRole.OWNER && current.roleId != EStaffRole.ADMIN){
    //     throw L.ERR.PERMISSION_DENY();
    // }
    /*let test = await Models.ddtalkCorp.find({where : { "companyId" : "658cd3a0-bde4-11e6-997b-a9af9a42d08a" }});
     test.map(async (item)=>{
     await item.destroy();
     });

     test = Models.ddtalkCorp.create({
     "companyId" : "658cd3a0-bde4-11e6-997b-a9af9a42d08a",
     "corpId"    : "ding3c92322d23dbbbfa35c2f4657eb6378f",
     "permanentCode" : "MiWZd0Ja6qRtHydnRjavun3Hv6xEjSQ0oyaAkGO2bP2wAQb0L6NeLvOQ1KQPrABD",
     "isSuiteRelieve" : false,
     "agentid" : "80673127"
     });
     test = await test.save();

     return "good";*/

    let current = {
        company: {
            id: "658cd3a0-bde4-11e6-997b-a9af9a42d08a"
        }
    }

    console.log("company.id : ", current.company.id);
    let corps = await Models.ddtalkCorp.find({where: {companyId: current.company.id}});
    if (!corps || !corps.length) {
        return {"msg": "您的钉钉账户没有授权"};
    }

    let corp = corps[0];

    await deleteCompanyOrganization(current.company.id , corp)

    let {isvApi, corpApi} = await getISVandCorp(corp.permanentCode, corp);

    console.log("ready coming to the create");

    await createCompanyOrganization(corpApi, corp);
    console.log("yes , hello");
}


setTimeout(() => {
    // synchroDDorganization();
    // deleteCompanyOrganization("658cd3a0-bde4-11e6-997b-a9af9a42d08a");
}, 8000);


/* do arr destroy */
async function arrDestroy(arr: [], callback?: Function) {
    if (!arr || !arr[0]) {
        return;
    }
    arr.map(async(item) => {
        if (item.name) {
            console.log(item.name);
        }
        await item.destroy();
    });
    return callback && callback();
}

/*
 *   删除某一企业的组织架构，删除所有部门，删除除owner外所有员工，及员工部门关系等
 *   time @ 2017.3.15
 *
 */
export async function deleteCompanyOrganization(companyId: string , corp): boolean {
    console.log("delete localDepart", companyId);
    //删除本地部门
    try {

        let localDept = await Models.department.find({where: {companyId: companyId}});
        console.log("localDept : ", localDept.length);



        localDept.map(async (item) => {
            //删除员工部门对照关系表
            let localDeptStaff = await Models.staffDepartment.find({where: {departmentId: item.id}});
            await arrDestroy(localDeptStaff);
            console.log(item.name);
            await item.destroy();
        });

        //删除dd部门与本地部门对照关系表
        let DdLocalDepart = await Models.ddtalkDepartment.find({where: {corpId: corp.corpId }});
        await arrDestroy(DdLocalDepart);

        //删除员工表
        let localStaff = await Models.staff.find({
            where: {companyId: companyId, roleId: {ne: EStaffRole.OWNER}}
        });
        await arrDestroy(localStaff);

        //删除钉钉用户表
        let corps = await Models.ddtalkCorp.find({where: {companyId: companyId}});
        if (corps && corps[0]) {
            let corp = corps[0];
            let ddtalkUsers = await Models.ddtalkUser.find({where: {corpid: corp.corpId}});
            await arrDestroy(ddtalkUsers);
        }
    }
    catch (e) {
        console.log(e);
    }
    console.log("delete ok");
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
 *   EventType : user_add_org
 *   企业增加员工
 *   msg :{
 "EventType": "user_add_org",
 "TimeStamp": 43535463645,
 "UserId": ["efefef" , "111111"],
 "CorpId": "corpid"
 }
 */
export async function userAddOrg(msg) {
    let userIds = msg.UserId;
    let corpId = msg.CorpId;
    let corps = await Models.ddtalkCorp.find({where: {corpId: corpId}});
    if (corps && corps.length) {
        let corp = corps[0];

        let {isvApi, corpApi} = getISVandCorp(corp.permanentCode, corp);
        let ps = userIds.map(async(userId) => {
            return await corpApi.getUser(userId);
        });
        let users = await Promise.all(ps);
        await addCompanyStaffs(corpApi, users, corp);
    }
}

/*
 *  EventType : org_dept_create
 *  通讯录企业部门创建
 */
export async function orgDeptCreate(msg: object) {
    let {DeptId, CorpId} = msg;
    let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    let corp = corps && corps[0];
    if (!corp || !corp.permanentCode) {
        return;
    }

    let {isvApi, corpApi} = getISVandCorp(corp.permanentCode, corp);

    for (let item of DeptId) {
        let deptInfo = await corpApi.getDepartmentInfo(item);
        if (!deptInfo)
            continue;
        //创建一个新的部门
        let localNewDepartment = {"name": deptInfo.name, "companyId": corp["companyId"], "parentId": null}
        if (deptInfo.parentId != 1) {
            //has parentId department
            let ParentDepartment = await Models.ddtalkDepartment.find({where: {ddDepartmentId: deptInfo.parentId}});
            if (ParentDepartment && ParentDepartment[0]) {
                localNewDepartment.parentId = ParentDepartment[0].local_department_id;
            }
        }

        let department = await Models.department.create(localNewDepartment);
        return department.save();
    }
}

/*
 *  EventType : org_dept_modify
 *  通讯录企业部门创建
 */
export async function orgDeptModify(msg: object) {
    let {DeptId, CorpId} = msg;
    let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    let corp = corps && corps[0];
    if (!corp || !corp.permanentCode) {
        return;
    }

    let {isvApi, corpApi} = getISVandCorp(corp.permanentCode, corp);
    for (let item of DeptId) {
        let deptInfo = await corpApi.getDepartmentInfo(item);
        if (!deptInfo)
            continue;
        //name changed or staff changed.
        let localAndDD = await Models.ddtalkDepartment.find({where: {dd_department_id: item}});
        if (localAndDD && localAndDD[0]) {
            let localDeptInfo = await Models.department.get(localAndDD.localDepartmentId);
        } else {
            //本地还没有这个部门
        }
    }
}

/*
 *  EventType : org_dept_remove
 *  通讯录企业部门删除
 */
export async function orgDeptRemove(msg: object) {

}