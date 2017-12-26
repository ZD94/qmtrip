import { L } from '@jingli/language';
import { clientExport } from '@jingli/dnode-api/dist/src/helper';

const axios = require('axios')
const PROVIDER_TOKEN_URL = `https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token`
const CORP_ID = 'wwb398745b82d67068'
const PROVIDER_SECRET = 'kGNDfdXSuzdvAgHC5AC8jaRUjnybKH0LnVK05NPvCV4'
const login = `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=wwb398745b82d67068&redirect_uri=https%3A%2F%2Fj.jingli365.com%2F&state=web_login@gyoss9&usertype=admin`
export default class SSOModule {

    @clientExport
    static async getProviderToken() {
        const res = await axios.post(PROVIDER_TOKEN_URL, {
            corpid: CORP_ID,
            provider_secret: PROVIDER_SECRET
        })
        if (res.status == 200 && res.data.errcode == 0) {
            return res.data.provider_access_token
        }
        throw new L.ERROR_CODE_C(500, '微信返回错误')
    }
}