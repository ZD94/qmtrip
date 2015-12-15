var Q = require("q");
var db = require("./models").sequelize;
var uuid = require("node-uuid");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var getRndStr = require("../../common/utils").getRndStr;
var mail = require("../mail");
var C = require("../../config");
var moment = require("moment");

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
        var email = data.email;

        return db.models.Account.destroy({where: {$or: [{id: accountId}, {email: email}]}})
            .then(function(account) {
                return {code: 0, msg: "ok"};
            })
            .nodeify(callback);
}


/**
 * 新建账号
 * @param {Object} data 参数
 * @param {String} data.mobile 手机号
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

    var mobile = data.mobile;
    if (mobile && !validate.isMobile(mobile)) {
        defer.reject(L.ERR.MOBILE_FORMAT_ERROR);
        return defer.promise.nodeify(callback);
    }

    var status = 0;
    if (mobile) {
        status = 1;
    }

    var pwd = data.pwd;
    pwd = md5(pwd);
    var m = db.models.Account.build({id: uuid.v1(), email: data.email, pwd: pwd, status: status});
    return m.save()
        .then(function(account) {
            if (account.status == 0) {
                //生成激活码
                var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
                var activeToken = getRndStr(6);
                var sign = makeActiveSign(activeToken, account.id, expireAt);
                var url = C.host + "/auth/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt;
                //发送激活邮件
                return  mail.sendEmail(account.email, "ACTIVE_EMAIL", [data.email, url])
                    .then(function() {
                        return account;
                    })
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
                throw L.ERR.ACCOUNT_NOT_EXIST
            }

            if (loginAccount.pwd != pwd) {
                throw L.ERR.PASSWORD_NOT_MATCH
            }

            if (loginAccount.status != 1) {
                throw L.ERR.ACCOUNT_FORBIDDEN;
            }

            return makeAuthenticateSign(loginAccount.id)
                .then(function(result) {
                    return {code:0, msg: "ok", data: result};
                })
        })
        .nodeify(callback);
}

/**
 * 认证登录凭证是否有效
 *
 * @param {Object} params
 * @param {UUID} params.userId
 * @param {UUID} params.tokenId
 * @param {Number} params.timestamp
 * @param {String} params.tokenSign
 * @param {Function} callback
 * @return {Promise} {code:0, msg: "Ok"}
 */
authServer.authentication = function(params, callback) {
    var defer = Q.defer();
    if (!params.userId || !params.tokenId || !params.timestamp || !params.tokenSign) {
        defer.resolve({code: -1, msg: "token expire"});
        return defer.promise.nodeify(callback);
    }
    var userId = params.userId;
    var tokenId = params.tokenId;
    var timestamp = params.timestamp;
    var tokenSign = params.tokenSign;

    return db.models.Token.findOne({where: {id: tokenId, accountId: userId, expireAt: {$gte: utils.now()}}})
        .then(function(m) {
            if (!m) {
                return {code: -1, msg: "已经失效"};
            }

            var sign = getTokenSign(userId, tokenId, m.token, timestamp);
            if (sign == tokenSign) {
                return {code: 0, msg: "ok"};
            }

            return {code: -1, msg: "已经失效"};
        })
        .nodeify(callback);
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

/**
 * 激活链接激活账号
 *
 * @param {Object} data
 * @param {Function} callback
 * @returns {*}
 */
authServer.activeAccount = function(data, callback) {
    var defer = Q.defer();

    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    if (!data.accountId || !data.timestamp || !data.sign) {
        defer.reject({code: -1, msg: "链接已经失效或者不存在"});
        return defer.promise.nodeify(callback);
    }

    return db.models.Account.findOne({where: {id: data.accountId}})
        .then(function(account) {
           if (!account) {
               return L.ERR.ACCOUNT_NOT_EXIST;
           }

           var activeToken = account.activeToken;
           var sign = makeActiveSign(activeToken, account.id, data.timestamp);
           if (sign.toLowerCase() == data.sign.toLowerCase()) {
               account.status = 1;
               return account.save()
                   .then(function() {
                       return {code: 0, msg: "激活成功"};
                   })
           }

            return {code: -1, msg: "链接不存在或者已经失效"};
        })
        .nodeify(callback);
}

//生成登录凭证
function makeAuthenticateSign(accountId, os, callback) {
    if (typeof os == 'function') {
        callback = os;
        os  = 'web';
    }

    if (!os) {
        os = 'web';
    }

    var defer = Q.defer();
    db.models.Token.findOne({where:{accountId: accountId, os: os}})
        .then(function(m) {
            var refreshAt = moment().format("YYYY-MM-DD HH:mm:ss");
            var expireAt = moment().add(2, "hours").format("YYYY-MM-DD HH:mm:ss")
            if (m) {
                m.refreshAt = refreshAt
                m.expireAt = expireAt
                return m.save();
            } else {
                m = db.models.Token.build({id: uuid.v1(), accountId: accountId, token: getRndStr(10), refreshAt: refreshAt, expireAt: expireAt});
                return m.save();
            }
        })
        .then(function(m) {
            var tokenId = m.id;
            var token = m.token;
            var timestamp = new Date(m.expireAt).valueOf();
            var tokenSign = getTokenSign(accountId, tokenId, token, timestamp);
            return {
                token_id: tokenId,
                user_id: accountId,
                token_sign: tokenSign,
                timestamp: timestamp
            }
        })
        .nodeify(callback);
}

function getTokenSign(accountId, tokenId, token, timestamp) {
    var originStr = accountId+tokenId+token+timestamp;
    return md5(originStr);;
}

//生成激活链接参数
function makeActiveSign(activeToken, accountId, timestamp) {
    var originStr = activeToken + accountId + timestamp;
    return md5(originStr);
}

module.exports = authServer;