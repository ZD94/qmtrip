import { AgencyUser } from '../../_types/agency/agency-user';
/**
 * Created by mr_squirrel on 01/09/2017.
 */


import { Staff } from "_types/staff";
var request = require("request");
const axios = require('axios');
const config = require("@jingli/config");
import crypto = require("crypto");
import cache from "common/cache";

function md5(str: string) {
    return crypto.createHash("md5").update(str).digest('hex')
}

export async function getAgentToken() {
    const appId: string = config.agent.appId;
    if (!appId) {
        return null;
    }
    let key = `token:agent:${appId}`;
    // logger.debug("KEY:", key)
    const token: string = await cache.read(key);
    if (token) {
        // logger.debug('TOKEN:', token);
        return token;
    }
    const timestamp = Date.now();
    const resp: IResponseEntity<IToken> = await axios.post(`${config.cloudAPI}/agent/gettoken`, {
        appId,
        timestamp,
        sign: md5(`${config.agent.appSecret}|${timestamp}`)
    }).then((res: { data: IToken }) => res.data)

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
    const companyToken: string = await cache.read(key);
    if (companyToken) {
        // logger.debug('TOKEN:', companyToken);
        return companyToken;
    }

    let agentToken = await getAgentToken();
    const resp: IResponseEntity<IToken> = await axios.get(`${config.cloudAPI}/agent/company/${companyId}/token`, {
        headers: { token: agentToken }
    }).then((res: {data: IToken}) => res.data);

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
        let companyToken: string;
        let currentAgency: AgencyUser = await AgencyUser.getCurrent();

        if (!useProxy || currentAgency) {
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
            }, (err: Error, resp: never, result: string | object) => {
                if (err) {
                    return reject(err);
                }

                if (typeof (result) == 'string') {
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
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
            }, (err: Error, resp: never, result: string | object) => {
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

export interface IToken {
    token: string,
    expires: number
}

export interface IResponseEntity<T> {
    code: number,
    msg: string,
    data: T
}