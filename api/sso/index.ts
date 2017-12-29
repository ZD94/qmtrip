import { L } from '@jingli/language';
import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import cache from 'common/cache'
import { Request, NextFunction, Response, Application } from 'express-serve-static-core';
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')
const { Parser } = require('xml2js')
const wxCrypto = require('wechat-crypto')

const crypto = new wxCrypto(config.workWechat.token, config.workWechat.encodingAESKey, config.workWechat.corpId)

const axios = require('axios')
const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'

export default class SSOModule {

    static __initHttpApp(app: Application) {
        app.all('/wechat/receive', receive)
        app.all('/wechat/data/callback', dataCallback)
    }

    @clientExport
    static async getSuiteToken() {
        const suite_token = await cache.read('suite_token')
        if (suite_token) return suite_token

        const suite_ticket = await cache.read('suite_ticket')
        if (!suite_ticket) throw new L.ERROR_CODE_C(500, '数据回调处理异常')
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
        const res = await axios.get(`${USER_INFO_URL}?access_token=${suite_token}&code=${code}`)
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.UserId
        }
        throw new L.ERROR_CODE_C(500, "获取用户信息失败")
    }

    @clientExport
    static async getAccessToken() {
        const permanent_code = ''
        const url = ''
        const res = await axios.post(url, {
            auth_corpid: '',
            permanent_code
        })
        if (res.status == 200)
            return res.data
        throw new L.ERROR_CODE_C(500, '获取企业 access_token  失败')
    }
}

async function receive(req: Request, res: Response) {
    const { timestamp, nonce, msg_signature, echostr } = req.query
    if (echostr) {
        if (msg_signature != crypto.getSignature(timestamp, nonce, echostr)) {
            return res.sendStatus(403)
        }
        return res.send(crypto.decrypt(echostr).message)
    }

    let rawBody = ''
    req.setEncoding('utf8')

    req.on('data', chunk => {
        rawBody += chunk
    })
    req.on('end', () => {
        if (rawBody == '') {
            return res.sendStatus(403)
        }
        new Parser().parseString(rawBody, (err, data) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            return res.send(resp.message)
        })
    })
}

async function dataCallback(req: Request, res: Response, next: NextFunction) {
    const { timestamp, nonce, msg_signature, echostr } = req.query
    if (req.method.toUpperCase() == 'GET') {
        if (msg_signature != crypto.getSignature(timestamp, nonce, echostr)) {
            return res.sendStatus(403)
        }
        return res.send(crypto.decrypt(echostr).message)
    }

    let rawBody = ''
    req.setEncoding('utf8')

    req.on('data', chunk => {
        rawBody += chunk
    })
    req.on('end', () => {
        if (rawBody == '') {
            return res.sendStatus(403)
        }
        new Parser().parseString(rawBody, (err, data) => {
            const resp = crypto.decrypt(data.xml['Encrypt'][0])
            new Parser().parseString(resp.message, async (err, data) => {
                if (data.xml['InfoType'] == 'suite_ticket')
                    await cache.write('suite_ticket', data.xml['SuiteTicket'][0])
                // if (data.xml['InfoType'] == 'create_auth')
                //     await cache.write('create_auth', data.xml['AuthCode'])
                res.send('success')
            })
        })
    })
}