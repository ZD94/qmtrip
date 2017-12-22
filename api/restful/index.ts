import {AgencyUser} from '../../_types/agency/agency-user';
/**
 * Created by mr_squirrel on 01/09/2017.
 */


import { Staff } from "_types/staff";
var request = require("request");
const axios = require('axios');
import config = require("@jingli/config");
import crypto = require("crypto");
import cache from "common/cache";
import Logger from '@jingli/logger';
const logger = new Logger('restful');
import {Models} from "_types"

function md5(str) {
    return crypto.createHash("md5").update(str).digest('hex')
}

export async function getAgentToken() {
    const appId = config.agent.appId;
    if (!appId) {
        return null;
    }
    let key = `token:agent:${appId}`;
    // logger.debug("KEY:", key)
    const token = await cache.read(key);
    if (token) {
        // logger.debug('TOKEN:', token);
        return token;
    }
    const timestamp = Date.now();
    const resp: any = await axios.post(`${config.cloudAPI}/agent/gettoken`, {
        appId,
        timestamp,
        sign: md5(`${config.agent.appSecret}|${timestamp}`)
    }).then(res => res.data)

    if (resp.code === 0) {
        await cache.write(key, resp.data.token, resp.data.expires - 30);
        // logger.debug('TOKEN:', resp.data.token)
        return resp.data.token;
    }
    return null;
}

export async function getCompanyTokenByAgent(companyId: string) {
    if (!companyId) {
        return null;
    }
    let key = `token:company:${companyId}`
    // logger.debug('KEY:', key);
    const companyToken = await cache.read(key);
    if (companyToken) {
        // logger.debug('TOKEN:', companyToken);
        return companyToken;
    }

    let agentToken = await getAgentToken();
    const resp: any = await axios.get(`${config.cloudAPI}/agent/company/${companyId}/token`, {
        headers: { token: agentToken }
    }).then(res => res.data);

    if (resp.code === 0) {
        await cache.write(key, resp.data.token, resp.data.expires);
        // logger.debug('TOKEN:', resp.data.token)
        return resp.data.token;
    }
    return null;
}

export class RestfulAPIUtil {

    async operateOnModel(options: {
        model: string,
        params?: any,
        addUrl?: string,
        useProxy?: boolean
    }): Promise<any> {
        let { params, model, addUrl = '', useProxy = true } = options;
        let { fields, method } = params;
        let currentCompanyId = fields['companyId'];
        let companyToken;
        let currentAgency: AgencyUser = await AgencyUser.getCurrent();

        if(!useProxy || currentAgency) {
            companyToken = await getAgentToken();
        }
        if (useProxy && !currentAgency) {
            if (!currentCompanyId || typeof (currentCompanyId) == 'undefined') {
                let staff = await Staff.getCurrent();
                currentCompanyId = staff["companyId"];
            }
            companyToken = await getCompanyTokenByAgent(currentCompanyId);
        } 

        if (!companyToken) {
            throw new Error('换取 token 失败！')
        }
        let url = config.cloudAPI + `/${model}`;
        if (addUrl) {
            url += `/${addUrl}`
        }
        let result: any;

        let qs: {
            [index: string]: string;
        } = {};

        if (fields.hasOwnProperty('id')) {
            url = url + `/${fields['id']}`;
        } else {
            if (method.toUpperCase() == 'GET') {
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
                    try{
                        result = JSON.parse(result);
                    }catch(e){
                        console.error(e);
                        return reject(e);
                    }                    
                }
                return resolve(result);
            });
        })
    }

    async proxyHttp(params: {
        url: string;
        body?: object;
        method: string;
        qs?: object;
    }) {
        const token = await getAgentToken();
        let { url, body = {}, method = "get", qs = {} } = params;
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