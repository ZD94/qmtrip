import RedisCache from "../ddtalk/lib/redisCache";
import { L } from '@jingli/language';
import { Staff, EStaffStatus, EStaffRole, SPropertyType } from "_types/staff";
import { Models } from "_types";
import { CPropertyType,Company, CompanyProperty } from "_types/company";
import { RestApi } from "api/sso/libs/restApi";
import { IWPermanentCode } from "./libs/restApi";
import { WCompany } from "api/sso/libs/wechat-company";
import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import Logger from "@jingli/logger";
var scheduler = require('common/scheduler');
var logger = new Logger("wechat");
let moment = require("moment");
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')
const axios = require('axios')
import cache from 'common/cache'
import { Request, NextFunction, Response, Application } from 'express-serve-static-core';
import { IWCreateUser, IWCreateDepartment, IWUpdateDepartment, IWDeleteDepartment } from './libs/event-notice';
import { IWUpdateUser, IWDeleteUser, EventNotice } from 'api/sso/libs/event-notice';

const { Parser } = require('xml2js')
const wxCrypto = require('wechat-crypto')
const crypto = new wxCrypto(config.workWechat.token, config.workWechat.encodingAESKey, config.workWechat.corpId)

const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'

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
        let self = this;
        let corpId: string = '';
        let agentId: string = '';
        let company: Company | undefined;
        let permanentCode: string = '';
        let hasJLCloudNotified = true;
        let suiteToken: string = await SSOModule.getSuiteToken();
        let staff = await Staff.getCurrent();
        let comProperty: {company: Company, corpId?: string, permanentCode?: string};
        
        if(staff){
            try{
                comProperty = await SSOModule.checkCompanyRegistered({companyId: staff.company.id});
                if(comProperty && comProperty.company) company = comProperty.company;
            } catch(err) {}   
        }   
        if(!company) {
            let authCode = await cache.read('create_auth'); 
            let permanentResult: IWPermanentCode = await RestApi.getPermanentCode(suiteToken, authCode)
            console.log("======>permanentResult: ", permanentResult)
            if(!permanentResult)
                throw new Error("永久授权码获取失败")
            permanentCode = permanentResult.permanentCode;
            accessToken = permanentResult.accessToken;
            agentId = permanentResult.authInfo.agentId;
            corpId = permanentResult.corpId

            try{
                comProperty = await SSOModule.checkCompanyRegistered({corpId});
            } catch(err) {}    
            if(!comProperty) {
                let com =await self.initializeCompany(permanentResult);
                hasJLCloudNotified = false;
                company = com.company;
            }
            if(comProperty && comProperty.company) company = comProperty.company;
        }

        if(!accessToken) {
            accessToken = (await this.getAccessToken(corpId, permanentCode, suiteToken)) || '';
        }

        let restApi = new RestApi(accessToken);
        if (company) {
            let wCompany = new WCompany({ id: corpId, name: company.name, restApi, company: company, permanentCode: permanentCode, agentId: agentId});
            await wCompany.saveCompanyProperty({companyId: company.id, permanentCode: permanentCode})
            await wCompany.sync();
            await wCompany.syncAdminRole(suiteToken); //同步企业管理员
            await wCompany.setCompanyCreator();  //随机选中设置创建者
        }

        //向jlbudget同步
        if(!hasJLCloudNotified) {
            await API.company.syncCompanyToJLCloud(company,'123456');
        }
    }

    /**
     * @method 检查企业是否已经在鲸力系统注册
     * @param permanentCode 
     */
    @clientExport
    static async checkCompanyRegistered(params: {companyId?:string, corpId?: string}): Promise<{company: Company, corpId: string, permanentCode: string}> {
        let {companyId, corpId} = params;
        let company: Company;
        if(!companyId && !corpId) throw new L.ERROR_CODE_C(404, '参数错误')
        let query: {where: any} = {where: {}};
        let permanentCode: string;
        let comProperties: CompanyProperty[] = [];
        if(corpId) {
            query.where.value = corpId;
            query.where.type = CPropertyType.WECHAT_CORPID;
            let comProperty = await Models.companyProperty.find(query);
            if(!comProperty || !comProperty.length) throw new L.ERROR_CODE_C(404, '该企业尚未授权')
            comProperties = await Models.companyProperty.find({where: {companyId: comProperty[0].companyId}});
        } else if(companyId) {
            comProperties = await Models.companyProperty.find({where: {companyId: companyId}});
        }
       
        for(let i = 0; i < comProperties.length; i++){
            switch(comProperties[i].type) {
                case CPropertyType.WECHAT_CORPID:
                    companyId = companyId ? companyId: comProperties[i].companyId;
                    company = await Models.company.get(companyId)
                    corpId = corpId? corpId: comProperties[i].value;
                    break;
                case CPropertyType.WECHAT_PERMAENTCODE:
                    permanentCode = comProperties[i].value;
                    break;
                default: 
                    break;
            }
        }
        if(!company || !corpId || !permanentCode) throw new L.ERROR_CODE_C(404, '该企业尚未授权')
        return {company, corpId, permanentCode};
    }

    /**
     * @method 根据permanentCode获取已注册公司，获取初始化新公司
     * @param result 
     */
    async initializeCompany(result: IWPermanentCode | any): Promise<{company: Company|undefined, corpId: string, permanentCode: string}> {
        let permanentCode: string = result.permanentCode;
        if(!permanentCode)
            throw new Error("永久授权码不存在")
            // throw new error.ParamsNotValidError("永久授权码不存在");
        let companyProperty = await Models.companyProperty.find({
            where: {
                value: result.corpId,
                type: CPropertyType.WECHAT_CORPID
            }
        })
        let company: Company | undefined;
        let corpId: string = '';
       
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
    async getAccessToken(corpId: string, permanentCode: string, suiteToken: string): Promise<string|null>{
        let cacheKey = `wechat:contact:${corpId}:access_token`;  //企业通讯录的access_token
        let redisCache = new RedisCache();
        let cacheResult: {
            accessToken: string,
            expired: number
        } = await redisCache.get(cacheKey);
        let accessToken: string = '';
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
        new Parser().parseString(rawBody, (err: Error, data: {xml: object}) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            return res.send(resp.message)
        })
    })
}

