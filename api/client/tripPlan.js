/**
 * Created by yumiao on 15-12-12.
 */

var API = require('../../common/api');
var Logger = require('../../common/logger');
var logger = new Logger();

var tripPlan = {};
//tripPlan.__public = true;
/**
 * 生成计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params, callback){
    params.accountId = this.accountId;
    logger.info(params);
    return API.tripPlan.savePlanOrder(params, callback);
}

/**
 * 保存消费支出明细
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.saveConsumeDetail = function(params, callback){
    params.accountId = this.accountId;
    return API.tripPlan.saveConsumeRecord(params)
        .then(function(consumeDetail){
            return {code: 0, msg: '保存成功', consumeDetail: consumeDetail};
        }).nodeify(callback);
}

/**
 * 获取计划单详情
 * @param orderId
 * @param callback
 */
tripPlan.getTripPlanOrderById = function(orderId, callback){
    var params = {
        orderId: orderId,
        userId: this.accountId
    }
    return API.tripPlan.getTripPlanOrder(params, callback);
}

/**
 * 获取差旅计划单列表(员工)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrder = function(query, callback){
    var accountId = this.accountId;
    query.accountId = accountId;
    var params = {
        userId: accountId,
        query: query
    }
    return API.tripPlan.listTripPlanOrder(params, callback);
}

/**
 * 获取差旅计划单列表(企业)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrderByCompany = function(query, callback){
    query.companyId = this.companyId; //test
    var params = {
        userId: this.accountId,
        query: query
    }
    return API.tripPlan.listTripPlanOrder(params, callback);
}

/**
 * 删除差旅计划单/预算单
 * @param orderId
 * @param callback
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function(orderId, callback){
    var params = {
        orderId: orderId,
        userId: this.accountId
    }
    return API.tripPlan.deleteTripPlanOrder(params, callback);
}

/**
 * 删除差旅消费明细
 * @param orderId
 * @param callback
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function(id, callback){
    var params = {
        id: id,
        userId: this.accountId
    }
    return API.tripPlan.deleteConsumeDetail(params, callback);
}

module.exports = tripPlan;