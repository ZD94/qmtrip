/*
*   time  @ 2017.3.10
*   conten@钉钉事件处理函数
*/

'use strict';
const API = require('common/api');
let dingSuiteCallback = require("dingtalk_suite_callback");
import fs = require("fs");
import cache from "common/cache";
const C = require("config");

const config ={
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
import {clientExport} from "common/api/helper";
import {get_msg} from "./msg-template/index";
import {md5} from "common/utils";
import {StaffDepartment} from "api/_types/department/staffDepartment";


const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;
const DEFAULT_PWD = '000000';



export async function tmpAuthCode(msg){
    console.log("yes" , msg);

    const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
    let isExist = await cache.read(TMP_CODE_KEY);
    if (isExist) {
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
    let corpid = permanentAuthMsg.auth_corp_info.corpid;
    let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, permanentCode);

    //获取企业授权的授权数据 , 拿到管理员信息
    let authInfo: any = await isvApi.getCorpAuthInfo();
    let authUserInfo = authInfo.auth_user_info;

    //agentID每次都会变,所以每次授权都要获取我们对应的agentid
    let agents = authInfo.auth_info.agent || [];
    let agentid = '';
    for(let agent of agents) {
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
    let corps = await Models.ddtalkCorp.find({where : {corpId: corpid}});
    if(corps && corps.length){
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
    }else{
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
        try{
            createCompanyOrganization( corpApi , corp );
        }catch(err){
            console.error("导入企业组织结构出错", err)
            throw err;
        }
    }

    await isvApi.activeSuite();
    await corpApi.registryContractChangeLister(config.token, config.encodingAESKey, C.host+'/ddtalk/isv/receive');
}



async function _getSuiteToken() {
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
    })
    d = {suite_access_token: ret.suite_access_token, expire_at: (ret.expires_in - 30) * 1000 + Date.now() };
    cache.write(key, JSON.stringify(d))
    return d;
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

/*
* 导入企业部门
*  corpApi : 获取对应企业的各项信息对象
*  corp    : ddtalk.corps 对象
*/
export async function createCompanyOrganization( corpApi , corp ){
    //拿到部门列表
    let departments = await corpApi.getDepartments();
    let company     = await corp.getCompany(corp['company_id']);

    let Translate = {} , Translate2 = {} , localDepartments = [];
    for(let d of departments){
        //创建一条部门数据
        let _d = Models.department.create({
            name : d.name,
            isDefault : d.id == 1
        });
        _d.company = company;
        if(_d.name == company.name){
            _d.isDefault = true;
        }
        _d = await _d.save();

        //修改部门id 与 钉钉部门id 对照表
        let ddtalkDepartment = Models.ddtalkDepartment.create({
            localDepartmentId : _d.id,
            DdDepartmentId    : d.id
        });
        await ddtalkDepartment.save();

        // dd_id : local_id
        Translate[d.id] = _d.id;
        // local_id : dd_parentid
        Translate2[_d.id] = d.parentid == 1 ? null : d.parentid;
        localDepartments.push(_d);

        //添加用户

    }

    //追加部门层级关系
    for(let item of localDepartments){
        item.parentId = Translate[ Translate2[item.id] ] || null;
        await item.save();
    }

    //若企业没有默认部门添加默认部门
    let defaultDept = await company.getDefaultDepartment();
    if(!defaultDept){
        let dd = Models.department.create({name: company.name, isDefault: true});
        dd.company = company;
        await dd.save();
    }
}

/*
*   导入企业员工
*   corpApi : 获取对应企业的各项信息对象
*   corp    : ddtalk.corps 对象
*/

export async function addCompanyStaffs( corpApi : CorpApi , dingUsers , corp ){
    let company = await corp.getCompany(corp["company_id"]);
    let corpid = corp.corpId;

    let travelPolicy = await company.getDefaultTravelPolicy();
    for(let u of dingUsers){
        let dingUsers = await Models.ddtalkUser.find({
            where : { corpid : corpid , ddUserId : u.userid }
        });
        if(dingUsers && dingUsers.length){
            let dingUser = dingUsers[0];
            let s = await Models.staff.get(dingUser.id);
            if(company.id == s.company.id){
                //已经存在这个员工
                continue;
            }
        }

        let _staff = Models.staff.create({name: u.name, travelPolicyId.id});
        _staff.company = company;
        _staff.pwd = md5(DEFAULT_PWD);
        _staff.status = 1;
        _staff = await _staff.save();

        //在本地绑定部门关系

    }
}
