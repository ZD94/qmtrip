/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
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
var checkAndGetParams = utils.checkAndGetParams;
var API = require('common/api');
var Paginate = require("common/paginate").Paginate;
var logger = new Logger("company");

var tripPlan = {}

/**
 * 保存预算单/差旅计划单
 * @param params
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params){
    var checkArr = ['accountId', 'companyId', 'type', 'destination', 'budget'];
    var getArr = ['startPlace', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'expenditure', 'expendInfo', 'remark'];
    var _planOrder = checkAndGetParams(checkArr, getArr, params);
    return API.seeds.getSeedNo('tripPlanOrderNo')
        .then(function(orderNo){
            var orderId = uuid.v1();
            _planOrder.id = orderId;
            _planOrder.orderNo = orderNo;
            _planOrder.createAt = utils.now();
            var userId = params.accountId;
            var execArr = new Array();
            return sequelize.transaction(function(t){
                execArr.push(PlanOrder.create(_planOrder, {transaction: t})); //保存计划单
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
            })
        })
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
}


/**
 * 获取计划单/预算单信息
 * @param params
 * @returns {*}
 */
tripPlan.getTripPlanOrder = function(params){
    params = checkAndGetParams(['userId', 'orderId'], [], params);
    var orderId = params.orderId;
    var userId = params.userId;
    return Q.all([
        PlanOrder.findById(orderId),
        ConsumeDetails.findAll({where: {orderId: orderId, type: -1, status: {$ne: -2}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 1, status: {$ne: -2}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 0, status: {$ne: -2}}})
    ])
        .spread(function(order, outTraffic, backTraffic, hotel){
            if(!order || order.status == -2){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            order.outTraffic = outTraffic;
            order.backTraffic = backTraffic;
            order.hotel = hotel;
            return order;
        })
}

/**
 * 更新计划单/预算单信息
 * @param params
 * @returns {*}
 */
tripPlan.updateTripPlanOrder = function(params){
    var checkArr = ['userId', 'orderId', 'optLog', 'updates'];
    var params = checkAndGetParams(checkArr, [], params);
    var orderId = params.orderId;
    var userId = params.userId;
    var optLog = params.optLog;
    var updates = params.updates;
    return PlanOrder.findById(orderId, {attributes: ['id', 'accountId', 'companyId', 'status']})
        .then(function(order){
            if(!order || order.status == -2){
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
        });
}

/**
 * 更新消费详情
 * @param params
 */
tripPlan.updateConsumeDetail = function(params){
    var updates = checkAndGetParams(['userId', 'id'], [], params, false);
    var id = params.id;
    var userId = params.userId;
    return ConsumeDetails.findById(params.id, {attributes: ['status']})
        .then(function(record){
            if(!record || record.status == -2){
                throw {code: -2, msg: '记录不存在'};
            }
            var cols = getColsFromParams(updates);
            return ConsumeDetails.update(updates, {returning: true, where: {id: params.id}, fields: cols});
        })
}


/**
 * 获取差旅计划单/预算单列表
 * @param params
 * @returns {*}
 */
tripPlan.listTripPlanOrder = function(options){
    var query = options.where;
    var status = query.status;
    typeof status == 'object'?query.status.$ne = -2:query.status = status;
    if(!query.status && query.status != 0){
        query.status = {$ne: -2};
    }
    return PlanOrder.findAndCount(options)
        .then(function(ret){
            if(!ret || ret.rows .length === 0){
                return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, []);
            }
            var orders = ret.rows;
            return Q.all(orders.map(function(order){
                var orderId = order.id;
                return Q.all([
                    ConsumeDetails.findAll({where: {orderId: orderId, type: -1, status: {$ne: -2}}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 0, status: {$ne: -2}}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 1, status: {$ne: -2}}})
                ])
                    .spread(function(outTraffic, hotel, backTraffic){
                        order.outTraffic = outTraffic;
                        order.backTraffic = backTraffic;
                        order.hotel = hotel;
                        return order;
                    })
            }))
            .then(function(orders){
                    return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, orders);
                })
        })
}

/**
 * 保存消费记录详情
 * @param params
 * @returns {*}
 */
