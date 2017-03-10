/**
 * Created by wlh on 16/9/7.
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
import ISVApi from "./lib/isvApi";
import CorpApi from "./lib/corpApi";
import {reqProxy} from "./lib/reqProxy";
import {Company} from "api/_types/company";
import {Staff, EStaffRole} from "api/_types/staff";
import {Models} from "../_types/index";
import {clientExport} from "../../common/api/helper";
import {get_msg} from "./lib/msg-template/index";
import {md5} from "../../common/utils";
import {StaffDepartment} from "../_types/department/staffDepartment";

import * as DealEvent from "./lib/dealEvent";

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;
const DEFAULT_PWD = '000000';

let ddTalkMsgHandle = {
    /* * * * 临时授权码* * * * */
    tmp_auth_code: async function(msg) {
        DealEvent.tmpAuthCode(msg);
    },

    /* * * * * 授权变更* * * * * * */
    change_auth: async function(msg) {
        return msg;
    },

    /* * * * 解除授权信息 * * * */
    suite_relieve: async function(msg) {
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
    },

    /* * * 保存授权信息 * */
    suite_ticket: async function(msg) {
        let ticket = msg.SuiteTicket;
        await cache.write(CACHE_KEY, JSON.stringify({ticket: ticket, timestamp: msg.TimeStamp}));
        return msg;
    },

    /* * * 企业增加员工 * * */
    /*
     {
     "EventType": "user_add_org",
     "TimeStamp": 43535463645,
     "UserId": ["efefef" , "111111"],
     "CorpId": "corpid"
     }
     */
    user_add_org: async function(msg) {
        let userIds = msg.UserId;
        let corpId = msg.CorpId;
        let corps = await Models.ddtalkCorp.find({where: {corpId: corpId}});
        if (corps && corps.length) {
            let corp = corps[0];

            let { isvApi , corpApi } = getISVandCorp(corp.permanentCode);
            let ps = userIds.map( async (userId) => {
                return await corpApi.getUser(userId);
            });
            let users = await Promise.all(ps);
            await addDingUsersCompany(corp, users, corpApi);
        }
    },
    check_url: async function(msg) {
        return msg;
    },
    /* * *  通讯录企业部门创建 * * */
    org_dept_create : async function(msg){
        await orgDeptCreate(msg);
        return msg;
    },
    /* * *  通讯录企业部门修改 * * */
    org_dept_modify : async function(msg){
        await orgDeptModify(msg);
        return msg;
    },
    /* * *  通讯录企业部门删除 * * */
    org_dept_remove : async function(msg){
        await orgDeptCreate(msg);
        return msg;
    },
}


class DDTalk {
    static __public: boolean = true;
    static __initHttpApp(app) {
        app.post("/ddtalk/isv/receive", dingSuiteCallback(config, function (msg, req, res, next) {
            console.info(msg)
            return ddTalkMsgHandle[msg.EventType](msg)
                .then((ret) => {
                    res.reply();
                })
                .catch((err) => {
                    console.error(err.stack);
                    next(err);
                });
        }));

        // app.post("/ddtalk/isv/receive", function (req, res, next) {
        //     console.log("yes");
        //     console.log(req.body);
        //     // res.send("yes");
        //     let msg = req.body;
        //     return ddTalkMsgHandle[msg.EventType](msg);
        //     console.log(msg);
        //     // console.info(msg)
        //     // return ddTalkMsgHandle[msg.EventType](msg)
        //     //     .then((ret) => {
        //     //         res.reply();
        //     //     })
        //     //     .catch((err) => {
        //     //         console.error(err.stack);
        //     //         next(err);
        //     //     });
        // });
    }

