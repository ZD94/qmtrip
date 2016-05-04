/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
let sequelize = require("common/model").importModel("./models");
let Models = sequelize.models;
let TripPlanModel = Models.TripPlan;
let TripDetailsModel = Models.TripDetails;
let TripOrderLogsModel = Models.TripPlanLogs;
let ProjectModel = Models.Projects;
let uuid = require("node-uuid");
let L = require("common/language");
let Logger = require('common/logger');
let utils = require('common/utils');
let API = require('common/api');
let logger = new Logger("company");
let validate = require("common/validate");
import _ = require('lodash');
import moment = require("moment");
import {validateApi} from 'common/api/helper';
import {Paginate} from 'common/paginate';
import {Project, TripPlan, TripDetails} from "api/_types/tripPlan";

let STATUS = {
    DELETE: -2, //删除
    NO_BUDGET: -1, //没有预算
    NO_COMMIT: 0, //待提交状态
    COMMIT: 1, //已提交待审核状态
    COMPLETE: 2 //审核完，已完成状态
};

let INVOICE_TYPE = {
    TRAIN: 0,
    PLANE: 1,
    HOTEL: 2
};

let tripPlan: any = {};

let TripDetailsCols = Object.keys(TripDetailsModel.attributes);
tripPlan.TripDetailsCols = TripDetailsCols;
tripPlan.TripPlanCols = Object.keys(TripPlanModel.attributes);

/**
 * 保存预算单/差旅计划单
 * @param params
 * @returns {Promise<TripPlan>}
 */
tripPlan.saveTripPlan = saveTripPlan;
async function saveTripPlan(params){
    let tripDetails = params.tripDetails;
    delete params.tripDetails;
    let _planOrder = params;

    if(_planOrder.deptCity && !_planOrder.deptCityCode) {
        throw {code: -3, msg: '城市代码不能为空'};
    }

    let project = await getProjectByName({companyId: _planOrder.companyId, name: _planOrder.description, userId: _planOrder.accountId, isCreate: true});

    let orderId = uuid.v1();
    _planOrder.id = orderId;
    _planOrder.createAt = utils.now();
    _planOrder.projectId = project.id;

    return sequelize.transaction(function(t){
        let order: any = {};
        return TripPlanModel.create(_planOrder, {transaction: t})
            .then(function(ret){
                order = ret.toJSON();

                return Promise.all(tripDetails.map(function(detail){
                    detail.orderId = order.id;
                    detail.accountId = order.accountId;
                    detail.orderStatus = _planOrder.orderStatus;

                    return TripDetailsModel.create(detail, {transaction: t})
                        .then(function(ret){
                            return ret.toJSON();
                        })
                }))
            })
            .then(function(list){
                order.tripDetails = list;
                let logs = {orderId: order.id, userId: params.accountId, remark: '新增计划单 ' + order.orderNo, createAt: utils.now()};

                return TripOrderLogsModel.create(logs, {transaction: t});
            })
            .then(function(){
                return new TripPlan(order);
            })
    })
}


/**
 * 获取计划单/预算单信息
 * @param params
 * @returns {*}
 */
tripPlan.getTripPlanOrder = getTripPlanOrder;
getTripPlanOrder['required_params'] = ['orderId'];
getTripPlanOrder['optional_params'] = ['columns'];
function getTripPlanOrder(params){
    let orderId = params.orderId;
    let options: any = {};

    if(params.columns){
        params.columns.push('status');
        options.attributes = params.columns;
    }

    return Promise.all([
        TripPlanModel.findById(orderId, options),
        TripDetailsModel.findAll({where: {orderId: orderId, type: -1, status: {$ne: STATUS.DELETE}}}),
        TripDetailsModel.findAll({where: {orderId: orderId, type: 1, status: {$ne: STATUS.DELETE}}}),
        TripDetailsModel.findAll({where: {orderId: orderId, type: 0, status: {$ne: STATUS.DELETE}}})
    ])
        .spread(function(order, outTraffic, backTraffic, hotel){
            if(!order || order.orderStatus == 'DELETE'){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }
            order.setDataValue("outTraffic", outTraffic);
            order.setDataValue("backTraffic", backTraffic);
            order.setDataValue("hotel", hotel);

            return order;
        })
}


