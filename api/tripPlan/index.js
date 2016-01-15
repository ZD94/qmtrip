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
var _ = require('lodash');
var checkAndGetParams = utils.checkAndGetParams;
var API = require('common/api');
var Paginate = require("common/paginate").Paginate;
var logger = new Logger("company");

var tripPlan = {}

tripPlan.PlanOrderCols = Object.keys(PlanOrder.attributes);

tripPlan.ConsumeDetailsCols = Object.keys(ConsumeDetails.attributes);

/**
 * 保存预算单/差旅计划单
 * @param params
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params){
    if(!params.consumeDetails){
        throw {code: -1, msg: '预算详情 consumeDetails 不能为空'};
    }
    var ConsumeDetailsCols = this.ConsumeDetailsCols;
    var checkArr = ['accountId', 'companyId', 'type', 'destination', 'budget'];
    var getArr = ['startPlace', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'expenditure', 'expendInfo', 'remark', 'description'];
    var _planOrder = checkAndGetParams(checkArr, getArr, params);
    return API.seeds.getSeedNo('tripPlanOrderNo')
        .then(function(orderNo){
            var orderId = uuid.v1();
            _planOrder.id = orderId;
            _planOrder.orderNo = orderNo;
            _planOrder.createAt = utils.now();
            var details = params.consumeDetails;
            var total_budget = 0;
            for(var i in details) {
                var obj = details[i];
                total_budget = parseFloat(total_budget) + parseFloat(obj.budget);
            }
            _planOrder.budget = total_budget;
            return sequelize.transaction(function(t){
                var order = {}
                return PlanOrder.create(_planOrder, {transaction: t})
                    .then(function(ret){
                        order = ret.toJSON();
                        order.outTraffic = new Array();
                        order.backTraffic = new Array();
                        order.hotel = new Array();
                        var details = params.consumeDetails;
                        return Q.all(details.map(function(s){
                            s.orderId = order.id;
                            s.accountId = order.accountId;
                            s.status = 0;
                            s = checkAndGetParams(['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'], ConsumeDetailsCols, s);
                            return ConsumeDetails.create(s, {transaction: t})
                                .then(function(ret){
                                    return ret.toJSON();
                                })
                        }))
                    })
                    .then(function(list){
                        for(var j = 0; j < list.length; j++){
                            var obj = list[j];
                            if(obj.type === -1){
                                order.outTraffic.push(obj);
                            }else if(obj.type === 0){
                                order.hotel.push(obj);
                            }else if(obj.type === 1){
                                order.backTraffic.push(obj);
                            }
                        }
                        var logs = {
                            orderId: order.id,
                            userId: params.accountId,
                            remark: '新增计划单 ' + order.orderNo,
                            createAt: utils.now()
                        }
                        return TripOrderLogs.create(logs, {transaction: t});
                    })
                    .then(function(){
                        return order;
                    })
            })
        })
}


/**
 * 获取计划单/预算单信息
 * @param params
 * @returns {*}
 */