    @clientExport
    static async getJSAPIConfig(params) {
        let {orgid, agentid, url} = params;
        let timestamp = Math.floor(Date.now() / 1000);
        let noncestr = getRndStr(6);
        //查询企业永久授权码
        let corps = await Models.ddtalkCorp.find({ where: {corpId: orgid}, limit: 1});
        if (corps && corps.length) {
            let corp = corps[0];
            if (corp.isSuiteRelieve) {
                let err = new Error(`企业还未授权或者已取消授权`);
                throw err;
            }
            let tokenObj = await _getSuiteToken();
            let suiteToken = tokenObj['suite_access_token']
            let isvApi = new ISVApi(config.suiteid, suiteToken, orgid, corp.permanentCode);
            let corpApi = await isvApi.getCorpApi();
            let ticketObj = await corpApi.getTicket();    //获取到了ticket
            let arr = [];
            arr.push('noncestr='+noncestr)
            arr.push('jsapi_ticket='+ticketObj.ticket);
            arr.push('url='+url);
            arr.push('timestamp='+timestamp)
            arr.sort()
            let originStr = arr.join('&');
            let signature = require("crypto").createHash('sha1').update(originStr, 'utf8').digest('hex');
            return {
                agentId: agentid, // 必填，微应用ID
                corpId: orgid,//必填，企业ID
                timeStamp: timestamp, // 必填，生成签名的时间戳
                nonceStr: noncestr, // 必填，生成签名的随机串
                signature: signature, // 必填，签名
            }
        }
        throw new Error(`企业不存在`)
    }

    @clientExport
    static async loginByDdTalkCode(params) : Promise<any> {
        let {corpid, code} = params;
        let corps = await Models.ddtalkCorp.find({ where: {corpId: corpid}, limit: 1});
        if (corps && corps.length) {
            let corp = corps[0];
            if (corp.isSuiteRelieve) {
                let err = new Error(`企业还未授权或者已取消授权`);
                throw err;
            }
            let tokenObj = await _getSuiteToken();
            let suiteToken = tokenObj['suite_access_token']
            let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, corp.permanentCode);
            let corpApi = await isvApi.getCorpApi();
            let dingTalkUser = await corpApi.getUserInfoByOAuth(code);
            //查找是否已经绑定账号
            let ddtalkUsers = await Models.ddtalkUser.find( { where: {corpid: corpid, ddUserId: dingTalkUser.userId}});
            if (ddtalkUsers && ddtalkUsers.length) {
                let ddtalkUser = ddtalkUsers[0]
                // //自动登录
                let ret = await API.auth.makeAuthenticateToken(ddtalkUser.id, 'ddtalk');
                return ret;
            }
            throw new Error(`{"code":-1, "msg": "用户还未绑定账户"}`);
        } else {
            throw new Error(`企业不存在`)
        }
    }

    static async sendLinkMsg(params): Promise<any> {
        let {accountId, text, url, picurl} = params;
        text = text || '您有一条新消息'
        url = url || '#';
        picurl = picurl || 'http://j.jingli365.com/ionic/images/dingtalk-shareicon.png';
        let staff = await Models.staff.get(accountId);
        let company = staff.company;
        let corp = await Models.ddtalkCorp.get(company.id);
        let ddtalkUser = await Models.ddtalkUser.get(staff.id);
        if (corp && ddtalkUser) {
            let tokenObj = await _getSuiteToken();
            let isvApi = new ISVApi(config.suiteid, tokenObj['suite_access_token'], corp.corpId, corp.permanentCode);
            let corpApi = await isvApi.getCorpApi();
            let msg= await get_msg({
                touser: ddtalkUser.ddUserId,
                content: text,
                agentid: corp.agentid,
                picurl: picurl,
                title: '鲸力商旅',
                url: url,
            }, 'link');

            let ret = await corpApi.sendNotifyMsg(msg);
            return ret;
        }
        console.warn(`企业不存在或者不是从钉钉导入`);
        return null;
    }
}


/* ======================== 功能函数部分 ======================== */




