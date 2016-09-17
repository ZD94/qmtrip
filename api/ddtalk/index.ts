/**
 * Created by wlh on 16/9/7.
 */

'use strict';
let dingSuiteCallback = require("dingtalk_suite_callback");
import fs = require("fs");
import cache = require("common/cache");

const config ={
    token: 'jingli2016',
    encodingAESKey: '8nf2df6n0hiifsgg521mmjl6euyxoy3y6d9d3mt1laq',
    suiteid: 'suitezutlhpvgyvgakcdo', //这里的suiteid===suiteKey, 第一次验证没有不用填
    secret: 'pV--T2FZj-3QCjJzcQd5OnzDBAe6rRKRQGEmc8iVCvdtc2FUOS5icq1gVfkbqiTx',
}

import request = require('request');
import ISVApi = require("./lib/isvApi");
import CorpApi = require("./lib/corpApi");
import {reqProxy} from "./lib/reqProxy";
import {Company} from "api/_types/company";
import {Staff} from "api/_types/staff";
import {Models} from "../_types/index";

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

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
    let d = cache.read(key)
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
        // let authCorpInfo = authInfo.auth_corp_info;

        let corpAccessToken = await isvApi.getCorpAccessToken();
        let corpApi = new CorpApi(corpid, corpAccessToken);
        let userInfo: any = await corpApi.getUser(authUserInfo.userId);

        let corps = await Models.ddtalkCorp.find({where : {corpId: corpid}});
        if (corps && corps.length) {
            let corp = corps[0];
            let company = await corp.getCompany(corp['company_id']);
            company.status = 1;
            company = await company.save();

            corp.isSuiteRelieve = false;
            corp.permanentCode = permanentCode;
            corp = await corp.save();
        } else {
            //创建企业
            let company = Company.create({name: corp_name});
            company = await company.save();

            //钉钉关联企业信息
            let obj = {
                corpId: corpid,
                permanentCode: permanentCode,
                companyId: company.id,
                isSuiteRelieve: false}
            let ddtalkCorp = Models.ddtalkCorp.create(obj);
            await ddtalkCorp.save();
            //管理员信息
            let staff = Staff.create({
                name: userInfo.name,
                companyId: company.id,
                status: 1
            })
            staff = await staff.save();
            let _ddtalkUser = {
                id: staff.id,
                dingId: userInfo.dingId,
                userId: userInfo.userid,
                isAdmin: userInfo.isAdmin}
            let ddtalkUser = Models.ddtalkUser.create(_ddtalkUser);
            await ddtalkUser.save();
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
        }
    },

    /* * * 保存授权信息 * */
    suite_ticket: async function(msg) {
        let ticket = msg.SuiteTicket;
        await cache.write(CACHE_KEY, JSON.stringify({ticket: ticket, timestamp: msg.TimeStamp}));
        return msg;
    },

    getJSDKParams: async function(params) {
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
            console.info(originStr)
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
}

class DDTalk {

    static __initHttpApp(app) {
        app.post("/ddtalk/isv/receive", dingSuiteCallback(config, function(msg, req, res, next) {
            console.info(msg)
            return ddTalkMsgHandle[msg.EventType](msg)
                .then( (ret) => {
                    res.reply();
                })
                .catch((err) => {
                    console.error(err.stack);
                    next(err);
                });
        }));

        app.get("/ddtalk/js-api-config", function(req, res, next) {
            let corpid = req.query.corpid;
            let url = req.query.url;
            let timestamp = Math.floor(Date.now() / 1000);
            let noncestr = getRndStr(6);
            let agentid = '40756443';
            let fn: any = async ()=> {
                //查询企业永久授权码
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
                    let ticketObj = await corpApi.getTicket();    //获取到了ticket
                    let arr = [];
                    arr.push('noncestr='+noncestr)
                    arr.push('jsapi_ticket='+ticketObj.ticket);
                    arr.push('url='+url);
                    arr.push('timestamp='+timestamp)
                    arr.sort()
                    let originStr = arr.join('&');
                    console.info(originStr)
                    let signature = require("crypto").createHash('sha1').update(originStr, 'utf8').digest('hex');
                    return {
                        agentId: agentid, // 必填，微应用ID
                        corpId: corpid,//必填，企业ID
                        timeStamp: timestamp, // 必填，生成签名的时间戳
                        nonceStr: noncestr, // 必填，生成签名的随机串
                        signature: signature, // 必填，签名
                        jsApiList : [
                            'runtime.info',
                            'biz.contact.choose',
                            'device.notification.confirm',
                            'device.notification.alert',
                            'device.notification.prompt',
                            'biz.ding.post',
                            'biz.util.openLink',
                            'biz.user.get',
                            'runtime.permission.requestAuthCode',
                            'device.base.getInterface',
                            'device.base.getUUID',
                            'biz.util.scan',
                        ] // 必填，需要使用的jsapi列表，注意：不要带dd。
                    }
                    // return ticketObj;
                }
                throw new Error(`企业不存在`)
            }

            fn().then( (ret)=> {
                res.json(ret)
            }).catch((err) => {
                console.info(err.stack);
                next(err)
            });
        })
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