/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
var moment = require("moment");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var PlanOrder = Models.TripPlanOrder;
var ConsumeDetails = Models.ConsumeDetails;
var TripOrderLogs = Models.TripOrderLogs;
var ConsumeDetailsLogs = Models.ConsumeDetailsLogs;
var Projects = Models.Projects;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var utils = require('common/utils');
var _ = require('lodash');
var API = require('common/api');
var Paginate = require("common/paginate").Paginate;
var logger = new Logger("company");
var validate = require("common/validate");

var STATUS = {
    DELETE: -2, //删除
    NO_BUDGET: -1, //没有预算
    NO_COMMIT: 0, //待提交状态
    COMMIT: 1, //已提交待审核状态
    COMPLETE: 2 //审核完，已完成状态
}

var tripPlan = {}

var ConsumeDetailsCols = Object.keys(ConsumeDetails.attributes);

/**
 * 保存预算单/差旅计划单
 * @param params
 * @returns {*}
 */
tripPlan.savePlanOrder = savePlanOrder;
savePlanOrder.required_params = ['consumeDetails', 'accountId', 'companyId', 'type', 'destination', 'budget', 'destinationCode', 'description'];
savePlanOrder.optional_params = ['startPlace', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'expenditure', 'expendInfo', 'remark', 'destinationCode', 'startPlaceCode', 'projectId'];
var consumeDetails_required_fields = ['type', 'startTime', 'invoiceType', 'budget'];
function savePlanOrder(params){
    var consumeDetails = params.consumeDetails.map(function(detail){
        consumeDetails_required_fields.forEach(function(key){
            if(!_.has(detail, key)){
                throw {code: '-1', msg: 'consumeDetails的属性' + key + '没有指定'};
            }
        })

        if(detail.startPlace && !detail.startPlaceCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.arrivalPlace && !detail.arrivalPlaceCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.city && !detail.cityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        return _.pick(detail, ConsumeDetailsCols);
    });

    delete params.consumeDetails;
    var _planOrder = params;

    if(_planOrder.startPlace && !_planOrder.startPlaceCode) {
        throw {code: -3, msg: '城市代码不能为空'};
    }

    return Promise.all([
        API.seeds.getSeedNo('tripPlanOrderNo'),
        getProjectByName({companyId: _planOrder.companyId, name: _planOrder.description, userId: _planOrder.accountId, isCreate: true})
    ])
        .spread(function(orderNo, project){
            var orderId = uuid.v1();
            _planOrder.id = orderId;
            _planOrder.orderNo = orderNo;
            _planOrder.createAt = utils.now();
            _planOrder.projectId = project.id;
            var total_budget = 0;
            var isBudget = true;
            for(var i in consumeDetails) {
                var obj = consumeDetails[i];

                if(!/^-?\d+(\.\d{1,2})?$/.test(obj.budget)) {
                    throw {code: -2, nsg: '预算金额格式不正确'};
                }

                if(obj.budget > 0) {
                    total_budget = parseFloat(total_budget) + parseFloat(obj.budget);
                } else {
                    isBudget = false;
                }
            }

            _planOrder.budget = total_budget;
            if(!isBudget) {
                _planOrder.status = STATUS.NO_BUDGET; //待录入预算状态
                _planOrder.budget = -1;
            }

            return sequelize.transaction(function(t){
                var order = {};
                return PlanOrder.create(_planOrder, {transaction: t})
                    .then(function(ret){
                        order = ret.toJSON();
                        order.outTraffic = new Array();
                        order.backTraffic = new Array();
                        order.hotel = new Array();

                        return Promise.all(consumeDetails.map(function(detail){
                            detail.orderId = order.id;
                            detail.accountId = order.accountId;
                            detail.status = STATUS.NO_COMMIT;
                            detail.isCommit = false;

                            return ConsumeDetails.create(detail, {transaction: t})
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
tripPlan.getTripPlanOrder = getTripPlanOrder;
getTripPlanOrder.required_params = ['orderId'];
getTripPlanOrder.optional_params = ['columns'];
function getTripPlanOrder(params){
    var orderId = params.orderId;
    var options = {};

    if(params.columns){
        params.columns.push('status');
        options.attributes = params.columns;
    }

    return Promise.all([
        PlanOrder.findById(orderId, options),
        ConsumeDetails.findAll({where: {orderId: orderId, type: -1, status: {$ne: STATUS.DELETE}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 1, status: {$ne: STATUS.DELETE}}}),
        ConsumeDetails.findAll({where: {orderId: orderId, type: 0, status: {$ne: STATUS.DELETE}}})
    ])
        .spread(function(order, outTraffic, backTraffic, hotel){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            order.setDataValue("outTraffic", outTraffic);
            order.setDataValue("backTraffic", backTraffic);
            order.setDataValue("hotel", hotel);

            return order;
        })
}


tripPlan.getConsumeInvoiceImg = function(params) {
    var consumeId = params.consumeId;

    if (!consumeId) {
        throw {code: -1, msg: "consumeId不能为空"};
    }

    return ConsumeDetails.findById(consumeId)
        .then(function(consumeDetail) {
            return API.attachments.getAttachment({id: consumeDetail.newInvoice})
        })
        .then(function(attachment) {
            if (!attachment) {
                L.ERR.NOT_FOUND;
            }

            return 'data:image/jpg;base64,' + attachment.content;
        })
        .then(function(result) {
            return result;
        })

}

tripPlan.getConsumeDetail = getConsumeDetail;
getConsumeDetail.required_params = ['consumeId'];
getConsumeDetail.optional_params = ['columns'];
function getConsumeDetail(params){
    var options = {};

    if(params.columns){
        options.attributes = _.intersection(params.columns, ConsumeDetailsCols);
    }

    return ConsumeDetails.findById(params.consumeId, options)
        .then(function(detail){
            if(!detail || detail.status == STATUS.DELETE){
                throw {code: -2, msg: '消费记录不存在'};
            }
            return detail;
        })
}

/**
 * 更新计划单/预算单信息
 * @param params
 * @returns {*}
 */
tripPlan.updateTripPlanOrder = updateTripPlanOrder;
updateTripPlanOrder.required_params = ['userId', 'orderId', 'optLog', 'updates'];
function updateTripPlanOrder(params){
    var orderId = params.orderId;
    var userId = params.userId;
    var optLog = params.optLog;
    var updates = params.updates;

    return PlanOrder.findById(orderId, {attributes: ['id', 'accountId', 'companyId', 'status']})
        .then(function(order){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            var logs = {
                orderId: order.id,
                userId: userId,
                remark: optLog,
                createAt: utils.now()
            }

            return sequelize.transaction(function(t){
                return Promise.all([
                    PlanOrder.update(updates, {returning: true, where: {id: orderId}, fields: Object.keys(updates), transaction: t}),
                    TripOrderLogs.create(logs, {transaction: t})
                ]);
            })
        })
        .spread(function(update){
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
tripPlan.updateConsumeDetail = updateConsumeDetail;
updateConsumeDetail.required_params = ['id'];
updateConsumeDetail.optional_params = _.keys(ConsumeDetails.attributes);
function updateConsumeDetail(params){
    var updates = params;

    return ConsumeDetails.findById(params.id, {attributes: ['status']})
        .then(function(record){
            if(!record || record.status == STATUS.DELETE){
                throw {code: -2, msg: '票据不存在'};
            }

            if(record.status == 1){
                throw {code: -3, msg: '该票据已经审核通过，不能修改'};
            }

            return ConsumeDetails.update(updates, {returning: true, where: {id: params.id}, fields: Object.keys(updates)});
        })
}

tripPlan.updateConsumeBudget = updateConsumeBudget;
updateConsumeBudget.required_params = ['id', 'budget', 'userId'];
function updateConsumeBudget(params){
    var id = params.id;

    return ConsumeDetails.findById(id, {attributes: ['status', 'budget', 'orderId']})
        .then(function(ret){
            if(!ret ||ret.status == STATUS.DELETE){
                throw {code: -2, msg: '票据不存在'};
            }

            if(ret.status == 1){
                throw {code: -3, msg: '该票据已经审核通过，不能修改预算'};
            }

            return [ret.budget, PlanOrder.findById(ret.orderId, {attributes: ['id', 'budget', 'status']})];
        })
        .spread(function(o_budget, order){
            if(order.status == STATUS.COMMIT){
                throw {code: -4, msg: '该次出差计划已经提交，不能修改预算'};
            }

            if(order.status > STATUS.COMMIT){
                throw {code: -5, msg: '该次出差计划已经审核通过，不能修改预算'};
            }

            var budget = params.budget;
            //var c_budget = 0;
            //if(o_budget > 0) {
            //    c_budget = parseFloat(order.budget) - parseFloat(o_budget) + parseFloat(budget);
            //} else {
            //    c_budget = parseFloat(order.budget) + parseFloat(budget)
            //}

            var logs = {
                orderId: order.id,
                userId: params.userId,
                remark: "更新预算",
                createAt: utils.now()
            }

            return sequelize.transaction(function(t){
                return Promise.all([
                    order.id,
                    ConsumeDetails.update({budget: budget, updateAt: utils.now()}, {where: {id: id}, fields: ['budget', 'updateAt'], transaction: t}),
                    TripOrderLogs.create(logs, {transaction: t})
                ])
            })
        })
        .spread(function(orderId){
            return [orderId, ConsumeDetails.findAll({where: {orderId: orderId, status: {$ne: -2}}, attributes: ['budget']})];
        })
        .spread(function(orderId, list){
            var c_budget = 0;
            for(var i=0; i<list.length; i++){
                var budget = list[i].budget;
                if(budget < 0) {
                    return true;
                }
                c_budget += parseFloat(budget);
            }

            return PlanOrder.update({status: STATUS.NO_COMMIT, budget: c_budget, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'budget', 'updateAt']})
        })
        .then(function(){
            return true;
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
    typeof status == 'object'?query.status.$ne = STATUS.DELETE:query.status = status;

    if(!query.status && query.status != STATUS.NO_COMMIT){
        query.status = {$ne: STATUS.DELETE};
    }

    if(!options.order) {
         options.order = [['start_at', 'desc'], ['create_at', 'desc']]; //默认排序，创建时间
    }

    return PlanOrder.findAndCount(options)
        .then(function(ret){
            if(!ret || ret.rows .length === 0){
                return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, []);
            }
            var orders = ret.rows;

            return Promise.all(orders.map(function(order){
                var orderId = order.id;
                return Promise.all([
                    ConsumeDetails.findAll({where: {orderId: orderId, type: -1, status: {$ne: STATUS.DELETE}}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 0, status: {$ne: STATUS.DELETE}}}),
                    ConsumeDetails.findAll({where: {orderId: orderId, type: 1, status: {$ne: STATUS.DELETE}}})
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


tripPlan.findOrdersByOption = findOrdersByOption;
findOrdersByOption.required_params = ['where'];
function findOrdersByOption(options) {
    return PlanOrder.findAll(options);
}

/**
 * 保存消费记录详情
 * @param params
 * @returns {*}
 */
tripPlan.saveConsumeRecord = saveConsumeRecord;
saveConsumeRecord.required_params = ['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'];
saveConsumeRecord.optional_params = ConsumeDetailsCols;
function saveConsumeRecord(params){
    var record = params;
    record.isCommit = false;
    record.status = STATUS.NO_COMMIT;
    var options = {};
    options.fields = Object.keys(record);

    return PlanOrder.findById(params.orderId, {attributes: ['id', 'status', 'accountId', 'budget']})
        .then(function(order){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            if(order.accountId != params.accountId){
                L.ERR.PERMISSION_DENY;
            }

            if(order.status == STATUS.COMMIT){
                throw {code: -3, msg: '该订单已提交，不能添加消费单据'};
            }

            if(order.status > STATUS.COMMIT){
                throw {code: -4, msg: '该计划单已审核，不能添加消费单据'};
            }

            var budget = params.budget || 0;
            if(budget >0){
                order.increment(['budget'], { by: parseFloat(budget) });
            }


            if(order.status > STATUS.NO_COMMIT){
                order.status = STATUS.NO_COMMIT;
            }

            order.updateAt = utils.now();
            return [record, order];
        })
        .spread(function(record, order){
            return sequelize.transaction(function(t){
                options.transaction = t;

                var logs = {
                    orderId: order.id,
                    userId: params.accountId,
                    remark: "增加新的预算",
                    createAt: utils.now()
                }

                return Promise.all([
                    ConsumeDetails.create(record, options),
                    TripOrderLogs.create(logs, {transaction: t}),
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
tripPlan.deleteTripPlanOrder = deleteTripPlanOrder;
deleteTripPlanOrder.required_params = ['userId', 'orderId'];
function deleteTripPlanOrder(params){
    var orderId = params.orderId;
    var userId = params.userId;
    return PlanOrder.findById(orderId, {attributes: ['accountId', 'status']})
        .then(function(order){

            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST
            }

            if(order.accountId != userId){ //权限不足
                throw L.ERR.PERMISSION_DENY;
            }

            return sequelize.transaction(function(t){
                return Promise.all([
                    PlanOrder.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'updateAt'], transaction: t}),
                    ConsumeDetails.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {orderId: orderId}, fields: ['status', 'updateAt'], transaction: t})
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
tripPlan.deleteConsumeDetail = deleteConsumeDetail;
deleteConsumeDetail.required_params = ['userId', 'id'];
function deleteConsumeDetail(params){
    var id = params.id;
    var userId = params.userId;

    return ConsumeDetails.findById(id, {attributes: ['accountId']})
        .then(function(detail){
            if(!detail || detail.status == STATUS.DELETE){
                throw L.ERR.CONSUME_DETAIL_NOT_EXIST;
            }

            if(detail.accountId != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            return ConsumeDetails.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {id: id}, fields: ['status', 'updateAt']})
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
tripPlan.uploadInvoice = uploadInvoice;
uploadInvoice.required_params = ['userId', 'consumeId', 'picture'];
function uploadInvoice(params){
    var orderId = "";

    return ConsumeDetails.findById(params.consumeId, {attributes: ['status', 'orderId', 'invoice', 'accountId']})
        .then(function(custome){
            if(!custome || custome.status == STATUS.DELETE)
                throw L.ERR.NOT_FOUND;

            if(custome.accountId != params.userId)
                throw L.ERR.PERMISSION_DENY;

            orderId = custome.orderId;
            return [orderId, custome, PlanOrder.findById(orderId, {attributes: ['status']})]
        })
        .spread(function(orderId, custome, order){
            if(order.status == STATUS.NO_BUDGET){
                throw {code: -2, msg: '还没有录入出差预算'};
            }
            var invoiceJson = custome.invoice;
            var times = invoiceJson.length ? invoiceJson.length+1 : 1;
            var currentInvoice = {times:times, picture:params.picture, create_at:moment().format('YYYY-MM-DD HH:mm'), status:STATUS.NO_COMMIT, remark: '', approve_at: ''};
            invoiceJson.push(currentInvoice);
            var updates = {
                newInvoice: params.picture,
                invoice: JSON.stringify(invoiceJson),
                updateAt: moment().format("YYYY-MM-DD HH:mm:ss"),
                status: STATUS.NO_COMMIT,
                auditRemark: params.auditRemark || ''
            };
            var logs = {consumeId: params.consumeId, userId: params.userId, remark: "上传票据"};
            var orderLogs = {orderId: custome.orderId, userId: params.userId, remark: '上传票据', createAt: utils.now()};

            return sequelize.transaction(function(t){
                return Promise.all([
                    ConsumeDetails.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    ConsumeDetailsLogs.create(logs,{transaction: t}),
                    TripOrderLogs.create(orderLogs, {transaction: t}),
                    PlanOrder.update({status: STATUS.NO_COMMIT, auditStatus: 0, updateAt: utils.now()}, {where: {id: orderId}})
                ]);
            })
        })
        .then(function(){
            return true;
        })
}


/**
 * 判断某用户是否有访问该消费记录票据权限
 * @param params
 * @returns {Promise.<Instance>}
 */
tripPlan.getVisitPermission = getVisitPermission;
getVisitPermission.required_params = ['consumeId', 'userId'];
function getVisitPermission(params){
    var userId = params.userId;
    var consumeId = params.consumeId;

    return ConsumeDetails.findById(consumeId)
        .then(function(consume){
            if(!consume || consume.status == STATUS.DELETE){
                throw {code: -4, msg: '查询记录不存在'};
            }

            if(consume.accountId == userId){//允许自己查看
                return {allow: true, fileId: consume.newInvoice}
            }else{
                return PlanOrder.findById(consume.orderId)
                    .then(function(order){
                        if(!order){
                            throw {code: -4, msg: '订单记录不存在'};
                        }
                        return order.companyId;
                    })
                    .then(function(companyId){
                        return API.company.getCompany({companyId: companyId})
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
                                    return {allow: true, fileId: consume.newInvoice};
                                }else{
                                    return {allow: false};
                                }
                            })
                    })
            }
        })
        .catch(function(err){
            console.error(err);
        })

}

/**
 * 保存出差计划日志
 * @type {saveOrderLogs}
 */
tripPlan.saveOrderLogs = saveOrderLogs;
saveOrderLogs.required_params = ['userId', 'orderId', 'remark']
function saveOrderLogs(logs){
    return PlanOrder.findById(params.orderId, {attributes: ['status']})
        .then(function(order){
            if(!order || order,status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            if(order.status == STATUS.COMPLETE){
                throw {code: -2, msg: '该计划单已完成，不能增加日志'};
            }

            logs.createAt = utils.now();
            return TripOrderLogs.create(logs);
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
tripPlan.approveInvoice = approveInvoice;
approveInvoice.required_params = ['status', 'consumeId', 'userId'];
approveInvoice.optional_params = ['remark', 'expenditure'];
function approveInvoice(params){
    return ConsumeDetails.findById(params.consumeId)
        .then(function(consume){
            if(!consume || consume.status == STATUS.DELETE)
                throw L.ERR.NOT_FOUND;

            if(!consume.newInvoice){
                throw {code: -2, msg: '没有上传票据'};
            }

            if(consume.status == STATUS.COMMIT){
                throw {code: -3, msg: '该票据已审核通过，不能重复审核'};
            }

            return [PlanOrder.findById(consume.orderId, {attributes: ['id', 'expenditure', 'status', 'budget', 'auditStatus']}), consume]
        })
        .spread(function(order, consume){
            var invoiceJson = consume.invoice;

            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            if(order.status === STATUS.NO_COMMIT && order.auditStatus == 0){
                throw {code: -3, msg: '该订单未提交，不能审核'};
            }

            if(invoiceJson && invoiceJson.length > 0){
                invoiceJson[invoiceJson.length-1].status = params.status;
                invoiceJson[invoiceJson.length-1].remark = params.remark;
                invoiceJson[invoiceJson.length-1].approve_at = utils.now();
            }

            var updates = {
                invoice: JSON.stringify(invoiceJson),
                updateAt: utils.now(),
                status: params.status,
                auditUser: params.userId,
                expenditure: params.expenditure
            };

            if(params.remark){
                updates.auditRemark = params.remark;
            }

            var logs = {consumeId: params.consumeId, userId: params.userId, status: params.status, remark: "审核票据-"+params.remark};

            return sequelize.transaction(function(t){
                if(updates.status == STATUS.NO_BUDGET) {
                    updates.isCommit =false;
                }
                return Promise.all([
                    ConsumeDetails.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    ConsumeDetailsLogs.create(logs,{transaction: t})
                ])
                    .spread(function(ret){
                        var status = params.status;

                        if(status == STATUS.NO_BUDGET){
                            return PlanOrder.update({status: STATUS.NO_COMMIT, auditStatus: -1, updateAt: utils.now()},
                                {where: {id: order.id}, fields: ['auditStatus', 'status', 'updateAt'], transaction: t});
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
                                    if(list[i].status != STATUS.COMMIT && list[i].id != ret[1][0].id){
                                        return false;
                                    }
                                }

                                return true;
                            })
                            .then(function(isAllAudit){
                                if(isAllAudit){
                                    var score = 0;
                                    (order.budget - order_updates.expenditure)>0?score=parseInt(order.budget - order_updates.expenditure):score=0;
                                    order_updates.status = STATUS.COMPLETE;
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
tripPlan.countTripPlanNum = countTripPlanNum;
countTripPlanNum.required_params = ['companyId'];
countTripPlanNum.optional_params = ['accountId', 'status'];
function countTripPlanNum(params){
    var query = params;
    query.status = {$ne: STATUS.DELETE};
    return PlanOrder.count({where: query});
}


/**
 * 按月份统计预算/计划/完成金额
 * @type {statBudgetByMonth}
 */
tripPlan.statBudgetByMonth = statBudgetByMonth;
statBudgetByMonth.required_params = ['companyId'];
statBudgetByMonth.optional_params = ['startTime', 'endTime', 'accountId'];
function statBudgetByMonth(params) {
    var stTime = params.startTime||moment().format('YYYY-MM-DD');
    var enTime = params.endTime||moment().format('YYYY-MM-DD');
    var timeArr = [];
    do{
        var t = moment(stTime).format('YYYY-MM-');
        timeArr.push(t + '0\\d');
        timeArr.push(t + '1\\d');
        timeArr.push(t + '2\\d');
        stTime = moment(stTime).add(1, 'months').format('YYYY-MM-DD');
    }while(stTime<enTime);

    var sql = 'select sum(budget) as \"planMoney\",sum(expenditure) as expenditure ' +
        'from tripplan.trip_plan_order where company_id=\'' + params.companyId + '\'';

    if(params.accountId) {
        sql += ' and account_id=\'' + params.accountId + '\'';
    }

    var complete_sql = sql + ' and status=2 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';

    sql += ' and status > -1 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';

    return Promise.all(
        timeArr.map(function(month) {
            var s_sql = sql + month + '\';';
            var c_sql = complete_sql + month + '\';';

            var index = month.match(/\d{4}-\d{2}-(\d).*/)[1];
            var remark = '';
            if(index === '0') {
                remark = '上旬';
            }else if(index === '1') {
                remark = '中旬';
            }else if(index === '2') {
                remark = '下旬';
            }

            var month = month.match(/\d{4}-\d{2}/)[0];
            return Promise.all([
                sequelize.query(s_sql),
                sequelize.query(c_sql)
            ])
                .spread(function(all, complete){
                    var a = all[0][0];
                    var c = complete[0][0];
                    var stat = {
                        month: month,
                        qmBudget: a.planMoney|0,
                        planMoney: c.planMoney|0,
                        expenditure: c.expenditure|0,
                        remark: remark
                    };

                    return stat;
                })
        })
    )
}

/**
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
tripPlan.statPlanOrderMoney = statPlanOrderMoney;
statPlanOrderMoney.required_params = ['companyId'];
statPlanOrderMoney.optional_params = ['startTime', 'endTime', 'accountId'];
function statPlanOrderMoney(params){
    var query = params;
    var query_complete = {
        companyId: query.companyId,
        status: STATUS.COMPLETE,
        auditStatus: 1
    }
    var query_sql = 'select sum(budget-expenditure) as \"savedMoney\" from tripplan.trip_plan_order where company_id=\''+ params.companyId +'\' and status=2 and audit_status=1';
    query.status = {$gte: STATUS.NO_COMMIT};
    var startAt = {};

    if(params.startTime){
        startAt.$gte = params.startTime;
        query_sql += ' and start_at >=\'' + params.startTime + '\'';
        delete params.startTime;
    }

    if(params.endTime){
        startAt.$lte = params.endTime;
        query_sql += ' and start_at <=\'' + params.endTime + '\'';
        delete params.endTime;
    }

    if(params.accountId){
        query_complete.accountId = params.accountId;
        query_sql += ' and account_id=\'' + params.accountId + '\'';
    }

    query_sql += ' and budget>expenditure;';

    if(!isObjNull(startAt)){
        query.startAt = startAt;
        query_complete.startAt = startAt;
    }

    return Promise.all([
        PlanOrder.sum('budget', {where: query}),
        PlanOrder.sum('budget', {where: query_complete}),
        PlanOrder.sum('expenditure', {where: query_complete}),
        PlanOrder.count({where: query_complete}),
        sequelize.query(query_sql)
    ])
        .spread(function(n1, n2, n3, n4, n5) {
            var savedMoney = n5[0][0].savedMoney || 0;
            return {
                qmBudget: n1 || 0,
                planMoney: n2 || 0,
                expenditure: n3 || 0,
                savedMoney: savedMoney,
                NumOfStaff: n4 || 0
            }
        })
}


/**
 * 获取项目名称列表
 * @param params
 * @returns {*}
 */
tripPlan.getProjects = getProjects;
getProjects.required_params = ['companyId'];
getProjects.optional_params = ['description'];
function getProjects(params){
    return PlanOrder.findAll({where: params, group: ['description'], attributes: ['description']})
}

/**
 * 提交计划单
 * @param params
 * @returns {*}
 */
tripPlan.commitTripPlanOrder = commitTripPlanOrder;
commitTripPlanOrder.required_params = ['orderId', 'accountId'];
function commitTripPlanOrder(params){
    var id = params.orderId;
    return Promise.all([
        PlanOrder.findById(id, {attributes: ['status', 'auditStatus', 'accountId']}),
        ConsumeDetails.findAll({where:{orderId: id}, attributes: ['status', 'newInvoice', 'isCommit']})
    ])
        .spread(function(order, list){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            if(order.accountId != params.accountId){
                throw L.ERR.PERMISSION_DENY;
            }

            if(order.status == STATUS.NO_BUDGET){
                throw {code: -3, msg: '计划单还没有预算，不能提交'};
            }

            if(order.status == STATUS.COMMIT){
                throw {code: -4, msg: '该计划单已提交，不能重复提交'};
            }

            if(order.status > STATUS.COMMIT || order.auditStatus == 1){
                throw {code: -5, msg: '该计划单已经审核通过，不能提交'};
            }

            if(list.length <= 0){
                throw {code: -6, msg: '该计划单没有票据提交'};
            }

            for(var i=0; i<list.length; i++){
                var s = list[i];

                if((s.status === STATUS.NO_COMMIT && !s.newInvoice) || s.status == STATUS.NO_BUDGET){
                    throw {code: -7, msg: '票据没有上传完'};
                }
            }
        })
        .then(function(){
            return Promise.all([
                PlanOrder.update({status: STATUS.COMMIT, auditStatus: 0, updateAt: utils.now(), isCommit: true}, {where: {id: id}, fields: ['status', 'auditStatus', 'updateAt', 'isCommit']}),
                ConsumeDetails.update({isCommit: true, updateAt: utils.now()}, {where: {orderId: id}})
            ])
        })
        .then(function(){
            return true;
        })
}

/**
 * @method previewConsumeInvoice 预览发票图片
 *
 * @param {Object} params
 * @param {UUID} params.consumeId
 * @param {UUID} params.accountId
 */
tripPlan.previewConsumeInvoice = function (params) {
    var consumeId = params.consumeId;
    var accountId = params.accountId;

    return tripPlan.getVisitPermission({
        consumeId: consumeId,
        userId: accountId
    })
        .then(function(result) {
            if (!result.allow) {
                throw L.ERR.PERMISSION_DENY;
            }
            return ConsumeDetails.findOne({where: {orderId: orderId, id: consumeId}})
        })
        .then(function(consume) {
            return API.attachments.getAttachment({id: consume.newInvoice});
        })
        .then(function(attachment) {
            return "data:image/jpg;base64,"+attachment.content;
        })
}

/**
 * 判断用户是否已经生成改预算
 * @param params
 */
tripPlan.checkBudgetExist = checkBudgetExist;
checkBudgetExist.required_params = ['consumeDetails', 'accountId', 'companyId', 'destination', 'destinationCode'];
checkBudgetExist.optional_params = ['startPlace', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'description', 'destinationCode', 'startPlaceCode'];
var consumeDetails_required_fields = ['type', 'startTime', 'invoiceType'];
function checkBudgetExist(params){
    var consumeDetails = params.consumeDetails.map(function(detail){
        consumeDetails_required_fields.forEach(function(key){
            if(!_.has(detail, key)){
                throw {code: '-1', msg: 'consumeDetails的属性' + key + '没有指定'};
            }
        })

        if(detail.startPlace && !detail.startPlaceCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.arrivalPlace && !detail.arrivalPlaceCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.city && !detail.cityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        return _.pick(detail, ConsumeDetailsCols);
    });

    delete params.consumeDetails;
    var _planOrder = params;

    if(_planOrder.startPlace && !_planOrder.startPlaceCode) {
        throw {code: -3, msg: '城市代码不能为空'};
    }

    _planOrder.status = {$ne: STATUS.DELETE};

    logger.error(_planOrder);
    return PlanOrder.findAll({where: _planOrder})
        .then(function(order){
            if(order.length <= 0) {
                return [false];
            }

            logger.error("*********************************");
            logger.error(order.length);

            return [true, order[0].id, Promise.all(consumeDetails.map(function(detail) {
                detail.status = {$ne: STATUS.DELETE};
                return ConsumeDetails.findAll({where: detail})
            }))]
        })
        .spread(function(ret, order_id, array) {
            if(!ret) {
                return false;
            }
            var result = order_id;
            array.map(function(details) {
                if(details.length <= 0) {
                    result = false;
                }
            });

            return result;
        })
}

tripPlan.getProjectList = getProjectList;
getProjectList.require_params = ['companyId'];
getProjectList.optionnal_params = ['code', 'name'];
function getProjectList(params) {
    return Projects.findAll({where: params})
}

tripPlan.createNewProject = createNewProject;
createNewProject.required_params = ['name', 'createUser', 'company_id'];
createNewProject.optional_params = ['code']
function createNewProject(params) {
    params.createAt = utils.now();
    return Projects.create(params);
}

tripPlan.getProjectByName = getProjectByName;
getProjectByName.required_params = ['userId', 'name'];
getProjectByName.optional_params = ['companyId', 'isCreate']
function getProjectByName(params) {
    return Projects.findOne({name: params.name})
        .then(function(project){
            if(!project && params.isCreate === true) {
                var p = {
                    name: params.name,
                    createUser: params.userId,
                    code: '',
                    companyId: params.companyId,
                    createAt: utils.now()
                }
                return Projects.create(p)
            }else {
                return project;
            }
        })
        .then(function(project){
            if(!project) {
                throw {code: -2, msg: '查找项目不存在'};
            }
            return project;
        })
}

/**
 * 保存出差计划改动日志
 * @type {saveTripPlanLog}
 */
tripPlan.saveTripPlanLog = saveTripPlanLog;
saveTripPlanLog.require_params = ['orderId', 'userId', 'remark'];
function saveTripPlanLog(params) {
    params.createAt = utils.now();
    return TripOrderLogs.create(params);
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

tripPlan.__initHttpApp = require('./invoice');
module.exports = tripPlan;