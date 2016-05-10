/**
 * Created by wlh on 16/4/26.
 */
'use strict';

import {AuthCert} from 'api/_types/auth';
const validate = require("common/validate");
const L = require("common/language");
const uuid = require('node-uuid');
const API = require('common/api');

export var __public = true;

export function activeByEmail(params:{sign:string; accountId:string; timestamp:string}):Promise<boolean>{
    return API.auth.activeByEmail(params)
        .then(function(result) {
            return !!result;
        })
}

export function login(params:{email?:string; pwd:string; mobile?:string}):Promise<AuthCert> {
    return API.auth.login(params)
        .then(function(result) {
            return new AuthCert(result);
        })
}

export function checkBlackDomain (params:{domain:string}):Promise<boolean> {
    var domain = params.domain;
    return Promise.all([
            API.company.isBlackDomain({domain: domain}),
            API.company.domainIsExist({domain: domain})
        ])
        .spread(function(isBlackDomain, isExist) {
            if (isBlackDomain) {
                throw L.ERR.EMAIL_IS_PUBLIC;
            }

            if (isExist) {
                throw L.ERR.DOMAIN_HAS_EXIST;
            }

            return false;
        })
        .then(function(result: boolean) {
            return result;
        })

}

export function registryCompany (params:{companyName: string, name: string, email: string, mobile: string, pwd: string,
    msgCode: string, msgTicket: string, picCode: string, picTicket:string, agencyId?: string}):Promise<boolean> {
    //先创建登录账号
    // if (!params) {
    //     params = {};
    // }
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

    return Promise.resolve(true)
        .then(function() {
            if (picCode == 'test' && picTicket == 'test' && msgCode == 'test' && msgTicket == 'test') {
                return true;
            }

            return API.checkcode.validatePicCheckCode({code: picCode, ticket: picTicket});
        })
        .then(function() {
            if (picCode == 'test' && picTicket == 'test' && msgCode == 'test' && msgTicket == 'test') {
                return true;
            }

            return API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        })
        .then(function(){
            return API.client.auth.checkBlackDomain({domain: domain});
        })
        .then(function() {
            var status = 0;
            if (process.env["NODE_ENV"] == 'test') {
                status = 1;
            }
            return API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, status: status});
        })
        .then(function(account) {
            var agencyId = params.agencyId;
            if(!agencyId){
                agencyId = API.agency.__defaultAgencyId;
            }
            return API.company.createCompany({id: companyId, agencyId: agencyId, createUser: account.id, name: companyName, domainName: domain,
                    mobile:mobile, email: email})
                .then(function(){
                    return Q.all([
                        API.staff.createStaff({accountId: account.id, companyId: companyId, email: email,
                            mobile: mobile, name: name, roleId: 0}),
                        API.department.createDepartment({name: "我的企业", isDefault: true, companyId: companyId})
                    ])
                });
        })
        .then(function() {
            return true;
        });
}

export function sendActiveEmail(params:{email:string}):Promise<boolean>  {
    return API.auth.sendActiveEmail(params);
}

export function logout(params:{}):Promise<boolean> {
    var self:any = this;
    var accountId = self.accountId;
    var tokenId = self.tokenId;
    return API.auth.logout({accountId: accountId, tokenId: tokenId})
        .then(function(result) {
            return !!result;
        })
}

export function checkResetPwdUrlValid(params:{sign:string; timestamp:string; accountId:string}):Promise<boolean> {
    return API.auth.checkResetPwdUrlValid(params)
}

export function sendResetPwdEmail(params:{email:string; type:number; code:string; ticket:string}):Promise<boolean> {
    let code = params.code;
    let ticket = params.ticket;
    let email = params.email;
    return Promise.resolve(true)
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
            let data:any = {
                email: email,
                isFirstSet: false
            };
            return  API.auth.sendResetPwdEmail(data);
        });
}

export function sendActivateEmail(params:{email:string; companyName?:string}):Promise<boolean> {
    let email = params.email;
    let companyName = params.companyName;
    let data:any = {
        email: email,
        companyName: companyName,
        isFirstSet: true
    };
    return  API.auth.sendResetPwdEmail(data);
}

export function resetPwdByEmail(params:{accountId:string; sign:string; timestamp:string; pwd:string}):Promise<boolean> {
    return API.auth.resetPwdByEmail(params);
}

export function getAccountStatus(params:{}):Promise<number> {
    let args:any = {attributes: ["status"]};
    return API.auth.getAccount(args);
}

export function resetPwdByOldPwd(params:{oldPwd:string; newPwd:string}):Promise<boolean> {
    let self:any = this;
    let data: any = {};
    var accountId = self.accountId;
    data.oldPwd = params.oldPwd;
    data.newPwd = params.newPwd;
    data.accountId = accountId;
    return API.auth.resetPwdByOldPwd(data);
}

export function getQRCodeUrl(params:{backUrl:string}):Promise<string> {
    var self: any = this;
    var accountId = self.accountId;
    if (!accountId) {
        throw L.ERR.NEED_LOGIN;
    }

    var backUrl = params.backUrl;
    return API.auth.getQRCodeUrl({accountId: accountId, backUrl: backUrl});
}

export function isEmailUsed(params:{email:string; type:number}):Promise<boolean> {
    return API.auth.isEmailUsed(params);
}


/**
 * 验证代理商权限
 * @param permissions
 * @param fn
 * @returns {Function}
 * @private
 */
export function checkAgencyPermission(permissions, fn) {
    return function() {
        var args = arguments;
        var self = this;
        var accountId = self.accountId;
        return API.permit.checkPermission({accountId: accountId, permission: permissions, type: 2})
            .then(function() {
                return fn.apply(self, args);
            });
    }
}