tripPlan.saveConsumeRecord = function(params, options){
    if(!options){
        options = {};
    }
    var checkArr = ['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'];
    var fields = getColsFromParams(ConsumeDetails.attributes);
    params.status = 0;
    params = checkAndGetParams(checkArr, fields, params);
    options.fields = getColsFromParams(params);
    return ConsumeDetails.create(params, options);
}

/**
 * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
 * @param params
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function(params){
    var params = checkAndGetParams(['userId', 'orderId'], [], params);
    var orderId = params.orderId;
    var userId = params.userId;
    return PlanOrder.findById(orderId, {attributes: ['accountId', 'status']})
        .then(function(order){
            if(!order || order.status == -2){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST
            }
            if(order.accountId != userId){ //权限不足
                throw L.ERR.PERMISSION_DENY;
            }
            return sequelize.transaction(function(t){
                return Q.all([
                    PlanOrder.update({status: -2}, {where: {id: orderId}, fields: ['status'], transaction: t}),
                    ConsumeDetails.update({status: -2}, {where: {orderId: orderId}, fields: ['status'], transaction: t})
                ])
            })
        })
        .then(function(){
            return {code: 0, msg: '删除成功'};
        })
}

/**
 * 删除差旅消费明细
 * @param params
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function(params){
    var params = checkAndGetParams(['userId', 'id'], [], params);
    var id = params.id;
    var userId = params.userId;
    return ConsumeDetails.findById(id, {attributes: ['accountId']})
        .then(function(detail){
            if(!detail || detail.status == -2){
                throw L.ERR.CONSUME_DETAIL_NOT_EXIST;
            }
            if(detail.accountId != userId){
                throw L.ERR.PERMISSION_DENY;
            }
            return ConsumeDetails.update({status: -2, updateAt: utils.now()}, {where: {id: id}, fields: ['status', 'updateAt']})
        })
        .then(function(){
            return {code: 0, msg: '删除成功'}
        })
}

/**
 * 上传票据
 * @param params
 * @param params.userId 用户id
 * @param params.consumeId 消费详情id
 * @param params.picture 新上传的票据md5key
 * @returns {*}
 */
