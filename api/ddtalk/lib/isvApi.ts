/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import MemoryCache = require("./memoryCache");
import {CorpAccessToken, CorpAccessTokenCache} from "./interface";
import {reqProxy} from "./reqProxy";

class ISVApi {

    constructor(public suiteKey: string, public suiteToken: string, public corpid: string, public permanent_code: string, public corpTokenCache?: CorpAccessTokenCache) {
        //生成默认缓存对象
        if (!corpTokenCache) {
            this.corpTokenCache = new MemoryCache();
        }
    }

    async getCorpAccessToken() :Promise<CorpAccessToken> {
        let cacheKey = this.corpid
        let corpAccessToken = await this.corpTokenCache.get(cacheKey);
        if (corpAccessToken) {
            //失效时间为创建时间+有效期+ 10秒
            if (Date.now() >= (corpAccessToken.expires_in * 1000 + corpAccessToken.create_at + 10 * 1000) ) {
                await this.corpTokenCache.remove(cacheKey);
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
        corpAccessToken = {
            expires_in: ret.expires_in,
            access_token: ret.access_token,
            create_at: Date.now(),
        } as CorpAccessToken;
        //写入缓存
        await this.corpTokenCache.set(cacheKey, corpAccessToken);
        return corpAccessToken;
    }

    async getCorpAuthInfo() {
        let url = `https://oapi.dingtalk.com/service/get_auth_info?suite_access_token=${this.suiteToken}`;
        return reqProxy(url, {
            name: '获取企业授权信息',
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
}

export= ISVApi