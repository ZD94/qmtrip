/**
 * Created by wlh on 15/12/9.
 */

var Q = require("q");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var db = require("../../models").sequelize;
var uuid = require("node-uuid");
var authServer = require("../auth/index");
var auth = {
    __public: true
};
var accounts = [];
var mail = require("../mail");
var API = require("../../common/api");


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
auth.login = authServer.login;

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
auth.bindMobile =authServer.bindMobile;

/**
 * 激活账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {String} data.timestamp 时间戳
 * @param {String} data.sign 签名
 * @param {Callback} callback
 * @return {Promise} {code:0 , msg: "ok"}
 */
auth.activeAccount = authServer.activeAccount;

/**
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
 * @param {Function} callback
 * @return {Promise}
 */
auth.registryCompany = function(params, callback) {
    var defer = Q.defer();
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
        defer.reject({code: -1, msg: "验证码错误"});
        return defer.promise.nodeify(callback);
    }

    if (!msgCode || !msgTicket) {
        defer.reject({code: -1, msg: "短信验证码错误"});
        return defer.promise.nodeify(callback);
    }

    if (!mobile || !validate.isMobile(mobile)) {
        defer.reject(L.ERR.MOBILE_FORMAT_ERROR);
        return defer.promise.nodeify(callback);
    }

    if (!name) {
        defer.reject({code: -1, msg: "联系人姓名为空"});
        return defer.promise.nodeify(callback);
    }

    if (!companyName) {
        defer.reject({code: -1, msg: "公司名称为空"});
        return defer.promise.nodeify(callback);
    }

    if (!pwd) {
        defer.reject({code: -1, msg: "密码不能为空"});
        return defer.promise.nodeify(callback);
    }

    pwd = md5(pwd);
    var validatePicCheckCode = Q.denodeify(API.checkcode.validatePicCheckCode);
    var validateMsgCheckCode = Q.denodeify(API.checkcode.validateMsgCheckCode);
    var createCompany = Q.denodeify(API.company.createCompany);
    var createStaff = Q.denodeify(API.staff.createStaff);
    return validatePicCheckCode({code: picCode, ticket: picTicket})
        .then(function(result) {
            if (result.code) {
                throw result;
            }
            return true;
        })
        .then(function() {
            return validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile})
                .then(function(result) {
                    if (result.code) {
                        throw result;
                    }
                    return true;
                })
        })
        .then(function(){
            return authServer.newAccount({mobile: mobile, email: email, pwd: pwd})
                .then(function(result) {
                    if (result.code) {
                        throw result;
                    }

                    var domain = email.split(/@/)[1];
                    var account = result.data;
                    return createCompany({createUser: account.id, name: companyName, email: domain})
                        .then(function(result) {
                            if (result.code) {
                                throw result;
                            }

                            var company = result.company;
                            return createStaff({email: email, mobile: mobile, name: name, companyId: company.id, accountId: account.id})
                        })
                })
                .then(function(result) {
                    return {code: 0, msg: "OK"};
                })
        })
        .nodeify(callback);
}

module.exports = auth;