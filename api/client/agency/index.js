/**
 * Created by yumiao on 15-12-9.
 */

var API = require('../../../common/api');
var Logger = require('../../../common/logger');
var logger = new Logger();

var agency = {}

//agency.__public = true;

/**
 * 创建代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.createAgency = function(params, callback){
    params.createUser = this.accountId;
    return API.agency.createAgency(params, callback);
}

/**
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
    return agencyServer.getAgency(this.accountId, callback);
}
agency.listAndPaginateAgencyUser = API.agency.listAndPaginateAgencyUser;

module.exports = agency;