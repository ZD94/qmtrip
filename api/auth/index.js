/**
 * @module auth
 */
"use strict";

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
var utils = require("common/utils");

var ACCOUNT_STATUS = {
    ACTIVE: 1,
    NOT_ACTIVE: 0,
    FORBIDDEN: -1
};

var ACCOUNT_TYPE = {
    COMPANY_STAFF: 1,
    AGENT_STAFF: 2
}

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

            if (account.status == ACCOUNT_STATUS.ACTIVE) {
                return true;
            }

            var needSign = makeActiveSign(account.activeToken, accountId, timestamp)
            if (sign.toLowerCase() != needSign.toLowerCase()) {
                throw L.ERR.ACTIVE_URL_INVALID;
            }

            return Models.Account.update({status: ACCOUNT_STATUS.ACTIVE, activeToken: null}, {where: {id: account.id}})
                .then(function() {
                    return true;
                })
        })
        .nodeify(callback);
}

/**
 * @method sendResetPwdEmail 发送设置密码邮件
 *
 * @param {Object} params
 * @param {UUID} params.email 账号ID
 * @param {Integer} params.type 1. 企业员工 2.代理商
 * @param {Boolean} params.isFirstSet true|false 是否首次设置密码
 * @param {Function} [callback]
 * @returns {Promise} true|error
 */
authServer.sendResetPwdEmail = function(params, callback) {
    var email = params.email;
    var isFirstSet = params.isFirstSet;
    var type = params.type || 1;
    return Q()
        .then(function() {
            if (!email) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }
            return email;
        })
        .then(function(email) {
            return Models.Account.findOne({where: {email: email, type: type}})
                .then(function(account) {
                    if (!account) {
                        throw L.ERR.ACCOUNT_NOT_EXIST;
                    }
                    return account;
                })
        })
        .then(function(account) {
            //生成设置密码token
            var pwdToken = getRndStr(6);
            return Models.Account.update({pwdToken: pwdToken}, {where: {id: account.id}, returning: true})
        })
        .spread(function(affect, rows) {
            var account = rows[0];
            var timeStr = utils.now();
            var timestamp = Date.now() + 20 * 24 * 60 * 60 * 1000;  //失效时间20天
            var sign = makeActiveSign(account.pwdToken, account.id, timestamp);
            var url = C.host + "/staff.html#/auth/reset-pwd?accountId="+account.id+"&timestamp="+timestamp+"&sign="+sign;
            var templateName;
            if (isFirstSet) {
                templateName = 'qm_first_set_pwd_email';
            } else {
                templateName = 'qm_reset_pwd_email';
            }
            return API.mail.sendMailRequest({toEmails: account.email, templateName: templateName, values: [timeStr, url]});
        })
        .then(function() {
            return true;
        })
        .nodeify(callback);
}

/**
 * @method resetPwdByEmail
 * 找回密码
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.sign 签名
 * @param {String} params.timestamp 时间戳
 * @param {String} params.pwd 新密码
 * @param {Function} [callback] (null, true)
 * @return {Promise} true|error
 */
