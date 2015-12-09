/**
 * Created by wlh on 15/12/9.
 */

var Q = require("q");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;

var authServer = require("../auth");
var auth = {};
var accounts = [];

/**
 * 新建账号
 * @param {Object} data 参数
 * @param {String} data.email 邮箱
 * @param {String} data.pwd 密码
 * @param {Callback} callback 回调函数
 * @return {Promise} {code: 0, data:{accountId: 账号ID, email: "邮箱", status: "状态"}
 */
auth.newAccount = function(data, callback) {
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.email) {
        defer.reject(L.ERR.EMAIL_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!validate.isEmail(data.email)) {
        defer.reject(L.ERR.EMAIL_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.pwd) {
        defer.reject(L.ERR.PASSWORD_EMPTY);
        return defer.promise.nodeify(callback);
    }

    var account = {id: "123400000-1234-1234-1234-123400001234", email: data.email, pwd: data.pwd, status: 0};
    accounts.push(account);
    defer.resolve({code: 0, msg: "ok", data: account});
    return defer.promise.nodeify(callback)
}

/**
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @param {Callback} callback 可选回调函数
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 */
auth.login = function(data, callback) {
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.email && !data.mobile) {
        defer.reject(L.ERR.EMAIL_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.pwd) {
        defer.reject(L.ERR.PWD_EMPTY);
        return defer.promise.nodeify(callback);
    }

    var loginAccount;
    for(var i= 0, ii=accounts.length; i<ii; i++) {
        var account = accounts[i];
        if (account.email == data.email || account.mobile == data.mobile) {
            loginAccount = account;
            break;
        }
    }

    if (!loginAccount) {
        defer.reject(L.ERR.ACCOUNT_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (loginAccount.pwd != data.pwd) {
        defer.reject(L.ERR.PASSWORD_NOT_MATCH);
        return defer.promise.nodeify(callback);
    }

    if (loginAccount.status != 1) {
        defer.reject(L.ERR.ACCOUNT_FORBIDDEN);
        return defer.promise.nodeify(callback);
    }

    return _authenticateSign(loginAccount.id)
        .then(function(result) {
            return {code:0, msg: "ok", data: result};
        })
        .nodeify(callback);
}

/**
 * 认证登录凭证是否有效
 *
 * @param {UUID} userId
 * @param {UUID} tokenId
 * @param {Number} timestamp
 * @param {String} tokenSign
 * @param {Callback} callback
 * @return {Promise} {code:0, msg: "Ok"}
 */
auth.authenticate = function(userId, tokenId, timestamp, tokenSign, callback) {
    var defer = Q.defer();
    defer.resolve({code: 0, msg: "ok"});
}

/**
 * 绑定手机号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 操作人
 * @param {String} data.mobile 要绑定的手机号
 * @param {String} data.code 手机验证码
 * @param {String} data.pwd 登录密码
 * @param {Callback} callback
 * @return {Promise} {code: 0, msg: "ok};
 */
auth.bindMobile = function(data, callback) {
    var defer = Q.defer();
    defer.resolve({code: 0, msg: "ok"});
    return defer.promise.nodeify(callback);
}

//生成登录凭证
function _authenticateSign(accountId, callback) {
    var defer = Q.defer();
    var tokenId = "12341234-1234-1234-1234-123412341234";
    var token = "12341234";
    var timestamp = Date.now();
    var originStr = accountId+tokenId+token+timestamp;
    var tokenSign = md5(originStr);
    defer.resolve({
        token_id: tokenId,
        user_id: accountId,
        token_sign: tokenSign,
        timestamp: timestamp
    });
    return defer.promise.nodeify(callback);
}

module.exports = auth;