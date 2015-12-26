/**
 * Created by yumiao on 15-12-12.
 */

var API = require('../../../common/api');
var Logger = require('../../../common/logger');
var logger = new Logger();

var tripPlan = {};

/**
 * 生成计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params, callback){
    params.accountId = this.accountId;
    params.type = params.type | 2;
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
    return API.tripPlan.saveConsumeRecord(params, callback);
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

/**
 * 上传票据
 * @param params
 * @param params.userId 用户id
 * @param params.consumeId 消费详情id
 * @param params.picture 新上传的票据md5key
 * @param callback
 * @returns {*}
 */
tripPlan.uploadInvoice = function(params, callback){
//    params.userId = this.accountId;
    params.userId = "ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6";
    return API.tripPlan.uploadInvoice(params, callback);
}

/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params。consumeId 审核消费单id
 * @param params.userId 用户id
 * @param callback
 * @returns {*|*|Promise}
 */
tripPlan.approveInvoice = function(params, callback){
//    params.userId = this.accountId;
    params.userId = "ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6";
    return API.tripPlan.approveInvoice(params, callback);
}


module.exports = tripPlan;