﻿/**
 * @module auth
 */
"use strict";
import { requireParams, clientExport } from "@jingli/dnode-api/dist/src/helper";
import { Models, EAccountType, EGender, EPlaneLevel, ETrainLevel, EHotelLevel } from "_types";
import { Account, ACCOUNT_STATUS } from "_types/auth";
import { Staff, EInvitedLinkStatus, EAddWay, EStaffRole } from "_types/staff";
import validator = require('validator');
import L from '@jingli/language';
import cache from "common/cache";
import * as authentication from './authentication';
import * as wechat from './wechat';
import * as messagePush from './messagePush';
import * as qrcode from './qrcode';
import * as byTest from './by-test';

var uuid = require("node-uuid");
const C = require("@jingli/config");
var moment = require("moment");
var API = require("@jingli/dnode-api");
var utils = require("common/utils");
var accountCols = Account['$fieldnames'];
import { getSession } from "@jingli/dnode-api";
import { Application } from 'express-serve-static-core';
import { ICompanyRegion } from '_types/travelPolicy';
const _ = require('lodash/fp')

let codeTicket = "checkcode:ticket:";

//生成激活链接参数
function makeActiveSign(activeToken: string, accountId: string, timestamp: number) {
    var originStr = activeToken + accountId + timestamp;
    return utils.md5(originStr);
}

//生成邀请链接参数
function makeLinkSign(linkToken: string, invitedLinkId: string, timestamp: number) {
    var originStr = linkToken + invitedLinkId + timestamp;
    return utils.md5(originStr);
}



/**
 * @class API.auth 认证类
 * @constructor
 */
export default class ApiAuth {

    static __public: boolean = true;

