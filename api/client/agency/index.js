/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
/**
 * @module API
 */

var Q = require("q");
var API = require('common/api');
var Logger = require('common/logger');
var utils = require("common/utils");
var getColsFromParams = utils.getColsFromParams;
var checkAndGetParams = utils.checkAndGetParams;
var logger = new Logger();

/**
 * @class agency 代理商
 */
var agency = {}


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
 * @param {Function} [callback]
 * @returns {Promise} {code: 0, msg: '注册成功||错误信息'}
 */
agency.registerAgency = function(params, callback){
    var agency = checkAndGetParams(['name', 'email', 'mobile', 'userName'], ['description', 'remark'], params, true);
    return API.agency.registerAgency(agency, callback);
}

/**
 * @method updateAgency
 *
 * 更新代理商信息
 * @param params
 * @param callback
 * @returns {*}
 */
agency.updateAgency = function(params, callback){
    var self = this;
    params = checkAndGetParams(['agencyId'],
        ['name', 'description', 'status', 'address', 'email', 'telephone', 'mobile', 'company_num', 'remark'], params, true);
    params.userId = self.accountId;
    return API.agency.updateAgency(params, callback);
}

/**
 * 获取代理商信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.getAgencyById = function(agencyId, callback){
    var self = this;
    var params = {
        agencyId: agencyId,
        userId: self.accountId
    }
    return API.agency.getAgency(params, callback);
}

/**
 * 根据查询条件获取代理商列表
 * @param params
 * @param callback
 * @returns {*}
 */
agency.listAgency = function(params, callback){
    params.userId = this.accountId;
    return API.agency.listAgency(params, callback);
}

/**
 * 删除代理商信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.deleteAgency = function(agencyId, callback){
    var self = this;
    var params = {
        agencyId: agencyId,
        userId: self.accountId
    }
    return API.agency.deleteAgency(params, callback);
}

/**************** 代理商用户相关 ****************/

agency.createAgencyUser = function(agencyUser){
    var self = this;
    return API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']})
        .then(function(user){
            agencyUser.agencyId = user.agencyId;
            return API.agency.createAgencyUser(agencyUser)
        })
};

/**
 * 获取当前代理商用户
 * @param callback
 * @returns {*}
 */
agency.getCurrentAgencyUser = function(){
    var self = this;
    var accountId = self.accountId;
    return API.agency.getAgencyUser({id: accountId})
}

/**
 * 删除代理商用户
 * @param userId
 * @param callback
 * @returns {*}
 */
agency.deleteAgencyUser = function(agencyUserId){
    var self = this;
    var accountId = self.accountId;
    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
        API.agency.getAgencyUser({id:agencyUserId, columns: ['agencyId']})
    ])
    .spread(function(user, target){
            if(user.agencyId != target.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }
            return API.agency.deleteAgencyUser({id: agencyUserId});
        })
}

/**
 * 更新代理商用户
 * @param params
 * @param callback
 * @returns {*}
 */
agency.updateAgencyUser = function(params) {
    var params = checkAndGetParams(['id'], ['status', 'name', 'sex', 'email', 'mobile', 'avatar', 'roleId'], params, true);
    var self = this;
    var accountId = self.accountId;
    var id = params.id;
    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
        API.agency.getAgencyUser({id: id, columns: ['agencyId']})
    ])
    .spread(function(user, target){
            if(user.agencyId != target.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }
            return API.agency.updateAgencyUser(params);
        })
}

/**
 * 获取代理商用户
 * @param params
 * @param callback
 * @returns {*}
 */
agency.getAgencyUser = function(agencyUserId){
    var self = this;
    var accountId = self.accountId;
    if(!agencyUserId){
        throw {code: -1, msg: '用户id不能为空'};
    }
    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
        API.agency.getAgencyUser({id: agencyUserId})
    ])
    .spread(function(user, agencyUser){
            if(user.agencyId != agencyUser.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }
            return agencyUser;
        })
}

agency.listAndPaginateAgencyUser = function(params, callback) {
    var user_id = this.accountId;
    return API.agency.getAgencyUser({id:user_id})
        .then(function(data){
            params.agencyId = data.agencyId;
            return API.agency.listAndPaginateAgencyUser(params);
        })
        .nodeify(callback);
}

module.exports = agency;