authServer.resetPwdByEmail = function(params, callback) {
    var accountId = params.accountId;
    var sign = params.sign;
    var timestamp = params.timestamp;
    var pwd = params.pwd;

    return Q()
        .then(function() {
            if (!timestamp || timestamp < Date.now()) {
                throw L.ERR.TIMESTAMP_TIMEOUT;
            }

            if (!accountId) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            if (!sign) {
                throw L.ERR.SIGN_ERROR;
            }

            if (!pwd) {
                throw L.ERR.PWD_EMPTY;
            }

            return Models.Account.findById(accountId)
        })
        .then(function(account) {
            var _sign = makeActiveSign(account.pwdToken, accountId, timestamp);
            if (_sign.toLowerCase() == sign.toLowerCase()) {
                pwd = utils.md5(pwd);
                //如果从来没有设置过密码,将账号类型设为激活
                var status = account.status;
                if (account.status == ACCOUNT_STATUS.NOT_ACTIVE && !account.pwd) {
                    status = ACCOUNT_STATUS.ACTIVE;
                }
                return Models.Account.update({pwd: pwd, pwdToken: null, status: status}, {where:{id: accountId}})
            }
            throw L.ERR.SIGN_ERROR;
        })
        .then(function() {
            return true;
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
 * @param {String} [data.pwd] 密码
 * @param {Integer} data.type  账号类型 默认1.企业员工 2.代理商员工
 * @param {INTEGER} data.status 账号状态 0未激活, 1.已激活 如果为0将发送激活邮件,如果1则不发送
 * @param {Callback} callback 回调函数
 * @return {Promise} {accountId: 账号ID, email: "邮箱", status: "状态"}
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

    if (data.pwd) {
        var pwd = data.pwd;
        pwd = md5(pwd);
        //defer.reject(L.ERR.PASSWORD_EMPTY);
        //return defer.promise.nodeify(callback);
    }

    var mobile = data.mobile;
    if (mobile && !validate.isMobile(mobile)) {
        defer.reject(L.ERR.MOBILE_FORMAT_ERROR);
        return defer.promise.nodeify(callback);
    }

    var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;

    //查询邮箱是否已经注册
    return Q.all([
        Models.Account.findOne({where: {email: data.email, type: type}}),
        Models.Account.findOne({where: {mobile: mobile, type: type}})
    ])
        .spread(function(account1, account2) {
            if (account1) {
                throw L.ERR.EMAIL_HAS_REGISTRY;
            }

            if (account2 && account2.mobile && account2.mobile != "") {
                throw L.ERR.MOBILE_HAS_REGISTRY;
            }
            return true;
        })
        .then(function() {
            var status = data.status? data.status: ACCOUNT_STATUS.NOT_ACTIVE;
            var id = data.id?data.id:uuid.v1();
            return Models.Account.create({id: id, mobile:mobile, email: data.email, pwd: pwd, status: status, type: type});
        })
        .then(function(account) {
            if (!account.pwd) {
                return authServer.sendResetPwdEmail({email: account.email, type: 1, isFirstSet: true})
                    .then(function() {
                        return account;
                    })
            }

            if (account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                return _sendActiveEmail(account.id)
                    .then(function(){
                        return account;
                    })
            }

            return account;
        })
        .nodeify(callback);
}

/**
 * @method login
 *
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {Integer} data.type 1.企业员工 2.代理商员工 默认是企业员工
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @param {Callback} callback 可选回调函数
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 * @public
 */
authServer.login = function(data, callback) {
    return Q()
        .then(function() {
            if (!data) {
                throw L.ERR.DATA_NOT_EXIST;
            }

            if (!data.email && !data.mobile) {
                throw L.ERR.EMAIL_EMPTY;
            }

            if (!validate.isEmail((data.email))) {
                throw L.ERR.EMAIL_EMPTY;
            }

            if (!data.pwd) {
                throw L.ERR.PWD_EMPTY;
            }

            var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;


            return Models.Account.findOne({where: {email: data.email, type: type}})
                .then(function (loginAccount) {
                    var pwd = md5(data.pwd);
                    if (!loginAccount) {
                        throw L.ERR.ACCOUNT_NOT_EXIST
                    }

                    if (loginAccount.pwd != pwd) {
                        throw L.ERR.PASSWORD_NOT_MATCH
                    }

                    if (loginAccount.status == 0) {
                        throw L.ERR.ACCOUNT_NOT_ACTIVE;
                    }

                    if (loginAccount.status != 1) {
                        throw L.ERR.ACCOUNT_FORBIDDEN;
                    }

                    return makeAuthenticateSign(loginAccount.id);
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

/**
 * 由id查询账户信息
 * @param id
 * @param callback
 * @returns {*}
 */
authServer.getAccount = function(params, callback){
    var id = params.id;
    var attributes = params.attributes;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    var options = {};
    options.where = {id: id};
    if(attributes)
        options.attributes = attributes;
    return Models.Account.findOne(options)
        .nodeify(callback);
}

/**
 * 修改账户信息
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
authServer.updataAccount = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return Models.Account.update(data, options)
        .spread(function(rownum, rows){
            if(!rownum)
                throw L.ERR.NOT_FOUND;
            return rows[0];
        })
        .nodeify(callback);
}

/**
 * 根据条件查询一条账户信息
 * @param params
 * @param callback
 * @returns {*}
 */
authServer.findOneAcc = function(params, callback){
    var options = {};
    options.where = params;
    return Models.Account.findOne(options)
        .then(function(obj){
            if(!obj)
                throw L.ERR.NOT_FOUND;
            return obj;
        })
        .nodeify(callback);
}

/**
 * 检查账户是否存在
 * @param params
 * @param callback
 * @returns {*}
 */
authServer.checkAccExist = function(params, callback){
    var options = {};
    options.where = params;
    return Models.Account.findOne(options)
        .then(function(obj){
            return obj;
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
    return md5(originStr);
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
            var url = C.host + "/staff.html#/auth/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt;
            //发送激活邮件
            var sendEmailRequest = Q.denodeify(API.mail.sendMailRequest);
            return  sendEmailRequest({toEmails: account.email, templateName: "qm_active_email", values: [account.email, url]})
                .then(function(result) {
                    account.activeToken = activeToken;
                    return Models.Account.update({activeToken: activeToken}, {where: {id: accountId}, returning: true});
                })
        })
}

/**
 * @method sendActiveEmail
 *
 * 发送激活邮件
 *
 * @param {Object} params
 * @param {String} params.email 要发送的邮件
 * @param {Function} [callback] 可选回调函数
 * @return {Promise} {code: 0, msg: "OK", submit: "ID"}
 */
authServer.sendActiveEmail = function(params, callback) {
    var email = params.email;
    var defer = Q.defer();
    if (!email) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    if (!validate.isEmail(email)) {
        defer.reject(L.ERR.EMAIL_FORMAT_INVALID);
        return defer.promise.nodeify(callback);
    }

    return Models.Account.findOne({where: {email: email}})
    .then(function(account) {
        if (!account) {
            throw L.ERR.EMAIL_NOT_REGISTRY;
        }

        return _sendActiveEmail(account.id);
    })
    .then(function() {
        return {code: 0, msg: "ok"};
    })
    .nodeify(callback);
}

/**
 * 退出登录
 * @param {Object} params
 * @param {UUID} params.accountId
 * @param {UUID} params.tokenId
 * @param {Function} callback
 * @return {Promise}
 */
authServer.logout = function (params, callback) {
    var accountId = params.accountId;
    var tokenId = params.tokenId;
    return Q.all([])
        .then(function() {
            if (accountId && tokenId) {
                return Models.Token.destroy({where: {accountId: accountId, id: tokenId}})
                    .then(function() {
                        return {code: 0, msg: "OK"};
                    })
            }
            return {code: 0, msg: "ok"};
        })
        .nodeify(callback);
}


/**
 * @method resetPwdByOldPwd
 *
 * 根据旧密码重置密码
 *
 * @param {Object} params
 * @param {String} params.oldPwd 旧密码
 * @param {String} params.newPwd 新密码
 * @param {Function} [callback] true|error
 * @return {Promise}
 */
authServer.resetPwdByOldPwd = function(params, callback) {
    var oldPwd = params.oldPwd;
    var newPwd = params.newPwd;
    var accountId = params.accountId;

    return Q()
        .then(function() {
            if (!accountId) {
                throw L.ERR.NEED_LOGIN;
            }

            if (!oldPwd || !newPwd) {
                throw L.ERR.PWD_EMPTY;
            }

            if (oldPwd == newPwd) {
                throw {code: -1, msg: "新旧密码不能一致"};
            }

            return Models.Account.findById(accountId)
        })
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            var pwd = utils.md5(oldPwd);
            if (account.pwd != pwd) {
                throw L.ERR.PWD_ERROR;
            }
            newPwd = newPwd.replace(/\s/g, "");
            pwd = utils.md5(newPwd);
            return Models.Account.update({pwd: pwd}, {where: {id: account.id}});
        })
        .then(function() {
            return true;
        })
        .nodeify(callback);
}

module.exports = authServer;