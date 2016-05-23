/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
let sequelize = require("common/model").DB;
let DBM = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
let Logger = require('common/logger');
let utils = require('common/utils');
let API = require('common/api');
let logger = new Logger("company");
let validate = require("common/validate");
let config = require("../../config");
import _ = require('lodash');
import moment = require("moment");
import {requireParams, clientExport} from 'common/api/helper';
import {Project, TripPlan, TripDetail, EPlanStatus, EInvoiceType, TripPlanLog, ETripType} from "api/_types/tripPlan";
import {Models} from "../_types/index";
import {getSession} from "common/model/client";


let TripDetailCols = TripDetail['$fieldnames'];
let TripPlanCols = TripPlan['$fieldnames'];

class IBudgetItem {
    price: number
    itemType: string
    type: string
    hotel: string
}

class TripPlanModule {
    static TripPlanCols = TripPlanCols;
    static TripDetailCols = TripDetailCols;

    /**
     * @method saveTripPlan
     * 生成出差计划单
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['deptCity', 'arrivalCity', 'startAt', 'title', 'budgets'], ['backAt', 'remark', 'description'])
    static async saveTripPlan(params: {deptCity: string, arrivalCity: string, startAt: string, title: string, budgets: IBudgetItem[],
        backAt?: string, remark?: string, description?: string}) {
        let {accountId} = Zone.current.get('session');
        console.info("##########################");
        console.info('accountId=>', accountId);
        let staff = await Models.staff.get(accountId);
        let email = staff.email;
        let staffName = staff.name;
        let _tripPlan:any = _.pick(params, TripPlanCols);
        let totalPrice:number = 0;
        for(let budget of params.budgets) {
            if (budget.price < 0) {
                totalPrice = -1;
                break;
            }
            totalPrice += (budget.price as number);
        }

        let tripPlanId = uuid.v1();
        let project = await getProjectByName({companyId: staff.company.id, name: _tripPlan.title, userId: accountId, isCreate: true});

        _tripPlan.id = tripPlanId;
        _tripPlan.budget = totalPrice
        _tripPlan.status = 0;
        _tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号
        _tripPlan.accountId = accountId;
        _tripPlan.companyId = staff.company.id;
        _tripPlan.projectId = project.id;

        let tripPlan = new TripPlan(await DBM.TripPlan.create(_tripPlan));

        await Promise.all(params.budgets.map(async function (detail) {
            let _detail: any = JSON.parse(JSON.stringify(detail));
            switch(detail.itemType) {
                case 'goTraffic': 
                    _detail.type = ETripType.OUT_TRIP;
                    break;
                case 'backTraffic':
                    _detail.type = ETripType.BACK_TRIP;
                    break;
                case 'hotel':
                    _detail.type = ETripType.HOTEL;
                    _detail.hotelName = detail.hotel;
                    break;
                default:
                    _detail.type = ETripType.OTHER;
            }

            switch(detail.type) {
                case 'train':
                    _detail.invoiceType = EInvoiceType.TRAIN;
                    break;
                case 'hotel':
                    _detail.invoiceType = EInvoiceType.HOTEL;
                    break;
                case 'air':
                    _detail.invoiceType = EInvoiceType.PLANE;
                    break;
                default:
                    _detail.invoiceType = EInvoiceType.OTHER;
            }
            _detail.tripPlanId = tripPlanId;
            _detail.accountId = accountId;
            _detail.status = 0;
            _detail.budget = Number(_detail.price);
            console.info(_detail);
            let tripDetail = await DBM.TripDetail.create(_detail);
        }));

        let logs = {tripPlanId: tripPlanId, userId: accountId, remark: '新增计划单 ' + tripPlan.planNo, createdAt: utils.now()};
        await DBM.TripPlanLog.create(logs);

        if (tripPlan.budget <= 0 || tripPlan['status'] === EPlanStatus.NO_BUDGET) {
            return tripPlan; //没有预算，直接返回计划单
        }
        
        let staffs = await Models.staff.find({companyId: staff.company.id, roleId: {$ne: 1}, status: {$gte: 0}});
        let url = config.host + '/corp.html#/TravelStatistics/planDetail?tripPlanId=' + tripPlan.id;
        let go = '无', back = '无', hotelStr = '无';

        let outTrip = await tripPlan.getOutTrip();
        if (outTrip && outTrip.length > 0) {
            let g = outTrip[0];
            go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.deptCity + ' 到 ' + g.arrivalCity;
            if (g.latestArriveTime)
                go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
            go += ', 动态预算￥' + g.budget;
        }

        let backTrip = await tripPlan.getBackTrip();
        if (backTrip && backTrip.length > 0) {
            let b = backTrip[0];
            back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.deptCity + ' 到 ' + b.arrivalCity;
            if (b.latestArriveTime)
                back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
            back += ', 动态预算￥' + b.budget;
        }

        let hotel = await tripPlan.getHotel();
        if (hotel && hotel.length > 0) {
            let h = hotel[0];
            hotelStr = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') +
                ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;
        }

        await Promise.all(staffs.map(async function (s) {
            let account = await API.auth.getAccount({id: s.id, type: 1, attributes: ['status']});
            if (account.status != 1)
                return false;

            let vals = {managerName: s.name, username: staffName, email: email, time: moment(tripPlan.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                projectName: tripPlan.description, goTrafficBudget: go, backTripBudget: back, hotelBudget: hotelStr,
                totalBudget: '￥' + tripPlan.budget, url: url, detailUrl: url};
            let log = {userId: accountId, tripPlanId: tripPlan.id, remark: tripPlan.planNo + '给企业管理员' + s.name + '发送邮件'};

            // await API.mail.sendMailRequest({toEmails: s.email, templateName: 'qm_notify_new_travelbudget', values: vals});
            await API.tripPlan.saveTripPlanLog(log);
            return true;
        }));

        return tripPlan;
    }


    /**
     * 获取计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    static async getTripPlan(params: {id: string}): Promise<TripPlan> {
        return await Models.tripPlan.get(params.id);
    }


    /**
     * 获取差旅计划单/预算单列表
     * @param params
     * @returns {*}
     */
    @clientExport
    static async listTripPlans(params): Promise<string[]> {
        let tripPlans = await Models.tripPlan.find(params);
        return tripPlans.map(function (plan) {
            return plan.id;
        });
    }

