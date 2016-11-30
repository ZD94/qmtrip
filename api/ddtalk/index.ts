/**
 * Created by wlh on 16/9/7.
 */

'use strict';
const API = require('common/api');
let dingSuiteCallback = require("dingtalk_suite_callback");
import fs = require("fs");
import cache from "common/cache";

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
import {TravelPolicy, EPlaneLevel, ETrainLevel, EHotelLevel} from "../_types/travelPolicy";
import {get_msg} from "./lib/msg-template/index";
import {md5} from "../../common/utils";

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

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


let ddTalkMsgHandle = {
    /* * * * 临时授权码* * * * */
    tmp_auth_code: async function(msg) {
        const TMP_CODE_KEY = `tmp_auth_code:${msg.AuthCode}`;
        let isExist = await cache.read(TMP_CODE_KEY);
        if (isExist) {
            return;
        }
        await cache.write(TMP_CODE_KEY, true, 60 * 2);
        let tokenObj = await _getSuiteToken();
        let suiteToken = tokenObj['suite_access_token']
        let permanentAuthMsg: any = await _getPermanentCode(suiteToken, msg.AuthCode);
        let permanentCode = permanentAuthMsg['permanent_code'];
        let companyInfo = permanentAuthMsg.auth_corp_info;

        let corp_name = companyInfo.corp_name;
        let corpid = companyInfo.corpid;

        let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, permanentCode);
        let authInfo: any = await isvApi.getCorpAuthInfo();
        let authUserInfo = authInfo.auth_user_info;

        //agentID每次都会变,所以每次授权都要获取
        let agents = authInfo.auth_info.agent || [];
        let agentid = '';
        for(let agent of agents) {
            if (agent['appid'] == config.appid) {
                agentid = agent['agentid'];
                break;
            }
        }
        let corpAccessToken = await isvApi.getCorpAccessToken();
        let corpApi = new CorpApi(corpid, corpAccessToken);
        let userInfo: any = await corpApi.getUser(authUserInfo.userId);
        const DEFAULT_PWD = '000000';
        let corps = await Models.ddtalkCorp.find({where : {corpId: corpid}});
        if (corps && corps.length) {
            let corp = corps[0];
            let company = await corp.getCompany(corp['company_id']);
            company.status = 1;
            company = await company.save();
            corp.isSuiteRelieve = false;
            corp.permanentCode = permanentCode;
            corp.agentid = agentid;
            corp = await corp.save();
        } else {
            //创建企业
            let company = Company.create({name: corp_name});
            company = await company.save();

            //创建默认差旅标准
            let travelPolicy = await TravelPolicy.create({name: '默认标准', planeLevel: EPlaneLevel.ECONOMY,
                trainLevel: ETrainLevel.SECOND_CLASS, hotelLevel: EHotelLevel.THREE_STAR, subsidy: 0, isDefault: true});
            travelPolicy.company = company;
            travelPolicy = await travelPolicy.save();

            //钉钉关联企业信息
            let obj = {
                id: company.id,
                corpId: corpid,
                permanentCode: permanentCode,
                companyId: company.id,
                isSuiteRelieve: false,
                agentid: agentid
            }
            let ddtalkCorp = Models.ddtalkCorp.create(obj);
            await ddtalkCorp.save();

            //管理员信息
            let staff = Staff.create({
                name: userInfo.name,
                status: 1,
                roleId: EStaffRole.OWNER,
                travelPolicyId: travelPolicy.id
            })
            staff.pwd = md5(DEFAULT_PWD);
            staff.company = company;
            staff = await staff.save();

            //更新公司信息
            company.createUser = staff.id;
            await company.save();

            let _ddtalkUser = {
                id: staff.id,
                dingId: userInfo.dingId,
                ddUserId: userInfo.userid,
                isAdmin: userInfo.isAdmin,
                name: userInfo.name,
                avatar: userInfo.avatar,
                corpid: corpid,
            }
            let ddtalkUser = Models.ddtalkUser.create(_ddtalkUser);
            await ddtalkUser.save();

            try {
                let departments = await corpApi.getDepartments();
                for(let d of departments) {
                    // console.info(`导入department:`, d.name)
                    let _d = Models.department.create({name: d.name});
                    _d.company = company;
                    _d = await _d.save();

                    let users = await corpApi.getUserListByDepartment(d.id);
                    for(let u of users) {
                        let dingUsers = await Models.ddtalkUser.find({ where: {corpid: corpid, ddUserId: u.userid}})
                        if (dingUsers && dingUsers.length) {
                            //查看是否是同一个公司
                            let dingUser = dingUsers[0];
                            let s = await Models.staff.get(dingUser.id);
                            if (company.id == s.company.id) {
                                continue;
                            }
                        }

                        let _staff = Models.staff.create({name: u.name, travelPolicyId: travelPolicy.id})
                        _staff.company = company;
                        _staff.department = _d;
                        _staff.pwd = md5(DEFAULT_PWD);
                        _staff = await _staff.save();
                        // console.info(`导入user:`, u.name);
                        let dingUser = Models.ddtalkUser.create({id: _staff.id, avatar: u.avatar, dingId: u.dingId,
                            isAdmin: u.isAdmin, name: u.name, ddUserId: u.userid, corpid: corpid});
                        await dingUser.save();
                    }
                }
            } catch(err) {
                console.error("导入用户错误", err)
                throw err;
            }
        }
        await isvApi.activeSuite();
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

function getRndStr(length) : string {
    let ret = '';
    for(var i=0, ii=length; i<ii; i++) {
        ret += Math.ceil(Math.random() * 9);
    }
    return ret;
}

export= DDTalk