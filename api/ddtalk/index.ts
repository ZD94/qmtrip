/**
 * Created by wlh on 16/9/7.
 */

'use strict';

const API = require('@jingli/dnode-api');
let dingSuiteCallback = require("dingtalk_suite_callback");
import cache from "common/cache";
const C = require("@jingli/config");
import L from '@jingli/language';
const config = C.ddconfig;
import request = require('request');
import ISVApi from "./lib/isvApi";
import {Models} from "_types/index";
import {SPropertyType, Staff} from "_types/staff";
import {clientExport} from "@jingli/dnode-api/dist/src/helper";
import {get_msg} from "./lib/msg-template/index";

import * as DealEvent from "./lib/dealEvent";
import {CPropertyType} from "../../_types/company/company-property";
import { Request, Response, NextFunction, Application } from 'express-serve-static-core';

const CACHE_KEY = `ddtalk:ticket:${config.suiteid}`;

// async function wait(number){
//     return new Promise(function(resolve, reject) {
//         setTimeout(() => {
//             resolve(null);
//         }, number)
//     })
// }
let ddTalkMsgHandle = {
    /* * * * 临时授权码* * * * */
    tmp_auth_code: async function(msg: any , req: Request , res: Response , next: NextFunction) {
        return await DealEvent.tmpAuthCode(msg , req , res , next);
    },

    /* * * * * 授权变更* * * * * * */
    change_auth: async function(msg: any) {
        return msg;
    },
    check_url: async function(msg: any) {
        return msg;
    },
    /* * * * 解除授权信息 * * * */
    suite_relieve: async function(msg: any) {
        return await DealEvent.suiteRelieve(msg);
    },

    /* * * 保存授权信息 , 每20分钟钉钉会请求一次 * * */
    suite_ticket: async function(msg: any) {
        let ticket = msg.SuiteTicket;
        return await cache.write(CACHE_KEY, JSON.stringify({
            ticket: ticket, timestamp: msg.TimeStamp
        }));
    },

    /* * * 企业增加员工 * * */
    user_add_org: async function(msg: any) {
        return await DealEvent.userModifyOrg(msg);
    },

    /* * 通讯录用户更改 * */
    user_modify_org : async function(msg: any){
        // let userIds = msg.UserId;
        // let corpId = msg.CorpId;
        // let execute = true;
        // await Promise.all(userIds.map(async (item) => {
        //     let staffPro = await Models.staffProperty.find({where : {value: item}});
        //     if(!(staffPro && staffPro.length)){
        //         execute = false;
        //     }
        // }))
        // if(!execute){
        //     await wait(5000);
        // }
        return await DealEvent.userModifyOrg(msg);
    },
    /* * 通讯录用户离职 * */
    user_leave_org : async function(msg: any){
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
    org_dept_create : async function(msg: any){
        return await DealEvent.orgDeptCreate(msg);
    },
    /* * *  通讯录企业部门修改 * * */
    org_dept_modify : async function(msg: any){
        return await DealEvent.orgDeptCreate(msg);
    },
    /* * *  通讯录企业部门删除 * * */
    org_dept_remove : async function(msg: any){
        return await DealEvent.orgDeptRemove(msg);
    },
    /* * *  企业被解散 * * */
    org_remove : async function(msg: any){
        // return await DealEvent.orgDeptRemove(msg);
        return msg;
    }

}

let DDEventCorpId : any = {};


class DDTalk {
    static __public: boolean = true;

    static __initHttpApp(app: Application) {

        let self = this;

        app.get("/JLTesthello", (req, res, next)=>{

            let url = config.test_url.replace(/\/$/g, "");
            if(config.reg_go){
                return DealEvent.transpond(req, res, next, null, url+"/JLTesthello");
            }
            console.log("yes, it's the hello");
            res.send("ok");
        });

        app.post("/ddtalk/isv/receive", dingSuiteCallback(config, async function (msg: any, req: Request, res: any, next: NextFunction) {

            console.log("hello : ", msg);
            if(msg.CorpId){
                /*let corps = await Models.ddtalkCorp.find({
                    where : { corpId : msg.CorpId }
                });*/
                let comPros = await Models.companyProperty.find({where: {value: msg.CorpId, type: CPropertyType.DD_ID}});
                if(config.test_url && config.reg_go && (!comPros || !comPros.length)){
                    return DealEvent.transpond(req, res, next, null);
                }
            }

            if(msg.EventType == "suite_ticket"){
                //transpond
                let url = config.test_url.replace(/\/$/g, "");
                if(config.test_url && config.reg_go){
                    request.post({
                        url : url + "/ddtalk/suite_ticket",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        form: msg
                    }, function(err, res) {
                        if (err) {
                            return console.error(err)
                        }
                    });
                }
            }

            /*if(msg.EventType != "tmp_auth_code"){
                const COMPANY_EVENTS_KEY = `company_events:${msg.CorpId}`;
                let isExist = await cache.read(COMPANY_EVENTS_KEY);

                let eventList = [];
                if(!isExist){
                    eventList.unshift(msg);
                    let content = {isRunning: false, eventList: eventList};
                    await cache.write(COMPANY_EVENTS_KEY, content, 60 * 60 * 24);
                    await DDTalk.dealEvent(msg.CorpId);
                }else{
                    eventList = isExist.eventList;
                    eventList.unshift(msg);
                    isExist.eventList = eventList;
                    await cache.write(COMPANY_EVENTS_KEY, isExist, 60 * 60 * 24);
                    if(!isExist.isRunning){
                        await DDTalk.dealEvent(msg.CorpId);
                    }

                }
                return res.reply();
            }else{*/

               /* if(!ddTalkMsgHandle[msg.EventType]){
                    return res.reply();
                }
                return ddTalkMsgHandle[msg.EventType](msg , req , res , next)
                    .then((result) => {
                        if(!(result && result.notReply)){
                            res.reply();
                        }
                    })
                    .catch((err) => {
                        console.error(err.stack);
                        next(err);
                    });*/

            // }


            /* ======== 修改事件处理方式 ======== */
            if(msg.CorpId){
                await self.eventPush(msg);
                res.reply();
                return;
            }
            
            return ddTalkMsgHandle[msg.EventType](msg , req , res , next)
                .then((result: any) => {
                    if(!(result && result.notReply)){
                        res.reply();
                    }
                })
                .catch((err: Error) => {
                    console.error(err.stack);
                    next(err);
                });

        }));

        app.post("/ddtalk/suite_ticket" , (req , res , next)=>{
            let msg = req.body || {};
            console.log("enter in : /ddtalk/suite_ticket");
            ddTalkMsgHandle.suite_ticket(msg);
            res.send("ok");
        });
    }

    static async dealEvent(corpId: string){
        let key = 'company_events:' + corpId;
        let msg : { EventType : string } = await cache.lpop(key);
        if(!msg){
            DDEventCorpId[corpId] = false;
            return;
        }

        try{
            await ddTalkMsgHandle[msg.EventType](msg);
        }catch(e){
            console.error(e);
        }
        
        await this.dealEvent( corpId );
    }

    static async eventPush( msg: any ){
        let corpId = msg.CorpId;
        let key = 'company_events:' + corpId;
        await cache.rpush( key, msg );
        if(!DDEventCorpId[corpId]){
            DDEventCorpId[corpId] = true;
            await this.dealEvent( corpId );
        }else{
            console.log("this key is running ===> ", corpId);
        }

        console.log("DDEventCorpId====>", DDEventCorpId);
    }

    @clientExport
    static async getJSAPIConfig(params: any) {
        let {orgid, agentid, url} = params;
        let timestamp = Math.floor(Date.now() / 1000);
        let noncestr = getRndStr(6);
        //查询企业永久授权码
        // let corps = await Models.ddtalkCorp.find({ where: {corpId: orgid}, limit: 1});
        let comPros = await Models.companyProperty.find({where: {value: orgid, type: CPropertyType.DD_ID}});
        if (comPros && comPros.length) {
            let comPro = comPros[0];
            let company = await Models.company.get(comPro.companyId);
            if (company.isSuiteRelieve) {
                let err = new Error(`企业还未授权或者已取消授权`);
                throw err;
            }
            let comPermanentCodePros = await Models.companyProperty.find({where: {companyId: company.id,
                type: CPropertyType.DD_PERMANENT_CODE}});
            let tokenObj = await DealEvent._getSuiteToken();
            let suiteToken = tokenObj['suite_access_token']
            let isvApi = new ISVApi(config.suiteid, suiteToken, orgid, comPermanentCodePros[0].value);
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
    static async loginByDdTalkCode(params: any) : Promise<any> {
        console.log("enter In loginByDdTalkCode" , params);
        let {corpid, code} = params;
        // let corps = await Models.ddtalkCorp.find({ where: {corpId: corpid}, limit: 1});
        let comPros = await Models.companyProperty.find({where: {value: corpid, type: CPropertyType.DD_ID}});
        if (comPros && comPros.length) {
            let comPro = comPros[0];
            let company = await Models.company.get(comPro.companyId);
            if (company.isSuiteRelieve) {
                let err = new Error(`企业还未授权或者已取消授权`);
                throw err;
            }
            let comPermanentCodePros = await Models.companyProperty.find({where: {companyId: company.id,
                type: CPropertyType.DD_PERMANENT_CODE}});
            let tokenObj = await DealEvent._getSuiteToken();
            let suiteToken = tokenObj['suite_access_token'];
            console.info("suiteToken==>>", suiteToken);
            let isvApi = new ISVApi(config.suiteid, suiteToken, corpid, comPermanentCodePros[0].value);
            let corpApi = await isvApi.getCorpApi();
            let dingTalkUser = await corpApi.getUserInfoByOAuth(code);
            console.info("dingTalkUser==>>", dingTalkUser);
            //查找是否已经绑定账号
            // let ddtalkUsers = await Models.ddtalkUser.find( { where: {corpid: corpid, ddUserId: dingTalkUser.userId}});
            let staffPro = await Models.staffProperty.find({where : {value: dingTalkUser.userId, type: SPropertyType.DD_ID}});
            let staff: Staff;
            if (staffPro && staffPro.length) {
                for(let s of staffPro){
                    let st = await Models.staff.get(s.staffId);
                    let staffCorpPro = await Models.staffProperty.find({where : {value: corpid, type: SPropertyType.DD_COMPANY_ID,
                    staffId: st.id}});
                    if(staffCorpPro && staffCorpPro.length){
                        staff = st;
                    }
                }

                if(staff){
                    // //自动登录
                    console.log("钉钉自动登录: API.auth.makeAuthenticateToken ", dingTalkUser.userId, staff.accountId);
                    let ret = await API.auth.makeAuthenticateToken(staff.accountId, 'ddtalk');
                    return ret;
                }else{
                    throw L.ERR.UNAUTHORIZED();
                }
            }
            throw L.ERR.UNAUTHORIZED();
        } else {
            throw L.ERR.COMPANY_NOT_EXIST();
        }
    }

    static async sendLinkMsg(params: any): Promise<any> {
        let {accountId, text, url, picurl} = params;
        text = text || '您有一条新消息'
        url = url || '#';
        picurl = picurl || 'http://j.jingli365.com/ionic/images/dingtalk-shareicon.png';
        let staff = await Models.staff.get(accountId);
        let company = staff.company;
        /*let corp = await Models.ddtalkCorp.get(company.id);
        let ddtalkUser = await Models.ddtalkUser.get(staff.id);*/

        let comPros = await Models.companyProperty.find({where: {companyId: company.id, type:
            [CPropertyType.DD_ID, CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});
        let staffPros = await Models.staffProperty.find({where: {staffId: staff.id, type: SPropertyType.DD_ID}});
        if (comPros && comPros.length && staffPros && staffPros.length) {
            let tokenObj = await DealEvent._getSuiteToken();
            let corpId = "";
            let permanentCode = "";
            let agentId = "";
            for(let c of comPros){
                if(c.type == CPropertyType.DD_ID) corpId = c.value;
                if(c.type == CPropertyType.DD_PERMANENT_CODE) permanentCode = c.value;
                if(c.type == CPropertyType.DD_AGENT_ID) agentId = c.value;
            }
            let isvApi = new ISVApi(config.suiteid, tokenObj['suite_access_token'], corpId, permanentCode);
            let corpApi = await isvApi.getCorpApi();
            let msg= await get_msg({
                touser: staffPros[0].value,
                content: text,
                agentid: agentId,
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

function getRndStr(length: number) : string {
    let ret = '';
    for(var i=0, ii=length; i<ii; i++) {
        ret += Math.ceil(Math.random() * 9);
    }
    return ret;
}



export= DDTalk