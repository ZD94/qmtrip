/**
 * @module auth
 */
"use strict";
import {requireParams, clientExport} from "../../common/api/helper";
import { Models, EAccountType } from "api/_types";
import {AuthCert, Token, Account} from "api/_types/auth"
import validator = require('validator');

var sequelize = require("common/model").importModel("./models");
var DBM = sequelize.models;
var uuid = require("node-uuid");
var L = require("../../common/language");
var md5 = require("../../common/utils").md5;
var getRndStr = require("../../common/utils").getRndStr;
var C = require("../../config");
var QRCODE_LOGIN_URL = '/auth/qrcode-login';
var moment = require("moment");
var API = require("../../common/api");
var utils = require("common/utils");
var Logger = require("common/logger");
var logger = new Logger('');
var AccountOpenid = DBM.AccountOpenid;


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
class ApiAuth {

    /**
     * @method activeByEmail 通过邮箱激活账号
     *
     * 通过邮箱激活账号
     *
     * @param {Object} data
     * @param {String} data.sign 签名
     * @param {UUID} data.accountId 账号ID
     * @param {String} data.timestamp 时间戳
     * @return {Promise}
     * @public
     */
    @clientExport
    static activeByEmail (data: {sign: string, accountId: string, timestamp: number}) : Promise<boolean> {

        var sign = data.sign;
        var accountId = data.accountId;
        var timestamp = data.timestamp;
        var nowTime = Date.now();

        //失效了
        if (timestamp<0 || nowTime - timestamp > 0) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }

