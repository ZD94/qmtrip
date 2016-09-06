/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
let sequelize = require("common/model").DB;
let DBM = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
import utils = require("common/utils");
let API = require('common/api');
let Logger = require('common/logger');
let logger = new Logger("tripPlan");
let config = require("../../config");
let moment = require("moment");
let scheduler = require('common/scheduler');
import _ = require('lodash');
import {requireParams, clientExport} from 'common/api/helper';
import {
    Project, TripPlan, TripDetail, EPlanStatus, EInvoiceType, TripPlanLog, ETripType, EAuditStatus,
    TripApprove, EApproveStatus, EApproveResult
} from "api/_types/tripPlan";
import {Models} from "api/_types/index";
import {FindResult} from "common/model/interface";
import {Staff, EStaffRole, EStaffStatus} from "api/_types/staff";
import {conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {getSession} from "common/model/index";
import {AgencyUser} from "../_types/agency";

let msgConfig = config.message
let TripDetailCols = TripDetail['$fieldnames'];
let TripPlanCols = TripPlan['$fieldnames'];

class TripPlanModule {
    /**
     * @param params.budgetId 预算id
     * @param params.title 项目名称
     * @param params.description 出差事由
     * @param params.remark 备注
     * @param params
     * @returns {TripPlan}
     */
    @clientExport
    @requireParams(['budgetId', 'title'], ['description', 'remark', 'auditUser'])
    static async saveTripPlan(params): Promise<TripPlan> {
        let staff = await Staff.getCurrent();
        let company = staff.company;

        if(company.isApproveOpen && !params.auditUser) { //企业开启审核功能后，审核人不能为空
            throw {code: -3, msg: '审核人不能为空'};
        }

        let budgetInfo = await API.travelBudget.getBudgetInfo({id: params.budgetId});

        if(!budgetInfo) {
            throw L.ERR.TRAVEL_BUDGET_NOT_FOUND();
        }

        let {budgets, query} = budgetInfo;
        let project = await getProjectByName({companyId: company.id, name: params.title, userId: staff.id, isCreate: true});
        let totalBudget = 0;
        let tripPlan = TripPlan.create(params);

        if(tripPlan.auditUser == staff.id) {
            throw {code: -2, msg: '审核人不能是自己'};
        }

        tripPlan.account = staff;
        tripPlan['companyId'] = company.id;
        tripPlan.project = project;
        tripPlan.startAt = query.leaveDate;
        tripPlan.backAt = query.goBackDate;
        tripPlan.deptCityCode = query.originPlace;
        tripPlan.query = JSON.stringify(query);

        if(query.originPlace) {
            let deptInfo = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace});
            tripPlan.deptCity = deptInfo.name;
        }
        tripPlan.arrivalCityCode = query.destinationPlace;
        let arrivalInfo = await API.place.getCityInfo({cityCode: query.destinationPlace.id || query.destinationPlace.id });
        tripPlan.arrivalCity = arrivalInfo.name;
        tripPlan.isNeedHotel = query.isNeedHotel;
        tripPlan.isRoundTrip = query.isRoundTrip;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo');
        if (!tripPlan.auditUser) {
            tripPlan.auditUser = null;
        }

        let tripDetails: TripDetail[] = budgets.map(function (budget) {
            let tripType = budget.tripType;
            let price = Number(budget.price);
            let detail = Models.tripDetail.create({type: tripType, invoiceType: budget.type, budget: price});
            detail.accountId = staff.id;
            detail.isCommit = false;
            detail.status = EPlanStatus.WAIT_UPLOAD;
            detail.tripPlan = tripPlan;
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail.deptCityCode = query.originPlace;
                    detail.arrivalCityCode = query.destinationPlace;
                    detail.deptCity = tripPlan.deptCity;
                    detail.arrivalCity = tripPlan.arrivalCity;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.BACK_TRIP:
                    detail.deptCityCode = query.destinationPlace;
                    detail.arrivalCityCode = query.originPlace;
                    detail.deptCity = tripPlan.arrivalCity;
                    detail.arrivalCity = tripPlan.deptCity;
                    detail.startTime = query.goBackDate;
                    detail.endTime = query.leaveDate;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.HOTEL:
                    detail.type = ETripType.HOTEL;
                    detail.cityCode = query.destinationPlace;
                    detail.city = tripPlan.arrivalCity;
                    detail.hotelCode = query.businessDistrict;
                    detail.hotelName = query.hotelName;
                    detail.startTime = query.checkInDate || query.leaveDate;
                    detail.endTime = query.checkOutDate || query.goBackDate;
                    tripPlan.isNeedHotel = true;
                    break;
                case ETripType.SUBSIDY:
                    detail.type = ETripType.SUBSIDY;
                    detail.deptCityCode = query.originPlace;
                    detail.arrivalCityCode = query.destinationPlace;
                    detail.deptCity = tripPlan.deptCity;
                    detail.arrivalCity = tripPlan.arrivalCity;
                    detail.startTime = query.leaveDate || query.checkInDate;
                    detail.endTime = query.goBackDate || query.checkOutDate;
                    detail.expenditure = price;
                    detail.status = EPlanStatus.COMPLETE;
                    break;
                default:
                    detail.type = ETripType.SUBSIDY;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    break;
            }

            if(budget.price < 0 || totalBudget < 0) {
                totalBudget = -1;
            }else {
                totalBudget = totalBudget + Number(budget.price);
            }
            return detail;
        });

        tripPlan.budget = totalBudget;
        tripPlan.status = totalBudget<0 ? EPlanStatus.NO_BUDGET : EPlanStatus.WAIT_UPLOAD;
        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: '创建出差计划'});

        await Promise.all([tripPlan.save(), tripPlanLog.save()]);
        await Promise.all(tripDetails.map((d) => d.save()));
        // if (tripPlan.budget > 0 || tripPlan.status === EPlanStatus.WAIT_APPROVE) {
        //     await TripPlanModule.sendTripPlanNotice(tripPlan, staff.id);
        // }
        return tripPlan;
    }

    /**
     * 获取出差计划中发送邮件的模板数据详情
     * 该函数将在审批单分出后舍弃
     * @param tripPlan
     * @returns {{go: string, back: string, hotel: string}}
     */
    static async getPlanEmailDetails(tripPlan: TripPlan): Promise<{go: string, back: string, hotel: string, others: string}> {
        let go = '无', back = '无', hotelStr = '无', others = '无';

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
                ', ' + h.city + ',';
            if(h.hotelName) {
                hotelStr += h.hotelName + ',';
            }
            hotelStr += '动态预算￥' + h.budget;
        }

        let subsidy = await tripPlan.getTripDetails({where: {type: [ETripType.SUBSIDY]}});
        if(subsidy && subsidy.length > 0) {
            let subsidyBudget = 0;
            subsidy.map((s) => {subsidyBudget += s.budget;});
            // others = moment(subsidy[0].startTime).format('YYYY-MM-DD') + ' 至 ' + moment(subsidy[0].endTime).format('YYYY-MM-DD') + '￥' + subsidyBudget;
            others = '￥' + subsidyBudget;
        }

        return {go: go, back: back, hotel: hotelStr, others: others};
    }

    static async getEmailInfoFromDetails(details: TripDetail[]): Promise<{go: string, back: string, hotel: string, others: string}> {
        let goStr = '无', backStr = '无', hotelStr = '无', otherStr = '无';

        details.map((d) => {
            switch (d.type) {
                case ETripType.OUT_TRIP:
                    goStr = `${moment(d.startTime).format('YYYY-MM-DD')}, ${d.deptCity} 到 ${d.arrivalCity}`;
                    if (d.latestArriveTime)
                        goStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    goStr += `, 动态预算￥${d.budget}`;
                    break;
                case ETripType.BACK_TRIP:
                    backStr = `${moment(d.startTime).format('YYYY-MM-DD')}, ${d.deptCity} 到 ${d.arrivalCity}`;
                    if (d.latestArriveTime)
                        backStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    backStr += `, 动态预算￥${d.budget}`;
                    break;
                case ETripType.HOTEL:
                    hotelStr = `${moment(d.startTime).format('YYYY-MM-DD')} 至 ${moment(d.endTime).format('YYYY-MM-DD')}, ${d.city}`;
                    if(d.hotelName) {
                        hotelStr += `, ${d.hotelName}`;
                    }
                    hotelStr += `, 动态预算￥${d.budget}`;
                    break;
                case ETripType.SUBSIDY:
                    otherStr = `￥${d.budget}`;
                    break;
            }
        });

        return {go: goStr, back: backStr, hotel: hotelStr, others: otherStr};
    }

    static async getDetailsFromApprove(params: {approveId: string}): Promise<TripDetail[]> {
        let approve = await Models.tripApprove.get(params.approveId);
        let account = approve.account;
        let budgets = approve.budgetInfo;
        let query = approve.query;
        return budgets.map(function (budget) {
            let tripType = budget.tripType;
            let price = Number(budget.price);
            let detail = Models.tripDetail.create({type: tripType, invoiceType: budget.type, budget: price});
            detail.accountId = account.id;
            detail.isCommit = false;
            detail.tripPlanId = approve.id;
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail.deptCityCode = approve.deptCityCode;
                    detail.arrivalCityCode = approve.arrivalCityCode;
                    detail.deptCity = approve.deptCity;
                    detail.arrivalCity = approve.arrivalCity;
                    detail.startTime = approve.startAt;
                    detail.endTime = approve.backAt;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    break;
                case ETripType.BACK_TRIP:
                    detail.deptCityCode = approve.arrivalCityCode;
                    detail.arrivalCityCode = approve.deptCityCode;
                    detail.deptCity = approve.arrivalCity;
                    detail.arrivalCity = approve.deptCity;
                    detail.startTime = approve.backAt;
                    detail.endTime = approve.startAt;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    break;
                case ETripType.HOTEL:
                    detail.type = ETripType.HOTEL;
                    detail.cityCode = approve.arrivalCityCode;
                    detail.city = approve.arrivalCity;
                    detail.hotelCode = query.businessDistrict;
                    detail.hotelName = query.hotelName;
                    detail.startTime = query.checkInDate || approve.startAt;
                    detail.endTime = query.checkOutDate || approve.backAt;
                    break;
                case ETripType.SUBSIDY:
                    detail.type = ETripType.SUBSIDY;
                    detail.deptCityCode = approve.deptCityCode;
                    detail.arrivalCityCode = approve.arrivalCityCode;
                    detail.deptCity = approve.deptCity;
                    detail.arrivalCity = approve.arrivalCity;
                    detail.startTime = approve.startAt || query.checkInDate;
                    detail.endTime = approve.backAt || query.checkOutDate;
                    detail.expenditure = price;
                    detail.status = EPlanStatus.COMPLETE;
                    break;
                default:
                    detail.type = ETripType.SUBSIDY;
                    detail.startTime = approve.startAt;
                    detail.endTime = approve.backAt;
                    break;
            }
            return detail;
        });
    }


    static async sendTripApproveNotice(params: {approveId: string, nextApprove?: boolean}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;
        let nextApprove = params.nextApprove || false;

        let details = await TripPlanModule.getDetailsFromApprove({approveId: tripApprove.id});
        let {go, back, hotel, others} = await TripPlanModule.getEmailInfoFromDetails(details);
        let timeFormat = 'YYYY-MM-DD HH:mm:ss';

        //给员工发送邮件
        let self_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
        let openid = await API.auth.getOpenIdByAccount({accountId: staff.id});
        let values: any = {
            staffName: staff.name,
            time: moment(tripApprove.createdAt["value"]).format(timeFormat),
            projectName: tripApprove.title,
            goTrafficBudget: go,
            backTrafficBudget: back,
            hotelBudget: hotel,
            otherBudget: others,
            totalBudget: '￥' + tripApprove.budget,
            url: self_url,
            detailUrl: self_url
        };
        if(!nextApprove){
            //给员工自己发送通知
            API.notify.submitNotify({
                key: 'qm_notify_self_traveludget',
                email: staff.email,
                values: values,
                openid: openid,
            });
        }

        if(company.isApproveOpen) {
            //给审核人发审核邮件
            let approveUser = tripApprove.approveUser;
            let approve_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
            let approve_values = utils.clone(values);
            let shortUrl = await API.wechat.shorturl({longurl: approve_url});
            let openId = await API.auth.getOpenIdByAccount({accountId: approveUser.id});
            approve_values.managerName = approveUser.name;
            approve_values.username = staff.name;
            approve_values.email = staff.email;
            approve_values.url = shortUrl;
            approve_values.detailUrl = shortUrl;
            approve_values.name = staff.name;
            approve_values.destination = tripApprove.arrivalCity;
            approve_values.startDate = moment(tripApprove.startAt["value"]).format('YYYY.MM.DD');
            if (openId) {
                approve_values.approveUser = approveUser.name;
                approve_values.content = `员工${staff.name}${moment(tripApprove.startAt["value"]).format('YYYY-MM-DD')}到${tripApprove.arrivalCity}的出差计划已经发送给您，预算：￥${tripApprove.budget}，等待您审批！`;
                approve_values.autoApproveTime = moment(tripApprove.autoApproveTime["value"]).format(timeFormat);
                approve_values.staffName = staff.name;
                approve_values.startDate = moment(tripApprove.startAt["value"]).format('YYYY.MM.DD');
                approve_values.endDate = moment(tripApprove.backAt["value"]).format('YYYY.MM.DD');
                approve_values.createdAt = moment(tripApprove.createdAt["value"]).format(timeFormat);
                let travelLine = "";
                if(!tripApprove.deptCity) {
                    travelLine = tripApprove.arrivalCity;
                }else {
                    travelLine = tripApprove.deptCity + ' - ' + tripApprove.arrivalCity;
                }
                if(tripApprove.isRoundTrip) {
                    travelLine += ' - ' + tripApprove.deptCity;
                }
                approve_values.travelLine = travelLine;
                approve_values.reason= tripApprove.title;
                approve_values.budget = tripApprove.budget;
                // approve_values.autoApproveTime = moment(tripApprove.autoApproveTime["value"]).format(timeFormat)
            }
            API.notify.submitNotify({
                key: 'qm_notify_new_travelbudget',
                email: approveUser.email,
                values: approve_values,
                mobile: approveUser.mobile,
                openid: openId,
            })
        } else {
            let admins = await Models.staff.find({ where: {companyId: tripApprove['companyId'], roleId: [EStaffRole.OWNER,
                EStaffRole.ADMIN], staffStatus: EStaffStatus.ON_JOB, id: {$ne: staff.id}}}); //获取激活状态的管理员
            //给所有的管理员发送邮件
            await Promise.all(admins.map(function(s) {
                let vals: any = utils.clone(values);
                vals.managerName = s.name;
                vals.email = staff.email;
                vals.projectName = tripApprove.title;
                vals.username = s.name;
                return API.notify.submitNotify({
                    key: 'qm_notify_new_travelbudget',
                    email: s.email,
                    values: vals
                })
            }));
        }
        return true;
    }


    /**
     * 获取计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.canGetTripPlan('0.id')}])
    static getTripPlan(params: {id: string}): Promise<TripPlan> {
        return Models.tripPlan.get(params.id);
    }

    /**
     * 更新计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['isNeedTraffic', 'isNeedHotel', 'title', 'description', 'status', 'deptCity',
        'deptCityCode', 'arrivalCity', 'arrivalCityCode', 'startAt', 'backAt', 'remark'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async updateTripPlan(params): Promise<TripPlan> {
        let tripPlan = await Models.tripPlan.get(params.id);
        for(let key in params) {
            tripPlan[key] = params[key];
        }
        return tripPlan.save();
    }

    /**
     * 获取差旅计划单/预算单列表
     * @param params
     * @returns {*}
     */
    @clientExport
    static async listTripPlans(options: any): Promise<FindResult> {
        options.order = options.order || [['start_at', 'desc'], ['created_at', 'desc']];
        let paginate = await Models.tripPlan.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
    }

    /**
     * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async deleteTripPlan(params): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        let tripDetails = await tripPlan.getTripDetails({where: {}});
        await tripPlan.destroy();
        await Promise.all(tripDetails.map((detail)=> detail.destroy()));
        return true;
    }

    /**
     * 保存消费记录详情
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['tripPlanId', 'type', 'startTime', 'invoiceType', 'budget'])
    static saveTripDetail(params): Promise<TripDetail> {
        return Models.tripDetail.create(params).save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static getTripDetail(params: {id: string}): Promise<TripDetail> {
        return Models.tripDetail.get(params.id);
    }

    /**
     * 更新消费详情
     * @param params
     */
    @clientExport
    @requireParams(['id'], TripDetail['$fieldnames'])
    @modelNotNull('tripDetail')
    static async updateTripDetail(params): Promise<TripDetail> {
        let tripDetail =  await Models.tripDetail.get(params.id);

        for(let key in params) {
            tripDetail[key] = params[key];
        }

        return tripDetail.save();
    }

    /**
     * 根据出差记录id获取出差详情(包括已删除的)
     * @param params
     * @returns {Promise<string[]>}
     */
    @requireParams(['where.tripPlanId'], ['where.type', 'where.status', 'where.id'])
    @clientExport
    static async getTripDetails(options: {where: any, offset?: number, limit?: number}): Promise<FindResult> {
        let details = await Models.tripDetail.find(options);
        let ids = details.map(function (d) {
            return d.id;
        });
        return {ids: ids, count: details['total']};
    }

    /**
     * 删除差旅消费明细
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static async deleteTripDetail(params: {id: string}): Promise<boolean> {
        let tripDetail = await Models.tripDetail.get(params.id);
        await tripDetail.destroy();
        return true;
    }

    /**
     * 企业管理员审批员工预算
     * @param params
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['id', 'approveResult', 'isNextApprove'], ['approveRemark', "budgetId", 'nextApproveUserId'])
    @modelNotNull('tripApprove')
    static async approveTripPlan(params): Promise<boolean> {
        let isNextApprove = params.isNextApprove;
        let staff = await Staff.getCurrent();
        let tripApprove = await Models.tripApprove.get(params.id);
        let approveResult = params.approveResult;
        let budgetId = params.budgetId;

        if(isNextApprove && !params.nextApproveUserId)
            throw new Error("审批人不能为空");

        if (!budgetId){
            throw new Error(`预算信息已失效请重新生成`);
        }else if(approveResult != EApproveResult.PASS && approveResult != EApproveResult.REJECT) {
            throw L.ERR.PERMISSION_DENY(); //只能审批待审批的出差记录
        }else if(tripApprove.status != EApproveStatus.WAIT_APPROVE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR(); //只能审批待审批的出差记录
        }else if(tripApprove.approveUser.id != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        let budgetInfo = await API.client.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.account.id});
        if (!budgetInfo || !budgetInfo.budgets)
            throw new Error(`预算信息已失效请重新生成`);
        let finalBudget = 0;
        budgetInfo.budgets.forEach((v) => {
            if (v.price <= 0) {
                finalBudget = -1;
                return;
            }
            finalBudget += Number(v.price);
        });
        tripApprove.budget = finalBudget;
        tripApprove.budgetInfo = budgetInfo.budgets;

        let tripPlan: TripPlan;
        let notifyRemark = '';
        let tplName = '';
        let log = TripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id});

        if (approveResult == EApproveResult.PASS && !isNextApprove) {
            notifyRemark = `审批通过，审批人：${staff.name}`;
            tplName = 'qm_notify_approve_pass';
            log.approveStatus = EApproveResult.PASS;
            log.remark = `审批通过`;
            log.save();
            tripApprove.status = EApproveStatus.PASS;
            tripApprove.approveRemark = '审批通过';
            tripApprove.approvedUsers += `,${staff.id}`;
            tripPlan = await TripPlanModule.saveTripPlanByApprove({tripApproveId: params.id});
        }else if(isNextApprove){ //指定下一级审批人
            log.approveStatus = EApproveResult.PASS;
            log.save();
            let nextApproveUser = await Models.staff.get(params.nextApproveUserId);
            tripApprove.approvedUsers += `,${staff.id}`;
            tripApprove.approveUser = nextApproveUser;
        }else if(approveResult == EApproveResult.REJECT) {
            let approveRemark = params.approveRemark;
            if(!approveRemark) {
                await tripApprove.reload();
                throw {code: -2, msg: '拒绝原因不能为空'};
            }
            notifyRemark = `审批未通过，原因：${approveRemark}`;
            tplName = 'qm_notify_approve_not_pass';
            log.approveStatus = EApproveResult.REJECT;
            log.remark = approveRemark;
            log.save();
            tripApprove.approveRemark = approveRemark;
            tripApprove.status = EApproveStatus.REJECT;
        }
        await tripApprove.save();

        if(isNextApprove){
            await TripPlanModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: true});
        }else{
            //发送审核结果邮件
            let self_url = config.host + '/index.html#/trip/list-detail?tripid=' + tripApprove.id;
            let user = tripApprove.account;
            if(!user) user = await Models.staff.get(tripApprove['accountId']);

            let {go, back, hotel, others} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            self_url = await API.wechat.shorturl({longurl: self_url});
            let openId = await API.auth.getOpenIdByAccount({accountId: user.id});

            let self_values = {
                username: user.name,
                planNo: tripPlan.planNo,
                approveTime: utils.now(),
                approveUser: staff.name,
                projectName: tripPlan.title,
                goTrafficBudget: go,
                backTrafficBudget: back,
                hotelBudget: hotel,
                otherBudget: others,
                totalBudget: '￥' + tripPlan.budget,
                url: self_url,
                detailUrl: self_url,
                time: moment(tripPlan.startAt["value"]).format('YYYY-MM-DD'),
                destination: tripPlan.arrivalCity,
                staffName: user.name,
                startTime: moment(tripPlan.startAt["value"]).format('YYYY-MM-DD'),
                arrivalCity: tripPlan.arrivalCity,
                budget: tripPlan.budget,
                tripPlanNo: tripPlan.planNo,
                approveResult: approveResult,
                reason: approveResult,
                emailReason: params.auditRemark
            };
            await API.notify.submitNotify({email: user.email, key: tplName, values: self_values, mobile: user.mobile, openid: openId});
        }

        return true;
    }

    @clientExport
    @requireParams(['id', 'budget'])
    @conditionDecorator([{if: condition.isAgencyTripDetail('0.id')}])
    @modelNotNull('tripDetail')
    static async editTripDetailBudget(params: {id: string, budget: number}) {
        let tripDetail = await Models.tripDetail.get(params.id);

        if(tripDetail.status != EPlanStatus.NO_BUDGET) {
            throw {code: -2, msg: '该出差计划不能修改预算'};
        }

        let tripPlan = tripDetail.tripPlan;
        tripDetail.budget = params.budget;
        tripDetail.status = EPlanStatus.WAIT_UPLOAD;
        await tripDetail.save();
        let details = await tripPlan.getTripDetails({where: {}});
        let budget = 0;

        for(let i=0; i< details.length; i++) {
            let detail = details[i];
            if(detail.budget <= 0) {
                budget = -1;
                break;
            }
            budget = budget + detail.budget;
        }

        if(budget > 0 ) {
            tripPlan.status = EPlanStatus.WAIT_UPLOAD;
        }
        tripPlan.budget = budget;
        await tripPlan.save();
        return true;
    }

    @clientExport
    @requireParams(['tripDetailId', 'pictureFileId'])
    @modelNotNull('tripDetail', 'tripDetailId')
    static async uploadInvoice(params): Promise<boolean> {
        let staff = await Staff.getCurrent();
        let tripDetail = await Models.tripDetail.get(params.tripDetailId);

        if (tripDetail.status != EPlanStatus.WAIT_UPLOAD && tripDetail.status != EPlanStatus.WAIT_COMMIT && tripDetail.status != EPlanStatus.AUDIT_NOT_PASS) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let tripPlan = tripDetail.tripPlan;

        if(tripPlan.status != EPlanStatus.WAIT_UPLOAD && tripDetail.status != EPlanStatus.WAIT_COMMIT && tripDetail.status != EPlanStatus.AUDIT_NOT_PASS) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let invoiceJson: any = tripDetail.invoice || [];
        let times = invoiceJson.length ? invoiceJson.length + 1 : 1;

        if(typeof invoiceJson =='string') {
            invoiceJson = JSON.parse(invoiceJson);
        }

        invoiceJson.push({times: times, pictureFileId: JSON.stringify(params.pictureFileId), created_at: utils.now(), status: EPlanStatus.WAIT_COMMIT, remark: '', approve_at: ''});
        if(typeof params.pictureFileId =='string') {
            // tripDetail.newInvoice = params.pictureFileId;
            tripDetail.latestInvoice = JSON.stringify([params.pictureFileId]);
        }else{
            tripDetail.latestInvoice = JSON.stringify(params.pictureFileId);
        }
        tripDetail.invoice = JSON.stringify(invoiceJson);
        tripDetail.status = EPlanStatus.WAIT_COMMIT;

        var details = await Models.tripDetail.find({where: {tripPlanId: tripPlan.id, status: EPlanStatus.WAIT_UPLOAD,
            id: {$ne: tripDetail.id}, type: [ETripType.BACK_TRIP, ETripType.HOTEL, ETripType.OUT_TRIP]}});

        if(!details || details.length == 0) {
            tripPlan.status = EPlanStatus.WAIT_COMMIT;
        }

        let tripType = '';
        switch (tripDetail.type) {
            case ETripType.OUT_TRIP: tripType = '去程'; break;
            case ETripType.BACK_TRIP: tripType = '回程'; break;
            case ETripType.HOTEL: tripType = '酒店'; break;
            default: break;
        }
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, tripDetailId: tripDetail.id, userId: staff.id, remark: `上传${tripType}发票`});

        await Promise.all([tripPlan.save(), tripDetail.save(), log.save()]);

        return true;
    }

    /**
     * 提交计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async commitTripPlan(params: {id: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);

        if(tripPlan.status != EPlanStatus.WAIT_COMMIT) {
            throw {code: -2, msg: "该出差计划不能提交，请检查状态"};
        }

        let tripDetails = await tripPlan.getTripDetails({where: {}});
        tripPlan.status = EPlanStatus.AUDITING;
        tripPlan.isCommit = true;

        if(tripDetails && tripDetails.length > 0) {
            tripDetails.map(function (detail) {
                if (detail.type == ETripType.SUBSIDY) {
                    return;
                }
                if (detail.status == EPlanStatus.WAIT_COMMIT) {
                    detail.isCommit = true;
                    detail.status = EPlanStatus.AUDITING;
                }
            })
        }

        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: `提交票据`});

        await Promise.all(tripDetails.map((detail) => detail.save()));
        await Promise.all([tripPlan.save(), log.save()]);

        let default_agency = config.default_agency;
        if(default_agency && default_agency.manager_email) {
            let auditEmail = default_agency.manager_email;
            let accounts = await Models.account.find({where: {email: auditEmail}});

            if(!accounts || accounts.length <= 0) {
                return true;
            }

            let user:any = await Models.agencyUser.get(accounts[0].id);
            if(!user) {
                user = await Models.staff.get(accounts[0].id);
            }
            let staff = tripPlan.account;
            if(!staff) {
                staff = await Models.staff.get(tripPlan['accountId']);
            }

            let company = await tripPlan.getCompany();
            let auditUrl = `${config.host}/agency.html#/travelRecord/TravelDetail?orderId==${tripPlan.id}`;
            let {go, back, hotel, others} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            let openId = await API.auth.getOpenIdByAccount({accountId: user.id});
            let auditValues = {auditUserName: user.name, companyName: company.name, staffName: staff.name, projectName: tripPlan.title, goTrafficBudget: go,
                backTrafficBudget: back, hotelBudget: hotel, otherBudget: others, totalBudget: tripPlan.budget, url: auditUrl, detailUrl: auditUrl,
                approveUser: user.name, tripPlanNo: tripPlan.planNo,
                content: `企业 ${company.name} 员工 ${user.name}${moment(tripPlan.startAt).format('YYYY-MM-DD')}到${tripPlan.arrivalCity}的出差计划票据已提交，预算：￥${tripPlan.budget}，等待您审核！`,
                createdAt: utils.now(),
            };

            API.notify.submitNotify({
                key: 'qm_notify_agency_budget',
                values: auditValues,
                email: default_agency.manager_email,
                openid: openId,
            })
        }
        return true;
    }

    /**
     * 审核出差票据
     *
     * @param params
     */
    @clientExport
    @requireParams(['id', 'auditResult'], ["reason", "expenditure"])
    @modelNotNull('tripDetail')
    static async auditPlanInvoice(params: {id: string, auditResult: EAuditStatus, expenditure?: number, reason?: string}): Promise<boolean> {
        const SAVED2SCORE = config.score_ratio;
        let {id, expenditure, reason, auditResult} = params;
        let tripDetail = await Models.tripDetail.get(params.id);

        if((tripDetail.status != EPlanStatus.AUDITING) && (tripDetail.status != EPlanStatus.AUDIT_NOT_PASS)) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }

        let audit = params.auditResult;
        let tripPlan = tripDetail.tripPlan;
        let templateValue: any = {invoiceDetail: '无', projectName: tripPlan.title, totalBudget: '￥' + tripPlan.budget, time: moment(tripPlan.startAt).format('YYYY-MM-DD')};
        let templateName: any = '';
        let isNotify = false;
        let savedMoney = 0;
        let logResult = '';

        if(audit == EAuditStatus.INVOICE_PASS) {
            logResult = '通过';
            tripDetail.status = EPlanStatus.COMPLETE;
            tripDetail.expenditure = expenditure;
            let query = {where: {id: {$ne: tripDetail.id}, status: [EPlanStatus.AUDITING, EPlanStatus.AUDIT_NOT_PASS]}}
            let noAuditDetails = await tripPlan.getTripDetails(query); //获取所有未经过审核的票据
            if(!noAuditDetails || noAuditDetails.length == 0 ) {
                isNotify = true;
                let details = await tripPlan.getTripDetails({ where: {}});
                let expenditure = 0;
                details.forEach( (detail) => {
                    expenditure += Number(detail.expenditure);
                });
                tripPlan.expenditure = expenditure;
                tripPlan.status = EPlanStatus.COMPLETE;
                tripPlan.auditStatus = EAuditStatus.INVOICE_PASS;
                savedMoney = (tripPlan.budget - tripPlan.expenditure);
                savedMoney = savedMoney > 0 ? savedMoney : 0;
                tripPlan.score = parseInt((savedMoney * SAVED2SCORE).toString());
            }
            templateValue.consume = '￥' + (tripDetail.expenditure || 0);
            templateName = 'qm_notify_invoice_one_pass';
            let detailSavedM = tripDetail.budget - tripDetail.expenditure;
            detailSavedM = detailSavedM > 0 ? detailSavedM : 0;
            templateValue.invoiceDetail += '，实际花费：' + tripDetail.expenditure + '元，节省：' + detailSavedM + '元';
        } else if(audit == EAuditStatus.INVOICE_NOT_PASS) {
            logResult = '未通过';
            isNotify = true;
            tripDetail.auditRemark = reason;
            tripDetail.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.auditStatus = EAuditStatus.INVOICE_NOT_PASS;
            templateValue.reason = reason;
            templateName = 'qm_notify_invoice_not_pass';
        } else {
            throw L.ERR.PERMISSION_DENY(); //代理商只能审核票据权限
        }


        //保存更改记录
        await Promise.all([tripPlan.save(), tripDetail.save()]);

        /*******************************************发送通知消息**********************************************/
        let staff = await Models.staff.get(tripPlan['accountId']);

        switch (tripDetail.type) {
            case ETripType.OUT_TRIP:
                templateValue.tripType = '去程';
                templateValue.invoiceDetail = `${moment(tripDetail.startTime).format('YYYY-MM-DD')} 由 ${tripDetail.deptCity} 到 ${tripDetail.arrivalCity}， 去程发票， 预算：${tripDetail.budget}元`;
                break;
            case ETripType.BACK_TRIP:
                templateValue.tripType = '回程';
                templateValue.invoiceDetail = `${moment(tripDetail.startTime).format('YYYY-MM-DD')} 由 ${tripDetail.deptCity} 到 ${tripDetail.arrivalCity}， 回程发票， 预算：${tripDetail.budget}元`;
                break;
            case ETripType.HOTEL:
                templateValue.tripType = '酒店';
                templateValue.invoiceDetail = `${moment(tripDetail.startTime).format('YYYY.MM.DD')} - ${moment(tripDetail.endTime).format('YYYY.MM.DD')}， ${tripDetail.city}`;
                if(tripDetail.hotelName) {
                    templateValue.invoiceDetail += tripDetail.hotelName;
                }
                templateValue.invoiceDetail += `，酒店发票，预算：￥{tripDetail.budget}元`;
                break;
            default: templateValue.tripType = ''; break;
        }
        if(isNotify) {
            if(tripPlan.status == EPlanStatus.COMPLETE) {
                templateValue.invoiceDetail = `${moment(tripPlan.startAt).format('YYYY-MM-DD')}到${tripPlan.arrivalCity}的出差票据，预算：${tripPlan.budget}元，实际花费：${tripPlan.expenditure}元，节省：${savedMoney}元`;
            }

            let {go, back, hotel, others} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            let self_url = `${config.host}/index.html#/trip/list-detail?tripid=${tripPlan.id}`;

            templateValue.ticket = templateValue.tripType;
            templateValue.username = staff.name;
            templateValue.goTrafficBudget = go;
            templateValue.backTrafficBudget = back;
            templateValue.hotelBudget = hotel;
            templateValue.otherBudget = others;
            templateValue.detailUrl = self_url;
            templateValue.url = self_url;
            templateValue.auditUser = '鲸力智享';
            templateValue.auditTime = utils.now();

            let openId = await API.auth.getOpenIdByAccount({accountId: staff.id});
            API.notify.submitNotify({key: templateName, values: templateValue, email: staff.email, openid: openId});
        }

        let user = await AgencyUser.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, tripDetailId: tripDetail.id, userId: user.id, remark: `${templateValue.tripType}票据审核${logResult}`});
        log.save();

        //如果出差已经完成,并且有节省反积分,增加员工积分
        if (tripPlan.status == EPlanStatus.COMPLETE && tripPlan.score > 0) {
            let pc = Models.pointChange.create({
                currentPoints: staff.balancePoints, status: 1,
                staff: staff, company: staff.company,
                points: tripPlan.score, remark: `节省反积分${tripPlan.score}`,
                orderId: tripPlan.id});
            await pc.save();
            try {
                staff.totalPoints = staff.totalPoints + tripPlan.score;
                staff.balancePoints = staff.balancePoints + tripPlan.score;
                let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: user.id, remark: `增加员工${tripPlan.score}积分`});
                await Promise.all([staff.save(), log.save()]);
            } catch(err) {
                //如果保存出错,删除日志记录
                await pc.destroy();
            }
        }
        return true;
    }


    /**
     * @method previewConsumeInvoice 预览发票图片
     *
     * @param {Object} params
     * @param {UUID} params.tripDetailId
     * @param {UUID} params.accountId
     */
    @clientExport
    @requireParams(['tripDetailId'])
    static async previewInvoice(params: {tripDetailId: string}) :Promise<string> {
        let tripDetail = await Models.tripDetail.get(params.tripDetailId);
        if(!tripDetail) {
            throw L.ERR.TRIP_DETAIL_FOUND();
        }
        let attachment = await API.attachments.getAttachment({id: tripDetail.newInvoice});

        return "data:image/jpg;base64," + attachment.content;
    }


    @clientExport
    @requireParams(['name', 'createUser', 'company_id'], ['code'])
    static createProject(params): Promise<Project> {
        return Project.create(params).save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('project')
    static getProjectById(params:{id:string}):Promise<Project> {
        return Models.project.get(params.id);
    }

    @clientExport
    @requireParams(['where.companyId'], ['where.name'])
    static async getProjectList(options): Promise<FindResult> {
        options.order = options.order || [['weight', 'desc'], ['created_at', 'desc']];
        let projects = await Models.project.find(options);
        return {ids: projects.map((p)=> {return p.id}), count: projects['total']};
    }

    @requireParams(['id'])
    @modelNotNull('project')
    static async deleteProject(params:{id:string}):Promise<boolean> {
        let project = await Models.project.get(params.id);
        return await project.destroy();
    }


    /**
     * @method saveTripPlanLog
     * 保存出差计划改动日志
     * @type {saveTripPlanLog}
     */
    @requireParams(['tripPlanId', 'remark'], ['tripDetailId'])
    static async saveTripPlanLog(params): Promise<TripPlanLog> {
        let staff = await Staff.getCurrent();
        params.userId = staff.id;
        return TripPlanLog.create(params).save();
    }

    /**
     * @method getTripPlanLog
     * @param params
     * @returns {any}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlanLog')
    static getTripPlanLog(params: {id: string}): Promise<TripPlanLog> {
        return Models.tripPlanLog.get(params.id);
    }

    /**
     * @method updateTripPlanLog
     * @param param
     */
    static updateTripPlanLog(param): Promise<TripPlanLog> {
        throw {code: -1, msg: '不能更新日志'};
    }

    @clientExport
    @requireParams(['where.tripPlanId'], ['where.tripDetailId'])
    static async getTripPlanLogs(options): Promise<FindResult> {
        let paginate = await Models.tripPlanLog.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    static async cancelTripPlan(params: {id: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        if( tripPlan.status != EPlanStatus.NO_BUDGET && tripPlan.status != EPlanStatus.WAIT_UPLOAD) {
            throw {code: -2, msg: "出差记录状态不正确！"};
        }
        
        let tripDetails = await tripPlan.getTripDetails({});
        if(tripDetails && tripDetails.length > 0) {
            await Promise.all(tripDetails.map((d) => {
                d.status = EPlanStatus.CANCEL;
                return d.save();
            }));
        }
        tripPlan.status = EPlanStatus.CANCEL;
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: `撤销出差计划`});
        await Promise.all([tripPlan.save(), log.save()]);
        return true;
    }

    //
    /********************************************统计相关API***********************************************/

    @clientExport
    @requireParams(['companyId', 'month'])
    static async statisticTripPlanOfMonth(params: {companyId: string, month: string}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let month = params.month;
        let startTime = month + '-01';
        let endTime = moment(startTime).add(1, 'months').format('YYYY-MM-DD');

        let where_sql = 'from trip_plan.trip_plans where company_id=\''
            + companyId + '\' and status!=(' + EPlanStatus.CANCEL + ')  and status!=(' + EPlanStatus.NO_BUDGET + ') and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let complete_sql = 'from trip_plan.trip_plans where company_id=\''
            + companyId + '\' and status=' + EPlanStatus.COMPLETE + ' and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let staff_num_sql = 'select count(1) as \"staffNum\" from (select account_id ' + where_sql + ') as Project;';
        let project_num_sql = 'select count(1) as \"projectNum\" from (select distinct project_id ' + where_sql + ') as Project;';
        let budget_sql = 'select sum(budget) as \"dynamicBudget\" ' + complete_sql;
        let saved_sql = 'select sum(budget-expenditure) as \"savedMoney\" ' + complete_sql;
        let expenditure_sql = 'select sum(expenditure) as expenditure ' + complete_sql;

        let staff_num_sql_ret = await sequelize.query(staff_num_sql);
        let project_num_sql_ret = await sequelize.query(project_num_sql);
        let budget_sql_ret = await sequelize.query(budget_sql);
        let saved_sql_ret = await sequelize.query(saved_sql);
        let expenditure_sql_ret = await sequelize.query(expenditure_sql);

        return {
            month: month,
            staffNum: Number(staff_num_sql_ret[0][0].staffNum || 0),
            projectNum: Number(project_num_sql_ret[0][0].projectNum || 0),
            dynamicBudget: budget_sql_ret[0][0].dynamicBudget || 0,
            savedMoney: saved_sql_ret[0][0].savedMoney || 0,
            expenditure: expenditure_sql_ret[0][0].expenditure || 0
        };
    }


    @clientExport
    @requireParams([], ['startTime', 'endTime', 'isStaff'])
    static async statisticTripBudget(params: {startTime?: string, endTime?: string, isStaff?: boolean}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;

        let selectSql = `select count(id) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure, sum(budget-expenditure) as "savedMoney" from`;
        let completeSql = `trip_plan.trip_plans where deleted_at is null and company_id='${companyId}'`;

        if(params.startTime)
            completeSql += ` and start_at>='${params.startTime}'`;
        if(params.endTime)
            completeSql += ` and start_at<='${params.endTime}'`;
        if(params.isStaff)
            completeSql += ` and account_id='${staff.id}'`;

        let planSql = `${completeSql}  and status in (${EPlanStatus.WAIT_UPLOAD}, ${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDITING}, ${EPlanStatus.AUDIT_NOT_PASS})`;
        completeSql += ` and status=${EPlanStatus.COMPLETE}`;

        let complete = `${selectSql} ${completeSql};`;
        let plan = `${selectSql} ${planSql};`;

        let completeInfo = await sequelize.query(complete);
        let planInfo = await sequelize.query(plan);

        let ret = {
            planTripNum: 0,
            completeTripNum: 0,
            planBudget: 0,
            completeBudget: 0,
            expenditure: 0,
            savedMoney: 0
        };

        if(completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            let c = completeInfo[0][0];
            ret.completeTripNum = Number(c.tripNum);
            ret.completeBudget = Number(c.budget);
            ret.expenditure = Number(c.expenditure);
            ret.savedMoney = Number(c.savedMoney);
        }

        if(planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            let p = planInfo[0][0];
            ret.planTripNum = Number(p.tripNum);
            ret.planBudget = Number(p.budget);
        }
        return ret;
    }

    /**
     * 按员工、项目、部门分类统计预算信息
     * @param params
     * @returns {{}}
     */
    @clientExport
    @requireParams(['startTime', 'endTime', 'type'], ['keyWord'])
    static async statisticBudgetsInfo(params: {startTime: string, endTime: string, type: string, keyWord?: string}) {
        let staff = await Staff.getCurrent();
        let company =staff.company;
        let completeSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status=${EPlanStatus.COMPLETE} and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
        let planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;

        let type = params.type;
        let selectKey = '', modelName = '';
        if(type == 'S' || type == 'P'){ //按员工统计
            selectKey = type == 'S' ? 'account_id' : 'project_id';
            modelName = type == 'S' ? 'staff' : 'project';
            if(params.keyWord) {
                let objs = await Models[modelName].find({where: {name: {$like: `%${params.keyWord}%`}}});
                let selectStr = '';
                objs.map((s) => {
                    if(s && s.id) {
                        selectStr+= selectStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if(! selectStr || selectStr == ''){selectStr = `'${uuid.v1()}'`; }
                completeSql += ` and ${selectKey} in (${selectStr})`;
                planSql += ` and ${selectKey} in (${selectStr})`;
            }
            completeSql += ` group by ${selectKey};`;
            planSql += ` group by ${selectKey};`;
        }

        let selectSql = `select ${selectKey}, count(1) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure, sum(budget-expenditure) as "savedMoney"`;
        let complete =  `${selectSql} ${completeSql}`;
        let plan = `${selectSql} ${planSql}`;

        if(type == 'D') {
            selectKey = 'departmentId';
            completeSql = `from department.departments as d, staff.staffs as s, trip_plan.trip_plans as p where d.deleted_at is null and s.deleted_at is null and p.deleted_at is null and p.company_id='${company.id}' and d.id=s.department_id and p.account_id=s.id and p.start_at>'${params.startTime}' and p.start_at<'${params.endTime}'`;
            planSql = `${completeSql} and p.status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING})`;
            completeSql += ` and p.status=${EPlanStatus.COMPLETE}`;
            if(params.keyWord) {
                let depts = await Models.department.find({where: {name: {$like: `%${params.keyWord}%`}}});
                let deptStr = '';
                depts.map((s) => {
                    if(s && s.id) {
                        deptStr+= deptStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if(! deptStr || deptStr == ''){deptStr = `'${uuid.v1()}'`; }
                completeSql += ` and d.id in (${deptStr})`;
                planSql += ` and d.id in (${deptStr})`;
            }

            selectSql = `select d.id as "departmentId", count(p.id) as "tripNum",sum(p.budget) as budget, sum(p.expenditure) as expenditure, sum(p.budget-p.expenditure) as "savedMoney"`;
            complete = `${selectSql} ${completeSql} group by d.id;`;
            plan = `${selectSql} ${planSql} group by d.id;`;
        }

        let completeInfo = await sequelize.query(complete);
        let planInfo = await sequelize.query(plan);

        let result = {};
        if(completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            completeInfo[0].map((ret) => {
                result[ret[selectKey]] = {
                    typeKey: ret[selectKey],
                    completeTripNum: Number(ret.tripNum),
                    completeBudget: Number(ret.budget),
                    expenditure: Number(ret.expenditure),
                    savedMoney: Number(ret.savedMoney)
                };
            });
        }

        if(planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            planInfo[0].map((ret) => {
                let key = ret[selectKey];
                if(!result[key]){
                    result[key] = {};
                }
                result[key].typeKey = ret[selectKey];
                result[key].planTripNum = Number(ret.tripNum);
                result[key].planBudget = Number(ret.budget);
                if(!result[key].expenditure) {
                    result[key].expenditure = 0;
                }
            });
        }

        result = _.orderBy(_.values(result), ['expenditure'], ['desc']);
        return result;
    }

    /**
     * @method saveTripPlan
     * 生成出差计划单
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['tripApproveId'])
    static async saveTripPlanByApprove(params: {tripApproveId: string}): Promise<TripPlan> {
        let formatStr = 'YYYY-MM-DD';
        let staff = await Staff.getCurrent();
        let tripApprove = await Models.tripApprove.get(params.tripApproveId);
        let account = tripApprove.account;

        let tripPlan = TripPlan.create(tripApprove);
        tripPlan.auditUser = staff.id;
        tripPlan.startAt = moment(tripApprove.startAt).format(formatStr);
        tripPlan.backAt = moment(tripApprove.backAt).format(formatStr);
        tripPlan.id = tripApprove.id;
        tripPlan.project = tripApprove.project;
        tripPlan.account = tripApprove.account;
        tripPlan.project = tripApprove.project;
        tripPlan.status = EPlanStatus.WAIT_UPLOAD;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号

        let budgets = tripApprove.budgetInfo;
        let query = tripApprove.query;
        if(typeof query == 'string') query = JSON.parse(query);

        let tripDetails: TripDetail[] = budgets.map(function (budget) {
            let tripType = budget.tripType;
            let price = Number(budget.price);
            let detail = Models.tripDetail.create({type: tripType, invoiceType: budget.type, budget: price});
            detail.accountId = account.id;
            detail.isCommit = false;
            detail.status = EPlanStatus.WAIT_UPLOAD;
            detail.tripPlan = tripPlan;
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail.deptCityCode = query.originPlace;
                    detail.arrivalCityCode = query.destinationPlace;
                    detail.deptCity = tripPlan.deptCity;
                    detail.arrivalCity = tripPlan.arrivalCity;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.BACK_TRIP:
                    detail.deptCityCode = query.destinationPlace;
                    detail.arrivalCityCode = query.originPlace;
                    detail.deptCity = tripPlan.arrivalCity;
                    detail.arrivalCity = tripPlan.deptCity;
                    detail.startTime = query.goBackDate;
                    detail.endTime = query.leaveDate;
                    detail.cabinClass = budget.cabinClass;
                    detail.fullPrice = budget.fullPrice;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.HOTEL:
                    detail.type = ETripType.HOTEL;
                    detail.cityCode = query.destinationPlace;
                    detail.city = tripPlan.arrivalCity;
                    detail.hotelCode = query.businessDistrict;
                    detail.hotelName = query.hotelName;
                    detail.startTime = query.checkInDate || query.leaveDate;
                    detail.endTime = query.checkOutDate || query.goBackDate;
                    tripPlan.isNeedHotel = true;
                    break;
                case ETripType.SUBSIDY:
                    detail.type = ETripType.SUBSIDY;
                    detail.deptCityCode = query.originPlace;
                    detail.arrivalCityCode = query.destinationPlace;
                    detail.deptCity = tripPlan.deptCity;
                    detail.arrivalCity = tripPlan.arrivalCity;
                    detail.startTime = query.leaveDate || query.checkInDate;
                    detail.endTime = query.goBackDate || query.checkOutDate;
                    detail.expenditure = price;
                    detail.status = EPlanStatus.COMPLETE;
                    break;
                default:
                    detail.type = ETripType.SUBSIDY;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    break;
            }
            return detail;
        });

        let log = TripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: `出差审批通过，生成出差记录`});
        await Promise.all([tripPlan.save(), log.save()]);
        await Promise.all(tripDetails.map((d) => d.save()));

        return tripPlan;
    }

    @clientExport
    @requireParams([], ['limit', 'staffId', 'startTime', 'endTime'])
    static async tripPlanSaveRank(params: {limit?: number|string, staffId?: string, startTime?: string, endTime?: string}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let limit = params.limit || 10;
        if (!limit || !/^\d+$/.test(limit as string) || limit > 100) {
            limit = 10;
        }
        let sql = `select account_id, sum(budget) - sum(expenditure) as save from trip_plan.trip_plans 
        where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}'`;
        if(params.staffId)
            sql += ` and account_id = '${params.staffId}'`;
        if(params.startTime)
            sql += ` and start_at > '${params.startTime}'`;
        if(params.endTime)
            sql += ` and start_at < '${params.endTime}'`;
        sql += `group by account_id order by save desc limit ${limit};`;

        let ranks = await sequelize.query(sql)
            .then(function(result) {
                return result[0];
            });

        ranks = await Promise.all(ranks.map((v: any) => {
            return Models.staff.get(v.account_id)
                .then(function(staff) {
                    return {name: staff.name, save: v.save};
                })
        }));

        return ranks;
    }

    @clientExport
    static async getTripPlanSave(params: {accountId?: string}) {
        let staff = await Models.staff.get(params.accountId);
        let accountId = params.accountId;
        let companyId = staff.company.id;
        let sql = `select sum(budget) - sum(expenditure) as save from trip_plan.trip_plans where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}' AND account_id =  '${accountId}' `;

        let ranks = await sequelize.query(sql)
            .then(function(result) {
                return result[0];
            });

        return ranks[0].save;
    }


    @clientExport
    @requireParams(["tripPlanId"])
    static async makeFinalBudget(params: {tripPlanId: string}) {
        let accountId = getSession()["accountId"];
        let tripPlanId = params.tripPlanId;
        if (!accountId) {
            throw L.ERR.PERMISSION_DENY();
        }

        if (!tripPlanId) {
            throw L.ERR.PERMISSION_DENY();
        }

        let tripPlan = await Models.tripPlan.get(tripPlanId);
        if (tripPlan.auditUser != accountId) {
            throw L.ERR.PERMISSION_DENY();
        }

        //取出查询参数,重新计算预算
        let isRoundTrip = true;
        let query = tripPlan.query;
        if (!query) {
            let {deptCityCode, arrivalCityCode, startAt, backAt, isNeedTraffic, isNeedHotel} = tripPlan;
            query = {
                originPlace: deptCityCode,
                destinationPlace: arrivalCityCode,
                leaveDate: moment(startAt['value']).format("YYYY-MM-DD"),
                goBackDate: moment(backAt['value']).format("YYYY-MM-DD"),
                isNeedTraffic: isNeedTraffic,
                isNeedHotel: isNeedHotel,
                isRoundTrip: isRoundTrip
            }
        }

        if (typeof query == 'string') {
            query = JSON.parse(query);
        }
        let budgetId = await API.client.travelBudget.getTravelPolicyBudget(query);
        let budgetResult = await API.client.travelBudget.getBudgetInfo({id: budgetId});
        let budgets = budgetResult.budgets;

        //计算总预算
        let totalBudget: number = 0;
        budgets.forEach((item) => {
            if (Number(item.price) <= 0) {
                totalBudget = -1;
                return;
            }
            totalBudget += Number(item.price);
        });
        tripPlan.originalBudget = tripPlan.budget;
        tripPlan.budget = totalBudget;
        tripPlan.isFinalBudget = true;
        tripPlan.finalBudgetCreateAt = budgetResult.createAt;
        await tripPlan.save();
        return true;
    }

    @clientExport
    static async getIpPosition(params){
        var stream = Zone.current.get("stream");
        //select * from place.cities where '辽宁省大连市' like concat(concat('%',name), '%') and type = 2
        //select * from place.cities where '辽宁省大连市' ~ name and type = 2
        var position = "";
        try{
            position = utils.searchIpAddress(stream.remoteAddress);
            // position = utils.searchIpAddress("202.103.102.10");
        }catch(e){
            throw L.ERR.INVALID_ARGUMENT("IP");
        }
        var result = await API.place.getCityByIpPosition(position);

        return result;
    }

    @clientExport
    @requireParams(['budgetId', 'title'], ['description', 'remark', 'approveUserId'])
    static async saveTripApprove(params) {
        let staff = await Staff.getCurrent();
        let company = staff.company;

        if(company.isApproveOpen && !params.approveUserId) { //企业开启审核功能后，审核人不能为空
            throw {code: -2, msg: '审批人不能为空'};
        }

        let budgetInfo = await API.travelBudget.getBudgetInfo({id: params.budgetId});

        if(!budgetInfo) {
            throw L.ERR.TRAVEL_BUDGET_NOT_FOUND();
        }

        let {budgets, query} = budgetInfo;
        let totalBudget = 0;
        budgets.map((b) => {totalBudget += Number(b.price);});
        let project = await getProjectByName({companyId: company.id, name: params.title, userId: staff.id, isCreate: true});
        let tripApprove =  TripApprove.create(params);

        if(params.approveUserId) {
            let approveUser = await Models.staff.get(params.approveUserId);
            if(!approveUser)
                throw {code: -3, msg: '审批人不存在'}
            if(tripApprove.approveUser && tripApprove['approveUser'].id == staff.id)
                throw {code: -4, msg: '审批人不能是自己'};
            tripApprove.approveUser = approveUser;
        }

        tripApprove.status = EApproveStatus.WAIT_APPROVE;
        tripApprove.account = staff;
        tripApprove['companyId'] = company.id;
        tripApprove.project = project;
        tripApprove.startAt = query.leaveDate;
        tripApprove.backAt = query.goBackDate;
        tripApprove.query = JSON.stringify(query);

        let arrivalInfo = await API.place.getCityInfo({cityCode: query.destinationPlace.id|| query.destinationPlace}) || {name: null};

        if(query.originPlace) {
            let deptInfo = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace}) || {name: null};
            tripApprove.deptCityCode = deptInfo.id;
            tripApprove.deptCity = deptInfo.name;
        }

        tripApprove.arrivalCityCode = arrivalInfo.id;
        tripApprove.arrivalCity = arrivalInfo.name;
        tripApprove.isNeedTraffic = query.isNeedTraffic;
        tripApprove.isNeedHotel = query.isNeedHotel;
        tripApprove.isRoundTrip = query.isRoundTrip;
        tripApprove.budgetInfo = budgets;
        tripApprove.budget = totalBudget;
        tripApprove.status = totalBudget < 0 ? EApproveStatus.NO_BUDGET : EApproveStatus.WAIT_APPROVE;

        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, approveStatus: EApproveResult.WAIT_APPROVE, remark: '提交审批单，等待审批'});

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == EApproveStatus.WAIT_APPROVE) {
            var days = moment(tripApprove.startAt).diff(moment(), 'days');
            let format = 'YYYY-MM-DD HH:mm:ss';
            if (days <= 0) {
                tripApprove.autoApproveTime = moment(tripApprove.createdAt).add(1, 'hours').format(format);
            } else {
                //出发前一天18点
                let autoApproveTime = moment(tripApprove.startAt).subtract(6, 'hours').format(format);
                //当天18点以后申请的出差计划，一个小时后自动审批
                if(moment(autoApproveTime).diff(moment()) <= 0) {
                    autoApproveTime = moment(tripApprove.createdAt).add(1, 'hours').format(format);
                }
                tripApprove.autoApproveTime = autoApproveTime;
            }
        }

        await Promise.all([tripApprove.save(), tripPlanLog.save()]);

        TripPlanModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});

        return tripApprove;
    }
    
    @clientExport
    @requireParams(['id'])
    static async getTripApprove(params: {id: string}): Promise<TripApprove> {
        let staff = await Staff.getCurrent();
        let staffId = staff.id;
        let approve = await Models.tripApprove.get(params.id);
        if(approve.account.id != staffId && approve.approveUser.id != staffId && approve.approvedUsers.indexOf(staffId) < 0)
            throw L.ERR.PERMISSION_DENY();
        return approve;
    }
    
    @clientExport
    static updateTripApprove(params): Promise<TripApprove> {
        return Models.tripApprove.update(params);
    }
    
    @clientExport
    static async getTripApproves(options: any): Promise<FindResult> {
        let staff = await Staff.getCurrent();
        if(!options.where) options.where = {};
        options.order = options.order || [['start_at', 'desc'], ['created_at', 'desc']];
        let paginate = await Models.tripApprove.find(options);
        return {ids: paginate.map((approve) => {return approve.id;}), count: paginate["total"]}
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripApprove')
    static async deleteTripApprove(params: {id: string}): Promise<boolean> {
        let tripApprove = await Models.tripApprove.get(params.id);
        await tripApprove.destroy();
        return true;
    }
    
    
    static __initHttpApp = require('./invoice');

    static _scheduleTask () {
        let taskId = "authApproveTrainPlan";
        logger.info('run task ' + taskId);
        scheduler('*/5 * * * *', taskId, async function() {
            let tripApproves = await Models.tripApprove.find({where: {autoApproveTime: {$lte: utils.now()}, status: EApproveStatus.WAIT_APPROVE}, limit: 10, order: 'auto_approve_time'});
            tripApproves.map(async (approve) => {
                approve.status = EApproveStatus.PASS;
                await approve.save();
                if(approve.approveUser && approve.approveUser.id && /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(approve.approveUser.id)) {
                    let log = Models.tripPlanLog.create({tripPlanId: approve.id, userId: approve.approveUser.id, approveStatus: EApproveResult.AUTO_APPROVE, remark: '自动通过'});
                    await log.save();
                }
                await TripPlanModule.saveTripPlanByApprove({tripApproveId: approve.id});
            });
        });
    }

}

async function getProjectByName(params) {
    let projects = await Models.project.find({where: {name: params.name}});

    if(projects && projects.length > 0) {
        let project = projects[0];
        project.weight += 1;
        await project.save();
        return project;
    }else if(params.isCreate === true){
        let p = {name: params.name, createUser: params.userId, code: '', companyId: params.companyId, createdAt: utils.now()};
        return Models.project.create(p).save();
    }
}

TripPlanModule._scheduleTask();

export = TripPlanModule;