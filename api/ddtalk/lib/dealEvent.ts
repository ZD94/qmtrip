/*
 *   time  @ 2017.3.10
 *   conten@钉钉事件处理函数
 */

'use strict';
import cache from "common/cache";
const C = require("@jingli/config");
const proxy = require("express-http-proxy");
const config = C.ddconfig;

import Logger from '@jingli/logger';
var logger = new Logger('main');
import ISVApi from "./isvApi";
import {reqProxy} from "./reqProxy";
import {CPropertyType} from "_types/company";
import {Staff, EStaffRole} from "_types/staff";
import {Models} from "_types/index";
import L from '@jingli/language';

import DdCompany from "./ddCompany";
import DdDepartment from "./ddDepartment";
import DdStaff from "./ddStaff";
import { Request,Response, NextFunction } from 'express-serve-static-core';
import { IMsg } from 'api/ddtalk';

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

let reg = new RegExp( config.name_reg );


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

async function _getPermanentCode(suiteToken: string, tmpAuthCode: string) {
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
export async function getISVandCorp(corp : {corpId: string, permanentCode: string}): Promise<any> {
    let corpId = corp.corpId;
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token'];

    let isvApi = new ISVApi(config.suiteid, suiteToken, corpId, corp.permanentCode);
    let corpApi = await isvApi.getCorpApi();

    return {
        isvApi: isvApi,
        corpApi: corpApi
    }
}

/* transpond */
export function transpond(req: Request, res: Response, next: NextFunction, options?: {timeout: number, decorateRequest?: Function}, urls?:string){
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

export async function tmpAuthCode(msg: IMsg, req: Request, res: Response, next: NextFunction) {
    const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
    let isExist = await cache.read(TMP_CODE_KEY);
    if (isExist) {
        console.log("exist?");
        return;
    }

    let suiteToken, permanentAuthMsg: any, permanentCode, corp_name;
    //暂时缓存，防止重复触发
    await cache.write(TMP_CODE_KEY, true, 60 * 1);
    let tokenObj = await _getSuiteToken();
    suiteToken = tokenObj['suite_access_token'];


    console.log("show the req.body: ", req.body);
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
            decorateRequest: (proxyReq: any, originalReq: any)=>{
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

    let corpid = permanentAuthMsg.auth_corp_info.corpid;
    let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, permanentCode);
    //生成获取该企业信息api对象
    let corpApi = await isvApi.getCorpApi()

    //获取企业授权的授权数据 , 拿到管理员信息
    let authInfo: any = await isvApi.getCorpAuthInfo();

    //agentID每次都会变,所以每次授权都要获取我们对应的agentid
    let agents = authInfo.auth_info.agent || [];
    let agentid = '';
    for (let agent of agents) {
        if (agent['appid'] == config.appid) {
            agentid = agent['agentid'];
            break;
        }
    }

    //同步钉钉企业数据
    let ddCompany = new DdCompany({id: corpid, name: corp_name, permanentCode: permanentCode, agentid: agentid,
        isvApi: isvApi, corpApi: corpApi});
    let resultCompany = await ddCompany.sync();

    //doSomethingAfterSync
    resultCompany.isConnectDd = true;
    await resultCompany.save();
    await isvApi.activeSuite();
    await corpApi.registryContractChangeLister(config.token, config.encodingAESKey, config.dd_online_url + '/ddtalk/isv/receive');

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

    let comPros = await Models.companyProperty.find({where: {companyId: current.company.id, type:
        [CPropertyType.DD_ID, CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});
    if (!comPros || !comPros.length) {
        throw new Error("您的钉钉账户没有授权");
    }

    let corpId = "";
    let permanentCode = "";
    let agentId = "";
    for(let c of comPros){
        if(c.type == CPropertyType.DD_ID) corpId = c.value;
        if(c.type == CPropertyType.DD_PERMANENT_CODE) permanentCode = c.value;
        if(c.type == CPropertyType.DD_AGENT_ID) agentId = c.value;
    }

    let {isvApi, corpApi} = await getISVandCorp({corpId: corpId, permanentCode: permanentCode});

    try{
        let company = current.company;
        let ddCompany = new DdCompany({id: corpId, name: company.name, permanentCode: permanentCode, agentid: agentId,
            isvApi: isvApi, corpApi: corpApi});

        await ddCompany.sync();

        /* 同步成功后需要修改company isConnectDd true */
        current.company.isConnectDd = true;
        await current.company.save();
        return true;
    }catch(e){
        return false;
        // throw new Error("同步钉钉组织架构出错");
    }
}

/*
 *   EventType : suite_relieve
 *   解除授权信息 处理事件
 */

export async function suiteRelieve(msg: IMsg) {
    let corpId = msg.AuthCorpId;
    // let corps = await Models.ddtalkCorp.find({where: {corpId: corpId}});
    let comPro = await Models.companyProperty.find({where: {value: corpId, type: CPropertyType.DD_ID}});
    if (comPro && comPro.length) {
        let comCorp = comPro[0];
        let company = await Models.company.get(comCorp.companyId);
        let comPros = await Models.companyProperty.find({where: {companyId: company.id,
            type: [CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});

        for(let c of comPros){
            if(c.type == CPropertyType.DD_PERMANENT_CODE){
                c.value = null;
                await c.save();
            }
        }

        //禁用企业
        company.isSuiteRelieve = true;
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

async function ddEventCommon(msg: IMsg){
    let corpId = msg.CorpId;

    let comPro = await Models.companyProperty.find({where: {value: corpId, type: CPropertyType.DD_ID}});
    if (!comPro || !comPro.length) {
        logger.warn("DDEvent : ddtalk.corp没有这条记录 : " , corpId);
        throw new Error("ddtalk.corp没有这条记录");
    }
    let comPros = await Models.companyProperty.find({where: {companyId: comPro[0].companyId,
        type: [CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});
    let permanentCode = "";
    let agentId = "";
    for(let c of comPros){
        if(c.type == CPropertyType.DD_PERMANENT_CODE) permanentCode = c.value;
        if(c.type == CPropertyType.DD_AGENT_ID) agentId = c.value;
    }

    let {isvApi, corpApi} = await getISVandCorp({corpId: corpId, permanentCode: permanentCode});

    return {
        corpApi : corpApi,
        isvApi: isvApi,
        corp  : {corpId: corpId, permanentCode: permanentCode, agentId: agentId}
    };
}

/*
 *   EventType : user_modify_org , user_add_org
 *   通讯录用户更改 ， 企业增加员工
 */
export async function userModifyOrg(msg: IMsg){
    let {corpApi, isvApi} = await ddEventCommon(msg);
    let userIds = msg.UserId;
    let corpId = msg.CorpId;

    let comPro = await Models.companyProperty.find({where: {value: corpId, type: CPropertyType.DD_ID}});
    if (!comPro || !comPro.length) {
        throw new Error("该企业没有钉钉授权");
    }
    let company = await Models.company.get(comPro[0].companyId);
    userIds.map(async (item)=>{
        let oaStaff = new DdStaff({id: item, corpId: corpId, isvApi: isvApi, corpApi: corpApi, company: company});
        let ddStaff = await oaStaff.getSelfById();
        await ddStaff.sync();
    });
}

/*
 *  EventType : user_leave_org
 *  钉钉删除员工
 */
export async function userLeaveOrg(msg: IMsg){
    let {corpApi, isvApi} = await ddEventCommon(msg);
    let userIds = msg.UserId;
    let corpId = msg.CorpId;

    userIds.map(async (item)=>{
        let oaStaff = new DdStaff({id: item, corpId: corpId, isvApi: isvApi, corpApi: corpApi});
        await oaStaff.leaveOrg();

        // let staff_id = await DDcrud.deleteDDuser( item );
        // await DDcrud.deleteStaffDepartment( "staff" , staff_id );
    });
}

/*
 *  EventType : org_dept_create , org_dept_modify
 *  通讯录企业部门创建 , 通讯录企业部门修改
 */
export async function orgDeptCreate(msg: IMsg) : Promise<void>{
    let {corpApi, isvApi} = await ddEventCommon(msg);
    let ddDeparts = msg.DeptId;
    let corpId = msg.CorpId;

    let comPro = await Models.companyProperty.find({where: {value: corpId, type: CPropertyType.DD_ID}});
    if (!comPro || !comPro.length) {
        throw new Error("该企业没有钉钉授权");
    }
    let company = await Models.company.get(comPro[0].companyId);

    ddDeparts.map(async (item)=>{
        let oaDepartment = new DdDepartment({id: item, corpId: corpId, isvApi: isvApi, corpApi: corpApi, company: company});
        let ddDept = await oaDepartment.getSelfById();
        await ddDept.sync();
    });
}

/*
 *  EventType : org_dept_remove
 *  通讯录企业部门删除
 */
export async function orgDeptRemove(msg: IMsg) : Promise<any> {
    let {corpApi, isvApi} = await ddEventCommon(msg);
    let ddDeparts = msg.DeptId;
    let corpId = msg.CorpId;

    ddDeparts.map(async (item)=>{
        let oaDepartment = new DdDepartment({id: item, corpId: corpId, isvApi: isvApi, corpApi: corpApi});
        await oaDepartment.destroy();
    });
}

/*
 * 从钉钉导入企业部门
 *  corpApi : 获取对应企业的各项信息对象
 *  corp    : ddtalk.corps 对象
 */
/*export async function dealCompanyOrganization(corpApi: CorpApi, corp : DDTalkCorp) {
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

    /!*  ========== 追加部门层级关系 ========  *!/
    for(let d of DDdepartments){
        await DDcrud.createDepartment( d );
    }

    /!* ========   清除本地 钉钉中没有的部门  ======== *!/
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

    /!* =================  END   ====================== *!/

    for (let d of DDdepartments) {
        //添加用户
        await addCompanyStaffsByDepartment(corpApi, d.id, corp);
    }

    console.log("dealCompanyOrganization over");
}*/

/*
 *   从钉钉导入一个部门的员工
 *   corpApi : 获取对应企业的各项信息对象
 *   corp    : ddtalk.corps 对象
 */

/*export async function addCompanyStaffsByDepartment(corpApi: CorpApi, DdDepartmentId: any, corp) {
    console.log("enter in addCompanyStaffsByDepartment");
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
}*/



/* do arr destroy */
/*async function arrDestroy(arr: any, callback?: Function) {
    if (!arr || !arr[0]) {
        return;
    }
    await Promise.all(arr.map((item)=>item.destroy()));
    return callback && callback();
}*/