        return Models.account.get(accountId)
            .then(function(account: any) {
                if (account.status == ACCOUNT_STATUS.ACTIVE) {
                    return true;
                }

                var needSign = makeActiveSign(account.activeToken, accountId, timestamp)
                if (sign.toLowerCase() != needSign.toLowerCase()) {
                    throw L.ERR.ACTIVE_URL_INVALID();
                }

                account.status = ACCOUNT_STATUS.ACTIVE;
                account.activeToken = null;
                return account.save();
            })
            .then(function() {
                return true;
            });
    }

    /**
     * @method checkResetPwdUrlValid
     *
     * 检查充值密码链接是否有效
     *
     * @param {Object} params
     * @param {String} params.sign 签名
     * @param {String} params.timestamp 时间戳
     * @param {String} params.accountId 账户ID
     * @return {Promise}
     */
    @clientExport
    static checkResetPwdUrlValid (params: {sign: string, timestamp: number, accountId: string}) {

        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;

        return Promise.resolve()
            .then(function() {
                if (!accountId) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                if (!sign) {
                    throw L.ERR.SIGN_ERROR();
                }

                if (!Boolean(timestamp) || timestamp < Date.now()) {
                    throw L.ERR.TIMESTAMP_TIMEOUT();
                }

                return Models.account.get(accountId)
                    .then(function(account) {
                        if (!account) {
                            throw L.ERR.ACCOUNT_NOT_EXIST();
                        }

                        var sysSign = makeActiveSign(account.pwdToken, account.id, timestamp);
                        if (sysSign.toLowerCase() != sign.toLowerCase()) {
                            throw L.ERR.SIGN_ERROR();
                        }
                        return true;
                    })
            });
    }

    /**
     * @method sendResetPwdEmail 发送设置密码邮件
     *
     * @param {Object} params
     * @param {UUID} params.email 账号ID
     * @param {Integer} params.type 1. 企业员工 2.代理商
     * @param {Boolean} params.isFirstSet true|false 是否首次设置密码
     * @param {String} params.companyName 公司名称
     * @returns {Promise} true|error
     */
    @clientExport
    static sendResetPwdEmail (params: {email: string, type?: Number, isFirstSet?: boolean, companyName?: string}) : Promise<boolean> {
        var email = params.email;
        var isFirstSet = params.isFirstSet;
        var type = params.type || 1;
        var companyName = params.companyName || '';

        return Promise.resolve()
            .then(function() {
                if (!email) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }
                return email;
            })
            .then(function(email) {
                return DBM.Account.findOne({where: {email: email, type: type}})
                    .then(function(account) {
                        if (!account) {
                            throw L.ERR.ACCOUNT_NOT_EXIST();
                        }
                        return account;
                    })
            })
            .then(function(account) {
                //生成设置密码token
                var pwdToken = getRndStr(6);
                return DBM.Account.update({pwdToken: pwdToken}, {where: {id: account.id}, returning: true})
            })
            .spread(function(affect, rows) {
                var account = rows[0];
                if (account.type != 1) {//如果是普通员工,发送姓名,如果是代理商直接发送邮箱
                    return account;
                }

                return API.staff.getStaff({id: account.id})
                    .catch(function(err) {
                        return {};
                    })
                    .then(function(staff) {
                        account = account.toJSON();
                        account.realname = staff.name;
                        return account;
                    })
            })
            .then(function(account: any) {
                var timeStr = utils.now();
                var oneDay = 24 * 60 * 60 * 1000
                var timestamp = Date.now() + 2 * oneDay;  //失效时间2天
                var sign = makeActiveSign(account.pwdToken, account.id, timestamp);
                var url = "accountId="+account.id+"&timestamp="+timestamp+"&sign="+sign+"&email="+account.email;
                var templateName;
                var vals: any = {
                    name: account.realname || account.email,
                    username: account.email,
                    time: timeStr,
                    companyName: companyName
                };

                if (isFirstSet) {
                    vals.url = C.host + "/staff.html#/auth/first-set-pwd?" + url;
                    templateName = 'qm_first_set_pwd_email';
                    return API.mail.sendMailRequest({toEmails: account.email, templateName: templateName, values: vals});
                } else {
                    vals.url = C.host + "/staff.html#/auth/reset-pwd?" + url;
                    templateName = 'qm_reset_pwd_email';
                    return API.mail.sendMailRequest({toEmails: account.email, templateName: templateName, values: vals});
                }
            })
            .then(function() {
                return true;
            });
    }

    // async sendResetPwdEmail(params:{email:string; type:number; code:string; ticket:string}):Promise<boolean> {
    //     let code = params.code;
    //     let ticket = params.ticket;
    //     let email = params.email;
    //     return Promise.resolve(true)
    //         .then(function() {
    //             if (!code) {
    //                 throw L.ERR.CODE_EMPTY();
    //             }
    //
    //             if (!ticket) {
    //                 throw L.ERR.CODE_ERROR();
    //             }
    //
    //             return API.checkcode.validatePicCheckCode({code: code, ticket: ticket});
    //         })
    //         .then(function(){
    //             let data:any = {
    //                 email: email,
    //                 isFirstSet: false
    //             };
    //             return  API.auth.sendResetPwdEmail(data);
    //         });
    // }

    static sendActivateEmail(params:{email:string; companyName?:string}):Promise<boolean> {
        let email = params.email;
        let companyName = params.companyName;
        let data:any = {
            email: email,
            companyName: companyName,
            isFirstSet: true
        };
        return  ApiAuth.sendResetPwdEmail(data);
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
     * @return {Promise} true|error
     */
    @clientExport
    static resetPwdByEmail (params: {accountId: string, sign: string, timestamp: number, pwd: string}) {

        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        var pwd = params.pwd;

        return Promise.resolve()
            .then(function() {
                if (!Boolean(timestamp) || timestamp < Date.now()) {
                    throw L.ERR.TIMESTAMP_TIMEOUT();
                }

                if (!accountId) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                if (!sign) {
                    throw L.ERR.SIGN_ERROR();
                }

                if (!pwd) {
                    throw L.ERR.PWD_EMPTY();
                }

                return DBM.Account.findById(accountId)
            })
            .then(function(account) {
                var _sign = makeActiveSign(account.pwdToken, accountId, timestamp);
                if (_sign.toLowerCase() != sign.toLowerCase()) {
                    throw L.ERR.SIGN_ERROR();
                }
                pwd = utils.md5(pwd);
                //如果从来没有设置过密码,将账号类型设为激活
                var status = account.status;
                if (account.status == ACCOUNT_STATUS.NOT_ACTIVE && !account.pwd) {
                    status = ACCOUNT_STATUS.ACTIVE;
                }
                return DBM.Account.update({pwd: pwd, pwdToken: null, status: status}, {where:{id: accountId}});
            })
            .then(function() {
                return true;
            });
    }

    @clientExport
    static getAccountStatus(params:{}):Promise<number> {
        let args:any = {attributes: ["status"]};
        return ApiAuth.getAccount(args);
    }

    /**
     * @method active 激活账号
     *
     * 激活账号
     *
     * @param {Object} data
     * @param {UUID} data.accountId 账号ID
     * @return {Promise}
     */
    static active (data: {accountId: string}) {

        var accountId = data.accountId;
        return DBM.Account.findOne({where: {id: accountId}})
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                account.status = 1;
                return account.save()
            })
            .then(function(account) {
                return {
                    id: account.id,
                    mobile: account.mobile,
                    email: account.email,
                    status: account.status
                };
            });
    };

    /**
     * @method remove 删除账号
     *
     * @param {Object} data
     * @param {UUID} data.accountId 账号ID
     * @return {Promise}
     * @public
     */
    static remove (data: {accountId: string, email: string, mobile?: string, type?: Number}) {

        var accountId = data.accountId;
        var email = data.email;
        var mobile = data.mobile;
        var type = data.type || 1;
        var where: any = {$or: [{id: accountId}, {email: email}, {mobile: mobile}]};
        if(!accountId){
            where.type = type;
        }
        return DBM.Account.destroy({where: where})
            .then(function() {
                return true;
            });
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
     * @param {String} data.companyName 公司名称,发邮件时使用
     * @return {Promise} {accountId: 账号ID, email: "邮箱", status: "状态"}
     * @public
     */
    static newAccount (data: {email: string, mobile?: string, pwd?: string, type?: Number, status?: Number, companyName?: string, id?: string}) {

        if (!data) {
            throw L.ERR.DATA_NOT_EXIST();
        }

        if (!data.email) {
            throw L.ERR.EMAIL_EMPTY();
        }

        if (!validator.isEmail(data.email)) {
            throw L.ERR.EMAIL_EMPTY();
        }

        if (data.pwd) {
            var pwd = data.pwd;
            var password = data.pwd.toString();
            pwd = md5(password);
            //throw L.ERR.PASSWORD_EMPTY();
        }


        var mobile = data.mobile;
        var companyName = data.companyName || '';
        if (mobile && !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_FORMAT_ERROR();
        }

        var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;

        //查询邮箱是否已经注册
        return Promise.all([
                DBM.Account.findOne({where: {email: data.email, type: type}}),
                DBM.Account.findOne({where: {mobile: mobile, type: type}})
            ])
            .spread(function(account1, account2) {
                if (account1) {
                    throw L.ERR.EMAIL_HAS_REGISTRY();
                }

                if (account2 && account2.mobile && account2.mobile != "") {
                    throw L.ERR.MOBILE_HAS_REGISTRY();
                }
                return true;
            })
            .then(function() {
                var status = data.status? data.status: ACCOUNT_STATUS.NOT_ACTIVE;
                var id = data.id?data.id:uuid.v1();
                return DBM.Account.create({id: id, mobile:mobile, email: data.email, pwd: pwd, status: status, type: type});
            })
            .then(function(account) {
                if (!account.pwd) {
                    return ApiAuth.sendResetPwdEmail({email: account.email, type: 1, isFirstSet: true, companyName: companyName})
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
            });
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
     * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
     * @public
     */
    @clientExport
    static login (data: {email?: string, pwd: string, type?: Number, mobile?: string}) :Promise<AuthCert>{

        if (!data) {
            throw L.ERR.DATA_NOT_EXIST();
        }
        if (!data.email && !data.mobile) {
            throw L.ERR.EMAIL_EMPTY();
        }
        if (!validator.isEmail((data.email))) {
            throw L.ERR.EMAIL_EMPTY();
        }
        if (!data.pwd) {
            throw L.ERR.PWD_EMPTY();
        }

        var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;
        var email = data.email.toLowerCase();
        return DBM.Account.findOne({where: {email: email, type: type}})
            .then(function (loginAccount) {
                var pwd = md5(data.pwd);
                if (!loginAccount) {
                    throw L.ERR.ACCOUNT_NOT_EXIST()
                }

                if (!loginAccount.pwd && loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                    throw L.ERR.ACCOUNT_NOT_ACTIVE();
                }

                if (loginAccount.pwd != pwd) {
                    throw L.ERR.PASSWORD_NOT_MATCH()
                }

                if (loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                    throw L.ERR.ACCOUNT_NOT_ACTIVE();
                }

                if (loginAccount.status != 1) {
                    throw L.ERR.ACCOUNT_FORBIDDEN();
                }

                return makeAuthenticateSign(loginAccount.id)
                    .then(function(ret) {
                        //判断是否首次登陆
                        if (loginAccount.isFirstLogin) {
                            loginAccount.isFirstLogin = false;
                            return loginAccount.save()
                                .then(function() {
                                    ret.is_first_login = true;
                                    return ret;
                                })
                        }

                        ret.is_first_login = false;
                        return ret;
                    });
            })
            .then(function(ret) {
                return new AuthCert(ret);
            })

    }

    async checkBlackDomain (params:{domain:string}):Promise<boolean> {
        return Promise.resolve(false);
        // var domain = params.domain;
        // return Promise.all([
        //     API.company.isBlackDomain({domain: domain}),
        //     API.company.domainIsExist({domain: domain})
        // ])
        //     .spread(function(isBlackDomain, isExist) {
        //         if (isBlackDomain) {
        //             throw L.ERR.EMAIL_IS_PUBLIC();
        //         }
        //
        //         if (isExist) {
        //             throw L.ERR.DOMAIN_HAS_EXIST();
        //         }
        //
        //         return false;
        //     })
        //     .then(function(result: boolean) {
        //         return result;
        //     })
    }

    // async registryCompany (params:{companyName: string, name: string, email: string, mobile: string, pwd: string,
    //     msgCode: string, msgTicket: string, picCode: string, picTicket:string, agencyId?: string}):Promise<boolean> {
    //     //先创建登录账号
    //     // if (!params) {
    //     //     params = {};
    //     // }
    //     var companyName = params.companyName;
    //     var name = params.name;
    //     var email = params.email;
    //     var mobile = params.mobile;
    //     var msgCode = params.msgCode;
    //     var msgTicket = params.msgTicket;
    //     var picCode = params.picCode;
    //     var picTicket = params.picTicket;
    //     var pwd = params.pwd;
    //
    //     if (!picCode || !picTicket) {
    //         throw {code: -1, msg: "验证码错误"};
    //     }
    //
    //     if (!msgCode || !msgTicket) {
    //         throw {code: -1, msg: "短信验证码错误"};
    //     }
    //
    //     if (!mobile || !validate.isMobile(mobile)) {
    //         throw L.ERR.MOBILE_FORMAT_ERROR();
    //     }
    //
    //     if (!name) {
    //         throw {code: -1, msg: "联系人姓名为空"};
    //     }
    //
    //     if (!companyName) {
    //         throw {code: -1, msg: "公司名称为空"};
    //     }
    //
    //     if (!pwd) {
    //         throw {code: -1, msg: "密码不能为空"};
    //     }
    //     var companyId = uuid.v1();
    //     var domain = email.split(/@/)[1];
    //
    //     return Promise.resolve(true)
    //         .then(function() {
    //             if (picCode == 'test' && picTicket == 'test' && msgCode == 'test' && msgTicket == 'test') {
    //                 return true;
    //             }
    //
    //             return API.checkcode.validatePicCheckCode({code: picCode, ticket: picTicket});
    //         })
    //         .then(function() {
    //             if (picCode == 'test' && picTicket == 'test' && msgCode == 'test' && msgTicket == 'test') {
    //                 return true;
    //             }
    //
    //             return API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
    //         })
    //         .then(function(){
    //             return API.client.auth.checkBlackDomain({domain: domain});
    //         })
    //         .then(function() {
    //             var status = 0;
    //             if (process.env["NODE_ENV"] == 'test') {
    //                 status = 1;
    //             }
    //             return API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, status: status});
    //         })
    //         .then(function(account) {
    //             var agencyId = params.agencyId;
    //             if(!agencyId){
    //                 agencyId = API.agency.__defaultAgencyId;
    //             }
    //             return API.company.createCompany({id: companyId, agencyId: agencyId, createUser: account.id, name: companyName, domainName: domain,
    //                 mobile:mobile, email: email})
    //                 .then(function(){
    //                     return Promise.all([
    //                         API.staff.createStaff({accountId: account.id, companyId: companyId, email: email,
    //                             mobile: mobile, name: name, roleId: 0}),
    //                         API.department.createDepartment({name: "我的企业", isDefault: true, companyId: companyId})
    //                     ])
    //                 });
    //         })
    //         .then(function() {
    //             return true;
    //         });
    // }


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
     * @return {Promise} {code:0, msg: "Ok"}
     */
    static authentication (params: {userId?: string, user_id?: string, tokenId?: string,
        token_id?: string, timestamp: number, tokenSign?: string, token_sign?: string}) : Promise<boolean> {

        if ((!params.userId && !params.user_id) || (!params.tokenId && !params.token_id)
            || !Boolean(params.timestamp) || (!params.tokenSign && !params.token_sign)) {
            return Promise.resolve(false);
        }
        var userId = params.userId || params.user_id;
        var tokenId = params.tokenId || params.token_id;
        var timestamp = params.timestamp;
        var tokenSign = params.tokenSign || params.token_sign;

        return Models.token.get(tokenId)
            .then(function(m) {
                if (!m) {
                    return false;
                }

                var sign = getTokenSign(userId, tokenId, m.token, timestamp);
                if (sign != tokenSign) {
                    return false;
                }

                return true;
            });
    };

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
     * @return {Promise} true||error;
     */
    static bindMobile (data: {accountId: string, mobile: string, code: string, pwd: string}) {

        throw L.ERR.NOT_IMPLEMENTED();
    };

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    static getAccount (params: {id: string, attributes?: string[], type?: Number}) {

        var id = params.id;
        var attributes = params.attributes;
        if(!id){
            throw {code: -1, msg: "id不能为空"};
        }
        var options: any = {};
        options.where = {id: id};
        if(params.type){
            options.where.type = params.type;
        }
        if(attributes)
            options.attributes = attributes;
        return DBM.Account.findOne(options);
    }

    /**
     * 修改账户信息
     * @param id
     * @param data
     * @param companyName
     * @returns {*}
     */
    static updateAccount(id: string, data: any, companyName?: string){
        if(!id){
            throw {code: -1, msg: "id不能为空"};
        }
        if (!companyName) {
            companyName = '';
        }
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        var old_email;
        return DBM.Account.findOne(options)
            .then(function(oldAcc){
                old_email = oldAcc.email;
                return DBM.Account.update(data, options);
            })
            .spread(function(rownum, rows){
                if(!rownum)
                    throw L.ERR.NOT_FOUND();
                if(old_email == rows[0].email){
                    return rows[0];
                }
                return ApiAuth.sendResetPwdEmail({companyName: companyName, email: rows[0].email, type: 1, isFirstSet: true})
                    .then(function() {
                        return rows[0];
                    });
            });
    }

    /**
     * 根据条件查询一条账户信息
     * @param params
     * @returns {*}
     */
    static findOneAcc (params: any) {

        var options: any = {};
        options.where = params;
        return DBM.Account.findOne(options)
            .then(function(obj){
                if(!obj)
                    throw L.ERR.NOT_FOUND();
                return obj;
            });
    }

    /**
     * 检查账户是否存在
     * @param params
     * @returns {*}
     */
    static checkAccExist (params: any) {

        var options: any = {};
        options.where = params;
        return DBM.Account.findOne(options);
    };



    /**
     * @method sendActiveEmail
     *
     * 发送激活邮件
     *
     * @param {Object} params
     * @param {String} params.email 要发送的邮件
     * @return {Promise} true||error
     */
    @clientExport
    static sendActiveEmail (params: {email: string}) {

        var email = params.email;
        if (!email) {
            throw L.ERR.EMAIL_EMPTY();
        }

        if (!validator.isEmail(email)) {
            throw L.ERR.EMAIL_FORMAT_INVALID();
        }

        return DBM.Account.findOne({where: {email: email}})
            .then(function(account) {
                if (!account) {
                    throw L.ERR.EMAIL_NOT_REGISTRY();
                }
                return _sendActiveEmail(account.id);
            })
            .then(function() {
                return true;
            });
    }

    /**
     * 退出登录
     * @param {Object} params
     * @param {UUID} params.accountId
     * @param {UUID} params.tokenId
     * @return {Promise}
     */
    static logout (params: {}) : Promise<boolean> {
        let session = Zone.current.get("session");
        var accountId = session["accountId"];
        var tokenId = session["tokenId"];
        if (accountId && tokenId) {
            return DBM.Token.destroy({where: {accountId: accountId, id: tokenId}})
                .then(function() {
                    return true;
                })
        }
        return Promise.resolve(true);
    };


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
    @clientExport
    static resetPwdByOldPwd (params: {oldPwd: string, newPwd: string}) : Promise<boolean>{
        let session = Zone.current.get("session");
        let oldPwd = params.oldPwd;
        let newPwd = params.newPwd;
        let accountId = session["accountId"];

        if (!accountId) {
            throw L.ERR.NEED_LOGIN();
        }

        if (!oldPwd || !newPwd) {
            throw L.ERR.PWD_EMPTY();
        }

        if (oldPwd == newPwd) {
            throw {code: -1, msg: "新旧密码不能一致"};
        }

        return DBM.Account.findById(accountId)
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                var pwd = utils.md5(oldPwd);
                if (account.pwd != pwd) {
                    throw L.ERR.PWD_ERROR();
                }
                newPwd = newPwd.replace(/\s/g, "");
                pwd = utils.md5(newPwd);
                return DBM.Account.update({pwd: pwd}, {where: {id: account.id}});
            })
            .then(function() {
                return true;
            });
    };

    /**
     * 二维码扫描登录接口
     *
     * @param {Object} params 参数
     * @param {UUID} params.accountId 账号ID
     * @param {String} params.sign签名信息
     * @param {String} params.timestamp 失效时间戳
     * @return {Promise}
     */
    static qrCodeLogin (params: {accountId: string, sign: string, timestamp: number, backUrl?: string}) {

        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        //var backUrl = params.backUrl;   //登录后返回地址
        return Promise.resolve()
            .then(function() {
                if (!params) {
                    throw L.ERR.DATA_FORMAT_ERROR();
                }

                if (!accountId) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                if (!sign) {
                    throw L.ERR.SIGN_ERROR();
                }

                if (!Boolean(timestamp)) {
                    throw L.ERR.TIMESTAMP_TIMEOUT();
                }

                if (timestamp < Date.now()) {
                    throw L.ERR.TIMESTAMP_TIMEOUT();
                }

                return DBM.Account.findById(accountId)
            })
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                if (!account.qrcodeToken) {
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
                if (sysSign.toLowerCase() == sign.toLowerCase() ) {
                    signCmpResult = true;
                }
                //新签名不正确,使用旧签名判断
                if (!signCmpResult && account.oldQrcodeToken) {
                    data = {
                        key: account.oldQrcodeToken,
                        timestamp: timestamp,
                        accountId: account.id
                    };
                    sysSign = cryptoData(data);
                    if (sysSign.toLowerCase() == sign.toLowerCase()) {
                        signCmpResult = true;
                    }
                }

                if (!signCmpResult) {
                    throw L.ERR.SIGN_ERROR();
                }

                return makeAuthenticateSign(account.id);
            });
    }

    /**
     * 获取二维码中展示链接
     *
     * @param {Object} params 参数
     * @param {String} params.accountId 账号ID
     * @param {String} params.backUrl
     */
    @clientExport
    static getQRCodeUrl (params: {backUrl: string}) : Promise<string> {

        let session = Zone.current.get("session");
        var accountId = session["accountId"];
        var backUrl = params.backUrl;

        return Promise.resolve()
            .then(function(){
                if (!Boolean(accountId)) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                if (!Boolean(backUrl)) {
                    throw {code: -1, msg: "跳转链接不存在"};
                }

                return API.shorturl.long2short({longurl: backUrl})
            })
            .then(function(shortUrl) {
                backUrl = encodeURIComponent(shortUrl);
                return DBM.Account.findById(accountId)
            })
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                var qrcodeToken = getRndStr(8);
                account.oldQrcodeToken = account.qrcodeToken;
                account.qrcodeToken = qrcodeToken;

                return account.save();
            })
            .then(function(account) {
                var timestamp = Date.now() + 1000 * 60 * 5;
                var data = {accountId: account.id, timestamp: timestamp, key: account.qrcodeToken};
                var sign = cryptoData(data);
                var urlParams = {accountId: account.id, timestamp: timestamp, sign: sign, backUrl: backUrl};
                urlParams = combineData(urlParams);
                return C.host + QRCODE_LOGIN_URL +"?"+urlParams;
            })
    }

    /**
     * @method isEmailUserd
     *
     * 邮箱是否被使用
     *
     * @param {Object} params
     * @param {String} params.email 邮箱
     * @param {Integer} [params.type] 1.企业  2.代理商 默认 1
     * @reutnr {Promise} true 使用 false未使用
     */
    @clientExport
    static isEmailUsed (params: {email: string, type?: Number}) :Promise<boolean> {
        var email = params.email;
        var type = params.type;

        return Promise.resolve()
            .then(function() {
                if (!validator.isEmail(email)) {
                    throw L.ERR.EMAIL_FORMAT_INVALID();
                }

                if (type !== 1 && type !== 2) {
                    type = 1;
                }

                return DBM.Account.findOne({where: {email: email, type: type}})
            })
            .then(function(account) {
                if (account) {
                    return true;
                }
                return false;
            })
    }

    /**
     * 保存openId关联的accountId
     * @type {saveOrUpdateOpenId}
     */
    @requireParams(['accountId', 'openId'], [])
    static saveOrUpdateOpenId(params: {accountId: string, openId: string}) {
        if(params.accountId == undefined) {
            throw {code: -1, msg: 'accountId不能为空'};
        }
        let _params: any;
        _params = params;
        _params.createdAt = utils.now();

        return AccountOpenid.findById(_params.openId)
            .then(function(ap) {
                if(ap) {
                    return ap;
                }

                return AccountOpenid.create(_params);
            })
    }

    /**
     * 获取数据库中openId关联的accountId
     * @type {getAccountIdByOpenId}
     */
    @requireParams(["openId"])
    static getAccountIdByOpenId(params: {openId: string}) {
        return AccountOpenid.findById(params.openId)
            .then(function(ret) {
                if(ret) {
                    return ret.accountId;
                }else {
                    return false;
                }
            })
    }

    @requireParams(["id"])
    static judgeRoleById(params: {id: string}){
        return DBM.Account.findById(params.id)
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }
                if(account.type == 1){
                    return EAccountType.STAFF;
                }else{
                    return EAccountType.AGENCY;
                }
            })
    }

    static __initHttpApp (app: any) {

        //二维码自动登录
        app.all("/auth/qrcode-login", function(req, res, next) {
            var accountId = req.query.accountId;
            var timestamp = req.query.timestamp;
            var sign = req.query.sign;
            var backUrl = req.query.backUrl;

            ApiAuth.qrCodeLogin({accountId: accountId, sign: sign, timestamp: timestamp, backUrl: backUrl})
                .then(function(result) {
                    res.cookie("token_id", result.token_id);
                    res.cookie("user_id", result.user_id);
                    res.cookie("timestamp", result.timestamp);
                    res.cookie("token_sign", result.token_sign);
                    res.redirect(backUrl);
                })
                .catch(function(err) {
                    console.info(err);
                    res.send("链接已经失效或者不存在");
                })
        });

        //微信自动登录
        app.all("/auth/wx-login", function(req, res, next) {
            var redirectUrl = req.query.redirect_url;
            redirectUrl = encodeURIComponent(redirectUrl)
            var backUrl = "http://qmtrip.com.cn/auth/get_access_code?back_url=" + redirectUrl;
            API.wechat.getOAuthUrl({backUrl: backUrl})
                .then(function(ret) {
                    res.redirect(ret);
                })
        });

        //微信自动登陆
        app.all("/auth/get_access_code", function(req, res, next) {
            var query = req.query;
            var code = query.code;
            var backUrl = req.url.match(/http.+/)[0];
            var account_id = req.cookies.user_id;
            if(account_id == "undefined") {
                account_id = null;
            }
            let ret: any;

            API.wechat.requestOpenIdByCode({code: code}) //获取微信openId
                .then(function(openid) {
                    return [openid, API.auth.getAccountIdByOpenId({openId: openid})]; //获取数据库中openId对应的accountId
                })
                .spread(function(openId, accountId) {
                    if(accountId) {//如果数据库有该openId关联的用户，自动登陆，生成登陆凭证
                        logger.warn("在微信中自动登陆...");
                        ret = [makeAuthenticateSign(accountId, 'weChat')];
                        return ret;
                    }else if(!account_id || account_id == "undefined"){
                        var login_back_url = '/auth/wx-login?redirect_url=' + encodeURIComponent('/auth/get_access_code?back_url=' + backUrl);
                        var loginUrl = '/mobile.html#/auth/login?backurl=' + login_back_url;
                        logger.warn("没有登陆，跳转至登陆页面...", loginUrl);
                        ret = new Promise(function(resolve) {
                            res.redirect(loginUrl);
                            resolve(false);
                        })
                        return ret;
                    }else {
                        logger.warn("第一次在微信登陆,关联openId和accountId...");
                        ret = [makeAuthenticateSign(account_id), API.auth.saveOrUpdateOpenId({openId: openId, accountId: account_id})];
                        return ret;
                    }
                })
                .spread(function(ret) {
                    if(ret !== false) {
                        res.cookie("token_id", ret.token_id);
                        res.cookie("user_id", ret.user_id);
                        res.cookie("timestamp", ret.timestamp);
                        res.cookie("token_sign", ret.token_sign);

                        var redirectUrl = decodeURIComponent(backUrl);
                        if(!redirectUrl.match(/^http:\/\/.*\?.*/)) {
                            redirectUrl = redirectUrl.replace(/&/, '?');
                        }
                        res.redirect(redirectUrl);
                    }
                })
                .catch(function(err) {
                    logger.error(err);
                    next(err);
                })
        })
    }

}

