/**
 * Created by yumiao on 15-12-12.
 */

var API = require("common/api");
var Q = require("q");
var Logger = require('common/logger');

var tripPlan = {};

/**
 * 生成计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params, callback){
    var self = this;
    var accountId = self.accountId;
    params.accountId = accountId;
    params.type = params.type | 2;
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function(staff){
            params.companyId = staff.companyId;
            return API.tripPlan.savePlanOrder(params);
        })
    .nodeify(callback);
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
    var self = this;
    var params = {
        orderId: orderId,
        userId: self.accountId
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
    params.userId = this.accountId;
    return API.tripPlan.uploadInvoice(params, callback);
}

/**
 * 根据条件统计计划单数目
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.countTripPlanNum = function(params, callback){
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId})
        .then(function(staff){
            var companyId = staff.companyId;
            params.companyId = companyId;
            return API.tripPlan.countTripPlanNum(params);
        })
    .nodeify(callback);
}


module.exports = tripPlan;