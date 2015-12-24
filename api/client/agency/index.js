/**
 * Created by yumiao on 15-12-9.
 */

/**
 * @module API
 */
var API = require('../../../common/api');
var Logger = require('../../../common/logger');
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
    return API.agency.registerAgency(params, callback);
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
    params.createUser = this.accountId;
    return API.agency.updateAgency(params, callback);
}

/**
 * 获取代理商信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.getAgencyById = function(agencyId, callback){
    var params = {
        agencyId: agencyId,
        userId: this.accountId
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
    var params = {
        agencyId: agencyId,
        userId: this.accountId
    }
    return API.agency.deleteAgency(params, callback);
}

/**************** 代理商用户相关 ****************/

agency.createAgencyUser = API.agency.createAgencyUser;
agency.deleteAgencyUser = API.agency.deleteAgencyUser;
agency.updateAgencyUser = API.agency.updateAgencyUser;
agency.getAgencyUser = API.agency.getAgencyUser;
agency.getCurrentAgency = function(callback){
    return API.agency.getAgencyUser(this.accountId, callback);
}
agency.listAndPaginateAgencyUser = API.agency.listAndPaginateAgencyUser;

module.exports = agency;