async function addDingUsersCompany(corp, dingUsers, corpApi: CorpApi) {
    let company = await corp.getCompany(corp['company_id']);

    let corpid = corp.corpId;

    let travelPolicy = await company.getDefaultTravelPolicy();

    for(let u of dingUsers) {
        let dingUsers = await Models.ddtalkUser.find({ where: {corpid: corpid, ddUserId: u.userid}})
        if (dingUsers && dingUsers.length) {
            //查看是否是同一个公司
            let dingUser = dingUsers[0];
            let s = await Models.staff.get(dingUser.id);
            if (company.id == s.company.id) {
                continue;
            }
        }

        let _staff = Models.staff.create({name: u.name, travelPolicyId: travelPolicy.id});
        _staff.company = company;
        _staff.pwd = md5(DEFAULT_PWD);
        _staff.status = 1;
        _staff = await _staff.save();

        //绑定部门关系
        let departmentIds = u['department'];
        let departmentId;
        if (departmentIds && departmentIds.length) {
            departmentId = departmentIds[0];
        }

        if (departmentId) {
            //获取钉钉部门详情
            let dingTalkDept = await corpApi.getDepartmentInfo(departmentId);
            //根据名称与我们系统匹配
            let jlDepts = await Models.department.find({where: {name: dingTalkDept.name}});
            let department;
            if (jlDepts && jlDepts.length) {
                department = jlDepts[0];
            } else {
                department = Models.department.create({name: dingTalkDept.name});
                department.company = company;
                department = await department.save();
            }
            let staffDepartment = StaffDepartment.create({staffId: _staff.id, departmentId: department.id});
            await staffDepartment.save();
        }

        let dingUser = Models.ddtalkUser.create({id: _staff.id, avatar: u.avatar, dingId: u.dingId,
            isAdmin: u.isAdmin, name: u.name, ddUserId: u.userid, corpid: corpid});
        await dingUser.save();
    }
}

interface suiteTokenCached{
    suite_access_token: string;
    expire_at: number;
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

function getRndStr(length) : string {
    let ret = '';
    for(var i=0, ii=length; i<ii; i++) {
        ret += Math.ceil(Math.random() * 9);
    }
    return ret;
}

//提供isv , corp 的api对象
async function getISVandCorp (permanentCode : string) : object{
    let tokenObj = await _getSuiteToken();
    let suiteToken = tokenObj['suite_access_token']
    let isvApi = new ISVApi(config.suiteid, suiteToken, corpId, corp.permanentCode);
    let corpApi = await isvApi.getCorpApi();

    return {
        isvApi : isvApi,
        corpApi: corpApi
    }
}

export async function orgDeptCreate(msg : object){
    let { DeptId , CorpId } = msg;
    let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    let corp  = corps && corps[0];
    if(!corp || !corp.permanentCode){
        return;
    }

    let { isvApi , corpApi } = getISVandCorp(corp.permanentCode);

    for(let item of DeptId){
        let deptInfo = await corpApi.getDepartmentInfo(item);
        if(!deptInfo)
            continue;
        //创建一个新的部门
        let localNewDepartment = {"name": deptInfo.name , "companyId" : corp["companyId"] , "parentId":null}
        if(deptInfo.parentId != 1){
            //has parentId department
            let ParentDepartment = await Models.ddtalkDepartment.find({ where:{ dd_department_id : deptInfo.parentId }});
            if(ParentDepartment && ParentDepartment[0]){
                localNewDepartment.parentId = ParentDepartment[0].local_department_id;
            }
        }

        let department = await Models.department.create(localNewDepartment);
        return department.save();
    }
}

export async function orgDeptModify(msg : object){
    let { DeptId , CorpId } = msg;
    let corps = await Models.ddtalkCorp.find({where: {corpId: CorpId}});
    let corp  = corps && corps[0];
    if(!corp || !corp.permanentCode){
        return;
    }

    let { isvApi , corpApi } = getISVandCorp(corp.permanentCode);
    for(let item of DeptId){
        let deptInfo = await corpApi.getDepartmentInfo(item);
        if(!deptInfo)
            continue;
        //name changed or staff changed.
        let localAndDD = await Models.ddtalkDepartment.find({ where: { dd_department_id : item } });
        if(localAndDD && localAndDD[0]){
            let localDeptInfo = await Models.department.get(localAndDD.localDepartmentId);
        }else{
            //本地还没有这个部门
        }
    }
}

export= DDTalk