async function dataCallback(req: Request, res: Response, next?: NextFunction) {
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
   
        new Parser().parseString(rawBody, (err: Error, data: {xml: object}) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            new Parser().parseString(resp.message, async (err: Error, data: {xml: object}) => {
                await workWechatEventHandlers[data.xml['InfoType']](data.xml)
                res.send('success')
            })
        })
    })
}

async function eventPush(msg: string ){
    let key = `sync:wechat:company` ;
    await cache.rpush( key, msg );
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
        xml.AuthCode && eventPush(xml.AuthCode[0]);
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
    //新增员工
    async create_user(xml: IWCreateUser) {
        console.log("事件通知-----新增员工, info: ", xml)
        let suiteToken = await SSOModule.getSuiteToken();
        let {permanentCode, company} = await SSOModule.checkCompanyRegistered({corpId: xml.AuthCorpId[0]});
        let accessToken = await API.sso.getAccessToken(xml.AuthCorpId[0], permanentCode ,suiteToken)
        let restApi = new RestApi(accessToken);
        if(!company || !restApi) throw L.ERR.METHOD_NOT_SUPPORT();
        let eventNotice = new EventNotice({ company, restApi});
        let hasUpdated = await eventNotice.create_user(xml);
        return hasUpdated;
    },
    //更新员工
    async update_user(xml: IWUpdateUser) {
        console.log("事件通知-----更新员工, info: ", xml)
        let suiteToken = await SSOModule.getSuiteToken();
        let {permanentCode, company} = await SSOModule.checkCompanyRegistered({corpId: xml.AuthCorpId[0]});
        let accessToken = await API.sso.getAccessToken(xml.AuthCorpId[0], permanentCode ,suiteToken)

        let restApi = new RestApi(accessToken);
        if(!company || !restApi) throw L.ERR.METHOD_NOT_SUPPORT();
        let eventNotice = new EventNotice({ company, restApi});
        let hasUpdated = await eventNotice.update_user(xml);
        return hasUpdated;
    },
    //删除员工
    async delete_user(xml: IWDeleteUser) {
        console.log("事件通知-----删除员工, info: ", xml)
        let hasUpdated = await EventNotice.delete_user(xml);
        return hasUpdated;

    },
    //创建部门
    async create_party(xml: IWCreateDepartment) {
        console.log("事件通知-----新增部门 info: ", xml)
        let suiteToken = await SSOModule.getSuiteToken();
        let {permanentCode, company} = await SSOModule.checkCompanyRegistered({corpId: xml.AuthCorpId[0]});
        let accessToken = await API.sso.getAccessToken(xml.AuthCorpId[0], permanentCode ,suiteToken)

        let restApi = new RestApi(accessToken);
        if(!company || !restApi) throw L.ERR.METHOD_NOT_SUPPORT();
        let eventNotice = new EventNotice({ company, restApi});
        let hasUpdated = await eventNotice.create_party(xml);
        return hasUpdated;

    },
    //更新部门
    async update_party(xml: IWUpdateDepartment) {
        console.log("事件通知-----更新部门 info: ", xml)
        let suiteToken = await SSOModule.getSuiteToken();
        let {permanentCode, company} = await SSOModule.checkCompanyRegistered({corpId: xml.AuthCorpId[0]});
        let accessToken = await API.sso.getAccessToken(xml.AuthCorpId[0], permanentCode ,suiteToken)
        let restApi = new RestApi(accessToken);
        if(!company || !restApi) throw L.ERR.METHOD_NOT_SUPPORT();
        let eventNotice = new EventNotice({ company, restApi});
        let hasUpdated = await eventNotice.update_party(xml);
        return hasUpdated;

    },
    //删除
    async delete_party(xml: IWDeleteDepartment) {
        console.log("事件通知-----删除部门 info: ", xml)
        let hasUpdated = await EventNotice.delete_party(xml);
        return hasUpdated;
    },
    // 标签成员变更事件
    async update_tag(xml: WorkWechatResponse) {

    }
}



export interface WorkWechatResponse {
    SuiteId: Array<string>,
    InfoType: Array<string>,
    TimeStamp: Array<number>,
    SuiteTicket?: Array<string>,
    AuthCode?: Array<string>,
    AuthCorpId?: Array<string>,
}