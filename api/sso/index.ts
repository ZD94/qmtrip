import {Express} from "express";

import RedisCache from "../ddtalk/lib/redisCache";
import { L } from '@jingli/language';
import { Staff, EStaffStatus, EStaffRole, StaffProperty, SPropertyType } from "_types/staff";
import { Models } from "_types";
import { CPropertyType, CompanyProperty, Company } from "_types/company";
import * as error from "@jingli/error";
import { RestApi } from "api/sso/libs/restApi";
import { IAccessToken, IWPermanentCode } from "./libs/restApi";
import { WCompany } from "api/sso/libs/wechat-company";
import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import { Department } from "_types/department";
import Logger from "@jingli/logger";
var scheduler = require('common/scheduler');
var logger = new Logger("wechat");
let moment = require("moment");
const md5 = require("md5");
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')
const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`
import cache from 'common/cache'
import { Request, NextFunction, Response, Application } from 'express-serve-static-core';
import {restfulAPIUtil } from 'api/restful';
import CompanyModule, { HotelPriceLimitType } from 'api/company';

const { Parser } = require('xml2js')
const wxCrypto = require('wechat-crypto')
const crypto = new wxCrypto(config.workWechat.token, config.workWechat.encodingAESKey, config.workWechat.corpId)

const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'
var EXPIREDATE = 7200; //微信access_token的失效时间是7200秒
export default class SSOModule {
    cache: RedisCache;
    constructor(){
        this.cache = new RedisCache();

    }

    static __initHttpApp(app: Application) {
        app.all('/wechat/receive', receive)
        app.all('/wechat/data/callback', dataCallback)
        app.all('/wechat/test', async (req, res, next) =>{
            res.json("test callback successfully")
        })
    }

    @clientExport
    static async getSuiteToken() {
        const suite_token = await cache.read('suite_token')
        if (suite_token) return suite_token

        const suite_ticket = await cache.read('suite_ticket')
        if (!suite_ticket) throw new L.ERROR_CODE_C(500, '数据回调处理异常,缓存中不存在suite_ticket')
        const res = await axios.post(SUITE_TOKEN_URL, {
            suite_id: config.workWechat.suiteId,
            suite_secret: config.workWechat.suiteSecret,
            suite_ticket
        })
        if (res.status == 200) {
            await cache.write('suite_token', res.data.suite_access_token, 7200)
            return res.data.suite_access_token
        }
        throw new L.ERROR_CODE_C(500, "获取 suite_token 失败")
    }

    @clientExport
    @requireParams(['code'])
    static async getUserInfo({ code }: { code: string }): Promise<WeChatUsrInfo> {
        const suite_token = await API.sso.getSuiteToken()
        const res = await axios.get(`${USER_INFO_URL}?access_token=${suite_token}&code=${code}`)
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data
        }
        throw new L.ERROR_CODE_C(500, "获取用户信息失败")
    }

    /**
     * @method 同步微信企业组织架构
     *    1: 企业首次在企业部署鲸力应用，向鲸力系统推送authCode, 进而同步通讯录
     *    2： 用户主动在鲸力app中主动触发同步通讯录
     */
    @clientExport
    async syncOrganization(accessToken?: string) {
        console.log("=======>同步企业通讯录开始")
        let hasComPropertySaved = false;
        let self = this;
        let corpId: string;
        let agentId: string;
        let company: Company;
        let permanentCode: string;
        let hasJLCloudNotified = true;
        let suiteToken: string = await SSOModule.getSuiteToken();
        let staff = await Staff.getCurrent();
        if(staff){
            company = staff.company;
            let comProperty = await Models.companyProperty.find({
                where: {
                    companyId: company.id
                }
            });
            if(comProperty && comProperty.length)
                hasComPropertySaved = true;
            for(let i =0; i < comProperty.length; i++){
                if(comProperty[i].type == CPropertyType.WECHAT_CORPID) 
                    corpId = comProperty[i].value;
                if(comProperty[i].type == CPropertyType.WECHAT_PERMAENTCODE)
                    permanentCode = comProperty[i].value;
            }
        }
        
        if(!company) {
            let authCode = await cache.read('create_auth'); 
            let permanentResult: IWPermanentCode = await RestApi.getPermanentCode(suiteToken, authCode)
            console.log("======>permanentResult: ", permanentResult)
            if(!permanentResult)
                throw new Error("永久授权码获取失败")
                // throw new error.NotPermitError(`永久授权码获取失败`)

            permanentCode = permanentResult.permanentCode;
            accessToken = permanentResult.accessToken;
            agentId = permanentResult.authInfo.agentId;

            let comProperty = await self.getRegisteredCompany(permanentCode, permanentResult.corpId);
            if(!comProperty) {
                let com =await self.initializeCompany(permanentResult);
                hasJLCloudNotified = false;
                company = com.company;
                corpId = com.corpId;
            }
            if(comProperty) {
                company = comProperty.company;
                corpId = comProperty.corpId;
            }
            permanentCode = permanentResult.permanentCode;
        }

        if(!accessToken) {
            accessToken = await this.getAccessToken(corpId, permanentCode, suiteToken);
        }

        let restApi = new RestApi(accessToken);
        let wCompany = new WCompany({ id: corpId, name: company.name, restApi, company: company, permanentCode: permanentCode, agentId: agentId});
        await wCompany.saveCompanyProperty({companyId: company.id, permanentCode: permanentCode})
        await wCompany.sync();
        await wCompany.syncAdminRole(suiteToken); //同步企业管理员
        await wCompany.setCompanyCreator();  //随机选中设置创建者

        //向jlbudget同步
        if(!hasJLCloudNotified) {
            await API.company.syncCompanyToJLCloud(company,'123456');
        }

    }




    /**
     * @method 检查企业是否已经在鲸力系统注册
     * @param permanentCode 
     */
    async getRegisteredCompany(permanentCode:string, corpId: string): Promise<{company: Company, corpId: string}> {
        let comProperty = await Models.companyProperty.find({
            where: {
                value: corpId,
                type: CPropertyType.WECHAT_CORPID
            }
        });
        if(comProperty && comProperty.length) {
            let company = await Models.company.get(comProperty[0].companyId)
            if(!company) return null;
            return { company, corpId};
        }
        return null;
    }

    /**
     * @method 根据permanentCode获取已注册公司，获取初始化新公司
     * @param result 
     */
    async initializeCompany(result: IWPermanentCode | any): Promise<{company: Company, corpId: string, permanentCode: string}> {
        let permanentCode = result.permanentCode;
        if(!permanentCode)
            throw new Error("永久授权码不存在")
            // throw new error.ParamsNotValidError("永久授权码不存在");
        let companyProperty = await Models.companyProperty.find({
            where: {
                value: result.corpId,
                type: CPropertyType.WECHAT_CORPID
            }
        })
        let company: Company;
        let corpId: string;
       
        if(companyProperty && companyProperty.length) {
            company = await Models.company.get(companyProperty[0].companyId);
            corpId = result.corpId;
        }
        if(!companyProperty || companyProperty.length == 0) {
            corpId = result.corpId;

            company = Company.create({
                name: result.corpName,
                expiryDate : moment().add(1 , "months").toDate(),
                mobile: result.authUserInfo.mobile
            })
            let defaultAgency = await Models.agency.find({  //Agency.__defaultAgencyId;
                where:{
                    email: config.default_agency.email
                }
            });
            let agencyId:any;
            if(defaultAgency && defaultAgency.length==1){
                agencyId=defaultAgency[0].id;
            }
            company['agencyId'] = agencyId;
            company = await company.save();
 
            //授权时存在管理员id， 则保存
            if(result && result.authUserInfo && result.authUserInfo.userid) {
                let staff: Staff = Staff.create({
                    name: result.authUserInfo.name,
                    staffStatus: EStaffStatus.ON_JOB,
                    roleId: EStaffRole.ADMIN
                });
                staff = await staff.save();
                let staffProperty = StaffProperty.create({
                    type: SPropertyType.WECHAT_UID,
                    staffId: staff.id,
                    value: result.authUserInfo.userId,  
                })
                staff.company = company;
                staff = await staff.save();
                
                company.createUser = staff.id;
                company = await company.save();
            }
            // let department = Department.create({
            //     name: result.corpName,
            //     companyId: company.id,
            //     isDefault: true
            // })
            // department = await department.save();
        }
        return {
            company,
            corpId,
            permanentCode
        }
    }

    static _scheduleTask() {
        let taskId = "syncWechatEnterpriseOrganization";
        logger.info('run task ' + taskId);
        scheduler('* */1 * * * *', taskId, async function () {
            await dealEvent();
        });
    }

    /**
     * @method 根据企业的corpid、secret生成企业的accessToken
     * @param secret {string} 
     * @param corpId
     * @return {string} 
     */
    async getAccessToken(corpId: string, permanentCode: string, suiteToken: string): Promise<string>{
        let cacheKey = `wechat:contact:${corpId}:access_token`;  //企业通讯录的access_token
        let redisCache = new RedisCache();
        let cacheResult: {
            accessToken: string,
            expired: number
        } = await redisCache.get(cacheKey);
        let accessToken: string;
        if(cacheResult) accessToken = cacheResult.accessToken;
        if(!cacheResult || (Date.now() - cacheResult.expired > 0)) {
            let result = await RestApi.getAccessTokenByPermanentCode(corpId, permanentCode, suiteToken);
            if(!result) return null;
            let value = {
                accessToken: result.accessToken,
                expired: Date.now() + (result.expires_in - 30)* 1000   
            };
            accessToken = result.accessToken;
            await this.cache.set(cacheKey, value)
        }
        if(!accessToken) 
            throw new Error("获取通讯录的accessToken失败")
            // throw new error.NotFoundError("获取通讯录的accessToken失败")
        return accessToken;
    }

    @clientExport
    @requireParams(['code'])
    static async loginByWechatCode(params: { code: string }) {
        const usrInfo: WeChatUsrInfo = await API.sso.getUserInfo(params)
        console.log('usr:', usrInfo)
        const companyProperties = await Models.companyProperty.find({
            where: { type: SPropertyType.WECHAT_CORPID, value: usrInfo.CorpId, deletedAt: null}
        })
        if (companyProperties.length < 1)
            throw new L.ERROR_CODE_C(404, "该企业尚未授权")
        console.log('company: ', companyProperties)
        const staffProperties = await Models.staffProperty.find({
            where: { type: SPropertyType.WECHAT_UID, value: usrInfo.UserId }
        })
        console.log('staffs:', staffProperties)
        if (staffProperties.length < 1)
            throw L.ERR.USER_NOT_EXIST()

        const staffs = await Promise.all(staffProperties.map(sp => Models.staff.get(sp.staffId)))
        const staff = staffs.filter(s => s.company.id == companyProperties[0].companyId)[0]
        console.log('staff:', staff)
        if (!staff) throw L.ERR.USER_NOT_EXIST()
        return { data: await API.auth.makeAuthenticateToken(staff.accountId, 'corp_wechat'), corpId: usrInfo.CorpId }
    }


    @clientExport
    @requireParams(['corpId'])
    static async getPermanentCodeByCorpId({ corpId }: { corpId: string }) {
        const companyProperties = await Models.companyProperty.find({
            where: { type: CPropertyType.WECHAT_CORPID, value: corpId }
        })
        if (companyProperties.length < 1) throw new L.ERROR_CODE_C(404, '该企业尚未授权')
        const companies = await Models.companyProperty.find({
            where: { type: CPropertyType.WECHAT_PERMAENTCODE, company_id: companyProperties[0].companyId }
        })
        return companies[0].value
    }
}

SSOModule._scheduleTask();
let sso = new SSOModule()

async function receive(req: Request, res: Response) {
    const { timestamp, nonce, msg_signature, echostr } = req.query
    if (echostr) {
        if (msg_signature != crypto.getSignature(timestamp, nonce, echostr)) {
            return res.sendStatus(403)
        }
        return res.send(crypto.decrypt(echostr).message)
    }

    let rawBody = ''
    req.setEncoding('utf8')

    req.on('data', chunk => {
        rawBody += chunk
    })
    req.on('end', () => {
        if (rawBody == '') {
            return res.sendStatus(403)
        }
        new Parser().parseString(rawBody, (err, data) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            return res.send(resp.message)
        })
    })
}

async function dataCallback(req: Request, res: Response, next: NextFunction) {
    const { timestamp, nonce, msg_signature, echostr } = req.query
    if (req.method.toUpperCase() == 'GET') {
        if (msg_signature != crypto.getSignature(timestamp, nonce, echostr)) {
            return res.sendStatus(403)
        }
        return res.send(crypto.decrypt(echostr).message)
    }

    let rawBody = ''
    req.setEncoding('utf8')

    req.on('data', chunk => {
        rawBody += chunk
    })
    req.on('end', () => {
        if (rawBody == '') {
            return res.sendStatus(403)
        }
   
        new Parser().parseString(rawBody, (err, data) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            new Parser().parseString(resp.message, async (err, data) => {
                await workWechatEventHandlers[data.xml['InfoType']](data.xml)
                res.send('success')
            })
        })
    })
}

async function eventPush(msg: string ){
    let key = `sync:wechat:company` ;
    let result = await cache.rpush( key, msg );
    logger.log("产生新的微信企业同步组织架构事件")
    return;
}

async function dealEvent(){
    let key = 'sync:wechat:company';
    let msg : { EventType : string } = await cache.lpop(key);
    if(!msg){
        return ;
    }
    try{
        await sso.syncOrganization();
    }catch(e){
        console.error(e);
    }
}

export interface WeChatUsrInfo {
    CorpId: string,
    UserId: string,
    DeviceId: string
}

const workWechatEventHandlers = {
    // 推送 suite_ticket 事件
    async suite_ticket(xml: WorkWechatResponse) {
        await cache.write('suite_ticket', xml.SuiteTicket)
    },
    // 授权变更事件
    async create_auth(xml: WorkWechatResponse) {
        await cache.write('create_auth',xml.AuthCode);
        eventPush(xml.AuthCode);
    },
    async change_auth(xml: WorkWechatResponse) {

    },
    async cancel_auth(xml: WorkWechatResponse) {

    },
    // 通讯录变更事件
    async change_contact(xml: WorkWechatResponse) {
        await changeContactEventHandlers[xml['ChangeType']](xml)
    }
}

const changeContactEventHandlers = {
    // 员工变动事件
    async create_user(xml: WorkWechatResponse) {

    },
    async update_user(xml: WorkWechatResponse) {

    },
    async delete_user(xml: WorkWechatResponse) {

    },
    // 部门变动事件
    async create_party(xml: WorkWechatResponse) {

    },
    async update_party(xml: WorkWechatResponse) {

    },
    async delete_party(xml: WorkWechatResponse) {

    },
    // 标签成员变更事件
    async update_tag(xml: WorkWechatResponse) {

    }
}

export interface WorkWechatResponse {
    SuiteId: string,
    InfoType: string,
    TimeStamp: number,
    SuiteTicket?: string,
    AuthCode?: string,
    AuthCorpId?: string
}