tripPlan.getConsumeInvoiceImg = function(params) {
    let consumeId = params.consumeId;

    if (!consumeId) {
        throw {code: -1, msg: "consumeId不能为空"};
    }

    return TripDetailsModel.findById(consumeId)
        .then(function(consumeDetail) {
            return API.attachments.getAttachment({id: consumeDetail.newInvoice})
        })
        .then(function(attachment) {
            if (!attachment) {
                throw L.ERR.NOT_FOUND;
            }

            return 'data:image/jpg;base64,' + attachment.content;
        })
        .then(function(result) {
            return result;
        })

}

tripPlan.getConsumeDetail = getConsumeDetail;
getConsumeDetail['required_params'] = ['consumeId'];
getConsumeDetail['optional_params'] = ['columns'];
function getConsumeDetail(params){
    let options: any = {};

    if(params.columns){
        options.attributes = _.intersection(params.columns, TripDetailsCols);
    }

    return TripDetailsModel.findById(params.consumeId, options)
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
updateTripPlanOrder['required_params'] = ['userId', 'orderId', 'optLog', 'updates'];
function updateTripPlanOrder(params){
    let orderId = params.orderId;
    let userId = params.userId;
    let optLog = params.optLog;
    let updates = params.updates;

    return TripPlanModel.findById(orderId)
        .then(function(order){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            let logs = {
                orderId: order.id,
                userId: userId,
                remark: optLog,
                createAt: utils.now()
            }

            return sequelize.transaction(function(t){
                updates = utils.now();
                return Promise.all([
                    TripPlanModel.update(updates, {returning: true, where: {id: orderId}, fields: Object.keys(updates), transaction: t}),
                    TripOrderLogsModel.create(logs, {transaction: t})
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
updateConsumeDetail['required_params'] = ['consumeId', 'optLog', 'userId', 'updates'];
updateConsumeDetail['optional_params'] = _.keys(TripDetailsModel.attributes);
function updateConsumeDetail(params){
    let updates: any = _.pick(params.updates, _.keys(TripDetailsModel.attributes));
    let trip_plan_id = '';

    return TripDetailsModel.findById(params.consumeId)
        .then(function(record){
            if(!record || record.status == STATUS.DELETE){
                throw {code: -2, msg: '票据不存在'};
            }

            if(record.status == 1){
                throw {code: -3, msg: '该票据已经审核通过，不能修改'};
            }

            trip_plan_id = record.orderId;
            updates.updateAt = utils.now();

            return TripDetailsModel.update(updates, {returning: true, where: {id: params.consumeId}, fields: Object.keys(updates)});
        })
        .spread(function(result) {
            if(result < 1) {
                throw {code: -2, msg: '更新出差明细失败失败'};
            }

            return TripDetailsModel.findAll({where: {orderId: trip_plan_id, status: {$ne: STATUS.DELETE}}})
        })
        .then(function(list) {
            let orderStatus = '';
            list.map(function(t) {
                if(orderStatus != '' && orderStatus != t.orderStatus) {
                    return true;
                }

                orderStatus = t.orderStatus;
            });

            return TripPlanModel.update({orderStatus: orderStatus, updateAt: utils.now()}, {returning: true, where: {id: trip_plan_id}})
        })
        .then(function() {
            return true;
        })
}

tripPlan.updateConsumeBudget = updateConsumeBudget;
updateConsumeBudget['required_params'] = ['id', 'budget', 'userId'];
updateConsumeBudget['optional_params'] = ['invoiceType'];
function updateConsumeBudget(params){
    let id = params.id;

    return TripDetailsModel.findById(id)
        .then(function(ret){
            if(!ret ||ret.status == STATUS.DELETE){
                throw {code: -2, msg: '票据不存在'};
            }

            if(ret.status == 1){
                throw {code: -3, msg: '该票据已经审核通过，不能修改预算'};
            }

            return [ret.budget, TripPlanModel.findById(ret.orderId)];
        })
        .spread(function(o_budget, order){
            if(order.status == STATUS.COMMIT){
                throw {code: -4, msg: '该次出差计划已经提交，不能修改预算'};
            }

            if(order.orderStatus !== 'NO_BUDGET'){
                throw {code: -5, msg: '修改预算失败，请检查出差记录状态'};
            }

            let budget = params.budget;

            let logs = {
                orderId: order.id,
                userId: params.userId,
                remark: "更新预算",
                createAt: utils.now()
            }

            let updates: any = {
                orderStatus: 'WAIT_UPLOAD',
                budget: budget,
                updateAt: utils.now()
            }

            if(params.invoiceType) {
                updates.invoiceType = params.invoiceType;
            }
            return sequelize.transaction(function(t){
                return Promise.all([
                    order.id,
                    TripDetailsModel.update(updates, {where: {id: id}, transaction: t}),
                    TripOrderLogsModel.create(logs, {transaction: t})
                ])
            })
        })
        .spread(function(orderId){
            return [orderId, TripDetailsModel.findAll({where: {orderId: orderId, status: {$ne: -2}}})];
        })
        .spread(function(orderId, list){
            let c_budget = 0;
            for(let i=0; i<list.length; i++){
                let budget = list[i].budget;
                if(budget < 0) {
                    return true;
                }
                c_budget += parseFloat(budget);
            }

            return TripPlanModel.update({status: STATUS.NO_COMMIT, budget: c_budget, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'budget', 'updateAt']})
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
tripPlan.listTripPlanOrder = async function(options){
    let query = options.where;
    let status = query.status;
    typeof status == 'object'?query.status.$ne = STATUS.DELETE:query.status = status;

    if(!query.status && query.status != STATUS.NO_COMMIT){
        query.status = {$ne: STATUS.DELETE};
    }

    if(!options.order) {
         options.order = [['start_at', 'desc'], ['create_at', 'desc']]; //默认排序，创建时间
    }

    let {rows: orders, count} = await TripPlanModel.findAndCount(options);
    if(!orders || orders.length === 0){
        return new Paginate(options.offset/options.limit + 1, options.limit, count, []);
    }

    let list = orders.map(function(order) {
        return order.id;
    });

    return new Paginate(options.offset/options.limit + 1, options.limit, count, list);
}


tripPlan.findOrdersByOption = findOrdersByOption;
findOrdersByOption['required_params'] = ['where'];
function findOrdersByOption(options) {
    return TripPlanModel.findAll(options);
}

/**
 * 保存消费记录详情
 * @param params
 * @returns {*}
 */
tripPlan.saveConsumeRecord = saveConsumeRecord;
saveConsumeRecord['required_params'] = ['orderId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'];
// saveConsumeRecord['optional_params'] = TripDetailsCols;
function saveConsumeRecord(params){
    let record = params;
    record.isCommit = false;
    record.status = STATUS.NO_COMMIT;
    let options: any = {};
    options.fields = Object.keys(record);

    return TripPlanModel.findById(params.orderId)
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

            if(order.orderStatus == 'COMPLETE'){
                throw {code: -4, msg: '该计划单已审核，不能添加消费单据'};
            }

            let budget = params.budget || 0;
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

                let logs = {
                    orderId: order.id,
                    userId: params.accountId,
                    remark: "增加新的预算",
                    createAt: utils.now()
                }

                return Promise.all([
                    TripDetailsModel.create(record, options),
                    TripOrderLogsModel.create(logs, {transaction: t}),
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
tripPlan.deleteTripPlan = deleteTripPlan;
deleteTripPlan['required_params'] = ['userId', 'orderId'];
function deleteTripPlan(params){
    let orderId = params.orderId;
    let userId = params.userId;
    return TripPlanModel.findById(orderId)
        .then(function(order){

            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST
            }

            if(order.accountId != userId){ //权限不足
                throw L.ERR.PERMISSION_DENY;
            }

            return sequelize.transaction(function(t){
                return Promise.all([
                    TripPlanModel.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {id: orderId}, fields: ['status', 'updateAt'], transaction: t}),
                    TripDetailsModel.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {orderId: orderId}, fields: ['status', 'updateAt'], transaction: t})
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
deleteConsumeDetail['required_params'] = ['userId', 'id'];
function deleteConsumeDetail(params){
    let id = params.id;
    let userId = params.userId;

    return TripDetailsModel.findById(id)
        .then(function(detail){
            if(!detail || detail.status == STATUS.DELETE){
                throw L.ERR.CONSUME_DETAIL_NOT_EXIST;
            }

            if(detail.accountId != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            return TripDetailsModel.update({status: STATUS.DELETE, updateAt: utils.now()}, {where: {id: id}, fields: ['status', 'updateAt']})
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
 * @param params.picture 新上传的票据fileId
 * @returns {*}
 */
tripPlan.uploadInvoice = uploadInvoice;
uploadInvoice['required_params'] = ['consumeId', 'picture', 'userId'];
function uploadInvoice(params){
    let orderId = "";

    return TripDetailsModel.findById(params.consumeId)
        .then(function(custome){
            if(!custome || custome.status == STATUS.DELETE){
                throw L.ERR.NOT_FOUND;
            }

            if(custome.accountId != params.userId){
                throw L.ERR.PERMISSION_DENY;
            }

            if(custome.orderStatus === 'AUDIT_PASS') {
                throw {code: -3, msg: '已审核通过的票据不能重复上传'};
            }

            orderId = custome.orderId;
            return [orderId, custome,
                TripPlanModel.findById(orderId),
                TripDetailsModel.findAll({where: {orderId: orderId}, attributes: ['id', 'orderStatus', 'status', 'budget', 'isCommit', 'newInvoice']}) //所有的未审核通过的数据
            ]
        })
        .spread(function(orderId, custome, order, list){
            if(order.status == STATUS.NO_BUDGET){
                throw {code: -2, msg: '还没有录入出差预算'};
            }

            let invoiceJson = custome.invoice;
            let times = invoiceJson.length ? invoiceJson.length+1 : 1;
            let currentInvoice = {times:times, picture:params.picture, create_at:moment().format('YYYY-MM-DD HH:mm'), status:STATUS.NO_COMMIT, remark: '', approve_at: ''};
            invoiceJson.push(currentInvoice);

            let updates = {
                newInvoice: params.picture,
                invoice: JSON.stringify(invoiceJson),
                updateAt: moment().format("YYYY-MM-DD HH:mm:ss"),
                status: STATUS.NO_COMMIT,
                auditRemark: params.auditRemark || ''
            };

            let logs = {orderId: orderId, consumeId: params.consumeId, userId: params.userId, remark: "上传票据"};
            let orderLogs = {orderId: custome.orderId, userId: params.userId, remark: '上传票据', createAt: utils.now()};

            let order_status = 'WAIT_COMMIT';
            list.map(function(en) {
                if(en.orderStatus == 'AUDIT_NOT_PASS' && en.id != params.consumeId) {
                    order_status = 'AUDIT_NOT_PASS';
                }

                if(en.orderStatus == 'WAIT_UPLOAD' && en.id != params.consumeId) {
                    order_status = 'WAIT_UPLOAD';
                }
            })

            return sequelize.transaction(function(t){
                return Promise.all([
                    TripDetailsModel.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    TripOrderLogsModel.create(logs,{transaction: t}),
                    TripOrderLogsModel.create(orderLogs, {transaction: t}),
                    TripPlanModel.update({orderStatus: order_status, updateAt: utils.now()}, {where: {id: orderId}})
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
getVisitPermission['required_params'] = ['consumeId', 'userId'];
async function getVisitPermission(params){
    let userId = params.userId;
    let consumeId = params.consumeId;
    let consume = await TripDetailsModel.findById(consumeId);
    if(!consume || consume.status == STATUS.DELETE){
        throw {code: -4, msg: '查询记录不存在'};
    }

    if(consume.accountId == userId){//允许自己查看
        return {allow: true, fileId: consume.newInvoice};
    }

    let order = await TripPlanModel.findById(consume.orderId);
    if(!order || order.orderStatus == 'DELETE'){
        throw {code: -4, msg: '订单记录不存在'};
    }

    let company = await API.company.getCompany({companyId: order.companyId});
    if(!company){
        throw {code: -5, msg: "企业不存在"}
    }

    let agencyId = company.agencyId;
    let agencyUser = await API.agency.getAgencyUser({id: userId});

    if(agencyUser && agencyUser.roleId != 1 && agencyUser.agencyId == agencyId){//允许代理商创建人管理员访问
        return {allow: true, fileId: consume.newInvoice};
    }else{
        return {allow: false};
    }
}

/**
 * 保存出差计划日志
 * @type {saveOrderLogs}
 */
tripPlan.saveOrderLogs = saveOrderLogs;
saveOrderLogs['required_params'] = ['userId', 'orderId', 'remark']
function saveOrderLogs(logs){
    return TripPlanModel.findById(logs.orderId)
        .then(function(order){
            if(!order || order.status == STATUS.DELETE){
                throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST;
            }

            if(order.status == STATUS.COMPLETE){
                throw {code: -2, msg: '该计划单已完成，不能增加日志'};
            }

            logs.createAt = utils.now();
            return TripOrderLogsModel.create(logs);
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
approveInvoice['required_params'] = ['status', 'consumeId', 'userId'];
approveInvoice['optional_params'] = ['remark', 'expenditure'];
function approveInvoice(params){
    return TripDetailsModel.findById(params.consumeId)
        .then(function(consume){
            if(!consume || consume.status == STATUS.DELETE)
                throw L.ERR.NOT_FOUND;

            if(!consume.newInvoice){
                throw {code: -2, msg: '没有上传票据'};
            }

            if(consume.status == STATUS.COMMIT){
                throw {code: -3, msg: '该票据已审核通过，不能重复审核'};
            }

            return [TripPlanModel.findById(consume.orderId), consume]
        })
        .spread(function(order, consume){
            let invoiceJson = consume.invoice;

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

            let updates: any = {
                invoice: JSON.stringify(invoiceJson),
                updateAt: utils.now(),
                status: params.status,
                auditUser: params.userId,
                expenditure: params.expenditure
            };

            if(params.remark){
                updates.auditRemark = params.remark;
            }

            let logs = {consumeId: params.consumeId, userId: params.userId, status: params.status, remark: "审核票据-"+params.remark};

            return sequelize.transaction(function(t){
                if(updates.status == STATUS.NO_BUDGET) {
                    updates.isCommit =false;
                }
                return Promise.all([
                    TripDetailsModel.update(updates, {returning: true, where: {id: params.consumeId}, transaction: t}),
                    TripOrderLogsModel.create(logs,{transaction: t})
                ])
                    .spread(function(ret){
                        let status = params.status;

                        if(status == STATUS.NO_BUDGET){
                            return TripPlanModel.update({status: STATUS.NO_COMMIT, auditStatus: -1, updateAt: utils.now()},
                                {where: {id: order.id}, fields: ['auditStatus', 'status', 'updateAt'], transaction: t});
                        }

                        if(!params.expenditure)
                            throw {code: -4, msg: '支出金额不能为空'};

                        let ex_expenditure = order.expenditure || 0;
                        let expenditure = (parseFloat(params.expenditure) + parseFloat(ex_expenditure)).toFixed(2);
                        let order_updates: any = {
                            expenditure: expenditure,
                            updateAt: utils.now()
                        }

                        return TripDetailsModel.findAll({where: {orderId: order.id, status: {$ne: -2}}})
                            .then(function(list){
                                for(let i=0; i<list.length; i++){
                                    if(list[i].status != STATUS.COMMIT && list[i].id != ret[1][0].id){
                                        return false;
                                    }
                                }

                                return true;
                            })
                            .then(function(isAllAudit){
                                if(isAllAudit){
                                    let score: number = 0;
                                    score = (order.budget - order_updates.expenditure) > 0 ? order.budget - order_updates.expenditure : 0;
                                    order_updates.status = STATUS.COMPLETE;
                                    order_updates.auditStatus = 1;
                                    order_updates.score = Math.floor(score/2);
                                }

                                return TripPlanModel.update(order_updates, {where: {id: order.id}, fields: Object.keys(order_updates), transaction: t})
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
countTripPlanNum['required_params'] = ['companyId'];
countTripPlanNum['optional_params'] = ['accountId', 'status'];
function countTripPlanNum(params){
    let query = params;
    query.status = {$ne: STATUS.DELETE};
    return TripPlanModel.count({where: query});
}


/**
 * 按月份统计预算/计划/完成金额
 * @type {statBudgetByMonth}
 */
tripPlan.statBudgetByMonth = statBudgetByMonth;
statBudgetByMonth['required_params'] = ['companyId'];
statBudgetByMonth['optional_params'] = ['startTime', 'endTime', 'accountId'];
function statBudgetByMonth(params) {
    let stTime = params.startTime||moment().format('YYYY-MM-DD');
    let enTime = params.endTime||moment().format('YYYY-MM-DD');
    let timeArr = [];
    do{
        let t = moment(stTime).format('YYYY-MM-');
        timeArr.push(t + '0\\d');
        timeArr.push(t + '1\\d');
        timeArr.push(t + '2\\d');
        stTime = moment(stTime).add(1, 'months').format('YYYY-MM-DD');
    }while(stTime<enTime);

    let sql = 'select count(account_id) as \"staffNum\", sum(budget) as \"planMoney\",sum(expenditure) as expenditure ' +
        'from tripplan.trip_plan where company_id=\'' + params.companyId + '\'';

    if(params.accountId) {
        sql += ' and account_id=\'' + params.accountId + '\'';
    }

    let complete_sql = sql + ' and status=2 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';


    sql += ' and status > -1 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';

    return Promise.all(
        timeArr.map(function(month) {
            let s_sql = sql; // + month + '\\d\';';
            let c_sql = complete_sql; // + month + '\\d\';';
            let index = month.match(/\d{4}-\d{2}-(\d).*/)[1];
            let remark = '';

            if(index === '0') {
                remark = '上旬';
                s_sql = sql + month + '\';';
                c_sql = complete_sql + month + '\';';
            }else if(index === '1') {
                remark = '中旬';
                s_sql = sql + month + '\';';
                c_sql = complete_sql + month + '\';';
            }else if(index === '2' || index === '3') {
                remark = '下旬';
                let str = month.substr(0, month.length -3);
                s_sql = sql + str + '(2|3)\\d\';';
                c_sql = complete_sql + str + '(2|3)\\d\';';
            }

            let _month = month.match(/\d{4}-\d{2}/)[0];
            return Promise.all([
                sequelize.query(s_sql),
                sequelize.query(c_sql),
            ])
                .spread(function(all, complete){
                    let a = all[0][0];
                    let c = complete[0][0];
                    let stat = {
                        month: _month,
                        qmBudget: a.planMoney|0,
                        planMoney: c.planMoney|0,
                        expenditure: c.expenditure|0,
                        staffNum: c.staffNum,
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
statPlanOrderMoney['required_params'] = ['companyId'];
statPlanOrderMoney['optional_params'] = ['startTime', 'endTime', 'accountId'];
function statPlanOrderMoney(params){
    let query = params;
    let query_complete: any = {
        companyId: query.companyId,
        status: STATUS.COMPLETE,
        auditStatus: 1
    }
    let query_sql = 'select sum(budget-expenditure) as \"savedMoney\" from tripplan.trip_plan where company_id=\''+ params.companyId +'\' and status=2 and audit_status=1';
    query.status = {$gte: STATUS.NO_COMMIT};
    let startAt: any = {};

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
        TripPlanModel.sum('budget', {where: query}),
        TripPlanModel.sum('budget', {where: query_complete}),
        TripPlanModel.sum('expenditure', {where: query_complete}),
        TripPlanModel.count({where: query_complete}),
        sequelize.query(query_sql)
    ])
        .spread(function(n1, n2, n3, n4, n5) {
            let savedMoney = n5[0][0].savedMoney || 0;
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
getProjects['required_params'] = ['companyId'];
getProjects['optional_params'] = ['description'];
function getProjects(params){
    return TripPlanModel.findAll({where: params, group: ['description'], attributes: ['description']})
}

/**
 * 提交计划单
 * @param params
 * @returns {*}
 */
tripPlan.commitTripPlanOrder = commitTripPlanOrder;
commitTripPlanOrder['required_params'] = ['orderId', 'accountId'];
function commitTripPlanOrder(params){
    let id = params.orderId;
    return Promise.all([
        TripPlanModel.findById(id),
        TripDetailsModel.findAll({where:{orderId: id}})
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

            for(let i=0; i<list.length; i++){
                let s = list[i];

                if((s.status === STATUS.NO_COMMIT && !s.newInvoice) || s.status == STATUS.NO_BUDGET){
                    throw {code: -7, msg: '票据没有上传完'};
                }
            }
        })
        .then(function(){
            return Promise.all([
                TripPlanModel.update({status: STATUS.COMMIT, auditStatus: 0, updateAt: utils.now(), isCommit: true, commitTime: utils.now()}, {where: {id: id}, fields: ['status', 'auditStatus', 'updateAt', 'isCommit']}),
                TripDetailsModel.update({isCommit: true, commitTime: utils.now(), updateAt: utils.now()}, {where: {orderId: id}})
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
    let consumeId = params.consumeId;
    let accountId = params.accountId;

    return tripPlan.getVisitPermission({consumeId: consumeId, userId: accountId})
        .then(function(result) {
            if (!result.allow) {
                throw L.ERR.PERMISSION_DENY;
            }
            return TripDetailsModel.findById(consumeId)
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
checkBudgetExist['required_params'] = ['tripDetails', 'accountId', 'companyId', 'arrivalCity', 'arrivalCityCode'];
checkBudgetExist['optional_params'] = ['deptCity', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'description', 'arrivalCityCode', 'deptCityCode'];
let tripDetails_required_fields = ['type', 'startTime', 'invoiceType'];
async function checkBudgetExist(params){
    let tripDetails = params.tripDetails;
    delete params.tripDetails;
    let _planOrder = params;

    if(_planOrder.deptCity && !_planOrder.deptCityCode) {
        throw {code: -3, msg: '城市代码不能为空'};
    }

    _planOrder.status = {$ne: STATUS.DELETE};

    let orders = await TripPlanModel.findAll({where: _planOrder});
    if(orders.length <= 0) {
        return false;
    }

    let details = [];
    await Promise.all(tripDetails.map(async function(detail) {
        detail.status = {$ne: STATUS.DELETE};
        detail.invoiceType = INVOICE_TYPE[detail.invoiceType];
        let plan_details =  await TripDetailsModel.findAll({where: detail});
        plan_details.map(function(d) {
            details.push(d);
        });
    }));

    if(!details || details.length <= 0) {
        return false;
    }

    let result: boolean|string = false;

    details.map(function(detail: any) {
        let orderId = detail.orderId;
        orders.map(function(order) {
            if(order.id === orderId) {
                result = orderId;
            }
        });
    });

    return result;
}

tripPlan.getProjectList = getProjectList;
getProjectList['required_params'] = ['companyId'];
getProjectList['optional_params'] = ['code', 'name', 'count'];
function getProjectList(params) {
    let options: any = {
        where: params,
        attributes: ['name'],
        order: [['create_at', 'desc']]
    };

    if(params.count) {
        options.limit = params.count;
        delete params.count;
    }

    return ProjectModel.findAll(options)
}

tripPlan.createNewProject = createNewProject;
createNewProject['required_params'] = ['name', 'createUser', 'company_id'];
createNewProject['optional_params'] = ['code']
function createNewProject(params) {
    params.createAt = utils.now();
    return ProjectModel.create(params);
}

tripPlan.getProjectByName = getProjectByName;
getProjectByName['required_params'] = ['userId', 'name'];
getProjectByName['optional_params'] = ['companyId', 'isCreate']
function getProjectByName(params) {
    return ProjectModel.findOne({where: {name: params.name}})
        .then(function(project){
            if(!project && params.isCreate === true) {
                let p = {
                    name: params.name,
                    createUser: params.userId,
                    code: '',
                    companyId: params.companyId,
                    createAt: utils.now()
                }
                return ProjectModel.create(p)
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
 * 根据出差记录id获取出差详情(包括已删除的)
 * @param params
 * @returns {Promise<TInstance[]>|any}
 */
tripPlan.listConsumesByPlanId = function(params) {
    return TripDetailsModel.findAll({where: params.trip_plan_id})
}

/**
 * 保存出差计划改动日志
 * @type {saveTripPlanLog}
 */
tripPlan.saveTripPlanLog = saveTripPlanLog;
saveTripPlanLog['required_params'] = ['orderId', 'userId', 'remark'];
function saveTripPlanLog(params) {
    params.createAt = utils.now();
    return TripOrderLogsModel.create(params);
}

/**
 * 判断JSON对象是否为空
 * @param obj
 * @returns {boolean}
 */
function isObjNull(obj){
    for (let s in obj){
        return false;
    }
    return true;
}

tripPlan.__initHttpApp = require('./invoice');
module.exports = tripPlan;