/**
 * Created by mr_squirrel on 01/09/2017.
 */


import {Staff} from "_types/staff";
var request = require("request");
const rp = require('request-promise');
import config = require("@jingli/config");
import crypto = require("crypto");
import cache from "common/cache";

function md5(str) {
    return crypto.createHash("md5").update(str).digest('hex')
}

export async function getAgentToken() {
    const appId = config.agent.appId;
    if(!appId) {
        return null;
    }
    const token = await cache.read(appId);
    if(token) {
        return token;
    }
    const timestamp = Date.now();
    const resp: any = await rp({
        uri:`${config.cloudAPI}/agent/gettoken`,
        method: 'POST',
        body: {
            appId,
            timestamp,
            sign: md5(`${config.agent.appSecret}|${timestamp}`)
        }
    });

    if(resp.code === 0) {
        await cache.write(appId, resp.data.token, resp.data.expires);
        return resp.data.token;
    }
    return null;
}

export async function getCompanyTokenByAgent(companyId: string) {
    if(!companyId) {
        return null;
    }
    const agentToken = await cache.read(companyId);
    if(agentToken) {
        return agentToken;
    }

    const token = await getAgentToken();
    const resp: any = await rp({
        uri: `${config.cloudAPI}/agent/company/${companyId}/token`,
        method: 'GET',
        headers: { token },
        json: true
    });
    if(resp.code === 0) {
        await cache.write(companyId, resp.data.token, resp.data.expires);
        return resp.data.token;
    }
    return null;
}

export class RestfulAPIUtil {

    async operateOnModel(options: {
        model: string,
        params?: any,
        addUrl?: string
    }):Promise<any> {
        let {params, model, addUrl = ''} = options;
        let {fields, method} = params;
        let currentCompanyId = fields['companyId'];
        if (!currentCompanyId || typeof(currentCompanyId) == 'undefined') {
            let staff = await Staff.getCurrent();
            currentCompanyId = staff["companyId"];
        }
        let companyToken = await getCompanyTokenByAgent(currentCompanyId);
        if (!companyToken) {
            throw new Error('换取 token 失败！')
        }
        let url = config.cloudAPI + `/${model}`;
        if(addUrl){
            url += `/${addUrl}`
        }
        let result: any;

        let qs: {
            [index: string]: string;
        } = {};

        if (fields.hasOwnProperty('id')) {
            url = url + `/${fields['id']}`;
        }else{
            if (method.toUpperCase() == 'GET') {
                url = url + "?";
                for (let key in fields) {
                   qs[key] = fields[key];
                }
            }
        }

        return new Promise((resolve, reject) => {
            return request({
                uri: url,
                body: fields,
                json: true,
                method: method,
                qs: qs,
                headers: {
                    token: companyToken
                }
            }, (err, resp, result) => {
                if (err) {
                    return reject(err);
                }
                if (typeof(result) == 'string') {
                    result = JSON.parse(result);
                }
                return resolve(result);
            });
        })
    }

    async proxyHttp(params:{
        url:string;
        body?:object;
        method:string;
        qs?:object;
    }){
        const token = await getAgentToken();
        let {url, body={}, method="get", qs={}} = params;
        return new Promise((resolve, reject) => {
            request({
                uri: config.cloudAPI + url,
                body,
                json: true,
                method,
                qs,
                headers: {
                    token
                }
            }, (err, resp, result) => {
                if (err) {
                    return reject(err);
                }

                if (typeof result == 'string') {
                    result = JSON.parse(result);
                }
                return resolve(result);
            });
        })
    }
}


export let restfulAPIUtil = new RestfulAPIUtil();