import L from 'common/language';
import * as utils from 'common/utils';
import { Models, EAccountType } from 'api/_types/index';
import { AuthResponse, AuthRequest, signToken, LoginResponse } from 'api/_types/auth/auth-cert';
import moment = require('moment');
import validator = require('validator');
import { Token } from 'api/_types/auth/token';
import { ACCOUNT_STATUS } from "api/_types/auth";

export const OS_TYPE = {
    WEB: 'web',
    TMP_CODE: 'tmpCode',
    WECHAT: 'wechat',
}

//生成登录凭证
export async function makeAuthenticateToken(accountId, os?: string, expireAt?: Date): Promise<LoginResponse> {
    if(!os) {
        os = OS_TYPE.WEB;
    }
    let type = 'auth:'+os;

    let tokens = await Models.token.find({where:{accountId, type}, limit: 1});
    let token: Token;
    if(tokens.total > 0) {
        if (os == OS_TYPE.TMP_CODE) {
            let ps = tokens.map((t) => {
                return t.destroy();
            });
            await Promise.all(ps);
            token = Models.token.create({token: utils.getRndStr(10), accountId, type});
        } else {
            token = tokens[0];
        }
    } else {
        token = Models.token.create({token: utils.getRndStr(10), accountId, type});
    }
    if (!expireAt) {
        token.expireAt = moment().add(7, "days").toDate();
    } else {
        token.expireAt = expireAt;
    }
    await token.save();
    return {accountId: token.accountId, tokenId: token.id, token: token.token};
}


/**
 * @method check
 *
 * 认证登录凭证是否有效
 *
 * @param {Object} params
 * @param {UUID} params.userId
 * @param {UUID} params.tokenId
 * @param {Number} params.timestamp
 * @param {String} params.tokenSign
 * @return {Promise} {code:0, msg: "Ok"}
 */
export async function checkTokenAuth(params: AuthRequest): Promise<AuthResponse|null> {
    if(!params.tokenId || !params.sign || !params.timestamp) {
        return null;
    }
    //var userId = params.userId || params.user_id;
    var tokenId = params.tokenId;
    var timestamp = params.timestamp;
    var tokenSign = params.sign;

    let token = await Models.token.get(tokenId);
    if(!token)
        return null;
    var now = new Date();
    if(!token.expireAt || token.expireAt < now)
        return null;
    var sign_date = new Date(timestamp);
    if(Math.abs(now.getTime() - sign_date.getTime()) > 5 * 60 * 1000) //签名时间相差过大
        return null;

    var sign = signToken(token.accountId, token.id, token.token, sign_date);
    if(sign != tokenSign) {
        return null;
    }

    token.expireAt = moment().add(7, "days").toDate();
    await token.save();
    return {accountId: token.accountId};
};


/**
 * @method login
 *
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.account 登录账号,邮箱或者手机号
 * @param {String} data.pwd 密码
 * @param {Integer} data.type 1.企业员工 2.代理商员工 默认是企业员工
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 * @public
 */
export async function login(data: {account?: string, pwd: string, type?: Number, email?: string}): Promise<LoginResponse> {
    if(!data) {
        throw L.ERR.DATA_NOT_EXIST();
    }
    //兼容原有调用方式
    if(!data.account && data.email) {
        data.account = data.email;
    }

    if(!data.account) {
        throw L.ERR.USERNAME_EMPTY();
    }

    if(!validator.isEmail(data.account) && !validator.isMobilePhone(data.account, 'zh-CN')) {
        throw L.ERR.USERNAME_ERR_FORMAT();
    }

    if(!data.pwd) {
        throw L.ERR.PWD_EMPTY();
    }

    var type = data.type || EAccountType.STAFF;
    var account = data.account.toLowerCase();
    var accounts = await Models.account.find({
        where:{
            type: type,
            $or: [
                {email: account},
                {mobile: account}
            ],
        },
        limit: 1,
    });
    if(accounts.total == 0) {
        throw L.ERR.ACCOUNT_NOT_EXIST()
    }
    var loginAccount = accounts[0];
    var pwd = utils.md5(data.pwd);
    //第一步验证账号是否存在
    if(!loginAccount) {
        throw L.ERR.ACCOUNT_NOT_EXIST()
    }
    //第二步验证密码是否正确
    if(!loginAccount.pwd || loginAccount.pwd != pwd) {
        throw L.ERR.PASSWORD_NOT_MATCH()
    }

    //第三步查看是邮箱登录或手机号登录 查看有限干活手机号是否已验证
    /*if(loginAccount.mobile == account && !loginAccount.isValidateMobile) {
        throw L.ERR.NO_VALIDATE_MOBILE();
    }*/
    if(loginAccount.email == account && !loginAccount.isValidateEmail) {
        throw L.ERR.NO_VALIDATE_EMAIL();
    }

    //第四步查看账号是否激活
    /*if (!loginAccount.pwd && loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
     throw L.ERR.ACCOUNT_NOT_ACTIVE();
     }

     if (loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
     throw L.ERR.ACCOUNT_NOT_ACTIVE();
     }*/

    //第五步查看账号是否禁用
    if(loginAccount.status == ACCOUNT_STATUS.FORBIDDEN) {
        throw L.ERR.ACCOUNT_FORBIDDEN();
    }

    var ret = await makeAuthenticateToken(loginAccount.id)
    //判断是否首次登录
    if(loginAccount.isFirstLogin) {
        loginAccount.isFirstLogin = false;
        return loginAccount.save()
            .then(function() {
                ret['is_first_login'] = true;
                return ret;
            })
    }
    if (loginAccount.isNeedChangePwd) {
        ret['is_need_change_pwd'] = true;
    }

    ret['is_first_login'] = false;
    return ret;

}


/**
 * 退出登录
 * @param {Object} params
 * @param {UUID} params.accountId
 * @param {UUID} params.tokenId
 * @return {Promise}
 */
export async function logout(params: {}): Promise<boolean> {
    let session = Zone.current.get("session");
    var accountId = session["accountId"];
    var tokenId = session["tokenId"];
    if(accountId && tokenId) {
        var token = await Models.token.get(tokenId);
        if(token)
            token.destroy()
    }
    return true;
};