tripPlan.uploadInvoice = function(params){
    var params = checkAndGetParams(['userId', 'consumeId', 'picture'], [], params);
    var orderId = "";
    return ConsumeDetails.findOne({where: {id: params.consumeId, account_id: params.userId}})
        .then(function(custome){
            if(!custome || custome.status == -2)
                throw L.ERR.NOT_FOUND;
            orderId = custome.orderId;
            var invoiceJson = custome.invoice;
            var times = invoiceJson.length ? invoiceJson.length+1 : 1;
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
        .spread(function() {
            return ConsumeDetails.findAll({where: {orderId: orderId}})
        })
        .then(function(list){
            for(var i=0; i<list.length; i++){
                if(!list[i].newInvoice)
                    return;
            }
            return PlanOrder.update({status: 1, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'updateAt'], returning: true})
        })
        .then(function(){
            return {code: 0, msg: '上传成功'};
        })
}

/**
 * 查询计划单消费记录
 * @param params
 * @returns {*}
 */
tripPlan.getConsumeDetail = function(params){
    var params = checkAndGetParams(['consumeId', 'userId'], [], params);
    var consumeId = params.consumeId;
    return ConsumeDetails.findById(consumeId)
        .then(function(consumeDetail){
            if(!consumeDetail || consumeDetail.status == -2){
                throw {code: -4, msg: '查询记录不存在'};
            }
            return consumeDetail;
        })
}

/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params。consumeId 审核消费单id
 * @param params.userId 用户id
 * @returns {*|Promise}
 */
tripPlan.approveInvoice = function(params){
    var params = checkAndGetParams(['status', 'consumeId', 'userId'], ['remark', 'expenditure'], params);
    return ConsumeDetails.findById(params.consumeId)
        .then(function(consume){
            if(!consume || consume.status == -2)
                throw L.ERR.NOT_FOUND;
            if(!consume.newInvoice){
                throw {code: -2, msg: '没有上传票据'};
            }
            if(consume.status == 1){
                throw {code: -3, msg: '该票据已审核通过，不能重复审核'};
            }
            return PlanOrder.findById(consume.orderId, {attributes: ['id', 'expenditure', 'status']})
                .then(function(order){
                    if(!order || order.status == -2){
                        throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST
                    }
                    return [order, consume];
                })
        })
        .spread(function(order, consume){
            var invoiceJson = consume.invoice;
            if(invoiceJson && invoiceJson.length > 0){
                invoiceJson[invoiceJson.length-1].status = params.status;
                invoiceJson[invoiceJson.length-1].remark = params.remark;
                invoiceJson[invoiceJson.length-1].approve_at = utils.now();
            }
            var updates = {
                invoice: JSON.stringify(invoiceJson),
                updateAt: utils.now(),
                status: params.status,
                expenditure: params.expenditure
            };
            if(params.remark){
                updates.auditRemark = params.remark;
            }
            var logs = {consumeId: params.consumeId, userId: params.userId, status: params.status, remark: "审核票据-"+params.remark};
            return sequelize.transaction(function(t){
                return Q.all([
                    ConsumeDetails.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    ConsumeDetailsLogs.create(logs,{transaction: t})
                ])
                    .spread(function(ret){
                        var status = params.status;
                        if(status == -1){
                            return PlanOrder.update({status: 0, auditStatus: -1, updateAt: utils.now()}, {where: {id: order.id}, fields: ['auditStatus', 'status', 'updateAt'], transaction: t})
                        }
                        if(!params.expenditure)
                            throw {code: -4, msg: '支出金额不能为空'};
                        var ex_expenditure = order.expenditure || 0;
                        var expenditure = (parseFloat(params.expenditure) + parseFloat(ex_expenditure)).toFixed(2);
                        var order_updates = {
                            expenditure: expenditure,
                            updateAt: utils.now()
                        }
                        return ConsumeDetails.findAll({where: {orderId: ret.orderId, status: {$ne: -2}}, attributes: ['status']})
                            .then(function(list){
                                for(var i=0; i<list.length; i++){
                                    if(list[i].status != 1){
                                        return false;
                                    }
                                }
                                return true;
                            })
                            .then(function(isAllAudit){
                                if(isAllAudit){
                                    order_updates.status = 2;
                                    order_updates.auditStatus = 1;
                                }
                                var fields = getColsFromParams(order_updates);
                                return PlanOrder.update(order_updates, {where: {id: order.id}, fields: fields, transaction: t})
                            })

                    })
            });
        })
        .then(function(){
            return {code: 0};
        })
}

/**
 * 统计计划单数量
 *
 * @param params
 */
tripPlan.countTripPlanNum = function(params){
    var query = checkAndGetParams(['companyId'], ['accountId', 'status'], params);
    query.status = {$ne: -2};
    return PlanOrder.count({where: query});
}

/**
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
tripPlan.statPlanOrderMoney = function(params){
    var query = checkAndGetParams(['companyId'], [], params);
    var createAt = {};
    if(params.startTime){
        createAt.$gte = params.startTime;
    }
    if(params.endTime){
        createAt.$lte = params.endTime;
    }
    return PlanOrder.findAll({where: query, attributes: ['id']})
        .then(function(orders){
            return orders.map(function(order){
                return order.id;
            })
        })
        .then(function(idList){
            var q1 = {
                orderId: {$in: idList},
                status: {$ne: -2}
            }
            var q2 = {
                orderId: {$in: idList},
                status: 1
            }
            if(!isObjNull(createAt)){
                q1.createAt = createAt;
                q2.createAt = createAt;
            }
            return Q.all([
                ConsumeDetails.sum('budget', {where: q1}),
                ConsumeDetails.sum('budget', {where: q2}),
                ConsumeDetails.sum('expenditure', {where: q2})
            ])
        })
        .spread(function(n1, n2, n3){
            return {
                qmBudget: n1 || 0,
                planMoney: n2 || 0,
                expenditure: n3 || 0
            }
        })
}

/**
 * 判断JSON对象是否为空
 * @param obj
 * @returns {boolean}
 */
function isObjNull(obj){
    for (var s in obj){
        return false;
    }
    return true;
}

module.exports = tripPlan;