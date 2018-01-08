import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Request, Response } from 'express-serve-static-core';
import { CustomerError } from '@jingli/error';
import { Models } from '_types';
import { CPropertyType } from '_types/company';
import { JLResponse } from 'server-auth/lib/auth';
import { RestApi } from 'api/sso/libs/restApi';
import { sortData } from '@jingli/sign';
import crypto from 'crypto';

@Restful()
export class WorkWechatController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    @Router('/login', 'POST')
    async loginByWechatCode(req: Request, res: Response) {
        try {
            const result = await API['sso'].loginByWechatCode(req.body)
            return res.json(result)
        } catch (e) {
            throw new CustomerError(400, '登录失败')
        }
    }

    @Router('/jssdk', 'POST')
    async generateWxConfig(req: Request, res: JLResponse) {
        const { corpId, url } = req.body
        const suiteToken = await API['sso'].getSuiteToken()
        const permanentCode = await API['sso'].getPermanentCodeByCorpId({ corpId })
        const result = await RestApi.getAccessTokenByPermanentCode(corpId, permanentCode, suiteToken)
        const ticket = await RestApi.getJsApiTicket(result.accessToken)
        const obj: WxConfigSignature = {
            timestamp: Date.now(),
            noncestr: Math.random().toString(36).slice(-7),
            url,
            jsapi_ticket: ticket
        }

        const sortedKeys = ['jsapi_ticket', 'noncestr', 'timestamp', 'url']
        let tempStr = sortedKeys.map(k => `${k}=${obj[k]}`).join('&')
        delete obj.jsapi_ticket
        res.send(this.reply(0, { ...obj, signature: this.encryptBySha1(tempStr) }))
    }

    encryptBySha1(str: string) {
        const sha1 = crypto.createHash('sha1')
        sha1.update(str)
        return sha1.digest('hex')
    }

}

export interface WxConfigSignature {
    timestamp: number,
    noncestr: string,
    url: string,
    jsapi_ticket: string
}