    @requireParams(['tripDetailId'], ['columns'])
    static async getTripDetail(params) {
        let options:any = {};

        if (params.columns) {
            options.attributes = _.intersection(params.columns, TripDetailCols);
        }

        let detail = await DBM.TripDetail.findById(params.tripDetailId, options);

        if (!detail) {
            throw {code: -2, msg: '消费记录不存在'};
        }

        return new TripDetail(detail);
    }

    /**
     * 更新计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @requireParams(['userId', 'tripPlanId', 'optLog', 'updates'])
    static updateTripPlan(params) {
        let tripPlanId = params.tripPlanId;
        let userId = params.userId;
        let optLog = params.optLog;
        let updates = params.updates;

        return DBM.TripPlan.findById(tripPlanId)
            .then(function (order) {
                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST();
                }

                let logs = {
                    tripPlanId: order.id,
                    userId: userId,
                    remark: optLog,
                    createdAt: utils.now()
                }

                return sequelize.transaction(function (t) {
                    updates = utils.now();
                    return Promise.all([
                        DBM.TripPlan.update(updates, {
                            returning: true,
                            where: {id: tripPlanId},
                            fields: Object.keys(updates),
                            transaction: t
                        }),
                        DBM.TripPlanLogs.create(logs, {transaction: t})
                    ]);
                })
            })
            .spread(function (update) {
                return update;
            })
            .spread(function (rownum, rows) {
                return rows[0];
            });
    }

    /**
     * 更新消费详情
     * @param params
     */
    @requireParams(['tripDetailId', 'optLog', 'userId', 'updates'], TripDetail['$fieldnames'])
    static updateTripDetail(params) {
        let updates:any = _.pick(params.updates, TripDetail['$fieldnames']);
        let trip_plan_id = '';

        return DBM.TripDetail.findById(params.tripDetailId)
            .then(function (record) {
                if (!record) {
                    throw {code: -2, msg: '票据不存在'};
                }

                if (record.status == 1) {
                    throw {code: -3, msg: '该票据已经审核通过，不能修改'};
                }

                trip_plan_id = record.tripPlanId;
                updates.updatedAt = utils.now();

                return DBM.TripDetail.update(updates, {
                    returning: true,
                    where: {id: params.tripDetailId},
                    fields: Object.keys(updates)
                });
            })
            .spread(function (result) {
                if (result < 1) {
                    throw {code: -2, msg: '更新出差明细失败失败'};
                }

                return DBM.TripDetail.findAll({where: {tripPlanId: trip_plan_id}})
            })
            .then(function (list) {
                let status = '';
                list.map(function (t) {
                    if (status != '' && status != t.status) {
                        return true;
                    }

                    status = t.status;
                });

                return DBM.TripPlan.update({status: status, updatedAt: utils.now()}, {
                    returning: true,
                    where: {id: trip_plan_id}
                })
            })
            .then(function () {
                return true;
            })
    }


    static getConsumeInvoiceImg(params) {
        let tripDetailId = params.tripDetailId;

        if (!tripDetailId) {
            throw {code: -1, msg: "consumeId不能为空"};
        }

        return DBM.TripDetail.findById(tripDetailId)
            .then(function (consumeDetail) {
                return API.attachments.getAttachment({id: consumeDetail.newInvoice})
            })
            .then(function (attachment) {
                if (!attachment) {
                    throw L.ERR.NOT_FOUND();
                }

                return 'data:image/jpg;base64,' + attachment.content;
            })
            .then(function (result) {
                return result;
            })

    }

    @requireParams(['id', 'budget', 'userId'], ['invoiceType'])

