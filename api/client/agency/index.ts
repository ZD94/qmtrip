/**
 * Created by yumiao on 16-4-25.
 */
'use strict';
let API = require('common/api');
let utils = require("common/utils");
let L = require("common/language");
let Logger = require("common/logger");
let logger = new Logger("client/agency");

import _ = require('lodash');
import * as TYPES from "./agency.types";
import {validateApi} from '../../../common/api/helper';

// let STATUS = TYPES.AGENCY_STATUS;
// let Agency = TYPES.Agency;
// let AgencyUser = TYPES.AgencyUser;
import {Agency, AgencyUser, AGENCY_STATUS} from "./agency.types";


/**
 * @class agency 代理商
 */

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
 * @param {string} params.pwd 密码 选
 * 填，如果手机号和邮箱在全麦注册过，则密码还是以前的密码
 * @returns {Promise} true||error
 */
validateApi(registerAgency, ['name', 'email', 'mobile', 'userName'], ['description', 'remark', 'pwd', 'id']);
export async function registerAgency(params: {name: string, email: string, mobile: string, userName: string, description?: string,
    remark?: string, pwd?: string}){
    let email = params.email;
    let mobile = params.mobile;
    let password = params.pwd || "123456";
    let ACCOUNT_TYPE : number = 2; //账号类型，2为代理商账号
    let account = await API.auth.checkAccExist({type: ACCOUNT_TYPE, $or: [{mobile: mobile}, {email: email}]});

    if(!account) {
        let _account : any = {email: email, mobile: mobile, pwd: password, type: ACCOUNT_TYPE};
        account = await API.auth.newAccount(_account);
    }

    let _agency = new Agency(params);
    _agency.id = account.id;
    _agency['userName'] = params.userName;

    return API.agency.createAgency(_agency);

}


/**
 * @method getAgencyById
 *
 * 获取代理商信息
 *
 * @param {object} params
 * @param params.agencyId 代理商id
 * @returns {Promise<Agency>}
 */
validateApi(getAgencyById, ['agencyId']);
export async function getAgencyById(params: {agencyId: string}){
    var self = this;
    var agencyId = params.agencyId;
    var user = await API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']});

    if(user.agencyId != agencyId){
        throw L.ERR.PERMISSION_DENY;
    }

    return API.agency.getAgency({agencyId: agencyId});
}


/* @method listAgency
 * 查询代理商列表
 * @param params
 * @returns {Promise<Array<Agency>>}
 */
export async function listAgency(){
    let self = this;
    let list = await API.agency.listAgency({});
    
    return list.map(function(agency) {
        return agency.id;
    })
}

/**
 * @method updateAgency
 *
 * 更新代理商信息
 * @param params {object}
 * @returns {Promise<Agency>}
 */
validateApi(updateAgency, ['agencyId'], ['name', 'description', 'status', 'address', 'email', 'telephone', 'mobile', 'company_num', 'remark']);
export async function updateAgency(params){
    let self = this;
    params.userId = self.accountId;
    return API.agency.updateAgency(params);
}

/**
 * @method deleteAgency
 * 删除代理商信息
 * @param params.agencyId 代理商id
 * @returns {Promise<boolean>}
 */
validateApi(deleteAgency, ['agencyId']);
export function deleteAgency(params: {agencyId: string}){
    let self = this;
    let _params : any = params;
    _params.userId = self.accountId

    return API.agency.deleteAgency(_params);
}

/**
 *
 * @param params
 * @returns {Promise<AgencyUser>}
 */
export async function createAgencyUser(params: Agency) {
    let self = this;
    let accountId = self.accountId;
    await API.permit.checkPermission({accountId: accountId, permission: "user.add", type: 2});    //检查权限
    let user = await API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']});
    let agencyUser = new AgencyUser(params);
    agencyUser.agencyId = user.agencyId;

    return API.agency.createAgencyUser(agencyUser)
}

/**
 * @method getAgencyUser
 * 获取代理商用户信息
 * @param {string} params.agencyUserId 代理商用户id
 * @returns {Promise<AgencyUser>}
 */
validateApi(getAgencyUser, ['agencyUserId']);
export async function getAgencyUser(params: {agencyUserId: string}){
    let self = this;
    let accountId = self.accountId;
    let user = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
    let agencyUser = await API.agency.getAgencyUser({id: params.agencyUserId});

    if(user.agencyId != agencyUser.agencyId){
        throw L.ERR.PERMISSION_DENY;
    }

    return agencyUser;
}

/**
 * @method getCurrentAgencyUser
 * 获取当前代理商用户
 * @returns {Promise<AgencyUser>}
 */
export function getCurrentAgencyUser(){
    let self = this;
    return API.agency.getAgencyUser({id: self.accountId})
}

/**
 * @method updateAgencyUser
 *
 * 更新代理商用户
 * @param {Object} params
 * @param {string} params.id 需要修改的代理商用户id
 * @param {number} params.status 代理商用户状态
 * @param {string} params.name 代理商名称
 * @param {string} params.mobile 代理商用户手机号
 * @returns {Promise<AgencyUser>}
 */
validateApi(updateAgencyUser, ['id'], ['status', 'name', 'sex', 'mobile', 'avatar', 'roleId']);
export async function updateAgencyUser(params: {id: string, status?: number, name?: string, sex?: string, email?: string,
    mobile?: string, avatar?: string, roleId?: string}) {
    let self = this;
    let accountId = self.accountId;

    await API.permit.checkPermission({accountId: accountId, permission: "user.edit", type: 2});    //检查权限

    let user = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
    let target = await API.agency.getAgencyUser({id: params.id, columns: ['agencyId', 'status']});

    if(user.agencyId != target.agencyId){
        throw L.ERR.PERMISSION_DENY;
    }

    return API.agency.updateAgencyUser(params);
}

/**
 * @method deleteAgencyUser
 * 删除代理商用户
 * 
 * @param {string} params.userId
 * @returns {Promise<boolean>}
 */

validateApi(deleteAgencyUser, ['userId']);
export async function deleteAgencyUser(params: {userId: string}){
    let self = this;
    let accountId = self.accountId;
    
    await API.permit.checkPermission({accountId: accountId, permission: "user.delete", type: 2}); //检查权限

    let agencyUserId = params.userId;
    let user = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
    let target = await API.agency.getAgencyUser({id:agencyUserId, columns: ['agencyId']});

    if(user.agencyId != target.agencyId){
        throw L.ERR.PERMISSION_DENY;
    }

    return API.agency.deleteAgencyUser({id: agencyUserId});
}

/**
 * @method listAndPaginateAgencyUser
 * @param params
 * @returns {Promise<Paginate>}
 */
export async function listAndPaginateAgencyUser(params) {
    let self = this;
    let user = await API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']});
    params.agencyId = user.agencyId;
    return API.agency.listAndPaginateAgencyUser(params);
}
