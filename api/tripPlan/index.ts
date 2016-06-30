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
import {Project, TripPlan, TripDetail, EPlanStatus, EInvoiceType, TripPlanLog, ETripType, EAuditStatus } from "api/_types/tripPlan";
import {Models} from "api/_types/index";
import {FindResult} from "common/model/interface";
import {Staff, EStaffRole, EStaffStatus} from "api/_types/staff";
import {conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {getSession} from "common/model/index";
import {isMobile} from "common/validate";

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

        tripPlan['accountId'] = staff.id;
        tripPlan['companyId'] = company.id;
        tripPlan.project = project;
        tripPlan.startAt = query.leaveDate;
        tripPlan.backAt = query.goBackDate;
        tripPlan.deptCityCode = query.originPlace;
        tripPlan.query = JSON.stringify(query);
        let deptInfo = await API.place.getCityInfo({cityCode: query.originPlace});
        tripPlan.deptCity = deptInfo.name;
        tripPlan.arrivalCityCode = query.destinationPlace;
        let arrivalInfo = await API.place.getCityInfo({cityCode: query.destinationPlace});
        tripPlan.arrivalCity = arrivalInfo.name;
        tripPlan.isNeedHotel = query.isNeedHotel;
        tripPlan.isRoundTrip = query.isRoundTrip;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo');
        if (!tripPlan.auditUser) {
            tripPlan.auditUser = null;
        }
        let tripDetails: TripDetail[] = budgets.map(function (budget) {
            let tripType = budget.tripType;
            let price = Number(budget.price)
            let detail = Models.tripDetail.create({type: tripType, invoiceType: budget.type, budget: price});
            detail.accountId = staff.id;
            detail.isCommit = false;
            detail.status = EPlanStatus.WAIT_APPROVE;
            detail.tripPlan = tripPlan;
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail.deptCityCode = query.originPlace;
                    detail.arrivalCityCode = query.destinationPlace;
                    detail.deptCity = tripPlan.deptCity;
                    detail.arrivalCity = tripPlan.arrivalCity;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.BACK_TRIP:
                    detail.deptCityCode = query.destinationPlace;
                    detail.arrivalCityCode = query.originPlace;
                    detail.deptCity = tripPlan.arrivalCity;
                    detail.arrivalCity = tripPlan.deptCity;
                    detail.startTime = query.goBackDate;
                    detail.endTime = query.leaveDate;
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.HOTEL:
                    // let landMarkInfo = await API.place.getCityInfo({cityCode: query.businessDistrict});
                    detail.cityCode = query.destinationPlace;
                    detail.city = tripPlan.arrivalCity;
                    detail.hotelName = query.businessDistrict; //landMarkInfo.name || '';
                    detail.startTime = query.checkInDate || query.leaveDate;
                    detail.endTime = query.checkOutDate || query.goBackDate;
                    tripPlan.isNeedHotel = true;
                    break;
                case ETripType.SUBSIDY:
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
                    detail.type = ETripType.OTHER;
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
        tripPlan.status = totalBudget<0 ? EPlanStatus.NO_BUDGET : EPlanStatus.WAIT_APPROVE;
        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: '创建出差计划'});

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripPlan.status == EPlanStatus.WAIT_APPROVE) {
            if(tripPlan.startAt.valueOf() == moment().format('YYYY-MM-DD')) {
                tripPlan.autoApproveTime = moment(tripPlan.createdAt).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
                logger.warn(tripPlan.autoApproveTime);
            }else {
                //出发前一天18点
                let autoApproveTime = moment(tripPlan.startAt.valueOf()).subtract(6, 'hours').format('YYYY-MM-DD HH:mm:ss');

                //当天18点以后申请的出差计划，一个小时后自动审批
                if(moment(autoApproveTime).diff(moment()) <= 0) {
                    autoApproveTime = moment(tripPlan.createdAt).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
                }

                tripPlan.autoApproveTime = autoApproveTime;
            }
        }

        await Promise.all([tripPlan.save(), tripPlanLog.save()]);
        await Promise.all(tripDetails.map((d) => d.save()));

        if (tripPlan.budget > 0 || tripPlan.status === EPlanStatus.WAIT_APPROVE) {
            await TripPlanModule.sendTripPlanEmails(tripPlan, staff.id);
        }

        return tripPlan;
    }

    /**
     * 获取出差计划中发送邮件的模板数据详情
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
                let landMarkInfo = await API.place.getCityInfo({cityCode: h.hotelName});
                hotelStr += landMarkInfo.name + ',';
            }
            hotelStr += '动态预算￥' + h.budget;
        }

        let subsidy = await tripPlan.getTripDetails({where: {type: [ETripType.SUBSIDY, ETripType.OTHER]}});
        if(subsidy && subsidy.length > 0) {
            let subsidyBudget = 0;
            subsidy.map((s) => {subsidyBudget += s.budget;});
            others = moment(subsidy[0].startTime).format('YYYY-MM-DD') + ' 至 ' + moment(subsidy[0].endTime).format('YYYY-MM-DD') + '，动态预算￥' + subsidyBudget;
        }

        return {go: go, back: back, hotel: hotelStr, others: others};
    }

    /**
     * 发送邮件
     * @param tripPlan
     * @param userId
     * @returns {Promise<boolean>}
     */
    static async sendTripPlanEmails(tripPlan: TripPlan, userId: string) {
        try{
            let url = config.host + '/index.html#/TravelStatistics/planDetail?tripPlanId=' + tripPlan.id;
            let user = await Models.staff.get(userId);
            let company = user.company;
            let {go, back, hotel, others} = await TripPlanModule.getPlanEmailDetails(tripPlan);

            //给员工发送邮件
            let self_url = config.host + '/index.html#/trip/list-detail?tripid=' + tripPlan.id;
            let self_values = {staffName: user.name, time: moment(tripPlan.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                projectName: tripPlan.title, goTrafficBudget: go, backTrafficBudget: back, hotelBudget: hotel, otherBudget: others,
                totalBudget: '￥' + tripPlan.budget, url: self_url, detailUrl: self_url};
            API.mail.sendMailRequest({toEmails: user.email, templateName: 'qm_notify_self_traveludget', values: self_values});

            if(company.isApproveOpen) {
                //给审核人发审核邮件
                let approveUser = await Models.staff.get(tripPlan.auditUser);
                let approve_url = config.host + '/index.html#/trip-approval/detail?tripid=' + tripPlan.id;
                let approve_values = {managerName: approveUser.name, username: user.name, email: user.email, time: moment(tripPlan.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    projectName: tripPlan.title, goTrafficBudget: go, backTrafficBudget: back, hotelBudget: hotel, otherBudget: others,
                    totalBudget: '￥' + tripPlan.budget, url: approve_url, detailUrl: approve_url};
                API.mail.sendMailRequest({toEmails: approveUser.email, templateName: 'qm_notify_new_travelbudget', values: approve_values});
                //发送短信提醒
                if(approveUser.mobile && isMobile(approveUser.mobile)) {
                    try{
                        let msg_url = await API.shorturl.long2short({longurl: approve_url, shortType: 'md5'});
                        API.sms.sendMsgSubmit({template: 'travelBudgetApply', mobile: approveUser.mobile,
                            values: {name: user.name, time: moment(tripPlan.startAt).format('YYYY-MM-DD'), destination: tripPlan.arrivalCity, url: msg_url}});
                    }catch (e) {
                        logger.error('发送短信失败...');
                        logger.error(e);
                    }
                }
            }else {
                let admins = await Models.staff.find({ where: {companyId: tripPlan['companyId'], roleId: [EStaffRole.OWNER, EStaffRole.ADMIN], status: EStaffStatus.ON_JOB, id: {$ne: userId}}}); //获取激活状态的管理员
                
                //给所有的管理员发送邮件
                await Promise.all(admins.map(async function(s) {
                    let vals = {managerName: s.name, username: user.name, email: user.email, time: moment(tripPlan.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                        projectName: tripPlan.title, goTrafficBudget: go, backTrafficBudget: back, hotelBudget: hotel, otherBudget: others,
                        totalBudget: '￥' + tripPlan.budget, url: url, detailUrl: url};

                    await API.mail.sendMailRequest({toEmails: s.email, templateName: 'qm_notify_new_travelbudget', values: vals});
                }));
            }
            return true;
        }catch (e) {
            logger.error("发送邮件失败");
            logger.error(e);
        }

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
    @requireParams(['id'], ['isNeedTraffic', 'isNeedHotel', 'title', 'description', 'status', 'deptCity', 'deptCityCode', 'arrivalCity', 'arrivalCityCode', 'startAt', 'backAt', 'remark'])
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
    @requireParams(['id', 'auditResult'], ['auditRemark', "budgetId"])
    @modelNotNull('tripPlan')
    static async approveTripPlan(params: {id: string, auditResult: EAuditStatus, auditRemark?: string, budgetId?: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        let auditResult = params.auditResult;
        let staff = await Staff.getCurrent();
        let budgetId = params.budgetId

        if(auditResult != EAuditStatus.PASS && auditResult != EAuditStatus.NOT_PASS) {
            throw L.ERR.PERMISSION_DENY(); //只能审批待审批的出差记录
        }

        if(tripPlan.status != EPlanStatus.WAIT_APPROVE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR(); //只能审批待审批的出差记录
        }

        if(tripPlan.auditUser != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        if (auditResult == EAuditStatus.PASS) {
            if (!budgetId) {
                throw new Error(`预算信息已失效请重新生成`);
            }
            let budgetInfo = await API.client.travelBudget.getBudgetInfo({id: budgetId, accountId: tripPlan["accountId"]});
            if (!budgetInfo) {
                throw new Error(`预算信息已失效请重新生成`);
            }
            let finalBudget = 0;
            budgetInfo.budgets.forEach((v) => {
                if (v.price <= 0) {
                    finalBudget = -1;
                    return;
                }
                finalBudget += Number(v.price);
            });
            tripPlan.finalBudgetCreateAt = budgetInfo.createAt;
            tripPlan.originalBudget = tripPlan.budget;
            tripPlan.budget = finalBudget;
            tripPlan.isFinalBudget = true;
            let budgets = budgetInfo.budgets;
            let query = budgetInfo.query;

            let oldDetails = await tripPlan.getTripDetails({where: {}});
            oldDetails.map(async (v) => {
                await Models.tripDetail.destroy(v);
            });

            //更新详情信息
            budgets.forEach(async (budget) => {
                let price = Number(budget.price);
                let tripType = budget.tripType;
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
                        break;
                    case ETripType.BACK_TRIP:
                        detail.deptCityCode = query.destinationPlace;
                        detail.arrivalCityCode = query.originPlace;
                        detail.deptCity = tripPlan.arrivalCity;
                        detail.arrivalCity = tripPlan.deptCity;
                        detail.startTime = query.goBackDate;
                        detail.endTime = query.leaveDate;
                        break;
                    case ETripType.HOTEL:
                        detail.cityCode = query.destinationPlace;
                        detail.city = tripPlan.arrivalCity;
                        detail.hotelName = query.businessDistrict;
                        detail.startTime = query.checkInDate || query.leaveDate;
                        detail.endTime = query.checkOutDate || query.goBackDate;
                        break;
                    case ETripType.SUBSIDY:
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
                        detail.type = ETripType.OTHER;
                        detail.startTime = query.leaveDate;
                        detail.endTime = query.goBackDate;
                        break;
                }
                await detail.save();
            });
        }

        tripPlan.auditStatus = auditResult;
        let log = TripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id})
        if(params.auditRemark) {
            tripPlan.auditRemark = params.auditRemark;
        }

        //发送审核结果邮件
        let self_url = config.host + '/index.html#/trip/list-detail?tripid=' + tripPlan.id;
        let user = tripPlan.account;

        if(!user) {
            user = await Models.staff.get(tripPlan['accountId']);
        }

        try {
            let {go, back, hotel, others} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            let self_values = {username: user.name, planNo: tripPlan.planNo, approveTime: utils.now(), approveUser: staff.name,
                projectName: tripPlan.title, goTrafficBudget: go, backTrafficBudget: back, hotelBudget: hotel, otherBudget: others,
                totalBudget: '￥' + tripPlan.budget, url: self_url, detailUrl: self_url};

            let msg_url = await API.shorturl.long2short({longurl: self_url, shortType: 'md5'});
            if(auditResult == EAuditStatus.PASS) {
                log.remark = '审批通过，审批人：' + staff.name;
                tripPlan.status = EPlanStatus.WAIT_UPLOAD;
                API.mail.sendMailRequest({toEmails: user.email, templateName: 'qm_notify_approve_pass', values: self_values});
                //发送短信提醒
                if(user.mobile && isMobile(user.mobile)) {
                    API.sms.sendMsgSubmit({template: 'travelBudgetApproved', mobile: user.mobile,
                        values: {time: moment(tripPlan.startAt).format('YYYY-MM-DD'), destination: tripPlan.arrivalCity, url: msg_url}});
                }
            }else if(auditResult == EAuditStatus.NOT_PASS) {
                if(!params.auditRemark) {
                    throw {code: -2, msg: '拒绝原因不能为空'};
                }
                log.remark = '审批未通过，原因：' + params.auditRemark + '，审批人：' + staff.name;
                tripPlan.status = EPlanStatus.APPROVE_NOT_PASS;
                self_values['reason'] = params.auditRemark;
                API.mail.sendMailRequest({toEmails: user.email, templateName: 'qm_notify_approve_not_pass', values: self_values});
                //发送短信提醒
                if(user.mobile && isMobile(user.mobile)) {
                    API.sms.sendMsgSubmit({template: 'travelBudgetApproveFailed', mobile: user.mobile,
                        values: {time: moment(tripPlan.startAt).format('YYYY-MM-DD'), destination: tripPlan.arrivalCity, url: msg_url}});
                }
            }
        }catch (e) {
            logger.error('审批发送邮件或短信失败...');
            logger.error(e);
        }


        let tripDetails = await tripPlan.getTripDetails({});

        tripDetails.map(function(detail) {
            if (detail.type == ETripType.SUBSIDY) return;
            detail.status = tripPlan.status;
        });

        await Promise.all(tripDetails.map((d) => d.save()));
        await Promise.all([tripPlan.save(), log.save()]);
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
    static async uploadInvoice(params: {tripDetailId: string, pictureFileId: string}): Promise<boolean> {
        let staff = await Staff.getCurrent();
        let tripDetail = await Models.tripDetail.get(params.tripDetailId);

        if (tripDetail.status != EPlanStatus.WAIT_UPLOAD && tripDetail.status != EPlanStatus.WAIT_COMMIT) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let tripPlan = tripDetail.tripPlan;

        if(tripPlan.status != EPlanStatus.WAIT_UPLOAD && tripDetail.status != EPlanStatus.WAIT_COMMIT) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let invoiceJson: any = tripDetail.invoice || [];
        let times = invoiceJson.length ? invoiceJson.length + 1 : 1;

        if(typeof invoiceJson =='string') {
            invoiceJson = JSON.parse(invoiceJson);
        }

        invoiceJson.push({times: times, pictureFileId: params.pictureFileId, created_at: utils.now(), status: EPlanStatus.WAIT_COMMIT, remark: '', approve_at: ''});
        tripDetail.newInvoice = params.pictureFileId;
        tripDetail.invoice = JSON.stringify(invoiceJson);
        tripDetail.status = EPlanStatus.WAIT_COMMIT;

        var details = await Models.tripDetail.find({where: {tripPlanId: tripPlan.id, status: EPlanStatus.WAIT_UPLOAD,
            id: {$ne: tripDetail.id}, type: [ETripType.BACK_TRIP, ETripType.HOTEL, ETripType.OUT_TRIP]}});

        if(!details || details.length == 0) {
            tripPlan.status = EPlanStatus.WAIT_COMMIT;
        }

        await Promise.all([tripPlan.save(), tripDetail.save()]);

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
                detail.status = EPlanStatus.AUDITING;
                detail.isCommit = true;
            })
        }

        await Promise.all(tripDetails.map((detail) => detail.save()));
        await tripPlan.save();
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
        let {id, expenditure, reason, auditResult} = params;
        let tripDetail = await Models.tripDetail.get(params.id);

        if(tripDetail.status != EPlanStatus.AUDITING) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }

        let audit = params.auditResult;
        let tripPlan = tripDetail.tripPlan;

        if(audit == EAuditStatus.INVOICE_PASS) {
            tripDetail.status = EPlanStatus.COMPLETE;
            tripDetail.expenditure = expenditure;
            let query = {where: {id: {$ne: tripDetail.id}, status: [EPlanStatus.AUDITING, EPlanStatus.AUDIT_NOT_PASS]}}
            let details = await tripPlan.getTripDetails(query); //获取所有未经过审核的票据
            if(!details || details.length == 0 ) {
                tripPlan.status = EPlanStatus.COMPLETE;
                tripPlan.auditStatus = EAuditStatus.INVOICE_PASS;
            }
        } else if(audit == EAuditStatus.INVOICE_NOT_PASS) {
            tripDetail.auditRemark = reason;
            tripDetail.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.auditStatus = EAuditStatus.INVOICE_NOT_PASS;
        } else {
            throw L.ERR.PERMISSION_DENIED(); //代理商只能审核票据权限
        }
        await Promise.all([tripPlan.save(), tripDetail.save()]);
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
        options.order = options.order || [['created_at', 'desc']];
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
        let paginate = await Models.tripPlan.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
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
            + companyId + '\' and status!=(' + EPlanStatus.APPROVE_NOT_PASS + ') and status!=' + EPlanStatus.WAIT_APPROVE + ' and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let complete_sql = 'from trip_plan.trip_plans where company_id=\''
            + companyId + '\' and status=' + EPlanStatus.COMPLETE + ' and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let staff_num_sql = 'select count(1) as \"staffNum\" from (select distinct account_id ' + where_sql + ') as Project;';
        let project_num_sql = 'select count(1) as \"projectNum\" from (select distinct project_id ' + where_sql + ') as Project;';
        let budget_sql = 'select sum(budget) as \"dynamicBudget\" ' + where_sql;
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

    /**
     * @method saveTripPlan
     * 生成出差计划单
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['deptCity', 'arrivalCity', 'startAt', 'title', 'budgets'], ['backAt', 'remark', 'description'])
    static async saveTripPlanByTest(params: {deptCity: string, arrivalCity: string, startAt: string, title: string,
        budgets: any[],backAt?: string, remark?: string, description?: string}): Promise<TripPlan> {
        let staff = await Staff.getCurrent();
        let totalPrice:number = 0;
        for(let budget of params.budgets) {
            if (budget.price < 0) {
                totalPrice = -1;
                break;
            }
            totalPrice += Number(budget.price);
        }

        let project = await getProjectByName({companyId: staff.company.id, name: params.title, userId: staff.id, isCreate: true});

        let tripPlan = TripPlan.create(params);
        tripPlan.budget = totalPrice;
        tripPlan.status = 0;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号
        tripPlan.account = staff;
        tripPlan.auditUser = staff.id;
        tripPlan['companyId'] = staff.company.id;
        tripPlan['projectId'] = project.id;

        await Promise.all(params.budgets.map(async function (detail) {
            let _detail = TripDetail.create(detail);
            _detail.tripPlan = tripPlan;
            _detail.accountId = staff.id;
            _detail.status = 0;
            console.info("补助自动计算:", _detail.type, ETripType.OTHER, _detail.type == ETripType.OTHER)
            if (_detail.type == ETripType.OTHER) {
                _detail.status = EPlanStatus.COMPLETE;
                _detail.expenditure = _detail.budget;
                console.info(_detail)
            }
            await _detail.save();
        }));

        let logs = {tripPlanId: tripPlan.id, userId: staff.id, remark: '新增计划单 ' + tripPlan.planNo, createdAt: utils.now()};
        await Promise.all([tripPlan.save(), TripPlanLog.create(logs).save()]);

        return tripPlan;
    }

    @clientExport
    static async tripPlanSaveRank(params: {limit?: number|string}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let limit = params.limit || 5;
        if (!limit || !/^\d+$/.test(limit as string) || limit > 100) {
            limit = 5;
        }
        let sql = `select account_id, sum(budget) - sum(expenditure) as save from trip_plan.trip_plans where status = 4 AND company_id = '${companyId}'
        group by account_id
        order by save asc limit ${limit}`;

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

    static __initHttpApp = require('./invoice');

    static _scheduleTask () {
        let taskId = "authApproveTrainPlan";
        logger.info('run task ' + taskId);
        scheduler('*/5 * * * *', taskId, async function() {
            let tripPlans = await Models.tripPlan.find({where: {autoApproveTime: {$lte: utils.now()}, status: EPlanStatus.WAIT_APPROVE}, limit: 10, order: 'auto_approve_time'});
            // logger.info("自动审批出差计划...");
            tripPlans.map(async (p) => {
                // logger.warn('auto_approve_time==>', moment(p.autoApproveTime).format('YYYY-MM-DD HH:mm:ss'));
                let details = await p.getTripDetails({});
                p.status = EPlanStatus.WAIT_UPLOAD;

                if(p.auditUser && /^\d{8}-\d{4}-\d{4}-\d{4}-\d{12}$/.test(p.auditUser)) {
                    let tripPlanLog = Models.tripPlanLog.create({tripPlanId: p.id, userId: p.auditUser, remark: '系统自动审批出差计划'});
                    await tripPlanLog.save();
                }

                await Promise.all(details.map((d) => {
                    d.status = EPlanStatus.WAIT_UPLOAD;
                    return d.save();
                }));
                await p.save();
            });
        });
    }

}

async function getProjectByName(params) {
    let projects = await Models.project.find({where: {name: params.name}});

    if(projects && projects.length > 0) {
        return projects[0]
    }else if(params.isCreate === true){
        let p = {name: params.name, createUser: params.userId, code: '', companyId: params.companyId, createdAt: utils.now()};
        return Models.project.create(p).save();
    }
}

TripPlanModule._scheduleTask();

export = TripPlanModule;