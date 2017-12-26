import { AbstractController, Restful, Router } from '@jingli/restful';

const httpProxy = require('http-proxy')

const proxy = httpProxy.createProxyServer({})

@Restful()
export default class WeChatController extends AbstractController {
    $isValidId(id: string): boolean {
        throw new Error("Method not implemented.");
    }

    @Router('/receive')
    async receive(req, res) {
        proxy.web(req, res, { target: 'http://192.168.1.242:3000' })
    }

    @Router('/data/callback')
    async dataCallback(req, res, next) {
        proxy.web(req, res, { target: 'http://192.168.1.242:3000' })
    }
}
