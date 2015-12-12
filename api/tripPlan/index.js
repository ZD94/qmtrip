/**
 * Created by yumiao on 15-12-10.
 */

var Q = require("q");
var sequelize = require("./models").sequelize;
var Models = sequelize.models;
var PlanOrder = Models.TripPlanOrder;
var ConsumeDetails = Models.ConsumeDetails
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
    var checkArr = ['accountId', 'companyId', 'type', 'startPlace', 'destination', 'startAt', 'backAt', 'budget'];
    return Q.all([
        seeds.getSeedNo('tripPlanOrderNo'),
        checkParams(checkArr, params)
    ])
        .spread(function(orderNo){
            logger.info("orderNo=>", orderNo);
            var orderId = uuid.v1();
            params.id = orderId;
            params.orderNo = orderNo;

            return sequelize.transaction(function (t) {
                var execArr = [PlanOrder.create(params, {transaction: t})];
                if(params.consumeDetails){
                    var details = params.consumeDetails;
                    for(var i in details){
                        var obj = details[i];
                        obj.orderId = orderId;
                        obj.accountId = params.accountId;
                        execArr.push(tripPlan.saveConsumeRecord(obj, {transaction: t}));
                    }
                }
                return Q.all(execArr)
                    .then(function(arr){
                        var order = arr[0].dataValues;
                        order.outTraffic = new Array();
                        order.backTraffic = new Array();
                        order.hotel = new Array();
                        for(var j = 1; j < arr.length; j++){
                            var obj = arr[j];
                            if(obj.type === -1){
                                order.outTraffic.push(obj);
                            }else if(obj.type === 0){
                                order.hotel.push(obj);
                            }else if(obj.type === 1){
                                order.backTraffic.push(obj);
                            }
                        }
                        return {code: 0, msg: '保存成功', tripPlanOrder: order};
                    })
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
            return Q.all([
                PlanOrder.findById(orderId),
                ConsumeDetails.findAll({where: {orderId: orderId, type: -1}}),
                ConsumeDetails.findAll({where: {orderId: orderId, type: 1}}),
                ConsumeDetails.findAll({where: {orderId: orderId, type: 0}})
            ])
                .spread(function(order, outTraffic, backTraffic, hotel){
                    logger.info(order);
                    if(!order){
                        defer.reject(L.ERR.TRIP_PLAN_ORDER_NOT_EXIST);
                        return defer.promise;
                    }
                    if(order.accountId != userId){ //权限不足
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    var tripPlanOrder = order.dataValues;
                    tripPlanOrder.outTraffic = outTraffic;
                    tripPlanOrder.backTraffic = backTraffic;
                    tripPlanOrder.hotel = hotel;
                    return {code: 0, msg: '', tripPlanOrder: tripPlanOrder};
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
    if(!params || !params.userId || !params.query){
        defer.reject({code: -1, msg: '参数不正确'});
        return defer.promise.nodeify(callback);
    }
    var query = params.query;
    return PlanOrder.findAll(query)
        .then(function(orders){
            return Q.all(orders.map(function(order){
                var orderId = order.id;
                logger.info("orderId=>", orderId);
                return Q.all([
                    ConsumeDetails.findAll({where: {orderId: orderId, type: -1}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 0}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 1}})
                ])
                    .spread(function(outTraffic, hotel, backTraffic){
                        order.outTraffic = outTraffic;
                        order.backTraffic = backTraffic;
                        order.hotel = hotel;
                        return order;
                    })
            }))
                .then(function(orders){
                    return {code: 0, msg: '', tripPlanOrders: orders};
                })
        }).nodeify(callback);
}

/**
 * 保存消费记录详情
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.saveConsumeRecord = function(params, options, callback){
    if(typeof options == 'function'){
        callback = options;
        options = {};
    }
    if(!options){
        options = {};
    }
    var checkArr = ['orderId', 'accountId', 'type', 'startTime', 'endTime', 'invoiceType', 'budget'];
    return checkParams(checkArr, params)
        .then(function(){
            return ConsumeDetails.create(params, options)
                .then(function(ret){
                    return ret.dataValues;
                })
        }).nodeify(callback);
}

/**
 * 删除差旅计划单/预算单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function(params, callback){
    var defer = Q.defer();
    return checkParams(['userId', 'orderId'], params)
        .then(function(){
            var orderId = params.orderId;
            var userId = params.userId;
            return PlanOrder.findById(orderId, {attributes: ['accountId']})
                .then(function(order){
                    if(!order){
                        defer.reject(L.ERR.TRIP_PLAN_ORDER_NOT_EXIST);
                        return defer.promise;
                    }
                    if(order.accountId != userId){ //权限不足
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    return Q.all([
                        PlanOrder.destory({where: {id: orderId}}),
                        ConsumeDetails.destory({where: {orderId: orderId}})
                    ])
                        .then(function(){
                            return {code: 0, msg: '删除成功'};
                        })
                })
        }).nodeify(callback);
}

/**
 * 删除差旅消费明细
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function(params, callback){
    var defer = Q.defer();
    return checkParams(['userId', 'id'])
        .then(function(){
            var id = params.id;
            var userId = params.userId;
            return ConsumeDetails.findById(id, {attributes: ['accountId']})
                .then(function(detail){
                    if(!detail){
                        defer.reject(L.ERR.CONSUME_DETAIL_NOT_EXIST);
                        return defer.promise;
                    }
                    if(detail.accountId != userId){
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    return ConsumeDetails.destory({where: {id: id}})
                        .then(function(){
                            return {code: 0, msg: '删除成功'}
                        })
                })
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