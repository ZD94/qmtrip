/**
 * Created by yumiao on 15-12-10.
 */

var Q = require("q");
var Models = require("./models").sequelize.models;
var PlanOrder = Models.TripPlanOrder;
var uuid = require("node-uuid");
var L = require("../../common/language");
var Logger = require('../../common/logger');
//var API = require('../../common/api');
var seeds = require('../seeds');
var logger = new Logger("company");

var tripPlan = {}

/**
 * 保存预算单/差旅计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params, callback){
    var defer = Q.defer();
    var checkArr = ['accountId', 'companyId', 'type', 'startPlace', 'destination', 'startAt', 'backAt', 'budget'];
    return Q.all([
        seeds.getSeedNo('tripPlanOrderNo'),
        checkParams(checkArr, params)
    ])
        .spread(function(orderNo){
            logger.info("orderNo=>\n", orderNo);
            params.orderNo = orderNo;
            return PlanOrder.create(params)
                .then(function(ret){
                    return {code: 0, msg: '', tripPlanOrder: ret.dataValues};
                })
        }).nodeify(callback);
}

/**
 * 获取计划单/预算单信息
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.getTripPlanOrder = function(params, callback){
    var checkArr = ['userId', 'orderId'];
    return checkParams(checkArr, params)
        .then(function(){
            var orderId = params.orderId;
            var userId = params.userId;
            logger.info("orderId=>", orderId);
            logger.info("userId=>", userId);
            return PlanOrder.findById(orderId)
                .then(function(ret){
                    logger.info(ret);
                    if(!ret){
                        defer.reject(L.ERR.TRIP_PLAN_ORDER_NOT_EXIST);
                        return defer.promise;
                    }
                    if(ret.accountId != userId){ //权限不足
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    return {code: 0, msg: '', tripPlaOrder: ret.dataValues};
                })
        }).nodeify(callback);
}

/**
 * 更新计划单/预算单信息
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.updateTripPlanOrder = function(params, callback){
    var checkArr = ['userId', 'orderId', 'optLog', 'updates'];
    return checkParams(checkArr, params)
        .then(function(){
            var orderId = params.orderId;
            var userId = params.userId;
            var optLog = params.optLog;
            var updates = params.updates;
            return PlanOrder.findById(orderId, {attributes: ['accountId', 'companyId']})
                .then(function(order){
                    if(!order){
                        defer.reject(L.ERR.TRIP_PLAN_ORDER_NOT_EXIST);
                        return defer.promise;
                    }
                    if(order.accountId != userId){ //权限不足
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    var cols = getColumns(updates);
                    return PlanOrder.update(updates, {returning: true, where: {id: orderId}, fields: cols})
                        .then(function(ret){
                            var entity = ret[1][0].dataValues;
                            return {code: 0, msg: optLog + '成功', tripPlanOrder: entity};
                        })
                })
        }).nodeify(callback);
}

/**
 * 获取差旅计划单/预算单列表
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrder = function(params, callback){
    var defer = Q.defer();
    if(!params || params.userId){
        defer.reject({code: -1, msg: '参数不正确'});
        return defer.promise.nodeify(callback);
    }
    return PlanOrder.findAll(params)
        .then(function(ret){
            return {code: 0, msg: '', tripPlanOrders: ret};
        }).nodeify(callback);
}

/**
 * 获取json params中的columns
 * @param params
 */
function getColumns(params){
    var cols = new Array();
    for(var s in params){
        cols.push(s)
    }
    return cols;
}

function checkParams(checkArray, params, callback){
    var defer = Q.defer();
    ///检查参数是否存在
    for(var key in checkArray){
        var name = checkArray[key];
        if(!params[name] && params[name] !== false && params[name] !== 0){
            defer.reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            return defer.promise.nodeify(callback);
        }
    }
    defer.resolve({code: 0});
    return defer.promise.nodeify(callback);
}

module.exports = tripPlan;