//拼接字符串
function combineData(obj) {
    if (typeof obj != 'object') {
        throw new Error("combineStr params must be object");
    }

    var strs:any = [];
    for(var key in obj) {
        strs.push(key+"="+obj[key]);
    }
    strs.sort();
    strs = strs.join("&");
    return strs;
}

//加密对象
function cryptoData(obj) {
    if (typeof obj == 'string') {
        return md5(obj);
    }

    var strs = combineData(obj);
    return md5(strs);
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
    return DBM.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            //生成激活码
            var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
            var activeToken = getRndStr(6);
            var sign = makeActiveSign(activeToken, account.id, expireAt);
            var url = C.host + "/staff.html#/auth/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt;
            //发送激活邮件
            var vals = {name: account.email, username: account.email, url: url};
            return API.mail.sendMailRequest({toEmails: account.email, templateName: "qm_active_email", values: vals})
                .then(function() {
                    account.activeToken = activeToken;
                    return DBM.Account.update({activeToken: activeToken}, {where: {id: accountId}, returning: true});
                })
        })
}


//生成登录凭证
function makeAuthenticateSign(accountId, os?: string) {
    if (!os) {
        os = 'web';
    }

    return DBM.Token.findOne({where:{accountId: accountId, os: os}})
        .then(function(m) {
            var refreshAt = moment().format("YYYY-MM-DD HH:mm:ss");
            var expireAt = moment().add(2, "hours").format("YYYY-MM-DD HH:mm:ss");
            if (m) {
                m.refreshAt = refreshAt;
                m.expireAt = expireAt;
                return m.save();
            } else {
                m = DBM.Token.build({id: uuid.v1(), accountId: accountId, token: getRndStr(10), refreshAt: refreshAt, expireAt: expireAt});
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
        });
}

export = ApiAuth;