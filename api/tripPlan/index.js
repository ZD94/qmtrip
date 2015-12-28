/**
 * Created by yumiao on 15-12-10.
 */

var Q = require("q");
var moment = require("moment");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var PlanOrder = Models.TripPlanOrder;
var ConsumeDetails = Models.ConsumeDetails;
var TripOrderLogs = Models.TripOrderLogs;
var ConsumeDetailsLogs = Models.ConsumeDetailsLogs;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var utils = require('common/utils');
var getColsFromParams = utils.getColsFromParams;
var API = require('common/api');
var errorHandle = require("common/errorHandle");
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
                        return order;
                    })
            })
                .then(function(ret){
                    return ret;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
                    return tripPlanOrder;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
            return PlanOrder.findById(orderId, {attributes: ['id', 'accountId', 'companyId']});
        })
        .then(function(order){
            if(!order){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            if(order.accountId != userId){ //权限不足
                throw L.ERR.PERMISSION_DENY;
            }
            var logs = {
                orderId: order.id,
                userId: userId,
                remark: optLog,
                createAt: utils.now
            }
            var cols = getColsFromParams(updates);
            return sequelize.transaction(function(t){
                return Q.all([
                        PlanOrder.update(updates, {returning: true, where: {id: orderId}, fields: cols, transaction: t}),
                        TripOrderLogs.create(logs, {transaction: t})
                    ]);
            })
        })
        .spread(function(update, create){
            return update;
        })
        .spread(function(rownum, rows){
            return rows[0];
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 更新消费详情
 * @param params
 * @param callback
 */
tripPlan.updateConsumeDetail = function(params, callback){
    return checkParams(['userId', 'id', 'updates'], params)
        .then(function(){
            return ConsumeDetails.findById(params.id)
        })
        .then(function(ret){
            var cols = getColsFromParams(params.updates);
            return ConsumeDetails.update(params.updates, {returning: true, where: {id: params.id}, fields: cols});
        })
        .catch(errorHandle)
        .nodeify(callback);
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
    return PlanOrder.findAll({where: {}})
        .then(function(orders){
            return Q.all(orders.map(function(order){
                var orderId = order.id;
                order = order;
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
                    return orders;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
    var checkArr = ['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'];
    return checkParams(checkArr, params)
        .then(function(){
            return ConsumeDetails.create(params, options)
                .then(function(ret){
                    return ret.dataValues;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 删除差旅消费明细
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function(params, callback){
    var defer = Q.defer();
    return checkParams(['userId', 'id'], params)
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
        })
        .catch(errorHandle)
        .nodeify(callback);
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
    var defer = Q.defer();
    return checkParams(['userId', 'consumeId', 'picture'], params)
        .then(function(code){
            return ConsumeDetails.findOne({where: {id: params.consumeId, account_id: params.userId}});
        })
        .then(function(custome){
            if(!custome)
                throw L.ERR.NOT_FOUND;

            var invoiceJson = custome.invoice;
            var times = invoiceJson.length ? invoiceJson.length+1 : 1;
            /*if(invoiceJson && invoiceJson.length > 0){
             invoiceJson[invoiceJson.length-1].status = custome.status;
             invoiceJson[invoiceJson.length-1].remark = custome.audit_remark;
             }*/
            var currentInvoice = {times:times, picture:params.picture, create_at:moment().format('YYYY-MM-DD HH:mm'), status:0, remark: '', approve_at: ''};
            invoiceJson.push(currentInvoice);
            var updates = {newInvoice: params.picture, invoice: JSON.stringify(invoiceJson), updateAt: moment().format(), status: 0, auditRemark: ""};
            var logs = {consumeId: params.consumeId, userId: params.userId, remark: "上传票据"};
            return sequelize.transaction(function(t){
                return Q.all([
                    ConsumeDetails.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    ConsumeDetailsLogs.create(logs,{transaction: t})
                ]);
            })
        })
        .spread(function(update, create) {
            return update;
        })
        .spread(function(rownum, rows){
            return rows[0];
        })
        .nodeify(callback);
}

/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params。consumeId 审核消费单id
 * @param params.userId 用户id
 * @param callback
 * @returns {*|Promise}
 */
tripPlan.approveInvoice = function(params, callback){
    var defer = Q.defer();
    return checkParams(['status', 'consumeId', 'userId'], params)
        .then(function(){
            return ConsumeDetails.findOne({where: {id: params.consumeId, account_id: params.userId}});
        })
        .then(function(custome){
            if(!custome)
                throw L.ERR.NOT_FOUND;
            var invoiceJson = custome.invoice;
            if(invoiceJson && invoiceJson.length > 0){
                invoiceJson[invoiceJson.length-1].status = params.status;
                invoiceJson[invoiceJson.length-1].remark = params.remark;
                invoiceJson[invoiceJson.length-1].approve_at = moment().format('YYYY-MM-DD HH:mm');
            }
            var updates = {invoice: JSON.stringify(invoiceJson), updateAt: moment().format(), status: params.status, auditRemark: params.remark};
            var logs = {consumeId: params.consumeId, userId: params.userId, status: params.status, remark: "审核票据-"+params.remark};
            return sequelize.transaction(function(t){
                return Q.all([
                    ConsumeDetails.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    ConsumeDetailsLogs.create(logs,{transaction: t})
                ]);
            });
        })
        .spread(function(update, create) {
            return update;
        })
        .spread(function(rownum, rows){
            return rows[0];
        })
        .nodeify(callback);
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