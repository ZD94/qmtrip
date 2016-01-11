/**
 * @module API
 */

var Q = require("q");
var L = require("common/language");
var Logger = require("common/logger");
var validate = require("common/validate");
var md5 = require("common/utils").md5;
var uuid = require('node-uuid');
var logger = new Logger("auth");

/**
 * @class auth 用户认证
 */
var auth = {
    /**
     * @property __public 是否公共模块
     * @type {Boolean}
     */
    __public: true
};

var API = require("common/api");

/**
 * @method activeByEmail
 *
 * 通过邮件激活账号
 *
 * @param {object} data
 * @param {String} data.sign
 * @param {String} data.accountId
 * @param {String} data.timestamp
 * @return {promise}
 * @public
 */
auth.activeByEmail = API.auth.activeByEmail;

/**
 * @method login
 *
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {String} [data.mobile] 手机号(可选,如果email提供则优先使用email)
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 */
auth.login = API.auth.login;

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
 * @return {Promise} {code: 0, msg: "ok};
 */
auth.bindMobile =API.auth.bindMobile;


/**
 * @method checkBlackDomain
 *
 * 是否黑名单
 *
 * @param {Object} params
 * @param {String} params.domain 域名
 * @return {Promise} {code: 0}, {code: -1, msg: "域名已占用或者不合法"}
 */
auth.checkBlackDomain = API.company.checkBlackDomain;

/**
 * @method registryCompany
 *
 * 注册企业账号
 *
 * @param {Object} params
 * @param {String} params.companyName 企业名称
 * @param {String} params.name 注册人姓名
 * @param {String} params.email 企业邮箱
 * @param {String} params.mobile 手机号
 * @param {String} params.pwd 密码
 * @param {String} params.msgCode 短信验证码
 * @param {String} params.msgTicket 验证码凭证
 * @param {String} params.picCode 图片验证码
 * @param {String} params.picTicket 图片验证码凭证
 * @return {Promise}
 */
auth.registryCompany = function(params) {
    //先创建登录账号
    if (!params) {
        params = {};
    }
    var companyName = params.companyName;
    var name = params.name;
    var email = params.email;
    var mobile = params.mobile;
    var msgCode = params.msgCode;
    var msgTicket = params.msgTicket;
    var picCode = params.picCode;
    var picTicket = params.picTicket;
    var pwd = params.pwd;

    if (!picCode || !picTicket) {
        throw {code: -1, msg: "验证码错误"};
    }

    if (!msgCode || !msgTicket) {
        throw {code: -1, msg: "短信验证码错误"};
    }

    if (!mobile || !validate.isMobile(mobile)) {
        throw L.ERR.MOBILE_FORMAT_ERROR;
    }

    if (!name) {
        throw {code: -1, msg: "联系人姓名为空"};
    }

    if (!companyName) {
        throw {code: -1, msg: "公司名称为空"};
    }

    if (!pwd) {
        throw {code: -1, msg: "密码不能为空"};
    }
    var companyId = uuid.v1();
    var domain = email.split(/@/)[1];

    return Q()
        .then(function() {
            if (process.env["NODE_ENV"] == 'test') {
                return true;
            }

            return API.checkcode.validatePicCheckCode({code: picCode, ticket: picTicket});
        })
        .then(function() {
            if (process.env["NODE_ENV"] == 'test') {
                return true;
            }

            return API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        })
        .then(function(){
            return API.company.checkBlackDomain({domain: domain});
        })
        .then(function() {
            var status = 0;
            if (process.env["NODE_ENV"] == 'test') {
                status = 1;
            }
            return API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, status: status});
        })
        .then(function(account) {
            return API.company.createCompany({id: companyId, createUser: account.id, name: companyName, domainName: domain,
                mobile:mobile, email: email})
            .then(function(c){
                    return API.staff.createStaff({accountId: account.id, companyId: companyId, email: email,
                        mobile: mobile, name: name, roleId: 0})
                })
        })
        .then(function() {
            return true;
        });
}

/**
 * @method sendActiveEmail
 *
 * 发送激活邮件
 *
 * @param {Object} params
 * @param {String} params.email 邮件账号
 * @return {Promise} {code: 0, msg: "OK"}
 */
auth.sendActiveEmail = function(params) {
    return API.auth.sendActiveEmail(params);
}

/**
 * @method logout
 *
 * 退出登录
 *
 * @return {Promise} {code: 0}, {code: -1}
 */
auth.logout = function() {
    var self = this;
    var accountId = self.accountId;
    var tokenId = self.tokenId;
    return API.auth.logout({accountId: accountId, tokenId: tokenId});
}

/**
 * @method checkPermission
 *
 * 权限控制
 *
 * @param fn
 * @param permissions
 * @return {Function}
 */
auth.checkPermission = function(permissions, fn) {
    return function(params) {
        var self = this;
        var accountId = self.accountId;
        return API.permit.checkPermission({accountId: accountId, permission: permissions})
            .then(function(result) {
                return fn.call(self, params);
            });
    }
};

/**
 * 验证代理商权限
 * @param permissions
 * @param fn
 * @returns {Function}
 */
auth.checkAgencyPermission = function(permissions, fn) {
    return function(params) {
        var self = this;
        var accountId = self.accountId;
        return API.permit.checkPermission({accountId: accountId, permission: permissions, type: 2})
            .then(function(ret) {
                return fn.call(self, params);
            });
    }
};

/**
 * @method sendResetPwdEmail
 *
 * 发送重置密码邮件
 *
 * @param {Object} params
 * @param {String} params.email 邮箱
 * @param {String} params.type 1.企业员工 2.代理商员工
 * @param {String} params.code 验证码
 * @param {String} params.ticket 验证码凭证
 * @return {Promise} true|error
 */
auth.sendResetPwdEmail = function(params) {
    var code = params.code;
    var ticket = params.ticket;
    var email = params.email;
    return Q()
        .then(function() {
            if (!code) {
                throw L.ERR.CODE_EMPTY;
            }

            if (!ticket) {
                throw L.ERR.CODE_ERROR;
            }

            return API.checkcode.validatePicCheckCode({code: code, ticket: ticket});
        })
        .then(function(){
            var data = {
                email: email,
                isFirstSet: false
            };
            return  API.auth.sendResetPwdEmail(data);
        });
}

/**
 * @method resetPwdByEmail
 *
 * 找回密码
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.sign 签名
 * @param {String} params.timestamp 时间戳
 * @param {String} params.pwd 新密码
 * @return {Promise} true|error
 */
auth.resetPwdByEmail = API.auth.resetPwdByEmail;

/**
 * 得到账号激活状态
 * @param params
 * @returns {*}
 */
auth.getAccountStatus = function(params) {
    params.attributes = ["status"];
    return API.auth.getAccount(params);
}

/**
 * @method resetPwdByOldPwd
 *
 * 根据旧密码重置密码
 *
 * @param {Object} params
 * @param {String} params.oldPwd 旧密码
 * @param {String} params.newPwd 新密码
 * @return {Promise}
 */
auth.resetPwdByOldPwd = function(params) {
    var self = this;
    var data = {};
    var accountId = self.accountId;
    data.oldPwd = params.oldPwd;
    data.newPwd = params.newPwd;
    data.accountId = accountId;
    return API.auth.resetPwdByOldPwd(data);
}

module.exports = auth;
