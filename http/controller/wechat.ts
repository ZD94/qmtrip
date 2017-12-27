import { AbstractController, Restful, Router } from '@jingli/restful';

const httpProxy = require('http-proxy')

const proxy = httpProxy.createProxyServer({})
const proxyTarget = { target: 'http://192.168.1.242:3000' }
@Restful()
export default class WeChatController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    @Router('/receive', 'ALL')
    async receive(req, res) {
        proxy.web(req, res, proxyTarget)
    }

    @Router('/data/callback', 'ALL')
    async dataCallback(req, res, next) {
        proxy.web(req, res, proxyTarget)
    }

    @Router('/success')
    async installSuccess(req, res) {
        proxy.web(req, res, proxyTarget)
    }
}


