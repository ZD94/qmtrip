/**
 * Created by wlh on 2016/11/14.
 */

'use strict';
import {clientExport, requireParams} from "common/api/helper";
import {modelNotNull} from "../_decorator";
import {Models} from "../_types/index";
import {FindResult} from "common/model/interface";
import {
    QMEApproveStatus, EApproveResult, ETripType, EPlanStatus,
    TripPlan, TripPlanLog, EApproveResult2Text, TripApprove
} from "../_types/tripPlan/tripPlan";
import moment = require("moment/moment");
import {Staff, EStaffStatus, EStaffRole} from "../_types/staff/staff";
import {EVENT, plugins, emitter} from "libs/oa/index";
import {TripDetail} from "../_types/tripPlan/tripDetail";
import TripPlanModule = require("../tripPlan/index");
let systemNoticeEmails = require('config/config').system_notice_emails;
const L = require('common/language');
var API = require('common/api');
var config = require("config");
import _ = require("lodash");
import {ENoticeType} from "../_types/notice/notice";

class TripApproveModule {

    static async getDetailsFromApprove(params: {approveId: string}): Promise<TripDetail[]> {
        let approve = await Models.tripApprove.get(params.approveId);
        let account = approve.account;
        let budgets = approve.budgetInfo;
        let query = approve.query;
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
                    detail.deptCity = approve.deptCityCode;
                    detail.arrivalCity = approve.arrivalCityCode;
                    detail.deptDateTime = approve.startAt;
                    detail.arrivalDateTime = approve.backAt;
                    detail.cabin = budget.cabinClass;
                    break;
                case ETripType.BACK_TRIP:
                    detail = Models.tripDetailTraffic.create(data);
                    detail.deptCity = approve.arrivalCityCode;
                    detail.arrivalCity = approve.deptCityCode;
                    detail.deptDateTime = approve.backAt;
                    detail.arrivalDateTime = approve.backAt;
                    detail.cabin = budget.cabinClass;
                    break;
                case ETripType.HOTEL:
                    detail = Models.tripDetailHotel.create(data);
                    detail.type = ETripType.HOTEL;
                    detail.city = approve.arrivalCityCode;
                    detail.position = query.businessDistrict;
                    detail.placeName = query.hotelName;
                    detail.checkInDate = query.checkInDate || approve.startAt;
                    detail.checkOutDate = query.checkOutDate || approve.backAt;
                    break;
                case ETripType.SUBSIDY:
                    detail = Models.tripDetailSubsidy.create(data);
                    detail.type = ETripType.SUBSIDY;
                    detail.deptCity = approve.deptCityCode;
                    detail.arrivalCity = approve.arrivalCityCode;
                    detail.startDateTime = approve.startAt
                    detail.endDateTime = approve.backAt;
                    if (approve.query && approve.query.subsidy) {
                        detail.hasFirstDaySubsidy = approve.query.subsidy.hasFirstDaySubsidy || true;
                        detail.hasLastDaySubsidy = approve.query.subsidy.hasLastDaySubsidy || true;
                    }
                    detail.expenditure = price;
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

    static async sendTripApproveNoticeToSystem(params: {approveId: string}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;

        if(company.name != "鲸力智享"){
            let details = await TripApproveModule.getDetailsFromApprove({approveId: tripApprove.id});
            let {go, back, hotel, subsidy} = await TripPlanModule.getEmailInfoFromDetails(details);
            let timeFormat = 'YYYY-MM-DD HH:mm:ss';

            let values: any = {
                time: moment(tripApprove.createdAt).format(timeFormat),
                projectName: tripApprove.title,
                goTrafficBudget: go,
                backTrafficBudget: back,
                hotelBudget: hotel,
                otherBudget: subsidy,
                totalBudget: '￥' + tripApprove.budget,
                userName : staff.name,
                email : staff.email
            };

            try {
                await Promise.all(systemNoticeEmails.map(async function(s) {
                    values.name = s.name;
                    console.info(s);
                    console.info("系统通知============");
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: values
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
    }

    static async sendTripApproveNotice(params: {approveId: string, nextApprove?: boolean}) {
        let tripApprove = await Models.tripApprove.get(params.approveId);
        let staff = tripApprove.account;
        let company = staff.company;
        let nextApprove = params.nextApprove || false;

        let details = await TripApproveModule.getDetailsFromApprove({approveId: tripApprove.id});
        let {go, back, hotel, subsidy} = await TripPlanModule.getEmailInfoFromDetails(details);
        let timeFormat = 'YYYY-MM-DD HH:mm:ss';

        //给员工发送邮件
        let self_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
        let appMessageUrl = `#/trip-approval/detail?approveId=${tripApprove.id}`;
        let openid = await API.auth.getOpenIdByAccount({accountId: staff.id});
        let values: any = {
            staffName: staff.name,
            time: moment(tripApprove.createdAt).format(timeFormat),
            projectName: tripApprove.title,
            goTrafficBudget: go,
            backTrafficBudget: back,
            hotelBudget: hotel,
            otherBudget: subsidy,
            totalBudget: '￥' + tripApprove.budget,
            url: self_url,
            detailUrl: self_url,
            appMessageUrl: appMessageUrl,
            startAt: moment(tripApprove.startAt).format('MM.DD'),
            backAt: moment(tripApprove.backAt).format('MM.DD'),
            deptCity: tripApprove.deptCity,
            arrivalCity: tripApprove.arrivalCity
        };
        if(!nextApprove){
            try {
                values.noticeType = ENoticeType.SYSTEM_NOTICE;
                //给员工自己发送通知
                await API.notify.submitNotify({
                    key: 'qm_notify_self_travelbudget',
                    accountId: staff.id,
                    values: values
                });

            } catch(err) {
                console.error(`发送通知失败`, err);
            }

            try {
                await API.ddtalk.sendLinkMsg({accountId: staff.id, text: `您的出差申请已经生成`, url: self_url})
            } catch(err) {
                console.error(`发送钉钉消息失败`, err)
            }
        }

        if(company.isApproveOpen) {
            //给审核人发审核邮件
            let approveUser = await Models.staff.get(tripApprove['approveUserId']);
            let approve_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
            let appMessageUrl = `#/trip-approval/detail?approveId=${tripApprove.id}`;
            let approve_values = _.cloneDeep(values);
            let shortUrl = approve_url
            try {
                shortUrl = await API.wechat.shorturl({longurl: approve_url});
            } catch(err) {
                console.warn(`转换短链接失败`, err);
            }

            let openId = await API.auth.getOpenIdByAccount({accountId: approveUser.id});
            approve_values.managerName = approveUser.name;
            approve_values.username = staff.name;
            approve_values.email = staff.email;
            approve_values.url = shortUrl;
            approve_values.detailUrl = shortUrl;
            approve_values.appMessageUrl = appMessageUrl;
            approve_values.name = staff.name;
            approve_values.destination = tripApprove.arrivalCity;
            approve_values.startDate = moment(tripApprove.startAt).format('YYYY.MM.DD');
            if (openId) {
                approve_values.approveUser = approveUser.name;
                approve_values.content = `员工${staff.name}${moment(tripApprove.startAt).format('YYYY-MM-DD')}到${tripApprove.arrivalCity}的出差计划已经发送给您，预算：￥${tripApprove.budget}，等待您审批！`;
                approve_values.autoApproveTime = moment(tripApprove.autoApproveTime).format(timeFormat);
                approve_values.staffName = staff.name;
                approve_values.startDate = moment(tripApprove.startAt).format('YYYY.MM.DD');
                approve_values.endDate = moment(tripApprove.backAt).format('YYYY.MM.DD');
                approve_values.createdAt = moment(tripApprove.createdAt).format(timeFormat);
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
                // approve_values.autoApproveTime = moment(tripApprove.autoApproveTime).format(timeFormat)
            }
            try {
                approve_values.noticeType = ENoticeType.TRIP_APPLY_NOTICE;
                console.info("API.notify.submitNotify===>", approve_values);
                await API.notify.submitNotify({
                    key: 'qm_notify_new_travelbudget',
                    accountId: approveUser.id,
                    values: approve_values
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
                let vals: any = _.cloneDeep(values);
                vals.managerName = s.name;
                vals.email = staff.email;
                vals.projectName = tripApprove.title;
                vals.username = s.name;
                vals.noticeType = ENoticeType.TRIP_APPLY_NOTICE;
                try {
                    await API.notify.submitNotify({
                        key: 'qm_notify_new_travelbudget',
                        accountId: s.id,
                        values: vals
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
        let approveUser = await Models.staff.get(tripApprove['approveUserId']);

        let details = await TripApproveModule.getDetailsFromApprove({approveId: tripApprove.id});
        let {go, back, hotel, subsidy} = await TripPlanModule.getEmailInfoFromDetails(details);
        let timeFormat = 'YYYY-MM-DD HH:mm:ss';

        let values: any = {
            projectName: tripApprove.title,
            goTrafficBudget: go,
            backTrafficBudget: back,
            hotelBudget: hotel,
            otherBudget: subsidy,
            totalBudget: '￥' + tripApprove.budget,
            userName : staff.name || "",
            approveTime: moment(new Date()).format(timeFormat),
            approveUser : approveUser.name || ""
        };

        try {
            if(company.getNoticeEmail){
                await API.notify.submitNotify({
                    key: 'qm_notify_company_approve_pass',
                    email: company.getNoticeEmail,
                    values: values
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
        if(!tripApprove.isSpecialApprove){
            budgetInfo = await API.client.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.account.id});
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
        }

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
            tripApprove.status = QMEApproveStatus.PASS;
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
            tripApprove.status = QMEApproveStatus.REJECT;
        }
        await tripApprove.save();

        if(isNextApprove){
            await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: true});
        }else{
            //发送审核结果邮件
            let self_url;
            let appMessageUrl;
            if (tripApprove.status == QMEApproveStatus.PASS) {
                self_url = config.host + '/index.html#/trip/list-detail?tripid=' + tripApprove.id;
                appMessageUrl = '#/trip/list-detail?tripid=' + tripApprove.id;
            } else {
                self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + tripApprove.id;
                appMessageUrl = '#/trip-approval/detail?approveId=' + tripApprove.id;
            }
            let user = tripApprove.account;
            if(!user) user = await Models.staff.get(tripApprove['accountId']);
            let go = {},back = {},hotel = {},subsidy = {};
            let self_values: any = {};
            try {
                self_url = await API.wechat.shorturl({longurl: self_url});
            } catch(err) {
                console.error(err);
            }
            let openId = await API.auth.getOpenIdByAccount({accountId: user.id});
            if(approveResult == EApproveResult.PASS){
                let data = await TripPlanModule.getPlanEmailDetails(tripPlan);
                go = data.go;
                back = data.back;
                hotel = data.hotel;
                subsidy = data.subsidy;
                self_values = {
                    noticeType: ENoticeType.TRIP_APPROVE_NOTICE,
                    username: user.name,
                    planNo: tripPlan.planNo,
                    approveTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    approveUser: staff.name,
                    projectName: tripPlan.title,
                    goTrafficBudget: go,
                    backTrafficBudget: back,
                    hotelBudget: hotel,
                    otherBudget: subsidy,
                    totalBudget: '￥' + tripPlan.budget,
                    url: self_url,
                    detailUrl: self_url,
                    appMessageUrl: appMessageUrl,
                    time: moment(tripPlan.startAt).format('YYYY-MM-DD'),
                    destination: tripPlan.arrivalCity,
                    staffName: user.name,
                    startTime: moment(tripPlan.startAt).format('YYYY-MM-DD'),
                    arrivalCity: tripPlan.arrivalCity,
                    budget: tripPlan.budget,
                    tripPlanNo: tripPlan.planNo,
                    approveResult: EApproveResult2Text[approveResult],
                    reason: approveResult,
                    emailReason: params.approveRemark,
                    startAt: moment(tripPlan.startAt).format('MM.DD'),
                    backAt: moment(tripPlan.backAt).format('MM.DD'),
                    deptCity: tripPlan.deptCity,
                };
                await TripApproveModule.sendApprovePassNoticeToCompany({approveId: tripApprove.id});
            }else if(approveResult == EApproveResult.REJECT){
                let details = await TripApproveModule.getDetailsFromApprove({approveId: tripApprove.id});
                let data = await TripPlanModule.getEmailInfoFromDetails(details);
                go = data.go;
                back = data.back;
                hotel = data.hotel;
                subsidy = data.subsidy;
                self_values = {
                    noticeType: ENoticeType.TRIP_APPROVE_NOTICE,
                    username: user.name,
                    planNo: "无",
                    approveTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    approveUser: staff.name,
                    projectName: tripApprove.title,
                    goTrafficBudget: go,
                    backTrafficBudget: back,
                    hotelBudget: hotel,
                    otherBudget: subsidy,
                    totalBudget: '￥' + tripApprove.budget,
                    url: self_url,
                    detailUrl: self_url,
                    appMessageUrl: appMessageUrl,
                    time: moment(tripApprove.startAt).format('YYYY-MM-DD'),
                    destination: tripApprove.arrivalCity,
                    staffName: user.name,
                    startTime: moment(tripApprove.startAt).format('YYYY-MM-DD'),
                    arrivalCity: tripApprove.arrivalCity,
                    budget: tripApprove.budget,
                    approveResult: EApproveResult2Text[approveResult],
                    reason: approveResult,
                    emailReason: params.approveRemark,
                    startAt: moment(tripApprove.startAt).format('MM.DD'),
                    backAt: moment(tripApprove.backAt).format('MM.DD'),
                    deptCity: tripApprove.deptCity,
                };
            }
            try {
                await API.notify.submitNotify({accountId: user.id, key: tplName, values: self_values});
            } catch(err) { console.error(err);}
            try {
                await API.ddtalk.sendLinkMsg({ accountId: user.id, text: '您的预算已审批完成', url: self_url});
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
        if( tripApprove.status != QMEApproveStatus.WAIT_APPROVE && tripApprove.approvedUsers && tripApprove.approvedUsers.indexOf(",") != -1 ) {
            throw {code: -2, msg: "审批单状态不正确，该审批单不能撤销！"};
        }
        tripApprove.status = QMEApproveStatus.CANCEL;
        tripApprove.cancelRemark = params.remark || "";
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, remark: `撤销行程审批单`});
        await Promise.all([tripApprove.save(), log.save()]);
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
            var days = moment(tripApprove.startAt).diff(moment(), 'days');
            let format = 'YYYY-MM-DD HH:mm:ss';
            if (days <= 0) {
                tripApprove.autoApproveTime = moment(tripApprove.createdAt).add(1, 'hours').toDate();
            } else {
                //出发前一天18点
                let autoApproveTime = moment(tripApprove.startAt).subtract(6, 'hours').toDate();
                //当天18点以后申请的出差计划，一个小时后自动审批
                if(moment(autoApproveTime).diff(moment()) <= 0) {
                    autoApproveTime = <Date>(moment(tripApprove.createdAt).add(1, 'hours').toDate());
                }
                tripApprove.autoApproveTime = autoApproveTime;
            }
        }

        await Promise.all([tripApprove.save(), tripPlanLog.save()]);
        await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        await TripApproveModule.sendTripApproveNoticeToSystem({approveId: tripApprove.id});
        return tripApprove;
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
            var days = moment(tripApprove.startAt).diff(moment(), 'days');
            let format = 'YYYY-MM-DD HH:mm:ss';
            if (days <= 0) {
                tripApprove.autoApproveTime = moment(tripApprove.createdAt).add(1, 'hours').toDate()
            } else {
                //出发前一天18点
                let autoApproveTime = moment(tripApprove.startAt).subtract(6, 'hours').toDate()
                //当天18点以后申请的出差计划，一个小时后自动审批
                if(moment(autoApproveTime).diff(moment()) <= 0) {
                    autoApproveTime = moment(tripApprove.createdAt).add(1, 'hours').toDate();
                }
                tripApprove.autoApproveTime = autoApproveTime;
            }
        }
        await Promise.all([tripApprove.save(), tripPlanLog.save()]);

        await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        await TripApproveModule.sendTripApproveNoticeToSystem({approveId: tripApprove.id});

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