tripPlan.getTripPlanOrder = function(params){
    params = checkAndGetParams(['orderId'], ['columns'], params);
    var orderId = params.orderId;
    var options = {};
    if(params.columns){
        params.columns.push('status');
        options.attributes = params.columns;
    }
    return Q.all([
        PlanOrder.findById(orderId, options),
        ConsumeDetails.findAll({where: {orderId: orderId, type: -1, status: {$ne: -2}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 1, status: {$ne: -2}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 0, status: {$ne: -2}}})
    ])
        .spread(function(order, outTraffic, backTraffic, hotel){
            if(!order || order.status == -2){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            order.setDataValue("outTraffic", outTraffic);
            order.setDataValue("backTraffic", backTraffic);
            order.setDataValue("hotel", hotel);
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
            return sequelize.transaction(function(t){
                return Q.all([
                        PlanOrder.update(updates, {returning: true, where: {id: orderId}, fields: Object.keys(updates), transaction: t}),
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
    var updates = checkAndGetParams(['userId', 'id'], Object.keys(ConsumeDetails.attributes), params, false);
    var id = params.id;
    var userId = params.userId;
    return ConsumeDetails.findById(params.id, {attributes: ['status']})
        .then(function(record){
            if(!record || record.status == -2){
                throw {code: -2, msg: '记录不存在'};
            }
            return ConsumeDetails.update(updates, {returning: true, where: {id: params.id}, fields: Object.keys(updates)});
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
    options.order = [['create_at', 'desc']]; //默认排序，创建时间
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
                        order.setDataValue("outTraffic", outTraffic);
                        order.setDataValue("backTraffic", backTraffic);
                        order.setDataValue("hotel", hotel);
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
tripPlan.saveConsumeRecord = function(params){
    var options = {};
    var checkArr = ['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'];
    params.status = 0;
    var record = checkAndGetParams(checkArr, this.ConsumeDetailsCols, params);
    options.fields = Object.keys(params);

    return PlanOrder.findById(params.orderId, {attributes: ['id', 'status', 'accountId', 'budget']})
        .then(function(order){
            if(!order || order.status == -2){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            if(order.accountId != params.accountId){
                L.ERR.PERMISSION_DENY;
            }
            if(order.status == -1){
                throw {code: -3, msg: '该计划单已失效'};
            }
            if(order.status > 1){
                throw {code: -4, msg: '该计划单已审核，不能添加消费记录'};
            }
            var budget = params.budget || 0;
            order.increment(['budget'], { by: parseFloat(budget) });
            order.status = 0;
            order.updateAt = utils.now();
            return [record, order];
        })
        .spread(function(record, order){
            return sequelize.transaction(function(t){
                options.transaction = t;
                return Q.all([
                    ConsumeDetails.create(record, options),
                    order.save()
                ])
            })
        })
        .spread(function(r){
            return r;
        })
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
            return true;
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
            return true;
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
            return PlanOrder.update({status: 1, auditStatus: 0, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'auditStatus', 'updateAt'], returning: true})
        })
        .then(function(){
            return true;
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
 * 判断某用户是否有访问该消费记录票据权限
 * @param params
 * @returns {Promise.<Instance>}
 */
tripPlan.getVisitPermission = function(params){
    var params = checkAndGetParams(['consumeId', 'userId'], [], params);
    var userId = params.userId;
    var consumeId = params.consumeId;
    return ConsumeDetails.findById(consumeId)
        .then(function(consume){
            if(!consume || consume.status == -2){
                throw {code: -4, msg: '查询记录不存在'};
            }
            if(consume.accountId == userId){//允许自己查看
                return {allow: true, md5key: consume.newInvoice}
            }else{
                return PlanOrder.findById(consume.orderId)
                    .then(function(order){
                        if(!order){
                            throw {code: -4, msg: '订单记录不存在'};
                        }
                        return order.companyId;
                    })
                    .then(function(companyId){
                        return API.company.getCompanyById(companyId)
                            .then(function(company){
                                if(!company){
                                    throw {code: -5, msg: "企业不存在"}
                                }
                                return company.agencyId;
                            })
                    })
                    .then(function(agencyId){
                        return API.agency.getAgencyUser({id: userId})
                            .then(function(agencyUser){
                                if(agencyUser && agencyUser.roleId != 1 && agencyUser.agencyId == agencyId){//允许代理商创建人管理员访问
                                    return {allow: true, md5key: consume.newInvoice};
                                }else{
                                    return {allow: false};
                                }
                            })
                    })
            }
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
            return PlanOrder.findById(consume.orderId, {attributes: ['id', 'expenditure', 'status', 'budget']})
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
                            return PlanOrder.update({status: 0, auditStatus: -1, updateAt: utils.now()}, {where: {id: order.id}, fields: ['auditStatus', 'status', 'updateAt'], transaction: t});
                        }
                        if(!params.expenditure)
                            throw {code: -4, msg: '支出金额不能为空'};
                        var ex_expenditure = order.expenditure || 0;
                        var expenditure = (parseFloat(params.expenditure) + parseFloat(ex_expenditure)).toFixed(2);
                        var order_updates = {
                            expenditure: expenditure,
                            updateAt: utils.now()
                        }
                        return ConsumeDetails.findAll({where: {orderId: order.id, status: {$ne: -2}}, attributes: ['id', 'status']})
                            .then(function(list){
                                for(var i=0; i<list.length; i++){
                                    if(list[i].status != 1 && list[i].id != ret[1][0].id){
                                        return false;
                                    }
                                }
                                return true;
                            })
                            .then(function(isAllAudit){
                                if(isAllAudit){
                                    var score = 0;
                                    (order.budget - order_updates.expenditure)>0?score=parseInt(order.budget - order_updates.expenditure):score=0;
                                    order_updates.status = 2;
                                    order_updates.auditStatus = 1;
                                    order_updates.score = parseInt(score/2);
                                }
                                return PlanOrder.update(order_updates, {where: {id: order.id}, fields: Object.keys(order_updates), transaction: t})
                            })
                    })
            });
        })
        .then(function(){
            return true;
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
    var query_complete = {
        companyId: query.companyId,
        status: {$gte: 2},
        auditStatus: 1
    }
    query.status = {$gte: 0};
    var startAt = {};
    if(params.startTime){
        startAt.$gte = params.startTime;
    }
    if(params.endTime){
        startAt.$lte = params.endTime;
    }
    if(!isObjNull(startAt)){
        query.startAt = startAt;
        query_complete.startAt = startAt;
    }
    return Q.all([
        PlanOrder.findAll({where: query, attributes: ['id']}),
        PlanOrder.findAll({where: query_complete, attributes: ['id']})
    ])
        .spread(function(orders, orders1){
            return [orders.map(function(order){ return order.id; }),
                orders1.map(function(order){ return order.id; })]
        })
        .spread(function(idList, idComplete){
            var q1 = {
                orderId: {$in: idList},
                status: {$ne: -2}
            }
            var q2 = {
                orderId: {$in: idComplete},
                status: 1
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