    static updateTripDetailBudget(params) {
        let id = params.id;

        return DBM.TripDetail.findById(id)
            .then(function (ret) {
                if (!ret) {
                    throw {code: -2, msg: '票据不存在'};
                }

                if (ret.status == 1) {
                    throw {code: -3, msg: '该票据已经审核通过，不能修改预算'};
                }

                return [ret.budget, DBM.TripPlan.findById(ret.tripPlanId)];
            })
            .spread(function (o_budget, order) {
                if (order.status == EPlanStatus.AUDITING) {
                    throw {code: -4, msg: '该次出差计划已经提交，不能修改预算'};
                }

                if (order.status !== 'NO_BUDGET') {
                    throw {code: -5, msg: '修改预算失败，请检查出差记录状态'};
                }

                let budget = params.budget;

                let logs = {
                    tripPlanId: order.id,
                    userId: params.userId,
                    remark: "更新预算",
                    createdAt: utils.now()
                }

                let updates:any = {
                    status: 'WAIT_UPLOAD',
                    budget: budget,
                    updatedAt: utils.now()
                }

                if (params.invoiceType) {
                    updates.invoiceType = params.invoiceType;
                }
                return sequelize.transaction(function (t) {
                    return Promise.all([
                        order.id,
                        DBM.TripDetail.update(updates, {where: {id: id}, transaction: t}),
                        DBM.TripPlanLogs.create(logs, {transaction: t})
                    ])
                })
            })
            .spread(function (tripPlanId) {
                return [tripPlanId, DBM.TripDetail.findAll({where: {tripPlanId: tripPlanId, status: {$ne: -2}}})];
            })
            .spread(function (tripPlanId, list) {
                let c_budget = 0;
                for (let i = 0; i < list.length; i++) {
                    let budget = list[i].budget;
                    if (budget < 0) {
                        return true;
                    }
                    c_budget += parseFloat(budget);
                }

                return DBM.TripPlan.update({
                    status: EPlanStatus.WAIT_COMMIT,
                    budget: c_budget,
                    updatedAt: utils.now()
                }, {where: {id: tripPlanId}, fields: ['status', 'budget', 'updatedAt']})
            })
            .then(function () {
                return true;
            })
    }



    @requireParams(['where'])
    static findOrdersByOption(options) {
        return DBM.TripPlan.findAll(options);
    }

