import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
import RedisCache from "../ddtalk/lib/redisCache";
import { L } from '@jingli/language';
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Staff } from "_types/staff";
import { Models } from "_types";
import { CPropertyType } from "_types/company";
import * as error from "@jingli/error";
import { RestApi } from "api/sso/libs/restApi";
import {IAccessToken} from "./libs/restApi";
import { WCompany } from "api/sso/libs/wechat-company";


import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
var API = require("@jingli/dnode-api");
var events = require("events");


const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`

var EXPIREDATE = 7200; //微信access_token的失效时间是7200秒
 export class SSOModule {
    cache: RedisCache;
    constructor(){
        this.cache = new RedisCache();

    }

    @clientExport
    static async getProviderToken() {
        const res = await axios.post(PROVIDER_TOKEN_URL, {
            corpid: CORP_ID,
            provider_secret: PROVIDER_SECRET
        })
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.provider_access_token
        }
        throw new L.ERROR_CODE_C(500, '微信返回错误')
    }


    /**
     * @method 同步微信企业组织架构
     */
    async syncOrganization() {
        console.log("========同步微信企业通讯录")
        let {corpId, secret} = await  this.verifyWechatCompany();
        let accessToken = await this.getAccessToken(corpId, secret);

        let restApi = new RestApi(accessToken);
        
        let staff = await Staff.getCurrent();
        if(!staff) staff = await Models.staff.get("a9df54d0-ec3f-11e7-9662-7d53e2954166");  
        let company = await Models.company.get(staff.companyId);
        let wCompany = new WCompany({ id: corpId, name: company.name, restApi,});
        await wCompany.sync();
    }

    /**
     * @method 验证企业是否注册微信企业参数，如corpId, secret
     * @return {{corpId: string, secret: string}}
     */
    async verifyWechatCompany(): Promise<{corpId: string, secret: string}> {
        let staff = await Staff.getCurrent();
        //forTest
        if(!staff) staff = await Models.staff.get("a9df54d0-ec3f-11e7-9662-7d53e2954166");  

        let company = staff.company;
        let wechatProperty = await Models.companyProperty.find({
            where: {
                companyId: company.id
            }
        });
        if(!wechatProperty || !wechatProperty.length)
            throw new error.NotPermitError("该企业暂未绑定企业微信");
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
            throw new Error("===>该企业暂未绑定企业微信")
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
            console.log("-=======>token: ", corpId, secret)
            let result: IAccessToken = await RestApi.getAccessToken(corpId, secret);
            console.log("-=======>token: ",result)
            if(!result) return null;
            let value = {
                accessToken: result.access_token,
                expired: Date.now() + (result.expires_in - 30)* 1000   
            };
            accessToken = result.access_token;
            await this.cache.set(cacheKey, value)
        }
        if(!accessToken) throw("获取微信企业通讯录的access_token失败");
        return accessToken;
    }
}

let sso = new SSOModule()
export default sso;


// let eventEmitter = new events.EventEmitter();
// eventEmitter.once("syncOrganization", async () => {
//     sso.syncOrganization();
// })

// eventEmitter.emit("syncOrganization")


setTimeout(async () => {
    sso.syncOrganization();
}, 30 * 1000)
