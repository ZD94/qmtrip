/**
 * Created by yumiao on 15-12-10.
 */

var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var PlanOrder = Models.TripPlanOrder;
var ConsumeDetails = Models.ConsumeDetails;
var TripOrderLogs = Models.TripOrderLogs;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var utils = require('common/utils');
var API = require('../../common/api');
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
        API.seeds.getSeedNo('tripPlanOrderNo'),
        checkParams(checkArr, params)
    ])
        .spread(function(orderNo){
            var orderId = uuid.v1();
            params.id = orderId;
            params.orderNo = orderNo;
            var userId = params.accountId;
            return sequelize.transaction(function(t) {
                var execArr = new Array();
                execArr.push(PlanOrder.create(params, {transaction: t})); //保存计划单
                if(params.consumeDetails){ //保存计划单预算和消费详情
                    var details = params.consumeDetails;
                    for(var i in details){
                        var obj = details[i];
                        obj.orderId = orderId;
                        obj.accountId = params.accountId;
                        execArr.push(tripPlan.saveConsumeRecord(obj, {transaction: t}));
                    }
                }
                var logs = {
                    orderId: orderId,
                    userId: userId,
                    remark: '新增计划单 ' + orderNo,
                    createAt: utils.now()
                }
                execArr.push(TripOrderLogs.create(logs, {transaction: t})); //记录计划单操作日志
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
                .then(function(ret){
                    return ret;
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
    var defer = Q.defer();
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
            return PlanOrder.findById(orderId, {attributes: ['id', 'accountId', 'companyId']})
                .then(function(order){
                    if(!order){
                        defer.reject(L.ERR.TRIP_PLAN_ORDER_NOT_EXIST);
                        return defer.promise;
                    }
                    if(order.accountId != userId){ //权限不足
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    var logs = {
                        orderId: order.id,
                        userId: userId,
                        remark: optLog,
                        createAt: utils.now
                    }
                    var cols = getColumns(updates);
                    return sequelize.transaction(function(t){
                        return Q.all([
                            PlanOrder.update(updates, {returning: true, where: {id: orderId}, fields: cols, transaction: t}),
                            TripOrderLogs.create(logs, {transaction: t})
                        ])
                            .spread(function(ret){
                                var entity = ret[1][0].toJSON();
                                return {code: 0, msg: optLog + '成功', tripPlanOrder: entity};
                            })
                    })
                })
        }).nodeify(callback);
}

/**
 * 更新消费详情
 * @param params
 * @param callback
 */
tripPlan.updateConsumeDetail = function(params, callback){
    return checkParams(['userId', 'id', 'updates'], params)
        .then(function(){
            var updates = params.updates;
            var userId = params.userId;
            var id = params.id;
            return ConsumeDetails.findById(id)
                .then(function(ret){
                    var cols = getColumns(updates);
                    return ConsumeDetails.update(updates, {returning: true, where: {id: id}, fields: cols})
                        .then(function(detail){
                            var detail = detail.toJSON();
                            return {code: 0, msg: '更新成功', consumeDetail: detail};
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
 * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
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
                    return sequelize.transaction(function(t){
                        return Q.all([
                            PlanOrder.destory({where: {id: orderId}, transaction: t}),
                            ConsumeDetails.destory({where: {orderId: orderId}, transaction: t})
                        ])
                            .then(function(){
                                return {code: 0, msg: '删除成功'};
                            })
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