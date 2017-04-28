import * as utils from 'common/utils';
import L from '@jingli/language';
import { makeAuthenticateToken } from './authentication';
import { Models } from '_types/index';
import { LoginResponse } from '_types/auth/auth-cert';
import C = require("@jingli/config");
var API = require("@jingli/dnode-api");

//拼接字符串
function combineData(obj) {
    if(typeof obj != 'object') {
        throw new Error("combineStr params must be object");
    }

    var strs: any = [];
    for(var key in obj) {
        strs.push(key + "=" + obj[key]);
    }
    strs.sort();
    strs = strs.join("&");
    return strs;
}

//加密对象
function cryptoData(obj) {
    if(typeof obj == 'string') {
        return utils.md5(obj);
    }

    var strs = combineData(obj);
    return utils.md5(strs);
}

var QRCODE_LOGIN_URL = '/auth/qrcode-login';

//二维码自动登录
export function __initHttp(app) {
    app.all(QRCODE_LOGIN_URL, function(req, res, next) {
        var storageSetUrl = C.host + "/index.html#/login/storageSet";
        var accountId = req.query.accountId;
        var timestamp = req.query.timestamp;
        var sign = req.query.sign;
        var backUrl = req.query.backUrl;

        qrCodeLogin({accountId: accountId, sign: sign, timestamp: timestamp, backUrl: backUrl})
            .then(function(result) {
                res.cookie("user_id", result.accountId);
                res.cookie("token_id", result.tokenId);
                res.cookie("token", result.token);
                res.redirect(storageSetUrl + "?token_id=" + result.tokenId + "&user_id=" + result.accountId + "&token=" + result.token + "&back_url=" + backUrl);
            })
            .catch(function(err) {
                console.info(err);
                res.send("链接已经失效或者不存在");
            })
    });
}

/**
 * 二维码扫描登录接口
 *
 * @param {Object} params 参数
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.sign签名信息
 * @param {String} params.timestamp 失效时间戳
 * @return {Promise}
 */
export async function qrCodeLogin(params: {accountId: string, sign: string, timestamp: number, backUrl?: string}): Promise<LoginResponse> {
    var accountId = params.accountId;
    var sign = params.sign;
    var timestamp = params.timestamp;
    //var backUrl = params.backUrl;   //登录后返回地址
    if(!params) {
        throw L.ERR.DATA_FORMAT_ERROR();
    }

    if(!accountId) {
        throw L.ERR.ACCOUNT_NOT_EXIST();
    }

    if(!sign) {
        throw L.ERR.SIGN_ERROR();
    }

    if(!Boolean(timestamp)) {
        throw L.ERR.TIMESTAMP_TIMEOUT();
    }

    if(timestamp < Date.now()) {
        throw L.ERR.TIMESTAMP_TIMEOUT();
    }

    var account = await  Models.account.get(accountId);
    if(!account) {
        throw L.ERR.ACCOUNT_NOT_EXIST();
    }

    if(!account.qrcodeToken) {
        throw L.ERR.SIGN_ERROR();
    }

    var data = {
        key: account.qrcodeToken,
        timestamp: timestamp,
        accountId: account.id
    };
    var sysSign = cryptoData(data);
    var signCmpResult = false;
    //优先使用新签名判断
    if(sysSign.toLowerCase() == sign.toLowerCase()) {
        signCmpResult = true;
    }
    //新签名不正确,使用旧签名判断
    if(!signCmpResult && account.oldQrcodeToken) {
        data = {
            key: account.oldQrcodeToken,
            timestamp: timestamp,
            accountId: account.id
        };
        sysSign = cryptoData(data);
        if(sysSign.toLowerCase() == sign.toLowerCase()) {
            signCmpResult = true;
        }
    }

    if(!signCmpResult) {
        throw L.ERR.SIGN_ERROR();
    }

    return makeAuthenticateToken(account.id);
}


/**
 * 获取二维码中展示链接
 *
 * @param {Object} params 参数
 * @param {String} params.accountId 账号ID
 * @param {String} params.backUrl
 */
//@clientExport
export async function getQRCodeUrl(params: {backUrl: string}): Promise<string> {
    let session = Zone.current.get("session");
    var accountId = session["accountId"];
    var backUrl = params.backUrl;

    if(!Boolean(accountId)) {
        throw L.ERR.ACCOUNT_NOT_EXIST();
    }

    if(!Boolean(backUrl)) {
        throw {code: -1, msg: "跳转链接不存在"};
    }

    var shortUrl = backUrl;
    try {
        shortUrl = await API.wechat.shorturl({longurl: backUrl});
    } catch(err) {
        console.error(err);
    }
    backUrl = encodeURIComponent(shortUrl);
    var account = await Models.account.get(accountId);

    if(!account) {
        throw L.ERR.ACCOUNT_NOT_EXIST();
    }

    var qrcodeToken = utils.getRndStr(8);
    account.oldQrcodeToken = account.qrcodeToken;
    account.qrcodeToken = qrcodeToken;

    account = await account.save();

    var timestamp = Date.now() + 1000 * 60 * 5;
    var data = {accountId: account.id, timestamp: timestamp, key: account.qrcodeToken};
    var sign = cryptoData(data);
    var urlParams = {accountId: account.id, timestamp: timestamp, sign: sign, backUrl: backUrl};
    urlParams = combineData(urlParams);
    console.info(C.host + QRCODE_LOGIN_URL + "?" + urlParams);
    return C.host + QRCODE_LOGIN_URL + "?" + urlParams;
}

