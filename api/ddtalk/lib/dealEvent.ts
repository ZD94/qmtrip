/*
 *   time  @ 2017.3.10
 *   conten@钉钉事件处理函数
 */

'use strict';
import fs = require("fs");
import cache from "common/cache";
const C = require("@jingli/config");
const proxy = require("express-http-proxy");
const config = C.ddconfig;

import Logger from '@jingli/logger';
var logger = new Logger('main');
import request = require('request');
import ISVApi from "./isvApi";
import CorpApi from "./corpApi";
import {reqProxy} from "./reqProxy";
import {Company} from "_types/company";
import {Staff, EStaffRole} from "_types/staff";
import {Models} from "_types/index";
import L from '@jingli/language';

import {md5} from "common/utils";
import {DDTalkCorp , DDTalkDepartment , DDTalkUser} from "_types/ddtalk";
import {ddCrud} from "./ddCrud";


const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;
const DEFAULT_PWD = '000000';

let moment = require("moment");

let reg = new RegExp( config.name_reg );


/* transpond */
export function transpond(req, res, next, options:any, urls?:string){
    let url = config.test_url.replace(/\/$/g, "");
    url = url + "/ddtalk/isv/receive";
    if(urls){
        url = urls;
    }

    console.log("enter in transpond , the url : ", url);

    options = options || {
            timeout : 5000
        };
    proxy(url, options)(req, res, next);
}

export async function tmpAuthCode(msg , req , res , next) {
    const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
    let isExist = await cache.read(TMP_CODE_KEY);
    if (isExist) {
        return;
    }

    let suiteToken, permanentAuthMsg: any, permanentCode, corp_name;
    //暂时缓存，防止重复触发
    await cache.write(TMP_CODE_KEY, true, 60 * 2);
    let tokenObj = await _getSuiteToken();
    suiteToken = tokenObj['suite_access_token'];


    console.log("show the req.body", req.body);
    if(req.body && req.body.permanentAuthMsg){
        //不是在production
        permanentAuthMsg = req.body.permanentAuthMsg;
        console.log("不是在production :", permanentAuthMsg);
        permanentCode = permanentAuthMsg['permanent_code'];
        corp_name = permanentAuthMsg.auth_corp_info.corp_name;
    }else{
        //on the production
        //永久授权码和企业名称及id
        permanentAuthMsg = await _getPermanentCode(suiteToken, msg.AuthCode);
        console.log("on the production: ", permanentAuthMsg);
        permanentCode = permanentAuthMsg['permanent_code'];
        corp_name = permanentAuthMsg.auth_corp_info.corp_name;
    }





    /* ====== using for test ===== */
    if(reg.test(corp_name) && config.reg_go){
        //it's our test company.
        transpond( req, res, next, {
            timeout : 5000,
            decorateRequest: (proxyReq, originalReq)=>{
                if(!originalReq.body){
                    originalReq.body = {};
                }
                originalReq.body.permanentAuthMsg = permanentAuthMsg;
                return proxyReq;
            }
        });

        return { notReply: true };
    }
    console.log("tmp_auth_code 正常逻辑");
    /* ============ End =========== */

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
        let company = Company.create({name : corp_name , expiryDate : moment.add(1 , "months").toDate()});
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

    // ticket = 'WDwz3hpaNtXZye8TECW8kPeqVtuvjntAmOAE5BIXAMilQqHV0ehpPlIWMXFXiMnPiwoZlOxTFFQegwAtPBCDEW';
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


    // return {"suite_access_token": "9761c575f39c3505b5478e98bf28e705", "expire_at": 1489560379128}
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
        localDepartment_ids = [];

    let DDcrud = new ddCrud( corp.corpId );

    for(let d of DDdepartments){
        let localDepart = await DDcrud.createDepartment( d  , true);
        localDepartment_ids.push( localDepart.id );
    }

    /*  ========== 追加部门层级关系 ========  */
    for(let d of DDdepartments){
        await DDcrud.createDepartment( d );
    }

    /* ========   清除本地 钉钉中没有的部门  ======== */
    let deleDeparts = await Models.department.find({
        where : {companyId : company.id, id : { $notIn : localDepartment_ids}}
    });
    let deleDdtalkDeparts = await Models.ddtalkDepartment.find({
        where : { corpId : corpId , localDepartmentId:{ $notIn : localDepartment_ids} }
    });

    //将要清除的钉钉部门，删除staffDepartment关系
    deleDeparts.map(async (item)=>{
        await DDcrud.deleteStaffDepartment( "department" , item.id );
        await item.destroy();
    });
    await arrDestroy(deleDdtalkDeparts);

    /* =================  END   ====================== */

    for (let d of DDdepartments) {
        //添加用户
        await addCompanyStaffsByDepartment(corpApi, d.id, corp);
    }

    console.log("dealCompanyOrganization over");
}

/*
 *   从钉钉导入一个部门的员工
 *   corpApi : 获取对应企业的各项信息对象
 *   corp    : ddtalk.corps 对象
 */

