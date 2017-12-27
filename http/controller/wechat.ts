import { AbstractController, Restful, Router } from '@jingli/restful';
import { Request, NextFunction, Response } from 'express-serve-static-core';
import cache from 'common/cache'
const config = require('@jingli/config')

const { Parser } = require('xml2js')
const wxCrypto = require('wechat-crypto')

const crypto = new wxCrypto(config.workWechat.token, config.workWechat.encodingAESKey, config.workWechat.corpId)

const httpProxy = require('http-proxy')

const proxy = httpProxy.createProxyServer({})
const proxyTarget = { target: 'http://192.168.1.242:3000' }
@Restful()
export default class WeChatController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    @Router('/receive', 'ALL')
    async receive(req: Request, res: Response) {
        res.send(crypto.decrypt(req.query.echostr).message)
        // proxy.web(req, res, proxyTarget)
    }

    @Router('/data/callback', 'ALL')
    async dataCallback(req: Request, res: Response, next: NextFunction) {
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
        // proxy.web(req, res, proxyTarget)
    }
}


