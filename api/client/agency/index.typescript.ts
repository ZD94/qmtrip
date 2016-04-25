/**
 * Created by yumiao on 16-4-25.
 */
'use strict';
var API = require('common/api');
var utils = require("common/utils");
var L = require("common/language");
var Logger = require("common/logger");
var logger = new Logger("client/agency");
import _ = require('lodash');
var checkAgencyPermission = require('../auth').checkAgencyPermission;

/**
 * @class agency 代理商
 */
var agency : any = {};

/**
 * @method registerAgency
 *
 * 注册代理商
 *
 * @param {Object} params 参数
 * @param {string} params.name 代理商名称 必填
 * @param {string} params.userName 用户姓名 必填
 * @param {string} params.mobile 手机号 必填
 * @param {string} params.email 邮箱 必填
 * @param {string} params.pwd 密码 选填，如果手机号和邮箱在全麦注册过，则密码还是以前的密码
 * @returns {Promise} true||error
 */
agency.registerAgency = registerAgency;
// registerAgency.required_params = ['name', 'email', 'mobile', 'userName'];
// registerAgency.optional_params = ['description', 'remark', 'pwd'];
function registerAgency(params){
    var email = params.email;
    var mobile = params.mobile;
    return API.auth.checkAccExist({type: 2, $or: [{mobile: mobile}, {email: email}]})
        .then(function(ret){
            if(!ret){
                var _account : any = {
                    email: email,
                    mobile: mobile,
                    pwd: params.pwd||"123456",
                    type: 2
                }
                return API.auth.newAccount(_account);
            }else{
                return ret;
            }
        })
        .then(function(account) {
            params.id = account.id;
            return API.agency.createAgency(params)
        })
}

module.exports = agency;