    /**
     * 保存消费记录详情
     * @param params
     * @returns {*}
     */
    @requireParams(['tripPlanId', 'accountId', 'type', 'startTime', 'invoiceType', 'budget'])
// saveTripDetail['optional_params'] = TripDetailCols;
    static saveTripDetail(params) {
        let record = params;
        record.isCommit = false;
        record.status = EPlanStatus.WAIT_COMMIT;
        let options:any = {};
        options.fields = Object.keys(record);

        return DBM.TripPlan.findById(params.tripPlanId)
            .then(function (order) {
                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST();
                }

                if (order.accountId != params.accountId) {
                    L.ERR.PERMISSION_DENY();
                }

                if (order.status == EPlanStatus.AUDITING) {
                    throw {code: -3, msg: '该订单已提交，不能添加消费单据'};
                }

                if (order.status == 'COMPLETE') {
                    throw {code: -4, msg: '该计划单已审核，不能添加消费单据'};
                }

                let budget = params.budget || 0;
                if (budget > 0) {
                    order.increment(['budget'], {by: parseFloat(budget)});
                }


                if (order.status > EPlanStatus.WAIT_COMMIT) {
                    order.status = EPlanStatus.WAIT_COMMIT;
                }

                order.updatedAt = utils.now();
                return [record, order];
            })
            .spread(function (record, order) {
                return sequelize.transaction(function (t) {
                    options.transaction = t;

                    let logs = {
                        tripPlanId: order.id,
                        userId: params.accountId,
                        remark: "增加新的预算",
                        createdAt: utils.now()
                    }

                    return Promise.all([
                        DBM.TripDetail.create(record, options),
                        DBM.TripPlanLogs.create(logs, {transaction: t}),
                        order.save()
                    ])
                })
            })
            .spread(function (r) {
                return r;
            })
    }

    /**
     * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
     * @param params
     * @returns {*}
     */
    @requireParams(['userId', 'tripPlanId'])
    static deleteTripPlan(params) {
        let tripPlanId = params.tripPlanId;
        let userId = params.userId;
        return DBM.TripPlan.findById(tripPlanId)
            .then(function (order) {

                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST()
                }

                if (order.accountId != userId) { //权限不足
                    throw L.ERR.PERMISSION_DENY();
                }

                return sequelize.transaction(function (t) {
                    return Promise.all([
                        DBM.TripPlan.update({updatedAt: utils.now()}, {
                            where: {id: tripPlanId},
                            fields: ['status', 'updatedAt'],
                            transaction: t
                        }),
                        DBM.TripDetail.update({ updatedAt: utils.now()}, {where: {tripPlanId: tripPlanId}, fields: ['status', 'updatedAt'], transaction: t})
                    ])
                })
            })
            .then(function () {
                return true;
            })
    }

    /**
     * 删除差旅消费明细
     * @param params
     * @returns {*}
     */
    @requireParams(['userId', 'id'])

    static deleteTripDetail(params) {
        let id = params.id;
        let userId = params.userId;

        return DBM.TripDetail.findById(id)
            .then(function (detail) {
                if (!detail ) {
                    throw L.ERR.CONSUME_DETAIL_NOT_EXIST();
                }

                if (detail.accountId != userId) {
                    throw L.ERR.PERMISSION_DENY();
                }

                return DBM.TripDetail.update({ updatedAt: utils.now()}, {
                    where: {id: id},
                    fields: ['status', 'updatedAt']
                })
            })
            .then(function () {
                return true;
            })
    }

    /**
     * 上传票据
     * @param params
     * @param params.userId 用户id
     * @param params.tripDetailId 消费详情id
     * @param params.picture 新上传的票据fileId
     * @returns {*}
     */
    @requireParams(['tripDetailId', 'picture', 'userId'])
    static uploadInvoice(params) {
        let tripPlanId = "";

        return DBM.TripDetail.findById(params.tripDetailId)
            .then(function (custome) {
                if (!custome) {
                    throw L.ERR.NOT_FOUND();
                }

                if (custome.accountId != params.userId) {
                    throw L.ERR.PERMISSION_DENY();
                }

                if (custome.status === 'AUDIT_PASS') {
                    throw {code: -3, msg: '已审核通过的票据不能重复上传'};
                }

                tripPlanId = custome.tripPlanId;
                return [tripPlanId, custome,
                    DBM.TripPlan.findById(tripPlanId),
                    DBM.TripDetail.findAll({
                        where: {tripPlanId: tripPlanId},
                        attributes: ['id', 'status', 'status', 'budget', 'isCommit', 'newInvoice']
                    }) //所有的未审核通过的数据
                ]
            })
            .spread(function (tripPlanId, custome, order, list) {
                if (order.status == EPlanStatus.NO_BUDGET) {
                    throw {code: -2, msg: '还没有录入出差预算'};
                }

                let invoiceJson = custome.invoice;
                let times = invoiceJson.length ? invoiceJson.length + 1 : 1;
                let currentInvoice = {times: times, picture: params.picture, created_at: moment().format('YYYY-MM-DD HH:mm'), status: EPlanStatus.WAIT_COMMIT, remark: '', approve_at: ''};
                invoiceJson.push(currentInvoice);

                let updates = {newInvoice: params.picture, invoice: JSON.stringify(invoiceJson), updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"), status: EPlanStatus.WAIT_COMMIT, auditRemark: params.auditRemark || ''};

                let logs = {tripPlanId: tripPlanId, tripDetailId: params.tripDetailId, userId: params.userId, remark: "上传票据"};
                let orderLogs = {tripPlanId: custome.tripPlanId, userId: params.userId, remark: '上传票据', createdAt: utils.now()};

                let order_status = 'WAIT_COMMIT';
                list.map(function (en) {
                    if (en.status == 'AUDIT_NOT_PASS' && en.id != params.tripDetailId) {
                        order_status = 'AUDIT_NOT_PASS';
                    }

                    if (en.status == 'WAIT_UPLOAD' && en.id != params.tripDetailId) {
                        order_status = 'WAIT_UPLOAD';
                    }
                })

                return sequelize.transaction(function (t) {
                    return Promise.all([
                        DBM.TripDetail.update(updates, {
                            returning: true,
                            where: {id: params.tripDetailId},
                            transaction: t
                        }),
                        DBM.TripPlanLogs.create(logs, {transaction: t}),
                        DBM.TripPlanLogs.create(orderLogs, {transaction: t}),
                        DBM.TripPlan.update({
                            status: order_status,
                            updatedAt: utils.now()
                        }, {where: {id: tripPlanId}})
                    ]);
                })
            })
            .then(function () {
                return true;
            })
    }

    @clientExport
    @requireParams(['tripDetailId', 'pictureFileId'])
    static async uploadInvoiceNew(params: {tripDetailId: string, pictureFileId: string}): Promise<boolean> {
        console.info("********************");
        console.info("params", params);
        let {accountId} = getSession();

        let tripDetail = await Models.tripDetail.get(params.tripDetailId);

        if (!tripDetail) {
            throw L.ERR.NOT_FOUND();
        }

        if (tripDetail.accountId != accountId) {
            throw L.ERR.PERMISSION_DENY();
        }

        if (tripDetail.status === EPlanStatus.COMPLETE || tripDetail.status === EPlanStatus.AUDITING) {
            throw {code: -3, msg: '审核中或已审核通过的票据不能上传!'};
        }

        let tripPlan = tripDetail.tripPlan;

        let invoiceJson = tripDetail.invoice;
        let times = invoiceJson.length ? invoiceJson.length + 1 : 1;
        invoiceJson.push({times: times, pictureFileId: params.pictureFileId, created_at: utils.now(), status: EPlanStatus.WAIT_COMMIT, remark: '', approve_at: ''});

        tripDetail.newInvoice = params.pictureFileId;
        tripDetail.invoice = JSON.stringify(invoiceJson);
        tripDetail.status = EPlanStatus.WAIT_COMMIT;

        var details = await Models.tripDetail.find({where: {tripPlanId: tripPlan.id, status: EPlanStatus.WAIT_UPLOAD, id: {$ne: tripDetail.id}}});

        if(details || details.length == 0) {
            tripPlan.status = EPlanStatus.WAIT_COMMIT;
        }

        await Promise.all([tripPlan.save(), tripDetail.save()]);

        return true;
    }


    /**
     * 判断某用户是否有访问该消费记录票据权限
     * @param params
     * @returns {Promise.<Instance>}
     */
    @requireParams(['tripDetailId', 'userId'])

    static async getVisitPermission(params) {
        let userId = params.userId;
        let tripDetailId = params.tripDetailId;
        let consume = await DBM.TripDetail.findById(tripDetailId);
        if (!consume) {
            throw {code: -4, msg: '查询记录不存在'};
        }

        if (consume.accountId == userId) {//允许自己查看
            return {allow: true, fileId: consume.newInvoice};
        }

        let order = await DBM.TripPlan.findById(consume.tripPlanId);
        if (!order || order.status == 'DELETE') {
            throw {code: -4, msg: '订单记录不存在'};
        }

        let company = await API.company.getCompany({id: order.companyId});
        if (!company) {
            throw {code: -5, msg: "企业不存在"}
        }

        let agencyId = company.agencyId;
        let agencyUser = await API.agency.getAgencyUser({id: userId});

        if (agencyUser && agencyUser.roleId != 1 && agencyUser.agencyId == agencyId) {//允许代理商创建人管理员访问
            return {allow: true, fileId: consume.newInvoice};
        } else {
            return {allow: false};
        }
    }

    /**
     * 保存出差计划日志
     * @type {saveOrderLogs}
     */
    @requireParams(['userId', 'tripPlanId', 'remark'])

    static saveOrderLogs(logs) {
        return DBM.TripPlan.findById(logs.tripPlanId)
            .then(function (order) {
                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST();
                }

                if (order.status == EPlanStatus.COMPLETE) {
                    throw {code: -2, msg: '该计划单已完成，不能增加日志'};
                }

                logs.createdAt = utils.now();
                return DBM.TripPlanLogs.create(logs);
            })
    }

    /**
     * 审核票据
     * @param params
     * @param params.status审核结果状态
     * @param params。tripDetailId 审核消费单id
     * @param params.userId 用户id
     * @returns {*|Promise}
     */
    @requireParams(['status', 'tripDetailId', 'userId'], ['remark', 'expenditure'])

    static approveInvoice(params) {
        return DBM.TripDetail.findById(params.tripDetailId)
            .then(function (consume) {
                if (!consume )
                    throw L.ERR.NOT_FOUND();

                if (!consume.newInvoice) {
                    throw {code: -2, msg: '没有上传票据'};
                }

                if (consume.status == EPlanStatus.AUDITING) {
                    throw {code: -3, msg: '该票据已审核通过，不能重复审核'};
                }

                return [DBM.TripPlan.findById(consume.tripPlanId), consume]
            })
            .spread(function (order, consume) {
                let invoiceJson = consume.invoice;

                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST();
                }

                if (order.status === EPlanStatus.WAIT_COMMIT && order.auditStatus == 0) {
                    throw {code: -3, msg: '该订单未提交，不能审核'};
                }

                if (invoiceJson && invoiceJson.length > 0) {
                    invoiceJson[invoiceJson.length - 1].status = params.status;
                    invoiceJson[invoiceJson.length - 1].remark = params.remark;
                    invoiceJson[invoiceJson.length - 1].approve_at = utils.now();
                }

                let updates:any = {
                    invoice: JSON.stringify(invoiceJson),
                    updatedAt: utils.now(),
                    status: params.status,
                    auditUser: params.userId,
                    expenditure: params.expenditure
                };

                if (params.remark) {
                    updates.auditRemark = params.remark;
                }

                let logs = {
                    tripDetailId: params.tripDetailId,
                    userId: params.userId,
                    status: params.status,
                    remark: "审核票据-" + params.remark
                };

                return sequelize.transaction(function (t) {
                    if (updates.status == EPlanStatus.NO_BUDGET) {
                        updates.isCommit = false;
                    }
                    return Promise.all([
                        DBM.TripDetail.update(updates, {
                            returning: true,
                            where: {id: params.tripDetailId},
                            transaction: t
                        }),
                        DBM.TripPlanLogs.create(logs, {transaction: t})
                    ])
                        .spread(function (ret) {
                            let status = params.status;

                            if (status == EPlanStatus.NO_BUDGET) {
                                return DBM.TripPlan.update({
                                        status: EPlanStatus.WAIT_COMMIT,
                                        auditStatus: -1,
                                        updatedAt: utils.now()
                                    },
                                    {
                                        where: {id: order.id},
                                        fields: ['auditStatus', 'status', 'updatedAt'],
                                        transaction: t
                                    });
                            }

                            if (!params.expenditure)
                                throw {code: -4, msg: '支出金额不能为空'};

                            let ex_expenditure = order.expenditure || 0;
                            let expenditure = (parseFloat(params.expenditure) + parseFloat(ex_expenditure)).toFixed(2);
                            let order_updates:any = {
                                expenditure: expenditure,
                                updatedAt: utils.now()
                            }

                            return DBM.TripDetail.findAll({where: {tripPlanId: order.id, status: {$ne: -2}}})
                                .then(function (list) {
                                    for (let i = 0; i < list.length; i++) {
                                        if (list[i].status != EPlanStatus.AUDITING && list[i].id != ret[1][0].id) {
                                            return false;
                                        }
                                    }

                                    return true;
                                })
                                .then(function (isAllAudit) {
                                    if (isAllAudit) {
                                        let score:number = 0;
                                        score = (order.budget - order_updates.expenditure) > 0 ? order.budget - order_updates.expenditure : 0;
                                        order_updates.status = EPlanStatus.COMPLETE;
                                        order_updates.auditStatus = 1;
                                        order_updates.score = Math.floor(score / 2);
                                    }

                                    return DBM.TripPlan.update(order_updates, {
                                        where: {id: order.id},
                                        fields: Object.keys(order_updates),
                                        transaction: t
                                    })
                                })
                        })
                });
            })
            .then(function () {
                return true;
            })
    }

    /**
     * 统计计划单数量
     *
     * @param params
     */
    @requireParams(['companyId'], ['accountId', 'status'])

    static countTripPlanNum(params) {
        let query = params;
        return DBM.TripPlan.count({where: query});
    }


    /**
     * 按月份统计预算/计划/完成金额
     * @type {statBudgetByMonth}
     */
    @requireParams(['companyId'], ['startTime', 'endTime', 'accountId'])
    static statBudgetByMonth(params) {
        let stTime = params.startTime || moment().format('YYYY-MM-DD');
        let enTime = params.endTime || moment().format('YYYY-MM-DD');
        let timeArr = [];
        do {
            let t = moment(stTime).format('YYYY-MM-');
            timeArr.push(t + '0\\d');
            timeArr.push(t + '1\\d');
            timeArr.push(t + '2\\d');
            stTime = moment(stTime).add(1, 'months').format('YYYY-MM-DD');
        } while (stTime < enTime);

        let sql = 'select count(account_id) as \"staffNum\", sum(budget) as \"planMoney\",sum(expenditure) as expenditure ' +
            'from tripplan.trip_plan where company_id=\'' + params.companyId + '\'';

        if (params.accountId) {
            sql += ' and account_id=\'' + params.accountId + '\'';
        }

        let complete_sql = sql + ' and status=2 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';


        sql += ' and status > -1 and to_char(start_at, \'YYYY-MM-DD\') ~ \'';

        return Promise.all(
            timeArr.map(function (month) {
                let s_sql = sql; // + month + '\\d\';';
                let c_sql = complete_sql; // + month + '\\d\';';
                let index = month.match(/\d{4}-\d{2}-(\d).*/)[1];
                let remark = '';

                if (index === '0') {
                    remark = '上旬';
                    s_sql = sql + month + '\';';
                    c_sql = complete_sql + month + '\';';
                } else if (index === '1') {
                    remark = '中旬';
                    s_sql = sql + month + '\';';
                    c_sql = complete_sql + month + '\';';
                } else if (index === '2' || index === '3') {
                    remark = '下旬';
                    let str = month.substr(0, month.length - 3);
                    s_sql = sql + str + '(2|3)\\d\';';
                    c_sql = complete_sql + str + '(2|3)\\d\';';
                }

                let _month = month.match(/\d{4}-\d{2}/)[0];
                return Promise.all([
                    sequelize.query(s_sql),
                    sequelize.query(c_sql),
                ])
                    .spread(function (all, complete) {
                        let a = all[0][0];
                        let c = complete[0][0];
                        let stat = {
                            month: _month,
                            qmBudget: a.planMoney | 0,
                            planMoney: c.planMoney | 0,
                            expenditure: c.expenditure | 0,
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
    @requireParams(['companyId'], ['startTime', 'endTime', 'accountId'])
    static statPlanOrderMoney(params) {
        let query = params;
        let query_complete:any = {
            companyId: query.companyId,
            status: EPlanStatus.COMPLETE,
            auditStatus: 1
        }
        let query_sql = 'select sum(budget-expenditure) as \"savedMoney\" from tripplan.trip_plan where company_id=\'' + params.companyId + '\' and status=2 and audit_status=1';
        query.status = {$gte: EPlanStatus.WAIT_COMMIT};
        let startAt:any = {};

        if (params.startTime) {
            startAt.$gte = params.startTime;
            query_sql += ' and start_at >=\'' + params.startTime + '\'';
            delete params.startTime;
        }

        if (params.endTime) {
            startAt.$lte = params.endTime;
            query_sql += ' and start_at <=\'' + params.endTime + '\'';
            delete params.endTime;
        }

        if (params.accountId) {
            query_complete.accountId = params.accountId;
            query_sql += ' and account_id=\'' + params.accountId + '\'';
        }

        query_sql += ' and budget>expenditure;';

        if (!_.isNull(startAt)) {
            query.startAt = startAt;
            query_complete.startAt = startAt;
        }

        return Promise.all([
            DBM.TripPlan.sum('budget', {where: query}),
            DBM.TripPlan.sum('budget', {where: query_complete}),
            DBM.TripPlan.sum('expenditure', {where: query_complete}),
            DBM.TripPlan.count({where: query_complete}),
            sequelize.query(query_sql)
        ])
            .spread(function (n1, n2, n3, n4, n5) {
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
    @requireParams(['companyId'], ['description'])
    static getProjects(params) {
        return DBM.TripPlan.findAll({where: params, group: ['description'], attributes: ['description']})
    }

    /**
     * 提交计划单
     * @param params
     * @returns {*}
     */
    @requireParams(['tripPlanId', 'accountId'])
    static commitTripPlanOrder(params) {
        let id = params.tripPlanId;
        return Promise.all([
            DBM.TripPlan.findById(id),
            DBM.TripDetail.findAll({where: {tripPlanId: id}})
        ])
            .spread(function (order, list) {
                if (!order) {
                    throw L.ERR.TRIP_PLAN_ORDER_NOT_EXIST();
                }

                if (order.accountId != params.accountId) {
                    throw L.ERR.PERMISSION_DENY();
                }

                if (order.status == EPlanStatus.NO_BUDGET) {
                    throw {code: -3, msg: '计划单还没有预算，不能提交'};
                }

                if (order.status == EPlanStatus.AUDITING) {
                    throw {code: -4, msg: '该计划单已提交，不能重复提交'};
                }

                if (order.status > EPlanStatus.AUDITING || order.auditStatus == 1) {
                    throw {code: -5, msg: '该计划单已经审核通过，不能提交'};
                }

                if (list.length <= 0) {
                    throw {code: -6, msg: '该计划单没有票据提交'};
                }

                for (let i = 0; i < list.length; i++) {
                    let s = list[i];

                    if ((s.status === EPlanStatus.WAIT_COMMIT && !s.newInvoice) || s.status == EPlanStatus.NO_BUDGET) {
                        throw {code: -7, msg: '票据没有上传完'};
                    }
                }
            })
            .then(function () {
                return Promise.all([
                    DBM.TripPlan.update({
                        status: EPlanStatus.AUDITING,
                        auditStatus: 0,
                        updatedAt: utils.now(),
                        isCommit: true,
                        commitTime: utils.now()
                    }, {where: {id: id}, fields: ['status', 'auditStatus', 'updatedAt', 'isCommit']}),
                    DBM.TripDetail.update({
                        isCommit: true,
                        commitTime: utils.now(),
                        updatedAt: utils.now()
                    }, {where: {tripPlanId: id}})
                ])
            })
            .then(function () {
                return true;
            })
    }

    /**
     * @method previewConsumeInvoice 预览发票图片
     *
     * @param {Object} params
     * @param {UUID} params.tripDetailId
     * @param {UUID} params.accountId
     */
    static previewConsumeInvoice(params) {
        let tripDetailId = params.tripDetailId;
        let accountId = params.accountId;

        return TripPlanModule.getVisitPermission({tripDetailId: tripDetailId, userId: accountId})
            .then(function (result) {
                if (!result.allow) {
                    throw L.ERR.PERMISSION_DENY();
                }
                return DBM.TripDetail.findById(tripDetailId)
            })
            .then(function (consume) {
                return API.attachments.getAttachment({id: consume.newInvoice});
            })
            .then(function (attachment) {
                return "data:image/jpg;base64," + attachment.content;
            })
    }

    /**
     * 判断用户是否已经生成改预算
     * @param params
     */
    @requireParams(['tripDetails', 'accountId', 'companyId', 'arrivalCity', 'arrivalCityCode', 'title'], ['deptCity',
        'deptCityCode', 'startAt', 'backAt', 'isNeedTraffic', 'isNeedHotel', 'description'])
    static async checkBudgetExist(params) {
        // let tripDetails_required_fields = ['type', 'startTime', 'invoiceType'];
        let tripDetails = params.tripDetails;
        delete params.tripDetails;
        let _planOrder = params;

        if (_planOrder.deptCity && !_planOrder.deptCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }


        let orders = await DBM.TripPlan.findAll({where: _planOrder});
        if (orders.length <= 0) {
            return false;
        }

        let details = [];
        await Promise.all(tripDetails.map(async function (detail) {
            detail.invoiceType = EInvoiceType[detail.invoiceType];
            let plan_details = await DBM.TripDetail.findAll({where: detail});
            plan_details.map(function (d) {
                details.push(d);
            });
        }));

        if (!details || details.length <= 0) {
            return false;
        }

        let result:boolean|string = false;

        details.map(function (detail:any) {
            let tripPlanId = detail.tripPlanId;
            orders.map(function (order) {
                if (order.id === tripPlanId) {
                    result = tripPlanId;
                }
            });
        });

        return result;
    }


    /**
     * 根据出差记录id获取出差详情(包括已删除的)
     * @param params
     * @returns {Promise<TripDetails>}
     */
    @clientExport
    @requireParams(['tripPlanId'], ['type'])
    static async getTripDetails(params): Promise<string[]> {
        let options: any = {where: {tripPlanId: params.tripPlanId}}

        if(params.type) {
            options.where['type'] = params.type;
        }

        let details = await Models.tripDetail.find(options);
        return details.map(function(d) {
            return d.id;
        })
    }


    @clientExport
    @requireParams(['name', 'createUser', 'company_id'], ['code'])
    static createNewProject(params) {
        return Project.create(params).save();
    }

    @requireParams(['id'])
    @clientExport
    static async getProjectById(params:{id:string}):Promise<Project> {
        return await Models.project.get(params.id);
    }

    @clientExport
    @requireParams(['companyId'], ['code', 'name', 'count'])
    static getProjectList(params) {
        let options:any = {where: params, attributes: ['name'], order: [['created_at', 'desc']]};
        return Models.project.find(options);
    }

    static async deleteProject(params:{id:string}):Promise<boolean> {
        let project = await Models.project.get(params.id);

        if (!project) {
            throw L.ERR.NOT_FOUND();
        }

        return await project.destroy();
    }


    /**
     * @method saveTripPlanLog
     * 保存出差计划改动日志
     * @type {saveTripPlanLog}
     */
    @requireParams(['tripPlanId', 'remark'], ['tripDetailId'])
    static saveTripPlanLog(params): Promise<TripPlanLog> {
        let {account: userId} = Zone.current.get('session');
        params.createdAt = utils.now();
        params.updatedAt = utils.now();
        return DBM.TripPlanLog.create(params);
    }

    /**
     * @method getTripPlanLog
     * @param params
     * @returns {any}
     */
    @requireParams(['id'])
    static getTripPlanLog(params: {id: string}): Promise<TripPlanLog> {
        return DBM.TripPlanLog.findById(params.id);
    }

    /**
     * @method updateTripPlanLog
     * @param param
     */
    static updateTripPlanLog(param): Promise<TripPlanLog> {
        throw {code: -1, msg: '不能更新日志'};
    }

    @requireParams(['tripPlanId'], ['tripDetailId'])
    static async getTripPlanLogs(params) {
        let logs = DBM.findAll({where: params});
        return logs.map(function(log) {
            return log.id;
        })
    }


    static __initHttpApp = require('./invoice');

}

async function getProjectByName(params) {
    let projects = await Models.project.find({name: params.name});
    let project;

    if(projects && projects.length > 0) {
        project = projects[0];
    }else if(params.isCreate === true){
        let p = {name: params.name, createUser: params.userId, code: '', companyId: params.companyId, createdAt: utils.now()};
        project = await DBM.Project.create(p);
    }

    return new Project(project);
}



/**
 * 从参数中获取计划详情数组
 * @param params
 * @returns {Object}
 */
function getPlanDetails(params:any):{orderStatus:EPlanStatus, budget:number, tripDetails:any} {
    let tripDetails:any = [];
    let tripDetails_required_fields = ['startTime', 'invoiceType', 'budget'];
    if(params.outTrip){
        params.outTrip.map(function (detail:any) {
            detail.type = 1;
            tripDetails.push(detail);
        });
    }

    if(params.backTrip){
        params.backTrip.map(function (detail:any) {
            detail.type = 2;
            tripDetails.push(detail);
        });
    }

    if(params.hotel){
        params.hotel.map(function (detail:any) {
            detail.type = 3;
            tripDetails.push(detail);
        });
    }

    let total_budget:number = 0;
    let isBudget = true;

    let _tripDetails = tripDetails.map(function (detail) {
        tripDetails_required_fields.forEach(function (key) {
            if (!_.has(detail, key)) {
                throw {code: '-1', msg: 'tripDetails的属性' + key + '没有指定'};
            }
        });

        if (detail.deptCity && !detail.deptCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (detail.arrivalCity && !detail.arrivaltCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (detail.city && !detail.cityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (!/^-?\d+(\.\d{1,2})?$/.test(detail.budget)) {
            throw {code: -2, nsg: '预算金额格式不正确'};
        }

        detail.budget > 0 ? total_budget = total_budget + parseFloat(detail.budget) : isBudget = false;

        return _.pick(detail, API.tripPlan.TripDetailCols);
    });

    let orderStatus = isBudget ? EPlanStatus.WAIT_UPLOAD : EPlanStatus.NO_BUDGET; //是否有预算，设置出差计划状态

    return {orderStatus: orderStatus, budget: total_budget, tripDetails: _tripDetails};
}


export = TripPlanModule;