/**
 * @module auth
 */
"use strict";
import {requireParams, clientExport} from "../../common/api/helper";
import { Models, EAccountType } from "api/_types";
import {AuthCert, Token, Account, AccountOpenid, ACCOUNT_STATUS} from "api/_types/auth";
import {Staff, EInvitedLinkStatus} from "api/_types/staff";
import validator = require('validator');
import _ = require('lodash');
import { getSession } from '../../common/model/client';

var sequelize = require("common/model").DB;
var DBM = sequelize.models;
var uuid = require("node-uuid");
var L = require("common/language");
var C = require("config");
var QRCODE_LOGIN_URL = '/auth/qrcode-login';
var moment = require("moment");
var API = require("common/api");
var utils = require("common/utils");
var Logger = require("common/logger");
var logger = new Logger('auth');

let msgConfig = C.message;
var accountCols = Account['$fieldnames'];




var ACCOUNT_TYPE = {
    COMPANY_STAFF: 1,
    AGENT_STAFF: 2
}

/**
 * @class API.auth 认证类
 * @constructor
 */
class ApiAuth {

    static __public: boolean = true;

    /**
     * 验证验证码(通过手机重置密码第一步)
     * @param params
     * @returns {{accountId: null, sign: any, expireAt: number}}//为下一步重置密码生成验证凭证
     */
    @clientExport
    @requireParams(['mobile', 'msgCode','msgTicket'])
    static async validateMsgCheckCode(params:{mobile: string, msgCode: string, msgTicket: string}){
        var mobile = params.mobile;
        var msgCode = params.msgCode;
        var msgTicket = params.msgTicket;

        if (!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        var accounts = await Models.account.find({where: {mobile: mobile}});
        var account = Account.create();
        if(accounts && accounts.length > 0){
            account = accounts[0];
        }else{
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if (!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }

        var result =  await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        if(result){
            var checkcodeToken = utils.getRndStr(6);
            account.checkcodeToken = checkcodeToken;
            account.isValidateMobile = true;
            if(account.status == ACCOUNT_STATUS.NOT_ACTIVE){
                account.status = ACCOUNT_STATUS.ACTIVE;
            }
            await account.save();
            var expireAt = Date.now() +20 * 60 * 1000;//失效时间20分钟
            var sign = makeActiveSign(checkcodeToken, account.id, expireAt);
            return {accountId: account.id, sign: sign, expireAt: expireAt};
        }else{
            throw L.ERR.CODE_ERROR();
        }
    }

    /**
     * @method resetPwdByMobile
     *
     * 根据手机号重置密码（根据手机号重置密码第二步）
     *
     * @param {Object} params
     * @param {String} params.mobile 手机号
     * @param {String} params.newPwd 新密码
     * @return {Promise}
     */
    @clientExport
    static async resetPwdByMobile (params: {accountId: string, sign: string, timestamp: number, pwd: string}){
        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        var pwd = params.pwd;

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

        var account = await Models.account.get(accountId);
        var _sign = makeActiveSign(account.checkcodeToken, accountId, timestamp);
        if (_sign.toLowerCase() != sign.toLowerCase()) {
            throw L.ERR.SIGN_ERROR();
        }
        pwd = utils.md5(pwd);
        account.isValidateMobile = true;
        account.pwd = pwd;
        await account.save();
        return true;
    };


    /**
     * @method resetPwdByEmail（可用于通过邮箱重置密码）【待用】
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
    static async resetPwdByEmail (params: {accountId: string, sign: string, timestamp: number, pwd: string}) {

        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        var pwd = params.pwd;

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

        var account = await Models.account.get(accountId);

        var _sign = makeActiveSign(account.pwdToken, accountId, timestamp);
        if (_sign.toLowerCase() != sign.toLowerCase()) {
            throw L.ERR.SIGN_ERROR();
        }
        account.pwd = utils.md5(pwd);
        if(account.status == ACCOUNT_STATUS.NOT_ACTIVE){
            account.status = ACCOUNT_STATUS.ACTIVE;
        }
        account.isValidateEmail = true;
        account.pwdToken = null;
        await account.save();
        return true;
    }

    /**
     * 重新发送激活链接邮件
     * @param params
     * @returns {boolean}
     */
    @clientExport
    static async reSendActiveLink (params:{email:string, accountId?: string}):Promise<boolean> {
        var mobileOrEmail = params.email;
        var accountId = params.accountId;
        var account = Account.create();
        if(accountId){
            account = await Models.account.get(accountId);
        }else{
            var accounts = await Models.account.find({where : {$or : [{email: mobileOrEmail}, {mobile: mobileOrEmail}]}});
            if(accounts && accounts.length>0){
                account = accounts[0];
            }else{
                throw L.ERR.ACCOUNT_NOT_EXIST();
            }
        }

        //发送qm_first_set_pwd
        // var staff = await Models.staff.get(account.id);
        // await API.auth.sendResetPwdEmail({email: account.email, mobile: account.mobile, type: 1, isFirstSet: true, companyName: staff.company.name});
        //发送qm_active
        await _sendActiveEmail(account.id);
        return true;
    }

    /**
     * @method activeByEmail 通过邮箱链接激活账号
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
    static async activeByEmail (data: {sign: string, accountId: string, timestamp: number}) : Promise<any> {
        var sign = data.sign;
        var accountId = data.accountId;
        var timestamp = data.timestamp;
        var account = await Models.account.get(accountId);

        if(account.isValidateEmail){
            throw {code: -1, msg: "您的邮箱已激活"};
        }
        //失效了
        var nowTime = Date.now();
        if (timestamp<0 || nowTime - timestamp > 0) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }

        if(!account){
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var needSign = makeActiveSign(account.activeToken, accountId, timestamp)
        if (sign.toLowerCase() != needSign.toLowerCase()) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }

        if(account.status == ACCOUNT_STATUS.NOT_ACTIVE){
            account.status = ACCOUNT_STATUS.ACTIVE;
        }
        account.activeToken = null;
        account.isValidateEmail = true;
        account = await account.save()
        return account;
    }

    /**
     * 验证手机验证码激活账号
     * @param data
     * @returns {Account}
     */
    @clientExport
    @requireParams(['mobile','msgCode','msgTicket'])
    static async activeByMobile (data: {mobile: string, msgCode: string, msgTicket: number}) : Promise<any> {
        var mobile = data.mobile;
        var msgCode = data.msgCode;
        var msgTicket = data.msgTicket;

        if (!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if (!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        var accounts = await Models.account.find({where : {mobile: mobile}});
        var account = Account.create();
        if(accounts && accounts.length>0){
            account = accounts[0];
        }
        if(!account){
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var ckeckMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(ckeckMsgCode){
            if(account.status == ACCOUNT_STATUS.NOT_ACTIVE){
                account.status = ACCOUNT_STATUS.ACTIVE;
            }
            account.isValidateMobile = true;
            account = await account.save()
        }else{
            throw {code: -1, msg: "短信验证码错误"};
        }
        return account;
    }

    /**
     * 验证邀请链接
     * @param {Object} data
     * @param {String} data.sign 签名
     * @param {UUID} data.linkId 邀请链接ID
     * @param {String} data.timestamp 时间戳
     * @returns {{inviter: Staff, company: Company}}
     */
    @clientExport
    static async checkInvitedLink (data: {sign: string, linkId: string, timestamp: number}) : Promise<any> {
        var sign = data.sign;
        var linkId = data.linkId;
        var timestamp = data.timestamp;
        var nowTime = Date.now();

        //失效了
        if (timestamp<0 || nowTime - timestamp > 0) {
            throw L.ERR.INVITED_URL_INVALID();
        }

        var il = await Models.invitedLink.get(linkId);
        if(!il){
            throw L.ERR.INVITED_URL_INVALID();
        }
        if (il.status !== EInvitedLinkStatus.ACTIVE) {
            throw L.ERR.INVITED_URL_FORBIDDEN();
        }

        var needSign = makeLinkSign(il.linkToken, linkId, timestamp);
        if (sign.toLowerCase() != needSign.toLowerCase()) {
            throw L.ERR.INVITED_URL_INVALID();
        }
        var inviter = await Models.staff.get(il["staffId"]);
        var company = inviter.company;
        return {inviter: inviter, company: company};
    }

    /**
     * 被邀请人通过邀请链接注册员工信息
     * @param data
     * @returns {Company}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'companyId','msgCode','msgTicket', 'pwd'])
    static async invitedStaffRegister (data) : Promise<any> {
        var msgCode = data.msgCode;
        var msgTicket = data.msgTicket;
        var mobile = data.mobile;
        var name = data.name;
        var pwd = data.pwd;
        var companyId = data.companyId;

        if (!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if (!msgCode || !msgTicket) {
            throw {code: -1, msg: "短信验证码错误"};
        }
        var ckeckMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(ckeckMsgCode){
            var company = await Models.company.get(companyId);
            var staff = Staff.create({mobile: mobile, name: name, pwd: utils.md5(pwd), status: ACCOUNT_STATUS.ACTIVE, isValidateMobile: true})
            staff.company = company;
            staff = await staff.save();
        }else{
            throw {code: -1, msg: "短信验证码错误"};
        }
        return staff.company;
    }


    /**
     * 添加员工验证手机号和邮箱
     * @param data
     * @returns {boolean}
     */
    @clientExport
    static async checkEmailAndMobile (data: {email?: string, mobile?: string}) {
        if (data.email && !validator.isEmail(data.email)) {
            throw L.ERR.INVALID_FORMAT('email');
        }

        if (data.mobile && !validator.isMobilePhone(data.mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }


        var mobile = data.mobile;

        var staff = await Staff.getCurrent();

        var type = ACCOUNT_TYPE.COMPANY_STAFF;
        //查询邮箱是否已经注册
        if(data.email){
            var account1 = await Models.account.find({where: {email: data.email, type: type}, paranoid: false});
            if (account1 && account1.length>0) {
                throw L.ERR.EMAIL_HAS_REGISTRY();
            }
            /*if(staff){
                if(data.email && staff && staff.company["domainName"] && data.email.indexOf(staff.company["domainName"]) == -1){
                    throw L.ERR.EMAIL_SUFFIX_INVALID();
                }
            }else{
                let domain = data.email.match(/.*\@(.*)/)[1]; //企业域名

                let companies = await Models.company.find({where: {domain_name: domain}});

                if(companies && (companies.length > 0 || companies.total > 0)) {
                    throw L.ERR.DOMAIN_HAS_EXIST();
                }
            }*/
        }

        if(data.mobile){
            var account2 = await Models.account.find({where: {mobile: mobile, type: type}, paranoid: false});
            if (account2 && account2.length>0) {
                throw L.ERR.MOBILE_HAS_REGISTRY();
            }
        }

        return true;
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
     * 企业注册【待用】
     * @param params
     * @returns {Promise<TResult>|Promise<U>}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'email', 'userName','msgCode','msgTicket'], ['pwd','agencyId', 'remark', 'description'])
    static async registerCompany(params:{name: string, userName: string, email: string, mobile: string, pwd: string,
        msgCode: string, msgTicket: string, agencyId?: string}){
        var companyName = params.name;
        var name = params.userName;
        var email = params.email;
        var mobile = params.mobile;
        var msgCode = params.msgCode;
        var msgTicket = params.msgTicket;
        var pwd = params.pwd;

        if (!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if (!email || !validator.isEmail(email)) {
            throw L.ERR.EMAIL_FORMAT_INVALID();
        }

        if (!msgCode || !msgTicket) {
            throw {code: -1, msg: "短信验证码错误"};
        }

        if (!name) {
            throw {code: -1, msg: "联系人姓名为空"};
        }

        if (!companyName) {
            throw {code: -1, msg: "公司名称为空"};
        }

        if (!pwd) {
            throw {code: -1, msg: "密码为空"};
        }

        return Promise.resolve(true)
            .then(function(){
                return API.auth.checkEmailAndMobile({email: email, mobile: mobile});
            })
            .then(function() {
                return API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
            })
            .then(function() {
                return API.company.registerCompany({mobile:mobile, email: email,name: companyName,userName: name, pwd: pwd, status: 1});
            })
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
    static async sendResetPwdEmail (params: {email: string, mobile?: string, type?: Number, isFirstSet?: boolean, companyName?: string}) : Promise<boolean> {
        var email = params.email;
        var mobile = params.mobile;
        var isFirstSet = params.isFirstSet;
        var type = params.type || 1;
        var companyName = params.companyName || '';

        if (!email) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if (!mobile) {
            throw L.ERR.MOBILE_EMPTY();
        }
        var acc = await DBM.Account.findOne({where: {email: email, type: type}});
        if (!acc) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        //生成设置密码token
        var pwdToken = utils.getRndStr(6);
        var [affect, rows] = await DBM.Account.update({pwdToken: pwdToken}, {where: {id: acc.id}, returning: true});
        var account = rows[0];

        var staff = await Models.staff.get(account.id);
        account = account.toJSON();

        var timeStr = utils.now();
        var oneDay = 24 * 60 * 60 * 1000
        var timestamp = Date.now() + 2 * oneDay;  //失效时间2天
        var sign = makeActiveSign(account.pwdToken, account.id, timestamp);
        var url = "accountId="+account.id+"&timestamp="+timestamp+"&sign="+sign+"&email="+account.email;
        var templateName;

        var vals: any = {
            name: staff.name || account.mobile,
            username: account.email,
            time: timeStr,
            companyName: companyName
        };
        let _mobile;    //如果_mobile存在,将发短信通知
        let key;
        if (isFirstSet) {
            //发邮件
            vals.url = C.host + "/index.html#/login/first-set-pwd?" + url;
            key = 'qm_first_set_pwd';
            _mobile = account.mobile;
            vals.url = await API.wechat.shorturl({longurl: vals.url});
        } else {
            vals.url = C.host + "/index.html#/login/reset-pwd?" + url;
            key = 'qm_reset_pwd_email';
        }
        return API.notify.submitNotify({
            key: key,
            values: vals,
            email: account.email,
            mobile: _mobile,
        });
    }

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


    @clientExport
    static getAccountStatus(params:{}):Promise<any> {
        let args:any = {attributes: ["status"]};
        return Models.account.find(args);
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
    @clientExport
    @requireParams(["email"], accountCols)
static async newAccount (data: {email: string, mobile?: string, pwd?: string, type?: Number, status?: Number, companyName?: string, id?: string}) {
    if (!data) {
        throw L.ERR.DATA_NOT_EXIST();
    }

    if (!data.email) {
        throw L.ERR.EMAIL_EMPTY();
    }

    if (!validator.isEmail(data.email)) {
        throw L.ERR.INVALID_FORMAT('email');
    }

    if (data.mobile && !validator.isMobilePhone(data.mobile, 'zh-CN')) {
        throw L.ERR.MOBILE_NOT_CORRECT();
    }

    if (data.pwd) {
        var pwd = data.pwd;
        var password = data.pwd.toString();
        pwd = utils.md5(password);
        //throw L.ERR.PASSWORD_EMPTY();
    }


    var mobile = data.mobile;
    var companyName = data.companyName || '';

    var staff = await Staff.getCurrent();
    if(data.email && staff && staff.company["domainName"] && data.email.indexOf(staff.company["domainName"]) == -1){
        throw L.ERR.INVALID_ARGUMENT('email');
    }

    var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;
    //查询邮箱是否已经注册
    var account1 = await Models.account.find({where: {email: data.email, type: type}});
    if (account1 && account1.length>0) {
        throw L.ERR.EMAIL_HAS_REGISTRY();
    }

    if(data.mobile){
        var account2 = await Models.account.find({where: {mobile: mobile, type: type}});
        if (account2 && account2.length>0) {
            throw L.ERR.MOBILE_HAS_REGISTRY();
        }
    }

    var status = data.status? data.status: ACCOUNT_STATUS.NOT_ACTIVE;
    var id = data.id?data.id:uuid.v1();
    var accountObj = Account.create({id: id, mobile:mobile, email: data.email, pwd: pwd, status: status, type: type});
    var account = await accountObj.save();

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
}




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
    @clientExport
    static login (data: {account?: string, pwd: string, type?: Number, email?: string}) :Promise<AuthCert>{

        if (!data) {
            throw L.ERR.DATA_NOT_EXIST();
        }
        //兼容原有调用方式
        if (!data.account && data.email) {
            data.account = data.email;
        }

        if (!data.account) {
            throw new Error(`登录账号不能为空`);
        }

        if (!validator.isEmail(data.account) && !validator.isMobilePhone(data.account, 'zh-CN')) {
            throw new Error(`登录账号格式不正确`);
        }

        if (!data.pwd) {
            throw L.ERR.PWD_EMPTY();
        }

        var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;
        var account = data.account.toLowerCase();
        return DBM.Account.findOne({where: {$or : [{email: account}, {mobile: account}], type: type}})
            .then(function (loginAccount) {
                var pwd = utils.md5(data.pwd);
                //第一步验证账号是否存在
                if (!loginAccount) {
                    throw L.ERR.ACCOUNT_NOT_EXIST()
                }
                //第二步验证密码是否正确
                if (loginAccount.pwd && loginAccount.pwd != pwd) {
                    throw L.ERR.PASSWORD_NOT_MATCH()
                }
                //第三步查看是邮箱登录或手机号登录 查看有限干活手机号是否已验证
                if (loginAccount.mobile == account && !loginAccount.isValidateMobile) {
                    throw L.ERR.NO_VALIDATE_MOBILE();
                }
                if (loginAccount.email == account && !loginAccount.isValidateEmail) {
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
                if (loginAccount.status == ACCOUNT_STATUS.FORBIDDEN) {
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


    /**
     * 成为伙伴申请
     * @param params
     */
    @clientExport
    @requireParams(['type', 'companyName','userName','mobile', 'email', 'qq'])
    static async sendPartnerEmail(params){
        if(!msgConfig.is_send_email) {
            return;
        }
        var email = "peng.wang@jingli.tech";
        var vals = {
            type: params.type,
            companyName: params.companyName,
            userName: params.userName,
            mobile: params.mobile,
            email: params.email,
            qq: params.qq
        }
        return API.notify.submitNotify({
            key: 'qm_www_tobe_partner',
            values: vals,
            email: email,
        })
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
     * 创建Account
     * @param params
     * @returns {Promise<Account>}
     */
    @clientExport
    static async createAccount (params) : Promise<Account>{
        var acc = Account.create(params);
        return acc;
    }

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getAccount (params) {
        var id = params.id;
        var options: any = {};
        options.attributes = ["id", "email", "mobile", "status", "forbiddenExpireAt","loginFailTimes","lastLoginAt","lastLoginIp","activeToken","pwdToken","oldQrcodeToken","qrcodeToken","type","isFirstLogin"];
        var acc = await Models.account.get(id, options);
        return acc;
    }

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    @clientExport
    static async getAccounts (params: {where: any, order?: any, attributes?: any, $or?: any, paranoid?: boolean}) {
        if (!params.where) {
            params.where = {};
        }
        var options: any = {
            where:  params.where
        };
        if(params.attributes){
            options.attributes = params.attributes;
        }else{
            options.attributes = ["id", "email", "mobile", "status", "forbiddenExpireAt","loginFailTimes","lastLoginAt","lastLoginIp","activeToken","pwdToken","oldQrcodeToken","qrcodeToken","type","isFirstLogin"];
        }
        if(params.order){
            options.order = params.order || "createdAt desc";
        }
        if(params.$or) {
            options.where.$or = params.$or;
        }

        options.paranoid = params.paranoid;
        let paginate = await Models.account.find(options);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /**
     * 修改账户信息
     * @param id
     * @param data
     * @param companyName
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], accountCols)
    static async updateAccount(params){
        var id = params.id;
        var old_email;
        var accobj = await Models.account.get(id);
        var staff = await Staff.getCurrent();
        if(params.email && staff && staff.company["domainName"] && params.email.indexOf(staff.company["domainName"]) == -1){
            throw L.ERR.INVALID_ARGUMENT('email');
        }

        if(params.email && accobj["status"] != 0 && accobj.email != params.email){
            // throw {code: -2, msg: "该账号不允许修改邮箱"};
            throw L.ERR.NOTALLOWED_MODIFY_EMAIL();
        }


        for(var key in params){
            accobj[key] = params[key];
        }
        var newAcc = await accobj.save();
        return newAcc;

        /*if(accobj.email == newAcc.email){
            return newAcc;
        }

        var staff = await Models.staff.get(id);
        var companyName = (staff && staff.company) ? staff.company.name : "";
        return ApiAuth.sendResetPwdEmail({companyName: companyName, email: newAcc.email, type: 1, isFirstSet: true})
            .then(function() {
                return newAcc;
            });*/
    }

    /**
     * 删除Account
     * @param params
     * @returns {boolean}
     */
    @clientExport
    // @requireParams(["id"])
    static async deleteAccount(params): Promise<any> {
        /*let deleteAcc = await Models.account.get(params.id);
        await deleteAcc.destroy();*/
        return true;
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
    @clientExport
    static logout (params: {}) : Promise<boolean> {
        let session = Zone.current.get("session");
        var accountId = session["accountId"];
        var tokenId = session["tokenId"];
        if (accountId && tokenId) {
            return Models.token.get(tokenId)
                .then(function(token) {
                    if (token) return token.destroy()
                    return true;
                })
                .then(function() {
                    return true;
                })
            // Models.token.destroy()
            // return DBM.Token.destroy({where: {accountId: accountId, id: tokenId}})
            //     .then(function() {
            //         return true;
            //     })
        }
        return Promise.resolve(true);
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
    static async getQRCodeUrl (params: {backUrl: string}) : Promise<string> {

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

                return API.wechat.shorturl({longurl: backUrl})
            })
            .then(function(shortUrl) {
                backUrl = encodeURIComponent(shortUrl);
                return Models.account.get(accountId)
            })
            .then(function(account) {
                if (!account) {
                    throw L.ERR.ACCOUNT_NOT_EXIST();
                }

                var qrcodeToken = utils.getRndStr(8);
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
                console.info(C.host + QRCODE_LOGIN_URL +"?"+urlParams);
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
    @clientExport
    static async saveOrUpdateOpenId() {
        var session = getSession();
        let openid = session.wxopenid; //获取微信openId;
        if(!openid)
            return;
        let staff = await Staff.getCurrent();
        let list = await Models.accountOpenid.find({where: {openId: openid}});

        if(list && list.length > 0) {
            await Promise.all(list.map((op) => op.destroy()));
        }

        let obj = AccountOpenid.create({openId: openid, accountId: staff.id});
        return obj.save();
    }

    /**
     * 获取数据库中openId关联的accountId
     * @type {getAccountIdByOpenId}
     */
    @requireParams(["openId"])
    static async getAccountIdByOpenId(params: {openId: string}): Promise<string> {
        let list = await Models.accountOpenid.find({where: {openId: params.openId}});

        if(!list || list.length <= 0) {
            return null;
        }

        let obj = list[0];
        return obj.accountId;
    }

    /**
     * 获取数据库中accountId关联的openId
     * @type {getOpenIdByAccount}
     */
    @requireParams(["openId"])
    static async getOpenIdByAccount(params: {accountId: string}): Promise<string> {
        let list = await Models.accountOpenid.find({where: {accountId: params.accountId}});

        if(!list || list.length <= 0) {
            return null;
        }

        let obj = list[0];
        return obj.openId;
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


    @clientExport
    static async authWeChatLogin(params: {code: string}):
    Promise<{token_id: string, user_id: string, timestamp: string, token_sign: string} | boolean> {
        let openid = await API.wechat.requestOpenIdByCode({code: params.code}); //获取微信openId;
        var session = getSession();
        session.wxopenid = openid;
        let accountId = await ApiAuth.getAccountIdByOpenId({openId: openid});

        if(!accountId) {
            return false;
        }

        return makeAuthenticateSign(accountId, 'weChat');
    }
    
    @clientExport
    static async getWeChatLoginUrl(params: {redirectUrl: string}) {
        let redirectUrl = encodeURIComponent(params.redirectUrl);
        let backUrl = C.host + "/auth/get-wx-code?redirect_url=" + redirectUrl;
        // backUrl = "http://t.jingli365.com/auth/wx-login?redirect_url=" + redirectUrl; //微信公众号测使用
        // backUrl = "http://t.jingli365.com/auth/get-wx-code?redirect_url=" + redirectUrl; //微信公众号测使用
        return API.wechat.getOAuthUrl({backUrl: backUrl});
    }

    @clientExport
    static async destroyWechatOpenId(params: {}): Promise<boolean> {
        let staff = await Staff.getCurrent();
        let openIds = await Models.accountOpenid.find({where: {accountId: staff.id}});
        
        if(!openIds || openIds.length <= 0) {
            return false;
        }
        
        await Promise.all(openIds.map((openId) => openId.destroy()));
        return true;
    }

    static __initHttpApp (app: any) {

        //二维码自动登录
        app.all("/auth/qrcode-login", function(req, res, next) {
            var storageSetUrl = C.host + "/index.html#/login/storageSet";
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
                    res.redirect(storageSetUrl+"?token_id="+result.token_id+"&user_id="+result.user_id+"&timestamp="+result.timestamp+"&token_sign="+result.token_sign+"&back_url="+backUrl);
                })
                .catch(function(err) {
                    console.info(err);
                    res.send("链接已经失效或者不存在");
                })
        });

        //微信自动登录
        app.all("/auth/wx-login", async function(req, res, next) {
            let query = req.query;
            let redirect_url = query.redirect_url;
            redirect_url += redirect_url.indexOf('?') > 0 ? '&' : '?';
            redirect_url += 'wxauthcode=' + query.code + '&wxauthstate=' + query.state;
            res.redirect(redirect_url);
        });

        //获取微信code
        app.all("/auth/get-wx-code", async function(req, res, next) {
            let query = req.query;
            let redirect_url = query.redirect_url;

            //如果是登陆页，直接跳转
            if(/^http\:\/\/\w*\.jingli365\.com\/(index\.html)?\#\/login\/(index)?/.test(redirect_url)){
                redirect_url += redirect_url.indexOf('?') > 0 ? '&' : '?';
                redirect_url += 'wxauthcode=' + query.code + '&wxauthstate=' + query.state;
                res.redirect(redirect_url);
            }else {
                redirect_url = encodeURIComponent(redirect_url);

                let tokenSign = await API.auth.authWeChatLogin({code: query.code});
                let url = `${C.host}/index.html#/login/storageSet`;
                if(!tokenSign) {
                    url = `${C.host}/#/login/?backurl=${redirect_url}&wxauthcode=${query.code}&wxauthstate=${query.state}`;
                    // url = `http://t.jingli365.com/#/login/?backurl=${redirect_url}&wxauthcode=${query.code}&wxauthstate=${query.state}`;
                }else {
                    // url = "http://t.jingli365.com/index.html#/login/storageSet";
                    url += "?token_id=" + tokenSign.token_id + "&user_id=" + tokenSign.user_id + "&timestamp=" + tokenSign.timestamp
                        + "&token_sign=" + tokenSign.token_sign + "&back_url=" + redirect_url;
                }

                res.redirect(url);
            }
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
        return utils.md5(obj);
    }

    var strs = combineData(obj);
    return utils.md5(strs);
}


function getTokenSign(accountId, tokenId, token, timestamp) {
    var originStr = accountId+tokenId+token+timestamp;
    return utils.md5(originStr);
}

//生成激活链接参数
function makeActiveSign(activeToken, accountId, timestamp) {
    var originStr = activeToken + accountId + timestamp;
    return utils.md5(originStr);
}

//生成邀请链接参数
function makeLinkSign(linkToken, invitedLinkId, timestamp) {
    var originStr = linkToken + invitedLinkId + timestamp;
    return utils.md5(originStr);
}

async function _sendActiveEmail(accountId) {
    return Models.account.get(accountId)
        .then(async function(account) {
            //生成激活码
            var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
            var activeToken = utils.getRndStr(6);
            var sign = makeActiveSign(activeToken, account.id, expireAt);
            var url = C.host + "/index.html#/login/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt+"&email="+account.email;
            url = await API.wechat.shorturl({longurl: url});
            //发送激活邮件
            var vals = {
                name: account.email,
                username: account.email,
                url: url
            };
            return API.notify.submitNotify({
                key: 'qm_active',
                values: vals,
                email: account.email,
            })
            .then(function(ret) {
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
                m = DBM.Token.build({id: uuid.v1(), accountId: accountId, token: utils.getRndStr(10), refreshAt: refreshAt, expireAt: expireAt});
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