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
    suiteid: 'suite3run9ntilukajkvp', //这里的suiteid===suiteKey, 第一次验证没有不用填
    secret: '9Nlv2n0tUm-7ODThlYYboF4RZLTtgnsPvASUOAkOSEZTei4jY-sJrWw8uiP6qDWq',
}

import request = require('request');
import ISVApi = require("./lib/isvApi");
import CorpApi = require("./lib/corpApi");
import {reqProxy} from "./lib/reqProxy";
import {DDTalkCorp, DDTalkUser} from "api/_types/ddtalk";
import {Company} from "api/_types/company";
import {Staff} from "api/_types/staff";
import {Models} from "../_types/index";

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

async function _getSuiteToken() {
    let ticketObj: any = await cache.read(CACHE_KEY);
    if (typeof ticketObj == 'string') {
        ticketObj = JSON.parse(ticketObj);
    }
    if (!ticketObj || !ticketObj.ticket) {
        throw new Error(`还没有ticket`);
    }
    let ticket = ticketObj.ticket;
    console.info(ticket);
    if (!ticket) {
        throw new Error('不存在ticket');
    }
    let url = `https://oapi.dingtalk.com/service/get_suite_token`;
    return reqProxy(url, {
        name: '获取套件Token',
        body: {
            suite_key: config.suiteid,
            suite_secret: config.secret,
            suite_ticket: ticket
        }
    })
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
        let authCorpInfo = authInfo.auth_corp_info;

        let corpAccessToken = await isvApi.getCorpAccessToken();
        let corpApi = new CorpApi(corpAccessToken);
        let userInfo: any = await corpApi.getUser(authUserInfo.userId);
        console.info(userInfo);

        //创建企业
        let company = Company.create({name: corp_name});
        company = await company.save();

        //钉钉关联企业信息
        let obj = {corpId: corpid, permanentCode: permanentCode, companyId: company.id, isSuiteRelieve: false}
        let ddtalkCorp = Models.ddtalkCorp.create(obj);
        await ddtalkCorp.save();
        //管理员信息
        let staff = Staff.create({
            name: userInfo.name,
            companyId: company.id,
        })
        staff = await staff.save();
        let _ddtalkUser = {
            id: staff.id,
            dingId: userInfo.dingId,
            userId: userInfo.userid,
            isAdmin: userInfo.isAdmin}
        let ddtalkUser = Models.ddtalkUser.create(_ddtalkUser);
        await ddtalkUser.save();
    },

    /* * * * * 授权变更* * * * * * */
    change_auth: async function(msg) {
        return msg;
    },

    /* * * * 解除授权信息 * * * */
    suite_relieve: async function(msg) {
        console.info('解除授权', msg);
        return msg;
    },

    /* * * 保存授权信息 * */
    suite_ticket: async function(msg) {
        console.info("suite_ticket===>", msg)
        let ticket = msg.SuiteTicket;
        await cache.write(CACHE_KEY, JSON.stringify({ticket: ticket, timestamp: msg.TimeStamp}));
        return msg;
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
                    res.reply();
                });
        }));
    }
}

export= DDTalk