/**
 * Created by yumiao on 15-12-12.
 */
"use strict";
var API = require("common/api");
var Q = require("q");
var Logger = require('common/logger');
var L = require("common/language");
var checkAndGetParams = require("common/utils").checkAndGetParams;

var tripPlan = {};

/**
 * 生成计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function (params) {
    var self = this;
    var accountId = self.accountId;
    params.accountId = accountId;
    params.type = params.type | 2;
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            params.companyId = staff.companyId;
            return API.tripPlan.savePlanOrder(params);
        })
}

/**
 * 保存消费支出明细
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.saveConsumeDetail = function (params) {
    var self = this;
    params.accountId = self.accountId;
    return API.tripPlan.saveConsumeRecord(params);
}

/**
 * 获取计划单详情
 * @param orderId
 * @param callback
 */
tripPlan.getTripPlanOrderById = function (orderId) {
    var self = this;
    var accountId = self.accountId;
    var params = {
        orderId: orderId,
        userId: accountId
    }
    return Q.all([
        API.tripPlan.getTripPlanOrder(params),
        API.staff.getStaff({id: accountId, columns: ['companyId']})
    ])
        .spread(function (order, staff) {
            if (order.companyId != staff.companyId) {
                throw L.ERR.PERMISSION_DENY;
            }
            return order;
        })
}

/**
 * 获取员工已完成计划单分页列表
 * @param callback
 * @returns {*}
 */
tripPlan.pageCompleteTripPlanOrder = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            params.accountId = self.accountId;
            params.companyId = companyId;
            params.auditStatus = 1; //已完成计划单
            var query = checkAndGetParams(['companyId'], ['accountId', 'status', 'auditStatus'], params);
            var page = params.page;
            var perPage = params.perPage;
            typeof page == 'number' ? "" : page = 1;
            typeof perPage == 'number' ? "" : perPage = 10;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }
            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * 获取员工计划单分页列表
 * @param callback
 * @returns {*}
 */
tripPlan.pageTripPlanOrder = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;

    params.status = {$gte: -1};
    if (params.isUpload === true) {
        params.status = {$gt: 0}
    } else if (params.isUpload === false) {
        params.status = {$in: [-1, 0]};
    }
    if (params.audit) { //判断计划单的审核状态，设定auditStatus参数
        var audit = params.audit;
        params.status = 1;
        if (audit == 'Y') {
            params.auditStatus = 1;
        } else if (audit == "P") {
            params.auditStatus = 0;
        } else if (audit == 'N') {
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            params.accountId = self.accountId;
            params.companyId = companyId;
            var query = checkAndGetParams(['companyId'],
                ['accountId', 'status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure'], params);
            var page = params.page;
            var perPage = params.perPage;
            typeof page == 'number' ? "" : page = 1;
            typeof perPage == 'number' ? "" : perPage = 10;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }
            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * 获取员工计划单分页列表(企业)
 * @param callback
 * @returns {*}
 */
tripPlan.pageTripPlanOrderByCompany = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;

    (params.isUpload === true) ? params.status = {$gt: 0} : params.status = 0; //查询条件为是否上传票据，设定查询参数status
    if (params.audit) { //判断计划单的审核状态，设定auditStatus参数
        var audit = params.audit;
        params.status = 1;
        if (audit == 'Y') {
            params.auditStatus = 1;
        } else if (audit == "P") {
            params.auditStatus = 0;
        } else if (audit == 'N') {
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            params.companyId = companyId;
            var query = checkAndGetParams(['companyId'],
                ['accountId', 'status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure'], params);
            var page = params.page;
            var perPage = params.perPage;
            typeof page == 'number' ? "" : page = 1;
            typeof perPage == 'number' ? "" : perPage = 10;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }
            return API.tripPlan.listTripPlanOrder(options);
        })
}

/**
 * 获取差旅计划单列表(企业)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrderByCompany = function (params, callback) {
    if (typeof params == "function") {
        callback = params;
        params = {}
    }
    if (!params) {
        params = {}
    }
    ;
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            params.companyId = companyId;
            return API.tripPlan.listTripPlanOrder(params);
        })
        .nodeify(callback);
}

/**
 * 删除差旅计划单/预算单
 * @param orderId
 * @param callback
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function (orderId, callback) {
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
tripPlan.deleteConsumeDetail = function (id, callback) {
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
tripPlan.uploadInvoice = function (params, callback) {
    params.userId = this.accountId;
    return API.tripPlan.uploadInvoice(params, callback);
}

/**
 * 根据条件统计计划单数目
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.countTripPlanNum = function (params, callback) {
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId})
        .then(function (staff) {
            var companyId = staff.companyId;
            params.companyId = companyId;
            return API.tripPlan.countTripPlanNum(params);
        })
        .nodeify(callback);
}

/**
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
tripPlan.statPlanOrderMoneyByCompany = function (params) {
    var self = this;
    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function (staff) {
            params.companyId = staff.companyId;
            return API.tripPlan.statPlanOrderMoney(params);
        })
}


module.exports = tripPlan;