    /**
     * 验证验证码(通过手机重置密码第一步)
     * @param params
     * @returns {{accountId: null, sign: any, expireAt: number}}//为下一步重置密码生成验证凭证
     */
    @clientExport
    @requireParams(['mobile', 'msgCode', 'msgTicket'])
    static async validateMsgCheckCode(params: {mobile: string, msgCode: string, msgTicket: string}) {
        var mobile = params.mobile;
        var msgCode = params.msgCode;
        var msgTicket = params.msgTicket;

        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        var accounts = await Models.account.find({where: {mobile: mobile}});
        var account: Account;
        if(accounts && accounts.length > 0) {
            account = accounts[0];
        } else {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }

        var result = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        if(result) {
            var checkcodeToken = utils.getRndStr(6);
            account.checkcodeToken = checkcodeToken;
            account.isValidateMobile = true;
            if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                account.status = ACCOUNT_STATUS.ACTIVE;
            }
            await account.save();
            var expireAt = Date.now() + 20 * 60 * 1000;//失效时间20分钟
            var sign = makeActiveSign(checkcodeToken, account.id, expireAt);
            return {accountId: account.id, sign: sign, expireAt: expireAt};
        } else {
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
    static async resetPwdByMobile(params: {accountId: string, sign: string, timestamp: number, pwd: string}) {
        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        var pwd = params.pwd;

        if(!Boolean(timestamp) || timestamp < Date.now()) {
            throw L.ERR.TIMESTAMP_TIMEOUT();
        }

        if(!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if(!sign) {
            throw L.ERR.SIGN_ERROR();
        }

        if(!pwd) {
            throw L.ERR.PWD_EMPTY();
        }

        var account = await Models.account.get(accountId);
        var _sign = makeActiveSign(account.checkcodeToken, accountId, timestamp);
        if(_sign.toLowerCase() != sign.toLowerCase()) {
            throw L.ERR.SIGN_ERROR();
        }
        pwd = utils.md5(pwd);
        account.isValidateMobile = true;
        account.isNeedChangePwd = false;
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
    static async resetPwdByEmail(params: {accountId: string, sign: string, timestamp: number, pwd: string}) {

        var accountId = params.accountId;
        var sign = params.sign;
        var timestamp = params.timestamp;
        var pwd = params.pwd;

        if(!Boolean(timestamp) || timestamp < Date.now()) {
            throw L.ERR.TIMESTAMP_TIMEOUT();
        }

        if(!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if(!sign) {
            throw L.ERR.SIGN_ERROR();
        }

        if(!pwd) {
            throw L.ERR.PWD_EMPTY();
        }

        var account = await Models.account.get(accountId);

        var _sign = makeActiveSign(account.pwdToken, accountId, timestamp);
        if(_sign.toLowerCase() != sign.toLowerCase()) {
            throw L.ERR.SIGN_ERROR();
        }
        account.pwd = utils.md5(pwd);
        if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
            account.status = ACCOUNT_STATUS.ACTIVE;
        }
        account.isValidateEmail = true;
        account.pwdToken = '';
        await account.save();
        return true;
    }

    /**
     * 重新发送激活链接邮件
     * @param params
     * @returns {boolean}
     */
    @clientExport
    static async reSendActiveLink(params: {email: string, accountId?: string, origin?: string, version?: number}): Promise<boolean> {
        var mobileOrEmail = params.email;
        var accountId = params.accountId;
        var account: Account;
        let staff: Staff|null = null;
        if(accountId) {
            staff = await Models.staff.get(accountId);
            account = await Models.account.get(staff.accountId, {notParent: true});
        } else {
            var accounts = await Models.account.find({where: {$or: [{email: mobileOrEmail}, {mobile: mobileOrEmail}]}});
            if(accounts && accounts.length > 0) {
                account = accounts[0];
            } else {
                throw L.ERR.ACCOUNT_NOT_EXIST();
            }
        }

        //发送qm_first_set_pwd
        // var staff = await Models.staff.get(account.id);
        // await API.auth.sendResetPwdEmail({email: account.email, mobile: account.mobile, type: 1, isFirstSet: true, companyName: staff.company.name});
        //发送qm_active
        let account_id = account.id;
        if(staff && staff.id){
            account_id = staff.id;
        }
        await _sendActiveEmail(account_id, params.origin, params.version);
        return true;
    }

    /**
     * 重新发送激活短信qm_new_staff_active
     * @param params
     * @returns {boolean}
     */
    @clientExport
    static async reSendActiveSms(params: {accountId: string}): Promise<boolean> {
        let accountId = params.accountId;
        let account = await ApiAuth.getPrivateInfo({id: accountId});
        let currentStaff = await Staff.getCurrent();

        if (!account) {
            throw L.ERR.USER_NOT_EXIST();
        }
        if (!account.mobile) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }


        //发送短信通知
        let values  = {
            name: account.mobile,
            pwd:account.mobile.substr(account.mobile.length-6),
            url: C.host,
            company: currentStaff? currentStaff.company: null
        }

        await API.notify.submitNotify({
            key: 'qm_new_staff_active',
            values: values,
            mobile: account.mobile
        });
        return true;
    }

    /**
     * 发送短信qm_staff_join_other_company
     * @param params
     * @returns {boolean}
     */
    @clientExport
    static async reSendJoinedSms(params: {accountId: string, inviterStaffId: string, targetStaffName: string}): Promise<boolean> {
        let accountId = params.accountId;
        let account = await ApiAuth.getPrivateInfo({id: accountId});

        if (!account.mobile) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if(!params.inviterStaffId || !params.targetStaffName){
            throw L.ERR.INVALID_ARGUMENT();
        }

        let inviterStaff = await Models.staff.get(params.inviterStaffId);
        //发送短信通知
        let values  = {
            staffName: params.targetStaffName,
            companyName:inviterStaff.company.name,
            inviterName: inviterStaff.name
        }

        await API.notify.submitNotify({
            key: 'qm_staff_join_other_company',
            values: values,
            mobile: account.mobile,
        });
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
    static async activeByEmail(data: {sign: string, accountId: string, timestamp: number}): Promise<any> {
        var sign = data.sign;
        var accountId = data.accountId;
        var timestamp = data.timestamp;
        var account = await Models.account.get(accountId);

        if(account.isValidateEmail) {
            throw {code: -1, msg: "您的邮箱已激活"};
        }
        //失效了
        var nowTime = Date.now();
        if(timestamp < 0 || nowTime - timestamp > 0) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }

        if(!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var needSign = makeActiveSign(account.activeToken, accountId, timestamp);
        if (!sign) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }
        if(sign.toLowerCase() != needSign.toLowerCase()) {
            throw L.ERR.ACTIVE_URL_INVALID();
        }

        if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
            account.status = ACCOUNT_STATUS.ACTIVE;
        }
        account.activeToken = '';
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
    @requireParams(['mobile', 'msgCode', 'msgTicket'])
    static async activeByMobile(data: {mobile: string, msgCode: string, msgTicket: number}): Promise<any> {
        var mobile = data.mobile;
        var msgCode = data.msgCode;
        var msgTicket = data.msgTicket;

        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        var accounts = await Models.account.find({where: {mobile: mobile}});
        var account: Account|undefined;
        if(accounts && accounts.length > 0) {
            account = accounts[0];
        }
        if(!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var checkMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(checkMsgCode) {
            if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                account.status = ACCOUNT_STATUS.ACTIVE;
            }
            account.isValidateMobile = true;
            account = await account.save()
        } else {
            throw L.ERR.CODE_ERROR();
        }
        return account;
    }

    /**
     * （手动添加和批量导入员工）通过首次登陆修改密码激活账号
     * @param data
     * @returns {Account}
     */
    @clientExport
    @requireParams(['pwd', 'msgCode', 'msgTicket', 'accountId'])
    static async activeByModifyPwd(data: {pwd: string, msgCode: string, msgTicket: number, accountId: string}): Promise<boolean> {
        let account = await Models.staff.get(data.accountId);
        let pwd = data.pwd;
        let msgCode = data.msgCode;
        let msgTicket = data.msgTicket;

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        if(!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var checkMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: account.mobile});

        if(checkMsgCode) {
            account.pwd = utils.md5(pwd);
            if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                account.status = ACCOUNT_STATUS.ACTIVE;
            }
            account.isValidateMobile = true;
            account.isNeedChangePwd = false;
            account = await account.save()
        } else {
            throw L.ERR.CODE_ERROR();
        }
        return true;
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
    static async checkInvitedLink(data: {sign: string, linkId: string, timestamp: number}): Promise<any> {
        var sign = data.sign;
        var linkId = data.linkId;
        var timestamp = data.timestamp;
        var nowTime = Date.now();

        //失效了
        if(timestamp < 0 || nowTime - timestamp > 0) {
            throw L.ERR.INVITED_URL_INVALID();
        }

        var il = await Models.invitedLink.get(linkId);
        if(!il) {
            throw L.ERR.INVITED_URL_INVALID();
        }
        if(il.status !== EInvitedLinkStatus.ACTIVE) {
            throw L.ERR.INVITED_URL_FORBIDDEN();
        }

        var needSign = makeLinkSign(il.linkToken, linkId, timestamp);
        if(sign.toLowerCase() != needSign.toLowerCase()) {
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
    @requireParams(['mobile', 'name', 'companyId', 'msgCode', 'msgTicket', 'pwd'], ['avatarColor'])
    static async invitedStaffRegister(data: {
        msgCode: string, msgTicket: string,
        mobile: string, name: string, pwd: string, 
        companyId: string, avatarColor?: string
    }): Promise<any> {
        var msgCode = data.msgCode;
        var msgTicket = data.msgTicket;
        var mobile = data.mobile;
        var name = data.name;
        var pwd = data.pwd;
        var companyId = data.companyId;
        var avatarColor = data.avatarColor;

        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        var ckeckMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(ckeckMsgCode) {
            /*var company = await Models.company.get(companyId);
             var defaultDeptment = await company.getDefaultDepartment();
             var defaultTravelPolicy = await company.getDefaultTravelPolicy();
             var staff = Staff.create({
             mobile: mobile,
             name: name,
             pwd: utils.md5(pwd),
             status: ACCOUNT_STATUS.ACTIVE,
             isValidateMobile: true
             })
             staff.company = company;
             if(defaultDeptment) {
             staff.department = defaultDeptment;
             }
             staff["travelPolicyId"] = defaultTravelPolicy ? defaultTravelPolicy.id : null;
             staff = await staff.save();*/

            var staff = await API.staff.registerStaff({
                mobile: mobile,
                name: name,
                companyId: companyId,
                pwd: utils.md5(pwd),
                status: ACCOUNT_STATUS.ACTIVE,
                isValidateMobile: true,
                avatarColor: avatarColor,
                addWay: EAddWay.INVITED
            });

        } else {
            throw L.ERR.CODE_ERROR();
        }
        return staff.company;
    }



    /**
     * 被邀请人通过邀请链接注册员工信息
     * @param data
     * @returns {Company}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'companyId', 'msgTicket', 'pwd'], ['avatarColor', 'sex'])
    static async invitedNewStaffRegister(data: {
        sex: EGender, msgTicket: string,
        mobile: string, name: string, pwd: string, 
        companyId: string, avatarColor?: string
    }): Promise<any> {
        let msgTicket = data.msgTicket;
        let mobile = data.mobile;
        let name = data.name;
        let pwd = data.pwd;
        let companyId = data.companyId;
        let sex = data.sex;
        console.log(mobile);
        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }
        let key = codeTicket + msgTicket;
        let redis_mobile = await cache.read(key);

        if(redis_mobile != mobile){
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        let staff: Staff = await API.staff.registerStaff({
            mobile: mobile,
            name: name,
            sex: sex,
            companyId: companyId,
            pwd: utils.md5(pwd),
            status: ACCOUNT_STATUS.ACTIVE,
            isValidateMobile: true,
            avatarColor: data.avatarColor,
            addWay: EAddWay.INVITED
        });
        return staff.company;
    }

    /**
     * 被邀请人通过邀请链接验证手机号
     *
     */
    @clientExport
    @requireParams(['mobile', 'msgCode', 'msgTicket'])
    static async inviteStaffone( params: {
        mobile: string, msgCode: string, msgTicket: string
    }) : Promise<any>{
        let mobile = params.mobile && params.mobile.toString(),
            msgCode= params.msgCode && params.msgCode.toString(),
            msgTicket=params.msgTicket;

        if(mobile && !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }
        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        let checkMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        if(!checkMsgCode){
            throw L.ERR.CODE_ERROR();
        }

        let Result: {[key: string]: any} = {
            isRegister : false,
            ticket     : null,
            staff      : null,
            mobile     : null
        };

        let accounts = await Models.account.find({where: {mobile: mobile}});
        if(accounts && accounts.total > 0){
            //已经注册
            let account = accounts[0];
            Result.isRegister = true;
            Result.mobile = mobile;
            let staffs = await Models.staff.find({where: {accountId : account.id}});
            Result.staff = staffs[0].toJSON();
        }else{
            Result.mobile = mobile;
        }

        Result.ticket = msgTicket;
        let key = codeTicket + msgTicket;

        //save ticket
        await cache.write(key, mobile, 10 * 60);
        return Result;
    }

    /**
     * 被邀请人加入其它企业
     */
    @clientExport
    @requireParams(["msgTicket", "mobile", "companyId"])
    static async joinAnCompany( params: {mobile: string, msgTicket: string, companyId: string} ) : Promise<any>{
        let mobile = params.mobile,
            msgTicket=params.msgTicket,
            companyId=params.companyId;

        if(mobile && !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }
        if(!msgTicket) {
            throw L.ERR.SIGN_ERROR();
        }
        if(!companyId){
            throw L.ERR.INVALID_ARGUMENT();
        }
        let key = codeTicket + msgTicket;
        let cacheMobile =await cache.read(key);
        if(!cacheMobile || cacheMobile != mobile){
            throw L.ERR.SIGN_ERROR();
        }

        let accounts = await Models.account.find({where:{mobile:mobile}});
        if(!accounts.length){
            throw L.ERR.USER_NOT_EXIST();
        }
        let account = accounts[0];

        let company = await Models.company.get( companyId );
        if(!company){
            throw L.ERR.COMPANY_NOT_EXIST();
        }
        let travelPolicy = await company.getDefaultTravelPolicy();
        let otherStaffs = await Models.staff.find({where: {
            accountId : account.id
        }});
        let otherStaff = otherStaffs[0];

        let staffed = await Models.staff.find({where:{ companyId: companyId, accountId: account.id }});
        if(staffed && staffed.total > 0){
            return {
                "inCompany" : true,
                "company"   : staffed[0].company
            }
        }

        let staff = Staff.create({
            name: otherStaff.name,
            status: ACCOUNT_STATUS.ACTIVE,
            roleId: EStaffRole.COMMON,
            travelPolicyId: travelPolicy.id,
            accountId: account.id
        });
        staff.company = company;
        staff = await staff.save();
        let defaultDepart = await company.getDefaultDepartment();
        if(defaultDepart){
            let staffDepart = Models.staffDepartment.create({
                staffId : staff.id,
                departmentId : defaultDepart.id
            });

            staffDepart = await staffDepart.save();
        }

        return staff.company;
    }


    /**
     * 添加员工验证手机号和邮箱
     * @param data
     * @returns {boolean}
     */
    @clientExport
    static async checkEmailAndMobile(data: {email?: string, mobile?: string}) {
        if(data.email && !validator.isEmail(data.email)) {
            throw L.ERR.EMAIL_FORMAT_INVALID();
        }

        if(data.mobile && !validator.isMobilePhone(data.mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }


        var mobile = data.mobile;

        //var staff = await Staff.getCurrent();

        var type = EAccountType.STAFF;
        //查询邮箱是否已经注册
        if(data.email) {
            var account1 = await Models.account.find({where: {email: data.email, type: type}});
            if(account1 && account1.length > 0) {
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

        if(data.mobile) {
            var account2 = await Models.account.find({where: {mobile: mobile, type: type}});
            if(account2 && account2.length > 0) {
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
    static async resetPwdByOldPwd(params: {oldPwd: string, newPwd: string}): Promise<boolean> {
        let session = getSession();
        let oldPwd = params.oldPwd;
        let newPwd = params.newPwd;
        let accountId = session["accountId"];

        if(!accountId) {
            throw L.ERR.NEED_LOGIN();
        }
        if(!oldPwd || !newPwd) {
            throw L.ERR.PWD_EMPTY();
        }
        if(oldPwd == newPwd) {
            throw {code: -1, msg: "新旧密码不能一致"};
        }

        var account = await Models.account.get(accountId);
        if(!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var pwd = utils.md5(oldPwd);
        if(account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }
        newPwd = newPwd.replace(/\s/g, "");
        pwd = utils.md5(newPwd);
        account.pwd = pwd;
        await account.save();
        return true;
    };


    /**
     * 企业注册
     * @param params
     * @returns {Promise<TResult>|Promise<U>}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'userName', 'pwd', 'msgCode', 'msgTicket'], ['email', 'agencyId', 'remark', 'description', 'promoCode', 'referrerMobile', 'source'])
    static async registerCompany(params: {name: string, userName: string, email?: string, mobile: string, pwd: string,
        msgCode: string, msgTicket: string, agencyId?: string, promoCode?: string, referrerMobile?: string, source?: number}) {
        var companyName = params.name;
        var name = params.userName;
        var email = params.email;
        var mobile = params.mobile;
        var msgCode = params.msgCode;
        var msgTicket = params.msgTicket;
        var pwd = params.pwd;
        var referrerMobile = params.referrerMobile;

        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        /*if (!email || !validator.isEmail(email)) {
         throw L.ERR.EMAIL_FORMAT_INVALID();
         }*/

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }

        if(!name) {
            throw {code: -1, msg: "联系人姓名为空"};
        }

        if(!companyName) {
            throw {code: -1, msg: "公司名称为空"};
        }

        if(!pwd) {
            throw L.ERR.PASSWORD_EMPTY();
        }

        //验证优惠码是否有效
        if(params.promoCode){
            let promoCodes = await Models.promoCode.find({where : {code: params.promoCode}});
            if( promoCodes && promoCodes.length > 0 ) {
                let promoCode = promoCodes[0];
                if (promoCode.expiryDate && promoCode.expiryDate.getTime() - new Date().getTime() < 0) {
                    throw L.ERR.INVALID_PROMO_CODE();
                }
            }else{
                throw L.ERR.INVALID_PROMO_CODE();
            }
        }

        await API.auth.checkEmailAndMobile({email: email, mobile: mobile});
        await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});
        var result = await API.company.registerCompany({
            mobile: mobile,
            email: email,
            name: companyName,
            userName: name,
            pwd: pwd,
            status: ACCOUNT_STATUS.ACTIVE,
            isValidateMobile: true,
            promoCode: params.promoCode,
            referrerMobile: referrerMobile,
        });
        if (params.source == 1) {
            let companyId = result.company.id
            const companyRegions: ICompanyRegion[] = _.filter((cr: ICompanyRegion) => !/(一|二)类/.test(cr.name), _.prop('data', await API.travelPolicy.getCompanyRegions({companyId})))
            const travelPolicies = _.pluck('data', await Promise.all([API.travelPolicy.createTravelPolicy({companyId, name: '员工级', isDefault: true }),
                API.travelPolicy.createTravelPolicy({companyId, name: '高管级' })]))
            const promises = [...companyRegions.map(cr =>
                    API.travelPolicy.createTravelPolicyRegion({
                        travelPolicyId: travelPolicies[0].id,
                        companyRegionId: cr.id,
                        planeLevels: [EPlaneLevel.ECONOMY],
                        trainLevels: [ETrainLevel.SECOND_SEAT],
                        hotelLevels: [EHotelLevel.THREE_STAR]
                }))]
            promises.push(...companyRegions.map(cr =>
                API.travelPolicy.createTravelPolicyRegion({
                    travelPolicyId: travelPolicies[1].id,
                    companyRegionId: cr.id,
                    planeLevels: [EPlaneLevel.BUSINESS],
                    trainLevels: [ETrainLevel.BUSINESS_SEAT],
                    hotelLevels: [EHotelLevel.FIVE_STAR]
            })))
            await Promise.all(promises)
        }
        return result;
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
    static async sendResetPwdEmail(params: {email: string, mobile?: string, type?: Number, isFirstSet?: boolean, companyName?: string}): Promise<boolean> {
        var email = params.email;
        var mobile = params.mobile;
        var isFirstSet = params.isFirstSet;
        var type = params.type || 1;
        var companyName = params.companyName || '';

        if(!email) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        if(!mobile) {
            throw L.ERR.MOBILE_EMPTY();
        }
        var accounts = await Models.account.find({where:{email: email, type: type}, limit:1});
        if(accounts.total == 0)
            throw L.ERR.ACCOUNT_NOT_EXIST();
        var acc = accounts[0];
        if(!acc) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        //生成设置密码token
        var pwdToken = utils.getRndStr(6);
        acc.pwdToken = pwdToken;
        await acc.save();

        var staff = await Models.staff.get(acc.id);
        //var account = acc.toJSON();

        var oneDay = 24 * 60 * 60 * 1000
        var timestamp = Date.now() + 2 * oneDay;  //失效时间2天
        var sign = makeActiveSign(acc.pwdToken, acc.id, timestamp);
        var url = "accountId=" + acc.id + "&timestamp=" + timestamp + "&sign=" + sign + "&email=" + acc.email;

        var vals: {[key: string]: any} = {
            name: staff.name || acc.mobile,
            username: acc.email,
            time: new Date(),
            companyName: companyName
        };
        let key;
        if(isFirstSet) {
            //发邮件
            vals.url = C.host + "/index.html#/login/first-set-pwd?" + url;
            vals.appMessageUrl = "#/login/first-set-pwd?" + url;
            key = 'qm_first_set_pwd';
            try {
                vals.url = await API.wechat.shorturl({longurl: vals.url});
                vals.appMessageUrl = await API.wechat.shorturl({longurl: vals.appMessageUrl});
            } catch(err) {
                console.error(err);
            }
        } else {
            vals.url = C.host + "/index.html#/login/reset-pwd?" + url;
            vals.appMessageUrl = "#/login/reset-pwd?" + url;
            key = 'qm_reset_pwd_email';
        }

        return API.notify.submitNotify({
            key: key,
            values: vals,
            email: acc.email,
        });
    }

    /**
     * @method sendImportStaffEmail 发送批量导入员工邮件
     *
     * @param {Object} params
     * @param  params.accountId 账号id
     * @returns {Promise} true|error
     */
    @clientExport
    static async sendImportStaffEmail(params: {accountId: string, version?: number}): Promise<boolean> {
        var accountId = params.accountId;

        if(!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var acc = await Models.staff.get(accountId);
        if(!acc) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        //生成设置密码token
        var importStaffEmailToken = utils.getRndStr(6);
        let list = await Models.token.find({where: {type:'import_staff_email_token', accountId: accountId}});

        if(list && list.length > 0) {
            await Promise.all(list.map((op) => op.destroy()));
        }

        let obj = Models.token.create({token: importStaffEmailToken, accountId: acc.id, type:'import_staff_email_token', expireAt: moment().add(1,'days')});
        await obj.save();


        var oneDay = 24 * 60 * 60 * 1000
        var timestamp = Date.now() + oneDay;  //失效时间1天
        var sign = makeActiveSign(importStaffEmailToken, acc.id, timestamp);

        let key = 'qm_import_staff';
        var url: string
        if (params.version && params.version == 2) { //没有在v2中找到调用的地方，暂不修改。
            url = `${C.host}/index.html#/admin/download-template?accountId=${acc.id}&timeStamp=${timestamp}&sign=${sign}`
        } else {
            url = `${C.host}/index.html#/admin/download-template?accountId=${acc.id}&timeStamp=${timestamp}&sign=${sign}`
        }
        return API.notify.submitNotify({
            key: key,
            values: {
                url: url
            },
            email: acc.email
        });
    }

    @clientExport
    static async getAccountStatus(params: {id: string}): Promise<Account|undefined> {
        let acc: Account | undefined;
        let args: any = {attributes: ["status"]};
        args.where = {id: params.id};
        let result = await Models.account.find(args);
        if(result && result.length > 0){
            acc = result[0];
        }
        return acc;
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
    @requireParams(["email"], accountCols)
    static async newAccount(data: {email: string, mobile?: string, pwd?: string, type?: Number, status?: Number, companyName?: string, id?: string, version?: number}) {
        if(!data) {
            throw L.ERR.DATA_NOT_EXIST();
        }

        if(!data.email) {
            throw L.ERR.EMAIL_EMPTY();
        }

        if(!validator.isEmail(data.email)) {
            throw L.ERR.INVALID_FORMAT('email');
        }

        if(data.mobile && !validator.isMobilePhone(data.mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }

        if(data.pwd) {
            var pwd: string | undefined;
            var password = data.pwd.toString();
            pwd = utils.md5(password);
            //throw L.ERR.PASSWORD_EMPTY();
        }


        var mobile = data.mobile;
        var companyName = data.companyName || '';

        var staff = await Staff.getCurrent();
        if(data.email && staff && staff.company["domainName"] && data.email.indexOf(staff.company["domainName"]) == -1) {
            throw L.ERR.INVALID_ARGUMENT('email');
        }

        var type = data.type || EAccountType.STAFF;
        //查询邮箱是否已经注册
        var account1 = await Models.account.find({where: {email: data.email, type: type}});
        if(account1 && account1.length > 0) {
            throw L.ERR.EMAIL_HAS_REGISTRY();
        }

        if(data.mobile) {
            var account2 = await Models.account.find({where: {mobile: mobile, type: type}});
            if(account2 && account2.length > 0) {
                throw L.ERR.MOBILE_HAS_REGISTRY();
            }
        }

        var status = data.status ? data.status : ACCOUNT_STATUS.NOT_ACTIVE;
        var id = data.id ? data.id : uuid.v1();
        var accountObj = Account.create({
            id: id,
            mobile: mobile,
            email: data.email,
            pwd: pwd,
            status: status,
            type: type
        });
        var account = await accountObj.save();

        if(!account.pwd) {
            return ApiAuth.sendResetPwdEmail({
                email: account.email,
                type: 1,
                isFirstSet: true,
                companyName: companyName
            })
                .then(function() {
                    return account;
                })
        }

        if(account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
            return _sendActiveEmail(account.id, undefined, data.version)
                .then(function() {
                    return account;
                })
        }
    }

    // /**
    //  * 创建Account
    //  * @param params
    //  * @returns {Promise<Account>}
    //  */
    // @clientExport
    // static async createAccount(params): Promise<Account> {
    //     var acc = Account.create(params);
    //     return acc.save();
    // }


    /**
     * 更新account(为员工添加资金账户时用【改进后可删除】)
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    static async updateAccount(params: Account) : Promise<Account>{
        var id = params.id;
        console.log("更新字段:====>", params);
        var ah = await Models.account.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getAccount(params: {id: string}) {
        var id = params.id;
        var options: any = {};
        var acc = await Models.account.get(id, options);
        return acc;
    }

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    @requireParams(["id"])
    static async getPrivateInfo(params: {id: string}) {
        var id = params.id;
        var acc = await Models.account.get(id);
        return acc;
    }

    /**
     * 由id查询账户信息
     * @param id
     * @returns {*}
     */
    @clientExport
    static async getAccounts(params: {where: any, order?: any, attributes?: any, $or?: any, paranoid?: boolean}) {
        if(!params.where) {
            params.where = {};
        }
        if(!params.attributes){
            params.attributes = ["id", "email", "mobile", "status", "forbiddenExpireAt", "loginFailTimes", "lastLoginAt", "lastLoginIp", "activeToken", "pwdToken", "oldQrcodeToken", "qrcodeToken", "type", "isFirstLogin"];
        }
        params.order = params.order || [["created_at", "desc"]];

        let paginate = await Models.account.find(params);
        let ids = paginate.map(function(t) {
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
    /*@clientExport
     @requireParams(["id"], accountCols)
     static async updateAccount(params) {
     var id = params.id;
     var accobj = await Models.account.get(id);
     var staff = await Staff.getCurrent();
     if(params.email && staff && staff.company["domainName"] && params.email.indexOf(staff.company["domainName"]) == -1) {
     throw L.ERR.INVALID_ARGUMENT('email');
     }

     if(params.email && accobj["status"] != 0 && accobj.email != params.email) {
     // throw {code: -2, msg: "该账号不允许修改邮箱"};
     throw L.ERR.NOTALLOWED_MODIFY_EMAIL();
     }


     for(var key in params) {
     accobj[key] = params[key];
     }
     var newAcc = await accobj.save();
     return newAcc;

     /!*if(accobj.email == newAcc.email){
     return newAcc;
     }

     var staff = await Models.staff.get(id);
     var companyName = (staff && staff.company) ? staff.company.name : "";
     return ApiAuth.sendResetPwdEmail({companyName: companyName, email: newAcc.email, type: 1, isFirstSet: true})
     .then(function() {
     return newAcc;
     });*!/
     }*/

    /**
     * 删除Account
     * @param params
     * @returns {boolean}
     */
    @clientExport
    // @requireParams(["id"])
    static async deleteAccount(params: any): Promise<any> {
        /*let deleteAcc = await Models.account.get(params.id);
         await deleteAcc.destroy();*/
        return true;
    }

    /**
     * 检查账户是否存在
     * @param params
     * @returns {*}
     */
    static async checkAccExist(params: {[key: string]: any}) {
        var accounts = await Models.account.find(params);
        return accounts.total > 0;
    };


    @requireParams(["id"])
    static async judgeRoleById(params: {id: string}) {
        var account = await Models.account.get(params.id);
        if(!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        if(account.type == 1) {
            return EAccountType.STAFF;
        } else {
            return EAccountType.AGENCY;
        }
    }

    /**
     * 注册验证手机号和邮箱
     * @param data
     * @returns {boolean}
     */
    @clientExport
    static async registerCheckEmailMobile(data: {email?: string, mobile?: string}) {
        if(data.email && !validator.isEmail(data.email)) {
            throw L.ERR.INVALID_FORMAT('email');
        }

        if(data.mobile && !validator.isMobilePhone(data.mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }
        //查询邮箱是否已经注册
        if(data.email) {
            var account1 = await Models.account.find({where: {email: data.email}});
            if(account1 && account1.total > 0) {
                throw L.ERR.EMAIL_HAS_REGISTRY();
            }
        }

        if(data.mobile) {
            var account2 = await Models.account.find({where: {mobile: data.mobile}});
            if(account2 && account2.total > 0) {
                throw L.ERR.MOBILE_HAS_REGISTRY();
            }
        }

        return true;
    }


    static __initHttpApp(app: Application) {
        wechat.__initHttpApp(app);
        qrcode.__initHttp(app);
    }


    @clientExport
    static authWeChatLogin = wechat.authWeChatLogin;
    @clientExport
    static getWeChatLoginUrl = wechat.getWeChatLoginUrl;
    @clientExport
    static saveOrUpdateOpenId = wechat.saveOrUpdateOpenId;
    @clientExport
    static destroyWechatOpenId = wechat.destroyWechatOpenId;

    @requireParams(["openId"])
    static getAccountIdByOpenId = wechat.getAccountIdByOpenId;
    @requireParams(["openId"])
    static getOpenIdByAccount = wechat.getOpenIdByAccount;


    @clientExport
    static login = authentication.login;
    @clientExport
    static loginByLdap = authentication.loginByLdap;
    @clientExport
    static logout = authentication.logout;

    @clientExport
    static authentication = authentication.checkTokenAuth;
    static makeAuthenticateToken = authentication.makeAuthenticateToken;

    @clientExport
    static setCurrentStaffId = authentication.setCurrentStaffId;

    @clientExport
    @requireParams(["jpushId"])
    static saveOrUpdateJpushId = messagePush.saveOrUpdateJpushId;
    @clientExport
    static destroyJpushId = messagePush.destroyJpushId;

    @requireParams(["accountId"])
    static getJpushIdByAccount = messagePush.getJpushIdByAccount;

    @clientExport
    @requireParams(["backUrl"])
    static getQRCodeUrl = qrcode.getQRCodeUrl;

    static removeByTest = byTest.removeByTest;
}

async function _sendActiveEmail(accountId: string, origin?: string, version?: number) {
    let staff = await Models.staff.get(accountId);
    let account_id = accountId;
    if(staff && staff.accountId){
        account_id = staff.accountId;
    }
    var account = await Models.account.get(account_id);
    //生成激活码
    var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
    var activeToken = utils.getRndStr(6);
    var sign = makeActiveSign(activeToken, account.id, expireAt);
    let host = origin ? origin : C.host;
    var url: string = ""
    var appMessageUrl: string = ""
    version = version || C.link_version || 2 //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
    if (version == 2) {
        url = `${C.v2_host}#/login/active/${account.id}/${sign}/${expireAt}/${account.email}`
        appMessageUrl = "#/hom/staff-info";
    } else {
        url = host + "/index.html#/login/active?accountId=" + account.id + "&sign=" + sign + "&timestamp=" + expireAt + "&email=" + account.email;
        appMessageUrl = "#/staff/staff-info";
    }
    try {
        url = await API.wechat.shorturl({longurl: url});
    } catch(err) {
        console.error(err);
    }
    //发送激活邮件
    var vals = {
        staff: staff,
        detailUrl: url,
        appMessageUrl: appMessageUrl
    };
    account.activeToken = activeToken;
    await Promise.all([
        account.save(),
        API.notify.submitNotify({
            key: 'qm_active',
            values: vals,
            email: account.email,
            userId: staff ? staff.id : null
        })
    ]);

}