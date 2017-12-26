import RedisCache from "../ddtalk/lib/redisCache"
import { L } from '@jingli/language';
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Staff } from "_types/staff";
import { Models } from "_types";
import { CPropertyType } from "_types/company";
import * as error from "@jingli/error";
import { RestApi } from "api/sso/libs/restApi";
import {IAccessToken} from "./libs/restApi";
const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`

var EXPIREDATE = 7200; //微信access_token的失效时间是7200秒
export default class SSOModule {
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


    async syncOrganization() {
        let {corpId, secret} = await  this.verifyWechatCompany();
        let accessToken = await this.getAccessToken(corpId, secret);
       


    }

    /**
     * @method 验证企业是否注册微信企业参数，如corpId, secret
     * @return {{corpId: string, secret: string}}
     */
    async verifyWechatCompany(): Promise<{corpId: string, secret: string}> {
        let staff = await Staff.getCurrent();
        let company = staff.company;
        let wechatProperty = await Models.companyProperty.find({
            where: {
                companyId: company.id,
                types: {
                    $or: [CPropertyType.WECHAT_CORPID, CPropertyType.WECHAT_SECRET]
                }
            }
        });
        if(!wechatProperty || !wechatProperty.length)
            throw new error.NotPermitError("该企业暂未绑定企业微信");
        let corpid: string;
        let secret: string;
        for(let i =0; i < wechatProperty.length; i++){
            switch(wechatProperty[i].type){
                case CPropertyType.WECHAT_CORPID: 
                    corpid = wechatProperty[i].value;
                case CPropertyType.WECHAT_SECRET: 
                    secret = wechatProperty[i].value;
            }
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
        let {accessToken, expired} = cacheResult;
        if(Date.now() - expired > 0) {
            let result: IAccessToken = await RestApi.getAccessToken(corpId, secret);
            if(!result) return null;
            let value = {
                accessToken: result.access_token,
                expired: Date.now() + (result.expires_in - 30)* 1000   
            };
            accessToken = result.access_token;
            await this.cache.set(cacheKey, value)
        }
        return accessToken;
    }
}