var Q = require("q");
var db = require("./models").sequelize;
var uuid = require("node-uuid");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var mail = require("../mail");

var authServer = {};

//激活账号
authServer.active = function(data, callback) {
        var accountId = data.accountId;
        return db.models.Account.findOne({where: {id: accountId}})
            .then(function(account) {
                if (!account) {
                    return L.ERR.ACCOUNT_NOT_EXIST;
                }

                account.status = 1;
                return account.save()
                    .then(function(account) {
                        return {code: 0, msg: "ok", data: {
                            id: account.id,
                            mobile: account.mobile,
                            email: account.email,
                            status: account.status
                        }}
                    })
            })
            .nodeify(callback);
}

//删除账号
authServer.remove = function(data, callback) {
        var accountId = data.accountId;
        return db.models.Account.destroy({where: {id: accountId}})
            .then(function(account) {
                return {code: 0, msg: "ok"};
            })
            .nodeify(callback);
}


/**
 * 新建账号
 * @param {Object} data 参数
 * @param {String} data.email 邮箱
 * @param {String} data.pwd 密码
 * @param {Callback} callback 回调函数
 * @return {Promise} {code: 0, data:{accountId: 账号ID, email: "邮箱", status: "状态"}
 */
authServer.newAccount = function(data, callback) {
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.email) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    if (!validate.isEmail(data.email)) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    if (!data.pwd) {
        defer.reject(L.ERR.PASSWORD_EMPTY);
        return defer.promise.nodeify(callback);
    }

    var pwd = data.pwd;
    pwd = md5(pwd);
    var m = db.models.Account.build({id: uuid.v1(), email: data.email, pwd: pwd});
    return m.save()
        .then(function(account) {
            if (account.status == 0) {
                //发送激活邮件
//                mail.sendEmail(account.email, "ACTIVE_EMAIL", [data.email, "#"]);
            }
            return account;
        })
        .then(function(account) {
            return {code: 0, msg: "ok", data: {
                id: account.id,
                email: account.email,
                mobile: account.mobile,
                status: account.status
            }};
        })
        .nodeify(callback);
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
authServer.login = function(data, callback) {
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.email && !data.mobile) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    if (!validate.isEmail((data.email))) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    if (!data.pwd) {
        defer.reject(L.ERR.PWD_EMPTY);
        return defer.promise.nodeify(callback);
    }

    var pwd = md5(data.pwd);

    return db.models.Account.findOne({where: {email: data.email}})
        .then(function(loginAccount) {
            if (!loginAccount) {
                defer.reject(L.ERR.ACCOUNT_NOT_EXIST);
                return defer.promise.nodeify(callback);
            }

            if (loginAccount.pwd != pwd) {
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
authServer.authentication = function(userId, tokenId, timestamp, tokenSign, callback) {
    var defer = Q.defer();
    var sign = getTokenSign(userId, tokenId, "12341234", timestamp);
    if (sign == tokenSign) {
        defer.resolve({code: 0, msg: "ok"});
    } else {
        defer.reject({code: -1, msg: "已经失效"});
    }
    return defer.promise.nodeify(callback);
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
authServer.bindMobile = function(data, callback) {
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
    var tokenSign = getTokenSign(accountId, tokenId, token, timestamp);
    defer.resolve({
        token_id: tokenId,
        user_id: accountId,
        token_sign: tokenSign,
        timestamp: timestamp
    });
    return defer.promise.nodeify(callback);
}

function getTokenSign(accountId, tokenId, token, timestamp) {
    var originStr = accountId+tokenId+token+timestamp;
    return md5(originStr);;
}

module.exports = authServer;