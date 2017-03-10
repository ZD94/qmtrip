/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import RedisCache = require("./redisCache");
import {CorpAccessToken, DDTalkCache} from "./interface";
import {reqProxy} from "./reqProxy";
import CorpApi from "./corpApi";

export default class ISVApi {

    constructor(public suiteKey: string, public suiteToken: string, public corpid: string, public permanent_code: string, public corpTokenCache?: DDTalkCache) {
        //生成默认缓存对象
        if (!corpTokenCache) {
            this.corpTokenCache = new RedisCache();
        }
    }

    async getCorpAccessToken() :Promise<CorpAccessToken> {
        let cacheKey = `${this.corpid}:access_token`;
        let corpAccessToken = await this.corpTokenCache.get(cacheKey);
        if (corpAccessToken) {
            //失效时间为创建时间+有效期+ 10秒
            if (Date.now() >= (corpAccessToken.expires_in * 1000 + corpAccessToken.create_at + 10 * 1000) ) {
                // await this.corpTokenCache.remove(cacheKey);
                corpAccessToken = null;
            }
        }
        if (corpAccessToken && Boolean(corpAccessToken)) return corpAccessToken;
        let url = `https://oapi.dingtalk.com/service/get_corp_token?suite_access_token=${this.suiteToken}`;
        let ret: any = await reqProxy(url, {
            name: '获取企业accessToken',
            body: {
                auth_corpid: this.corpid,
                permanent_code: this.permanent_code,
            }
        });
        if (ret.errcode) throw new Error(ret);
        corpAccessToken = {
            expires_in: ret.expires_in,
            access_token: ret.access_token,
            create_at: Date.now(),
        } as CorpAccessToken;
        //写入缓存
        await this.corpTokenCache.set(cacheKey, corpAccessToken);
        return corpAccessToken;
    }
    
    async removeCorpAccessToken() :Promise<any> {
        let cacheKey = `${this.corpid}:access_token`;
        this.corpTokenCache.remove(cacheKey);
    }

    async getCorpAuthInfo() {
        let url = `https://oapi.dingtalk.com/service/get_auth_info?suite_access_token=${this.suiteToken}`;
        return reqProxy(url, {
            name: '获取企业授权的授权数据',
            body: {
                auth_corpid: this.corpid,
                permanent_code: this.permanent_code,
                suite_key: this.suiteKey,
            }
        })
    }

    async activeSuite() {
        let url = `https://oapi.dingtalk.com/service/activate_suite?suite_access_token=${this.suiteToken}`;
        return reqProxy(url, {
            name: '激活企业账户',
            body: {
                suite_key: this.suiteKey,
                auth_corpid: this.corpid,
                permanent_code: this.permanent_code
            }
        })
    }

    async getCorpApi() : Promise<CorpApi> {
        let self = this;
        let corpAccessToken = await self.getCorpAccessToken();
        return new CorpApi(self.corpid, corpAccessToken);
    }
}

