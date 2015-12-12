/**
 * Created by yumiao on 15-12-9.
 */

var API = require('../../common/api');
var Logger = require('../../common/logger');
var logger = new Logger();

var agency = {}

//agency.__public = true;

/**
 * 创建企业
 * @param params
 * @param callback
 * @returns {*}
 */
agency.createAgency = function(params, callback){
    params.createUser = this.accountId;
    return API.agency.createAgency(params, callback);
}

/**
 * 更新企业信息
 * @param params
 * @param callback
 * @returns {*}
 */
agency.updateAgency = function(params, callback){
    params.createUser = this.accountId;
    return API.agency.updateAgency(params, callback);
}

/**
 * 获取企业信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.getAgency = function(agencyId, callback){
    var params = {
        agencyId: agencyId,
        userId: this.accountId
    }
    return API.agency.getAgency(params, callback);
}

/**
 * 根据查询条件获取企业列表
 * @param params
 * @param callback
 * @returns {*}
 */
agency.listAgency = function(params, callback){
    params.userId = this.accountId;
    return API.agency.listAgency(params, callback);
}

/**
 * 删除企业信息
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

module.exports = agency;