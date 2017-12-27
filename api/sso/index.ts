import { L } from '@jingli/language';
import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import cache from 'common/cache'
const API = require('@jingli/dnode-api')
const config = require('@jingli/config')

const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const SUITE_TOKEN_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token'
const USER_INFO_URL = 'https://qyapi.weixin.qq.com/cgi-bin/service/getuserinfo3rd'

export default class SSOModule {

    @clientExport
    static async getProviderToken() {
        const res = await axios.post(PROVIDER_TOKEN_URL, {
            corpid: config.workWechat.corpId,
            provider_secret: config.workWechat.providerSecret
        })
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.provider_access_token
        }
        throw new L.ERROR_CODE_C(500, '获取服务商 token 失败')
    }

    @clientExport
    static async getSuiteToken() {
        const suite_token = await cache.read('suite_token')
        if (suite_token) return suite_token

        const suite_ticket = await cache.read('suite_ticket')
        const res = await axios.post(SUITE_TOKEN_URL, {
            suite_id: config.workWechat.suiteId,
            suite_secret: config.workWechat.suiteSecret,
            suite_ticket
        })
        if (res.status == 200) {
            await cache.write('suite_token', res.data.suite_access_token, 7200)
        }
    }

    @clientExport
    @requireParams(['code'])
    static async getUserInfo(code: string): Promise<string> {
        const suite_token = await API.sso.getSuiteToken()
        
        const res = await axios.get(`${USER_INFO_URL}?access_token=${suite_token}&code=${code}`)
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.UserId
        }
        throw new L.ERROR_CODE_C(500, "获取用户信息失败")
    }
}