/**
 * Created by wlh on 2016/11/14.
 */

'use strict';
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import {modelNotNull} from "../_decorator";
import {Models} from "_types/index";
import {FindResult} from "common/model/interface";
import {
    QMEApproveStatus, EApproveResult, ETripType, EPlanStatus,
    TripPlan, TripPlanLog, EApproveResult2Text, TripApprove
} from "_types/tripPlan/tripPlan";
import moment = require("moment/moment");
import {Staff, EStaffStatus, EStaffRole} from "_types/staff/staff";
import {EVENT, plugins, emitter} from "libs/oa/index";
import {TripDetail} from "_types/tripPlan/tripDetail";
import TripPlanModule = require("../tripPlan/index");
let systemNoticeEmails = require('@jingli/config').system_notice_emails;
const L = require('@jingli/language');
var API = require('@jingli/dnode-api');
import config = require("@jingli/config");
import _ = require("lodash");
import {ENoticeType} from "_types/notice/notice";
import {AutoApproveType, AutoApproveConfig} from "_types/tripPlan"


class TripApproveModule {

    static async getDetailsFromApprove(params: {approveId: string}): Promise<TripDetail[]> {
        let approve = await Models.tripApprove.get(params.approveId);
        let account = approve.account;
        let budgets = approve.budgetInfo;
        return budgets.map(function (budget: any) {
            if (typeof budget == 'string') {
                budget = JSON.parse(budget);
            }
            let tripType = budget.tripType;
            let price = Number(budget.price);
            let detail;
            let data = {}
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail = Models.tripDetailTraffic.create(data);
                    detail.deptCity = budget.originPlace.id;
                    detail.arrivalCity = budget.destination.id;
                    detail.deptDateTime = budget.leaveDate;
                    // detail.arrivalDateTime = budget.arrivalDateTime;
                    detail.cabin = budget.cabinClass;
                    break;
                case ETripType.BACK_TRIP:
                    detail = Models.tripDetailTraffic.create(data);
                    detail.deptCity = budget.originPlace.id;
                    detail.arrivalCity = budget.destination.id;
                    detail.deptDateTime = budget.leaveDate;
                    // detail.arrivalDateTime = budget.arrivalDateTime;
                    detail.cabin = budget.cabinClass;
                    break;
                case ETripType.HOTEL:
                    detail = Models.tripDetailHotel.create(data);
                    detail.type = ETripType.HOTEL;
                    detail.city = budget.cityName;
                    // detail.position = budget.businessDistrict;
                    detail.placeName = budget.hotelName;
                    detail.checkInDate = budget.checkInDate || approve.startAt;
                    detail.checkOutDate = budget.checkOutDate || approve.backAt;
                    break;
                case ETripType.SUBSIDY:
                    detail = Models.tripDetailSubsidy.create(data);
                    detail.type = ETripType.SUBSIDY;
                    // detail.deptCity = approve.deptCityCode;
                    // detail.arrivalCity = approve.arrivalCityCode;
                    detail.startDateTime = budget.fromDate
                    detail.endDateTime = budget.endDate;
                    detail.hasFirstDaySubsidy = budget.hasFirstDaySubsidy || true;
                    detail.hasLastDaySubsidy = budget.hasLastDaySubsidy || true;
                    // detail.expenditure = budget.price;
                    detail.status = EPlanStatus.COMPLETE;
                    break;
                case ETripType.SPECIAL_APPROVE:
                    detail = Models.tripDetailSpecial.create(data);
                    detail.type = ETripType.SPECIAL_APPROVE;
                    detail.deptCity = approve.deptCityCode;
                    detail.arrivalCity = approve.arrivalCityCode;
                    detail.startDateTime = approve.startAt;
                    detail.endDateTime = approve.backAt;
                    break;
                default:
                    throw new Error("not support tripDetail type!");
            }
            detail.type = tripType;
            detail.budget = price;
            detail.accountId = account.id;
            detail.tripPlanId = approve.id;
            return detail;
        });
    }

    /*static async sendTripApproveNoticeToSystem(params: {approveId: string}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;

        if(company.name != "鲸力智享"){

            try {
                await Promise.all(systemNoticeEmails.map(async function(s) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: {tripApprove: tripApprove, name: s.name}
                        })

                    } catch(err) {
                        console.error(err);
                    }
                }));
            } catch(err) {
                console.error('发送系统通知失败', err)
            }
        }
        return true;
    }*/

    static async sendTripApproveNotice(params: {approveId: string, nextApprove?: boolean}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;
        let nextApprove = params.nextApprove || false;

        let approve_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
        let appMessageUrl = `#/trip-approval/detail?approveId=${tripApprove.id}`;
        let shortUrl = approve_url;
        try {
            shortUrl = await API.wechat.shorturl({longurl: approve_url});
        } catch(err) {
            console.warn(`转换短链接失败`, err);
        }
        if(company.isApproveOpen) {
            //给审核人发审核邮件
            let approveUser = await Models.staff.get(tripApprove['approveUserId']);

            try {
                await API.notify.submitNotify({
                    key: 'qm_notify_new_travelbudget',
                    userId: approveUser.id,
                    values: {tripApprove: tripApprove, detailUrl: shortUrl, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPLY_NOTICE}
                });
            } catch(err) {
                console.error('发送通知失败', err.stack ? err.stack : err);
            }

            try {
                await API.ddtalk.sendLinkMsg({accountId: approveUser.id, text: '有新的出差申请需要您审批', url: shortUrl})
            } catch(err) {
                console.error(`发送钉钉通知失败`, err)
            }
        } else {
            let admins = await Models.staff.find({ where: {companyId: tripApprove['companyId'], roleId: [EStaffRole.OWNER,
                EStaffRole.ADMIN], staffStatus: EStaffStatus.ON_JOB, id: {$ne: staff.id}}}); //获取激活状态的管理员
            //给所有的管理员发送邮件
            await Promise.all(admins.map(async function(s) {
                try {
                    await API.notify.submitNotify({
                        key: 'qm_notify_new_travelbudget',
                        userId: s.id,
                        values: {tripApprove: tripApprove, detailUrl: shortUrl, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPLY_NOTICE}
                    });

                } catch(err) {
                    console.error(err);
                }
            }));
        }
        return true;
    }

    static async sendApprovePassNoticeToCompany(params: {approveId: string}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;

        try {
            if(company.getNoticeEmail){
                await API.notify.submitNotify({
                    key: 'qm_notify_company_approve_pass',
                    email: company.getNoticeEmail,
                    values: {tripApprove: tripApprove}
                })
            }
        } catch(err) {
            console.error('发送行政通知失败', err)
        }
        return true;
    }


    /* 企业管理员审批员工预算
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
        let approveUser = await Models.staff.get(tripApprove['approveUserId']);
        let approveCompany = approveUser.company;


        if(isNextApprove && !params.nextApproveUserId)
            throw new Error("审批人不能为空");

        if (!tripApprove.isSpecialApprove && !budgetId){
            throw new Error(`预算信息已失效请重新生成`);
        }else if(approveResult != EApproveResult.PASS && approveResult != EApproveResult.REJECT) {
            throw L.ERR.PERMISSION_DENY(); //只能审批待审批的出差记录
        }else if(tripApprove.status != QMEApproveStatus.WAIT_APPROVE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR(); //只能审批待审批的出差记录
        }else if(approveUser.id != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        let budgetInfo;
        let number = 0;
        /*if(tripApprove.isSpecialApprove){
            number = 1;
        }*/
        if(!tripApprove.isSpecialApprove){
            budgetInfo = await API.client.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.account.id});
            if (!budgetInfo || !budgetInfo.budgets)
                throw new Error(`预算信息已失效请重新生成`);
            let finalBudget = 0;
            budgetInfo.budgets.forEach((v) => {
                if(v.tripType != ETripType.SUBSIDY){
                    number = number + 1;
                }
                if (v.price <= 0) {
                    finalBudget = -1;
                    return;
                }
                finalBudget += Number(v.price);
            });
            if (finalBudget > tripApprove.budget) {
                tripApprove.budget = finalBudget;
                tripApprove.budgetInfo = budgetInfo.budgets;
            }
        }


        // 特殊审批和非当月提交的审批不记录行程点数
        if(!tripApprove.isSpecialApprove){
            if(typeof tripApprove.query == 'string'){
                tripApprove.query = JSON.parse(tripApprove.query);
            }
            let query = tripApprove.query;
            let frozenNum = query.frozenNum;
            let content = tripApprove.deptCity+"-"+tripApprove.arrivalCity;
            if(tripApprove.createdAt.getMonth() == new Date().getMonth()){
                //审批本月记录审批通过
                if(approveResult == EApproveResult.PASS && !isNextApprove){
                    await approveCompany.beforeApproveTrip({number : frozenNum});
                    await approveCompany.approvePassReduceTripPlanNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                        remark: "审批通过消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                }
                //审批本月记录审批驳回
                if(approveResult == EApproveResult.REJECT){
                    await approveCompany.approveRejectFreeTripPlanNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                        remark: "审批驳回释放冻结行程点数", content: content, frozenNum: frozenNum});
                }
            }else{
                //审批上月记录审批通过
                if(approveResult == EApproveResult.PASS && !isNextApprove){
                    await approveCompany.beforeApproveTrip({number : frozenNum});
                    await approveCompany.approvePassReduceBeforeNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                        remark: "审批通过上月申请消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                }

                //审批上月记录审批驳回
                if(approveResult == EApproveResult.REJECT){
                    await approveCompany.approveRejectFreeBeforeNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                        remark: "审批驳回上月申请释放冻结行程点数", content: content, frozenNum: frozenNum});
                }

            }

        }

        // let tripPlan: TripPlan;
        let notifyRemark = '';
        let log = TripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id});

        if (approveResult == EApproveResult.PASS && !isNextApprove) {
            notifyRemark = `审批通过，审批人：${staff.name}`;
            log.approveStatus = EApproveResult.PASS;
            log.remark = `审批通过`;
            log.save();
            tripApprove.status = QMEApproveStatus.PASS;
            tripApprove.approveRemark = '审批通过';
            tripApprove.approvedUsers += `,${staff.id}`;
            //tripPlan = await TripPlanModule.saveTripPlanByApprove({tripApproveId: params.id});
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
            log.approveStatus = EApproveResult.REJECT;
            log.remark = approveRemark;
            log.save();
            tripApprove.approveRemark = approveRemark;
            tripApprove.status = QMEApproveStatus.REJECT;
        }
        await tripApprove.save();

        if(isNextApprove){
            await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: true});
        }else if(approveResult == EApproveResult.REJECT){
            //发送审核结果邮件
            let self_url;
            let appMessageUrl;
            self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + tripApprove.id;
            appMessageUrl = '#/trip-approval/detail?approveId=' + tripApprove.id;
            let user = tripApprove.account;
            if(!user) user = await Models.staff.get(tripApprove['accountId']);
            try {
                self_url = await API.wechat.shorturl({longurl: self_url});
            } catch(err) {
                console.error(err);
            }
            try {
                await API.notify.submitNotify({userId: user.id, key: 'qm_notify_approve_not_pass',
                    values: { tripApprove: tripApprove, detailUrl: self_url, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPROVE_NOTICE}});
            } catch(err) { console.error(err);}
        }

        //发送通知给监听程序
        plugins.qm.tripApproveUpdateNotify(null, {
            approveNo: tripApprove.id,
            status: tripApprove.status,
            approveUser: staff.id,
            outerId: tripApprove.id,
            data: budgetInfo,
            oa: 'qm'
        });

        return true;
    }



    /**
     * 撤销tripApprove
     * @param params
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['id'],['remark'])
    static async cancelTripApprove(params: {id: string, remark?: string}): Promise<boolean> {
        let tripApprove = await Models.tripApprove.get(params.id);
        let company = tripApprove.account.company;
        if( tripApprove.status != QMEApproveStatus.WAIT_APPROVE && tripApprove.approvedUsers && tripApprove.approvedUsers.indexOf(",") != -1 ) {
            throw {code: -2, msg: "审批单状态不正确，该审批单不能撤销！"};
        }
        tripApprove.status = QMEApproveStatus.CANCEL;
        tripApprove.cancelRemark = params.remark || "";
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, remark: `撤销行程审批单`});
        await Promise.all([tripApprove.save(), log.save()]);

        let query = tripApprove.query;
        if (typeof query == 'string') {
            query = JSON.parse(query);
        }
        let frozenNum = query.frozenNum;
        console.info(frozenNum);
        let content = tripApprove.deptCity+"-"+tripApprove.arrivalCity;
        if(tripApprove.createdAt.getMonth() == new Date().getMonth()){
            await company.approveRejectFreeTripPlanNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                remark: "审批前撤销行程释放冻结行程点数", content: content, frozenNum: frozenNum});
        }else{
            await company.approveRejectFreeBeforeNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                remark: "审批前撤销上月行程释放冻结行程点数", content: content, frozenNum: frozenNum});

        }

        return true;
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
        budgets.forEach((b) => {totalBudget += Number(b.price);});
        budgets = budgets.map( (v) => {
            if (v.type == ETripType.HOTEL) {
                v.placeName = budgetInfo.query.hotelName;
            }
            return v;
        });
        let project = await API.tripPlan.getProjectByName({companyId: company.id, name: params.title, userId: staff.id, isCreate: true});
        let tripApprove =  TripApprove.create(params);

        if(params.approveUserId) {
            let approveUser = await Models.staff.get(params.approveUserId);
            if(!approveUser)
                throw {code: -3, msg: '审批人不存在'}
            // if(tripApprove.approveUser && tripApprove['approveUser'].id == staff.id)
            //     throw {code: -4, msg: '审批人不能是自己'};
            tripApprove.approveUser = approveUser;
        }

        tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
        tripApprove.account = staff;
        tripApprove['companyId'] = company.id;
        tripApprove.project = project;
        tripApprove.startAt = query.leaveDate;
        tripApprove.backAt = query.goBackDate
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
        tripApprove.status = totalBudget < 0 ? QMEApproveStatus.NO_BUDGET : QMEApproveStatus.WAIT_APPROVE;

        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, approveStatus: EApproveResult.WAIT_APPROVE, remark: '提交审批单，等待审批'});

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == QMEApproveStatus.WAIT_APPROVE) {
            tripApprove.autoApproveTime = TripApproveModule.calculateAutoApproveTime({
                type: company.autoApproveType,
                config: company.autoApprovePreference,
                submitAt: tripApprove.createdAt,
                tripStartAt: tripApprove.startAt,
            });
        }

        await Promise.all([tripApprove.save(), tripPlanLog.save()]);
        await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        // await TripApproveModule.sendTripApproveNoticeToSystem({approveId: tripApprove.id});
        return tripApprove;
    }


    static calculateAutoApproveTime( params: {
        type: AutoApproveType,
        config: AutoApproveConfig,
        submitAt:Date,
        tripStartAt:Date
    }):Date {
            let {type, config, submitAt, tripStartAt} = params;
            config = <AutoApproveConfig>config;
            let autoApproveDateTime: Date;
            let expectedApproveTime: Date;
            let interval = 0;
            let day = config.day ? config.day : 1;
            let hour = config.hour ? config.hour :18;
            let defaultDelay = config.defaultDelay ? config.defaultDelay : 1;

            switch(type) {
                case AutoApproveType.AfterSubmit:  // 审批提交时间
                    expectedApproveTime = moment(submitAt).add(day, 'hours').hour(hour).minute(0).toDate();

                    interval = moment(tripStartAt).diff(expectedApproveTime, 'hours');
                    if(interval > 0 ) {
                        autoApproveDateTime = expectedApproveTime;
                    } else {
                        autoApproveDateTime = moment(submitAt).add(defaultDelay, 'hours').minute(0).toDate();
                    }

                    break;
                default:           //出行时间
                    expectedApproveTime = moment(submitAt).subtract(day, 'days').hour(hour).minute(0).toDate();
                    interval = moment(tripStartAt).diff(expectedApproveTime, 'hours');
                    if(interval > 0){
                        autoApproveDateTime = expectedApproveTime;
                    } else {
                        autoApproveDateTime = moment(submitAt).add(defaultDelay, 'hours').minute(0).toDate();
                    }
                    break;
            }

            return autoApproveDateTime;
    }

    @clientExport
    @requireParams(['query', 'title', 'budget', 'specialApproveRemark'], ['description', 'remark', 'approveUserId'])
    static async saveSpecialTripApprove(params) {
        let staff = await Staff.getCurrent();
        let company = staff.company;

        if(company.isApproveOpen && !params.approveUserId) { //企业开启审核功能后，审核人不能为空
            throw {code: -2, msg: '审批人不能为空'};
        }

        let query = params.query;
        let project = await API.tripPlan.getProjectByName({companyId: company.id, name: params.title, userId: staff.id, isCreate: true});
        let tripApprove =  TripApprove.create(params);
        tripApprove.isSpecialApprove = true;

        if(params.approveUserId) {
            let approveUser = await Models.staff.get(params.approveUserId);
            if(!approveUser)
                throw {code: -3, msg: '审批人不存在'}
            if(tripApprove.approveUser && tripApprove['approveUser'].id == staff.id)
                throw {code: -4, msg: '审批人不能是自己'};
            tripApprove.approveUser = approveUser;
        }

        tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
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

        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, approveStatus: EApproveResult.WAIT_APPROVE, remark: '特别审批提交审批单，等待审批'});

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == QMEApproveStatus.WAIT_APPROVE) {
            tripApprove.autoApproveTime = TripApproveModule.calculateAutoApproveTime({
                type: company.autoApproveType,
                config: company.autoApprovePreference,
                submitAt: tripApprove.createdAt,
                tripStartAt: tripApprove.startAt,
            });
        }
        await Promise.all([tripApprove.save(), tripPlanLog.save()]);

        await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        // await TripApproveModule.sendTripApproveNoticeToSystem({approveId: tripApprove.id});

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
        //let staff = await Staff.getCurrent();
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
}



export= TripApproveModule