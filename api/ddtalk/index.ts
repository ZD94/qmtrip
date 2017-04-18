/**
 * Created by wlh on 16/9/7.
 */

'use strict';

const API = require('@jingli/dnode-api');
let dingSuiteCallback = require("dingtalk_suite_callback");
import fs = require("fs");
import cache from "common/cache";
import C = require("@jingli/config");

const config = C.ddconfig;
import request = require('request');
import ISVApi from "./lib/isvApi";
import {Models} from "_types/index";
import {clientExport} from "@jingli/dnode-api/dist/src/helper";
import {get_msg} from "./lib/msg-template/index";

import * as DealEvent from "./lib/dealEvent";

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

let ddTalkMsgHandle = {
    /* * * * 临时授权码* * * * */
    tmp_auth_code: async function(msg , req , res , next) {
        return await DealEvent.tmpAuthCode(msg , req , res , next);
    },

    /* * * * * 授权变更* * * * * * */
    change_auth: async function(msg) {
        return msg;
    },
    check_url: async function(msg) {
        return msg;
    },
    /* * * * 解除授权信息 * * * */
    suite_relieve: async function(msg) {
        return await DealEvent.suiteRelieve(msg);
    },

    /* * * 保存授权信息 , 每20分钟钉钉会请求一次 * * */
    suite_ticket: async function(msg) {
        let ticket = msg.SuiteTicket;
        return await cache.write(CACHE_KEY, JSON.stringify({
            ticket: ticket, timestamp: msg.TimeStamp
        }));
    },

    /* * * 企业增加员工 * * */
    user_add_org: async function(msg) {
        return await DealEvent.userModifyOrg(msg);
    },

    /* * 通讯录用户更改 * */
    user_modify_org : async function(msg){
        return await DealEvent.userModifyOrg(msg);
    },
    /* * 通讯录用户离职 * */
    user_leave_org : async function(msg){
        return await DealEvent.userLeaveOrg(msg);
    },
    /* * 通讯录用户被设为管理员 * */
    // org_admin_add : async function(msg){
    //     return msg;
    // },
    /* * 通讯录用户被取消设置管理员 * */
    // org_admin_remove : async function(msg){
    //     return msg;
    // },
    /* * *  通讯录企业部门创建 * * */
    org_dept_create : async function(msg){
        return await DealEvent.orgDeptCreate(msg);
    },
    /* * *  通讯录企业部门修改 * * */
    org_dept_modify : async function(msg){
        return await DealEvent.orgDeptCreate(msg);
    },
    /* * *  通讯录企业部门删除 * * */
    org_dept_remove : async function(msg){
        return await DealEvent.orgDeptRemove(msg);
    },
    /* * *  企业被解散 * * */
    org_remove : async function(msg){
        // return await DealEvent.orgDeptRemove(msg);
        return msg;
    }

}


class DDTalk {
    static __public: boolean = true;
    static __initHttpApp(app) {

        app.post("/ddtalk/isv/receive", dingSuiteCallback(config,async function (msg, req, res, next) {
            if(msg.CorpId){
                let corps = await Models.ddtalkCorp.find({
                    where : { corpId : msg.CorpId }
                });
                if(!corps.length){
                    return DealEvent.transpond(req , res , next);
                }
            }

            if(msg.EventType == "suite_ticket"){
                //transpond
                let url = config.test_url.replace(/\/$/g, "");
                if(config.test_url && config.reg_go){
                    request({
                        uri: url + "/ddtalk/suite_ticket",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        method: "POST",
                        body: msg
                    })
                }
            }

            if(!ddTalkMsgHandle[msg.EventType]){
                return res.reply();
            }
            return ddTalkMsgHandle[msg.EventType](msg , req , res , next)
                .then(() => {
                    res.reply();
                })
                .catch((err) => {
                    console.error(err.stack);
                    next(err);
                });
        }));

        app.post("/ddtalk/suite_ticket" , (req , res , next)=>{
            let msg = req.body || {};
            ddTalkMsgHandle.suite_ticket(msg);
            res.send("ok");
        });
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
            let tokenObj = await DealEvent._getSuiteToken();
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
            let tokenObj = await DealEvent._getSuiteToken();
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
            let tokenObj = await DealEvent._getSuiteToken();
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

    /*
    *  同步钉钉组织架构
    */
    @clientExport
    static async synchroDDorganization(){
        return DealEvent.synchroDDorganization();
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