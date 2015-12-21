/**
 * @module auth
 */
var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var uuid = require("node-uuid");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var getRndStr = require("../../common/utils").getRndStr;
var C = require("../../config");
var moment = require("moment");
var API = require("../../common/api");

/**
 * @class API.auth 认证类
 * @constructor
 */
var authServer = {};

/**
 * @method activeByEmail 通过邮箱激活账号
 *
 * 通过邮箱激活账号
 *
 * @param {Object} data
 * @param {String} data.sign 签名
 * @param {UUID} data.accountId 账号ID
 * @param {String} data.timestamp 时间戳
 * @param {Function} callback
 * @return {Promise}
 * @public
 */
authServer.activeByEmail = function(data, callback) {
    var sign = data.sign;
    var accountId = data.accountId;
    var timestamp = data.timestamp;
    var nowTime = Date.now();

    var defer = Q.defer();
    //失效了
    if (!timestamp || nowTime - timestamp > 0) {
        defer.reject(L.ERR.ACTIVE_URL_INVALID);
        return defer.promise.nodeify(callback);
    }

    return Models.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACTIVE_URL_INVALID;
            }

            if (account.status == 1) {
                return {code: 0, msg: "OK"};
            }

            var needSign = makeActiveSign(account.activeToken, accountId, timestamp)
            if (sign.toLowerCase() != needSign.toLowerCase()) {
                throw L.ERR.ACTIVE_URL_INVALID;
            }
            account.status = 1;
            return account.save()
                .then(function() {
                    return {code: 0, msg: "OK"};
                })
        })
        .nodeify(callback);
}

/**
 * @method active 激活账号
 *
 * 激活账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {Function} callback
 * @return {Promise}
 */
authServer.active = function(data, callback) {
    var accountId = data.accountId;
    return Models.Account.findOne({where: {id: accountId}})
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

/**
 * @method remove 删除账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {Function} callback
 * @return {Promise}
 * @public
 */
authServer.remove = function(data, callback) {
        var accountId = data.accountId;
        var email = data.email;

        return Models.Account.destroy({where: {$or: [{id: accountId}, {email: email}]}})
            .then(function() {
                return {code: 0, msg: "ok"};
            })
            .nodeify(callback);
}


/**
 * @method newAccount
 *
 * 新建账号
 *
 * @param {Object} data 参数
 * @param {String} data.mobile 手机号
 * @param {String} data.email 邮箱
 * @param {String} data.pwd 密码
 * @param {Callback} callback 回调函数
 * @return {Promise} {code: 0, data:{accountId: 账号ID, email: "邮箱", status: "状态"}
 * @public
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

    //查询邮箱是否已经注册
    return Q.all([
        Models.Account.findOne({where: {email: data.email}}),
        Models.Account.findOne({where: {mobile: mobile}})
    ]).spread(function(account1, account2) {
        if (account1) {
            throw L.ERR.EMAIL_HAS_REGISTRY;
        }

        if (account2) {
            throw L.ERR.MOBILE_HAS_REGISTRY;
        }
        return true;
    }).then(function() {
        var status = 0;
        var pwd = data.pwd;
        pwd = md5(pwd);
        var m = Models.Account.build({id: uuid.v1(), mobile:mobile, email: data.email, pwd: pwd, status: status});
        return m.save()
            .then(function(account) {
                if (account.status == 0) {
                    _sendActiveEmail(account.id);
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
    }).nodeify(callback);
}

/**
 * @method login
 *
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @param {Callback} callback 可选回调函数
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 * @public
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

    return Models.Account.findOne({where: {email: data.email}})
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
 * @method authenticate
 *
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
    if ((!params.userId && !params.user_id) || (!params.tokenId && !params.token_id)
        || !params.timestamp || (!params.tokenSign && !params.token_sign)) {
        defer.resolve({code: -1, msg: "token expire"});
        return defer.promise.nodeify(callback);
    }
    var userId = params.userId || params.user_id;
    var tokenId = params.tokenId || params.token_id;
    var timestamp = params.timestamp;
    var tokenSign = params.tokenSign || params.token_sign;

    return Models.Token.findOne({where: {id: tokenId, accountId: userId}})
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
 * @method bindMobile
 *
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
function makeAuthenticateSign(accountId, os, callback) {
    if (typeof os == 'function') {
        callback = os;
        os  = 'web';
    }

    if (!os) {
        os = 'web';
    }

    var defer = Q.defer();
    return Models.Token.findOne({where:{accountId: accountId, os: os}})
        .then(function(m) {
            var refreshAt = moment().format("YYYY-MM-DD HH:mm:ss");
            var expireAt = moment().add(2, "hours").format("YYYY-MM-DD HH:mm:ss")
            if (m) {
                m.refreshAt = refreshAt
                m.expireAt = expireAt
                return m.save();
            } else {
                m = Models.Token.build({id: uuid.v1(), accountId: accountId, token: getRndStr(10), refreshAt: refreshAt, expireAt: expireAt});
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

function _sendActiveEmail(accountId) {
    return Models.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            //生成激活码
            var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
            var activeToken = getRndStr(6);
            var sign = makeActiveSign(activeToken, account.id, expireAt);
            var url = C.host + "/auth.html#/auth/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt;

            //发送激活邮件
            var sendEmailRequest = Q.denodeify(API.mail.sendMailRequest);
            return  sendEmailRequest({toEmails: account.email, templateName: "qm_active_email", values: [account.email, url]})
                .then(function(result) {
                    account.activeToken = activeToken;
                    return account.save();
                })
        })
}

module.exports = authServer;