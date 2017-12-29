import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
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
import cache from 'common/cache';
import { Department } from "_types/department";
let moment = require("moment");
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')
const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`
const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'
var EXPIREDATE = 7200; //微信access_token的失效时间是7200秒
export class SSOModule {
    cache: RedisCache;
    constructor(){
        this.cache = new RedisCache();

    }


    @clientExport
    static async getProviderToken() {
        const res = await axios.post(PROVIDER_TOKEN_URL, {
            corpid: config.workWechat.corpId,
            provider_secret: config.workWechat.providerSecret
        })
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.provider_access_token
        }
        throw new L.ERROR_CODE_C(500, '获取服务商 token 失败')
    }

    @clientExport
    static async getSuiteToken() {
        const suite_token = await cache.read('suite_token')
        if (suite_token) return suite_token

        const suite_ticket = await cache.read('suite_ticket')
        if(!suite_ticket) throw new L.ERROR_CODE_C(500, '数据回调处理异常')
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
        console.log('suite_token:', suite_token)
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
        let {corpId, secret} = await  this.verifyWechatCompany();
        let accessToken = await this.getAccessToken(corpId, secret);
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
    async verifyWechatCompany(): Promise<{corpId: string, secret: string}> {
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
            throw new error.NotFoundError("===>该企业不存在企业微信corpid或secret")
        let corpid: string;
        let secret: string;
        for(let i =0; i < wechatProperty.length; i++){
            if(wechatProperty[i].type == CPropertyType.WECHAT_CORPID) {
                corpid = wechatProperty[i].value;
            }
            if(wechatProperty[i].type == CPropertyType.WECHAT_SECRET) {
                secret = wechatProperty[i].value;
            }
        }
        if(!corpid || !secret) {
            throw new error.NotFoundError("===>该企业不存在企业微信corpid或secret")
        }
        return {
            corpId:corpid,
            secret: secret
        }
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


    static async getPermanentCode(authCode) {
        let suiteToken = await SSOModule.getSuiteToken();
        let result: IWPermanentCode = await RestApi.getPermanentCode(suiteToken, authCode)
        if(!result)
            throw new error.NotFoundError("===>获取永久授权码失败")
        let cacheKey = `wechat:contact:${result.corpId}:access_token`;  //企业通讯录的access_token
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
}

let sso = new SSOModule()
export default sso;

export interface IWPermanentCode {
    accessToken: string,
    permanentCode: string,
    corpId: string, 
    corpName: string,
    authUserInfo: {
        email: string,
        mobile: string,
        userId: string,
        name: string,
        avatar: string
    }
}

// setTimeout(async () => {
//     sso.syncOrganization();
// }, 15 * 1000)
