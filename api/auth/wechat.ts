import { LoginResponse } from 'api/_types/auth/auth-cert';
import cache = require("common/cache");
import ApiAuth from './index';
import { makeAuthenticateToken } from './authentication';
import { Staff } from 'api/_types/staff/staff';
import { Models } from 'api/_types/index';
import { requireParams } from '../../common/api/helper';
var C = require("config");
var API = require("common/api");

export function __initHttpApp(app: any) {
    //微信自动登录
    app.all("/auth/wx-login", async function(req, res, next) {
        let query = req.query;
        let redirect_url = query.redirect_url;
        redirect_url += redirect_url.indexOf('?') > 0 ? '&' : '?';
        redirect_url += 'wxauthcode=' + query.code + '&wxauthstate=' + query.state;
        res.redirect(redirect_url);
    });

    //获取微信code
    app.all("/auth/get-wx-code", async function(req, res, next) {
        let query = req.query;
        let redirect_url = query.redirect_url;
        //如果是登录页，直接跳转
        if(/^http\:\/\/\w*\.jingli365\.com\/(index\.html)?\#\/login\/(index)?/.test(redirect_url)) {
            redirect_url += redirect_url.indexOf('?') > 0 ? '&' : '?';
            redirect_url += 'wxauthcode=' + query.code + '&wxauthstate=' + query.state;
            res.redirect(redirect_url);
        } else {
            if(!query.code) {
                return res.redirect('/#/login/index');
            }
            redirect_url = encodeURIComponent(redirect_url);
            let url = `${C.host}/#/login/?backurl=${redirect_url}&wxauthcode=${query.code}&wxauthstate=${query.state}`;
            res.redirect(url);
        }
    })
}

export async function authWeChatLogin(params: {code: string}): Promise<LoginResponse | boolean> {
    let openid = await API.wechat.requestOpenIdByCode({code: params.code}); //获取微信openId;
    await cache.write(`wechat:${params.code}`, JSON.stringify({openid: openid}));
    let accountId = await ApiAuth.getAccountIdByOpenId({openId: openid});

    if(!accountId) {
        return false;
    }

    return makeAuthenticateToken(accountId, 'weChat');
}

export async function getWeChatLoginUrl(params: {redirectUrl: string}) {
    let redirectUrl = encodeURIComponent(params.redirectUrl);
    let backUrl = C.host + "/auth/get-wx-code?redirect_url=" + redirectUrl;
    // backUrl = "https://t.jingli365.com/auth/wx-login?redirect_url=" + redirectUrl; //微信公众号测使用
    // backUrl = "https://t.jingli365.com/auth/get-wx-code?redirect_url=" + redirectUrl; //微信公众号测使用
    return API.wechat.getOAuthUrl({backUrl: backUrl});
}

export async function destroyWechatOpenId(params: {}): Promise<boolean> {
    let staff = await Staff.getCurrent();
    let openIds = await Models.accountOpenid.find({where: {accountId: staff.id}});

    if(!openIds || openIds.length <= 0) {
        return false;
    }

    await Promise.all(openIds.map((openId) => openId.destroy()));
    return true;
}

/**
 * 保存openId关联的accountId
 * @type {saveOrUpdateOpenId}
 */
export async function saveOrUpdateOpenId(params) {
    let {code} = params;
    let val = await cache.read(`wechat:${code}`);
    let openid = val ? val.openid : '';
    if(!openid)
        return;
    let staff = await Staff.getCurrent();
    let list = await Models.accountOpenid.find({where: {openId: openid}});

    if(list && list.length > 0) {
        await Promise.all(list.map((op) => op.destroy()));
    }

    let obj = Models.accountOpenid.create({openId: openid, accountId: staff.id});
    obj.save();
}


/**
 * 获取数据库中openId关联的accountId
 * @type {getAccountIdByOpenId}
 */
export async function getAccountIdByOpenId(params: {openId: string}): Promise<string> {
    let list = await Models.accountOpenid.find({where: {openId: params.openId}});

    if(!list || list.length <= 0) {
        return null;
    }

    let obj = list[0];
    return obj.accountId;
}

/**
 * 获取数据库中accountId关联的openId
 * @type {getOpenIdByAccount}
 */
export async function getOpenIdByAccount(params: {accountId: string}): Promise<string> {
    let list = await Models.accountOpenid.find({where: {accountId: params.accountId}});

    if(!list || list.length <= 0) {
        return null;
    }

    let obj = list[0];
    return obj.openId;
}
