import {Express} from "express";

import RedisCache from "../ddtalk/lib/redisCache";
import { L } from '@jingli/language';
import { Staff, EStaffStatus } from "_types/staff";
import { Models } from "_types";
import { CPropertyType, CompanyProperty, Company } from "_types/company";
import * as error from "@jingli/error";
import { RestApi } from "api/sso/libs/restApi";
import { IAccessToken, IWPermanentCode } from "./libs/restApi";
import { WCompany } from "api/sso/libs/wechat-company";
import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import { Department } from "_types/department";
let moment = require("moment");
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')
const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`
import cache from 'common/cache'
import { Request, NextFunction, Response, Application } from 'express-serve-static-core';

const { Parser } = require('xml2js')
const wxCrypto = require('wechat-crypto')
const crypto = new wxCrypto(config.workWechat.token, config.workWechat.encodingAESKey, config.workWechat.corpId)


const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'
var EXPIREDATE = 7200; //微信access_token的失效时间是7200秒
export class SSOModule {
    cache: RedisCache;
    constructor(){
        this.cache = new RedisCache();

    }


    static __initHttpApp(app: Application) {
        app.all('/wechat/receive', receive)
        app.all('/wechat/data/callback', dataCallback)
    }

    @clientExport
    static async getSuiteToken() {
        const suite_token = await cache.read('suite_token')
        if (suite_token) return suite_token

        const suite_ticket = await cache.read('suite_ticket')
        if (!suite_ticket) throw new L.ERROR_CODE_C(500, '数据回调处理异常')
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
    static async getUserInfo({ code }: { code: string }): Promise<string> {
        const suite_token = await API.sso.getSuiteToken()
        const res = await axios.get(`${USER_INFO_URL}?access_token=${suite_token}&code=${code}`)
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.UserId
        }
        throw new L.ERROR_CODE_C(500, "获取用户信息失败")
    }

    /**
     * @method 同步微信企业组织架构
     */
    async syncOrganization() {
        let {corpId, permanentCode} = await  this.verifyWechatCompany();   
        let suiteToken = await SSOModule.getSuiteToken();
        let accessToken = await  RestApi.getAccessTokenByPermanentCode(corpId, permanentCode, suiteToken)

        let restApi = new RestApi(accessToken);
        let staff = await Staff.getCurrent();


        // if(!staff) staff = await Models.staff.get("2eaf0b60-ec72-11e7-a61b-6dc8f39f777e");   //测试
        let company = await Models.company.get(staff.companyId);
        let wCompany = new WCompany({ id: corpId, name: company.name, restApi, company: company});
        await wCompany.sync();
    }

    /**
     * @method 验证企业是否注册微信企业参数，如corpId, secret
     * @return {{corpId: string, secret: string}}
     */
    async verifyWechatCompany(): Promise<{corpId: string, permanentCode}> {
        let staff = await Staff.getCurrent();
        //forTest
        // if(!staff) staff = await Models.staff.get("2eaf0b60-ec72-11e7-a61b-6dc8f39f777e");  //测试

        let company = staff.company;
        let wechatProperty = await Models.companyProperty.find({
            where: {
                companyId: company.id
            }
        });
        if(!wechatProperty || !wechatProperty.length)
            throw new error.NotFoundError("===>该企业不存在企业微信corpid")

        let corpid: string;
        let permanentCode: string;
        for(let i =0; i < wechatProperty.length; i++){
            if(wechatProperty[i].type == CPropertyType.WECHAT_CORPID) {
                corpid = wechatProperty[i].value;
            }
            if(wechatProperty[i].type == CPropertyType.WECHAT_PERMAENTCODE) {
                permanentCode = wechatProperty[i].value;
            }
        }

        return {
            corpId: wechatProperty[0].value,
            permanentCode,
        };
    }

    /**
     * 
     * @method 根据企业的corpid、secret生成企业的accessToken
     * @param secret {string} 
     * @param corpId
     * @return {string} 
     */
    async getAccessToken(corpId: string, secret: string): Promise<string>{
        let cacheKey = `wechat:contact:${corpId}:access_token`;  //企业通讯录的access_token
        let cacheResult: {
            accessToken: string,
            expired: number
        } = await this.cache.get(cacheKey);
        let accessToken: string;
        if(cacheResult) accessToken = cacheResult.accessToken;
        if(!cacheResult || (Date.now() - cacheResult.expired > 0)) {
            let result: IAccessToken = await RestApi.getAccessToken(corpId, secret);
            if(!result) return null;
            let value = {
                accessToken: result.access_token,
                expired: Date.now() + (result.expires_in - 30)* 1000   
            };
            accessToken = result.access_token;
            await this.cache.set(cacheKey, value)
        }
        if(!accessToken) throw new error.NotFoundError("===>该企业不存在企业微信corpid或secret")
        return accessToken;
    }


    /**
     * @method 首次下载应用时，微信管理后台传回pernamentCode, accessToken
     * @param authCode 
     * @param compayId 
     */
    static async getPermanentCode(authCode?: string, compayId?: string) {
        let suiteToken = await SSOModule.getSuiteToken();
        let result: IWPermanentCode = await RestApi.getPermanentCode(suiteToken, authCode)
        if(!result)
            throw new error.NotFoundError("===>获取永久授权码失败")
        let cacheKey = `wechat:contact:${result.corpId}:access_token`;  //企业通讯录的access_token
        let redisCache = new RedisCache();
        let cacheResult: {
            accessToken: string,
            expired: number
        } = await redisCache.get(cacheKey);
        if(!cacheResult || (Date.now() - cacheResult.expired > 0)) {
            let cacheResult =  {
                accessToken: result.accessToken,
                expired: Date.now() + (result.expires_in - 30)* 1000   
            };
            await redisCache.set(cacheKey, cacheResult);
        }
  
        let companyProperty = await Models.companyProperty.find({
            where: {
                value: result.permanentCode
            }
        })
        if(!companyProperty || companyProperty.length == 0) {
            let staff: Staff = Staff.create({
                name: result.authUserInfo.name,
                staffStatus: EStaffStatus.ON_JOB
            });
            staff = await staff.save();
            let company = Company.create({
                name: result.corpName,
                expiryDate : moment().add(1 , "months").toDate(),
                mobile: result.authUserInfo.mobile,
                createUser: staff.id
            })
            company = await company.save();
            staff.companyId = company.id;
            staff = await staff.save();
    
            let department = Department.create({
                name: result.corpName,
                companyId: company.id
            })
            department = await department.save();
            let companyProperty = CompanyProperty.create({
                value: result.corpId,
                type: CPropertyType.WECHAT_CORPID
            })
            companyProperty = await companyProperty.save();
        }
        let ssoInstance = new SSOModule();
        await ssoInstance.syncOrganization();
    }
}

let sso = new SSOModule()
export default sso;

// setTimeout(async () => {
//     sso.syncOrganization();
// }, 15 * 1000)


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
                if (data.xml['InfoType'] == 'suite_ticket')
                    await cache.write('suite_ticket', data.xml['SuiteTicket'][0])
                // if (data.xml['InfoType'] == 'create_auth')
                //     await cache.write('create_auth', data.xml['AuthCode'])
                res.send('success')
            })
        })
    })
}

