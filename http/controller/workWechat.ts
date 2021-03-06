import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Request, Response } from 'express-serve-static-core';
import { JLResponse } from 'server-auth/lib/auth';
import { RestApi } from 'api/sso/libs/restApi';
const crypto = require('crypto');

@Restful()
export class WorkWechatController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    @Router('/login', 'POST')
    async loginByWechatCode(req: Request, res: Response) {
        const result = await API['sso'].loginByWechatCode(req.body)
        return res.json(result)
    }

    @Router('/jssdk', 'POST')
    async generateWxConfig(req: Request, res: JLResponse) {
        const { corpId, url } = req.body
        const suiteToken = await API['sso'].getSuiteToken()
        let permanentCode: string;
        try{
            let result = await API['sso'].checkCompanyRegistered({ corpId });
            permanentCode = result ? result.permanentCode: null;
        } catch(err) {
            return res.json(this.reply(500, null))
        }
        
        const result = await RestApi.getAccessTokenByPermanentCode(corpId, permanentCode, suiteToken)
        const ticket = await RestApi.getJsApiTicket(result && result.accessToken)
        const obj: WxConfigSignature = {
            timestamp: Math.ceil(Date.now() / 1000),
            noncestr: Math.random().toString(36).slice(-7),
            jsapi_ticket: ticket,
            url
        }

        const sortedKeys = ['jsapi_ticket', 'noncestr', 'timestamp', 'url']
        let tempStr = sortedKeys.map(k => `${k}=${obj[k]}`).join('&')
        const sha1 = crypto.createHash('sha1')
        sha1.update(tempStr)
        const signature = sha1.digest('hex')
        console.log('temp:', tempStr)
        console.log('signature:', signature)
        delete obj.jsapi_ticket
        res.send(this.reply(0, { ...obj, signature }))
    }

}

export interface WxConfigSignature {
    timestamp: number,
    noncestr: string,
    url: string,
    jsapi_ticket: string
}