export async function addCompanyStaffsByDepartment(corpApi: CorpApi, DdDepartmentId: any, corp) {
    let dingUsers = await corpApi.getUserListByDepartment(DdDepartmentId);
    let staff_ids = [] , localDepart = [];
    let DDcrud = new ddCrud(corp.corpId);
    for(let u of dingUsers){
        let staff = await DDcrud.createStaff( u );
        await DDcrud.createDDuser( staff , u );
        localDepart = await DDcrud.addStaffDeparts( staff , [DdDepartmentId] );
        staff_ids.push(staff.id);
    }

    if(localDepart.length){
        //清除不存在的 staff_department
        await DDcrud.deleteStaffDepartment( "department" , localDepart[0] , staff_ids );
    }

    if(!dingUsers.length){
        //这是一个空部门
        let localDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : corp.corpId , DdDepartmentId : DdDepartmentId }
        });
        if(localDeparts && localDeparts.length){
            //清除该部门所有的 staff_department
            await DDcrud.deleteStaffDepartment( "department" , localDeparts[0].localDepartmentId );
        }
    }
}

/*
 *  手动触发同步钉钉组织架构
 *
 */

export async function synchroDDorganization() : Promise<boolean> {
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

    try{
        // await dealCompanyOrganization(corpApi, corp);
        return true;
    }catch(e){
        return false;
        // throw new Error("同步钉钉组织架构出错");
    }
}

// setTimeout(async () => {
    // let result = await _getSuiteToken();
    // console.log(result);
    // await synchroDDorganization();
//     deleteCompanyOrganization("658cd3a0-bde4-11e6-997b-a9af9a42d08a");
//     tmpAuthCode();
//
//
//     更新钉钉监听事件列表
//     let corps = await Models.ddtalkCorp.find({where : { companyId : "658cd3a0-bde4-11e6-997b-a9af9a42d08a" }});
//     let corp  = corps[0];
//     let { isvApi , corpApi } = await getISVandCorp(corp);
//     console.log("what");
//     // await isvApi.activeSuite();
//
//     let url = "https://j.jingli365.com/ddtalk/isv/receive";
//
//     let eventTypes = [
//         "user_add_org",
//         "user_modify_org",
//         "user_leave_org"  ,
//         "org_dept_create" ,
//         "org_dept_modify" ,
//         "org_dept_remove" ,
//         "org_remove"
//     ]
//     await corpApi.updateContractChangeLister(config.token, config.encodingAESKey, url , eventTypes);
//     console.log("good");

    /*await cache.write("keyforme" , "abcdfefegeg" , 20);


    for(let i=1;i<=30;i++){
        setTimeout(async function(){
            let g = await cache.read("keyforme");
            console.log(i , g);
        } , 1000*i)
    }*/

// }, 8000);


/* do arr destroy */
async function arrDestroy(arr: any, callback?: Function) {
    if (!arr || !arr[0]) {
        return;
    }
    await Promise.all(arr.map((item)=>item.destroy()));
    return callback && callback();
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
        logger.warn("DDEvent : ddtalk.corp没有这条记录 : " , corpId);
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
 *   EventType : user_modify_org , user_add_org
 *   通讯录用户更改 ， 企业增加员工
 */
export async function userModifyOrg(msg){
    let {corpApi , corp} = await ddEventCommon(msg);
    let userIds = msg.UserId;

    let DDcrud = new ddCrud(corp.corpId);
    userIds.map(async (item)=>{
        let userInfo = await corpApi.getUser(item);
        let staff = await DDcrud.createStaff( userInfo );
        await DDcrud.createDDuser(staff , userInfo);
        let localDeparts = await DDcrud.addStaffDeparts( staff , userInfo['department'] );
        await DDcrud.deleteStaffDepartment( "staff" , staff.id , localDeparts );
    });
}

/*
 *  EventType : user_leave_org
 *  钉钉删除员工
 */
export async function userLeaveOrg(msg){
    let {corpApi , corp} = await ddEventCommon(msg);
    let userIds = msg.UserId;

    let DDcrud = new ddCrud(corp.corpId);
    userIds.map(async (item)=>{
        let staff_id = await DDcrud.deleteDDuser( item );
        await DDcrud.deleteStaffDepartment( "staff" , staff_id );
    });
}

/*
 *  EventType : org_dept_create , org_dept_modify
 *  通讯录企业部门创建 , 通讯录企业部门修改
 */
export async function orgDeptCreate(msg) : Promise<void>{
    let {corpApi , corp} = await ddEventCommon(msg);
    let ddDeparts = msg.DeptId;
    let DDcrud    = new ddCrud( corp.corpId );

    ddDeparts.map(async (item)=>{
        let ddDepartInfo = await corpApi.getDepartmentInfo(item);
        await DDcrud.createDepartment( ddDepartInfo );
    });
}

/*
 *  EventType : org_dept_remove
 *  通讯录企业部门删除
 */
export async function orgDeptRemove(msg) : Promise<any> {
    let ddDeparts = msg.DeptId;
    let DDcrud    = new ddCrud( msg.CorpId );

    ddDeparts.map(async (item)=>{
        await DDcrud.ddDeleteDepart( item );
    });
}