/**
 * Created by wlh on 2016/11/14.
 */


'use strict';
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import {Models} from "_types/index";
import {QMEApproveStatus, EApproveResult, ETripType, EPlanStatus, TripPlanLog} from "_types/tripPlan/tripPlan";
import moment = require("moment/moment");
import {Staff, EStaffStatus, EStaffRole} from "_types/staff/staff";
import {plugins} from "libs/oa/index";
import {TripDetail} from "_types/tripPlan/tripDetail";
const L = require('@jingli/language');
var API = require('@jingli/dnode-api');
const config = require("@jingli/config");
import _ = require("lodash");
import {ENoticeType} from "_types/notice/notice";
import {AutoApproveType, AutoApproveConfig, ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan"
import {DB} from "@jingli/database";
import {ITripApprove, IDestination} from "../../_types/tripApprove";
import {Project} from "../../_types/tripPlan";
import {EApproveStatus, EApproveType} from "_types/approve/types";
import { ITravelBudgetInfo } from 'http/controller/budget';
import { Place } from '_types/place';

export default class TripApproveModule {

    static async retrieveDetailFromApprove(params: {approveNo: string, approveUser?: string, submitter?: string}):Promise<ITripApprove> {
        let {approveNo, approveUser, submitter} = params;
        let tripApproveObj: ITripApprove
        if(!approveUser && !submitter)
            tripApproveObj = await TripApproveModule.getTripApprove({id: approveNo});
        if(tripApproveObj)
            return tripApproveObj;

        let approve = await Models.approve.get(approveNo);
        let company = await Models.company.get(approve.companyId);
        approveUser = approveUser && typeof(approveUser) != 'undefined' ? approveUser : approve.approveUser;
        submitter = submitter && typeof(submitter) != 'undefined' ? submitter: approve.submitter;

        let budgetInfo: {budgets: ITravelBudgetInfo[], query: ICreateBudgetAndApproveParams} = approve.data;



        if(!budgetInfo) {
            throw L.ERR.TRAVEL_BUDGET_NOT_FOUND();
        }
        if(typeof budgetInfo == 'string') {
            budgetInfo = JSON.parse(budgetInfo);
        }
        let {budgets, query} = budgetInfo;
        if(typeof query == 'string') {
            query = JSON.parse(query);
        }
        if(typeof budgets == 'string') {
            budgets = JSON.parse(budgets);
        }
        let destinationPlacesInfo = query.destinationPlacesInfo;
        let totalBudget = 0;
        budgets.forEach((b) => {totalBudget += Number(b.price);});
        console.log('retrieveDetailFromTotal', totalBudget);
        /*budgets = budgets.map( (v) => {
         if (v.type == ETripType.HOTEL) {
         v.placeName = budgetInfo.query.hotelName;
         }
         return v;
         });*/

        let arrivalCityCodes: string[] = [];//目的地代码
        let destinations: IDestination[] = [];
        let project: Project;
        let projectId = query.projectId;
        let projectName = query.projectName;
        if(projectId){
            project = await Models.project.get(projectId);
        }else if(projectName){
            project = await API.tripPlan.getProjectByName({companyId: company.id, name: projectName,
                userId: submitter});
        }
        let tripApprove: ITripApprove;
        tripApprove.id = approveNo;
        // tripApprove.approveUserId = approveUser;
        // let tripApprove = await Models.tripApprove.create({approveUserId: approveUser, id: approveNo});
        if(query.originPlace) {
            let placeCode = query.originPlace;
            if (typeof placeCode != 'string') {
                placeCode = placeCode['id']
            }
            let deptInfo = await API.place.getCityInfo({cityCode: placeCode, companyId: approve.companyId}) || {name: null};
            tripApprove.deptCityCode = deptInfo.id;
            tripApprove.deptCity = deptInfo.name;
        }

        tripApprove.isRoundTrip = query.isRoundTrip;
        if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let segment: ISegment = destinationPlacesInfo[i];

                //处理目的地 放入arrivalCityCodes
                if(segment.destinationPlace){
                    let placeCode = segment.destinationPlace;
                    if (typeof placeCode != 'string') {
                        placeCode = placeCode['id'];
                    }
                    let arrivalInfo = await API.place.getCityInfo({cityCode: placeCode, companyId: approve.companyId}) || {name: null};
                    let destination: IDestination = {city:arrivalInfo.id, arrivalDateTime: segment.leaveDate, leaveDateTime: segment.goBackDate};
                    arrivalCityCodes.push(arrivalInfo.id);
                    destinations.push(destination);
                    if(i == (destinationPlacesInfo.length - 1)){//目的地存放最后一个目的地
                        tripApprove.arrivalCityCode = arrivalInfo.id;
                        tripApprove.arrivalCity = arrivalInfo.name;
                    }
                }

                //处理其他数据
                if(i == 0){
                    tripApprove.startAt = segment.leaveDate;
                }
                if(i == (destinationPlacesInfo.length - 1)){
                    tripApprove.backAt = segment.goBackDate;
                }
            }
        }

        if(approveUser) {
            let approveUserObj = await Models.staff.get(approveUser);
            if(!approveUserObj)
                throw {code: -3, msg: '审批人不存在'}
            tripApprove.approveUserId = approveUserObj.id;
        }

        tripApprove.isSpecialApprove = approve.isSpecialApprove;
        tripApprove.specialApproveRemark = approve.specialApproveRemark;
        tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
        tripApprove.accountId = submitter;
        tripApprove.companyId = company.id;
        // tripApprove.title = project.name;
        // tripApprove.projectId = project.id;//TODO  费用归集

        tripApprove.query = query;
        tripApprove.arrivalCityCodes = arrivalCityCodes;
        tripApprove.destinations = destinations;

        tripApprove.budgetInfo = budgets;
        tripApprove.budget = totalBudget;
        tripApprove.oldBudget = totalBudget;
        tripApprove.status = totalBudget < 0 ? QMEApproveStatus.NO_BUDGET : QMEApproveStatus.WAIT_APPROVE;
        tripApprove.staffList = approve.staffList;
        return tripApprove;

    }

    static async getDetailsFromApprove(params: {approveId: string}): Promise<TripDetail[]> {
        // let approve = await TripApproveModule.getTripApprove({id: params.approveId});

        let approve: ITripApprove = await TripApproveModule.retrieveDetailFromApprove({approveNo: params.approveId});
        // let approve = await Models.approve.get(params.approveId);
        let account = await Models.staff.get(approve.accountId);

        let budgets = approve.budgetInfo;
        return budgets.map(function (budget:{
            tripType: number, price: number, originPlace: Place, destination: Place, leaveDate: Date,
            cabinClass: number, cityName: string, hotelName: string, checkInDate: Date, checkOutDate: Date,
            fromDate: Date, endDate: Date, hasFirstDaySubsidy: boolean, hasLastDaySubsidy: boolean
        }) {
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
        let tripApprove = await TripApproveModule.getTripApprove({id: params.approveId});
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


    static async sendTripApproveNotice(params: {approveId: string, nextApprove?: boolean, approveUserId?: string, version?: number}) {
        let tripApprove: ITripApprove = await TripApproveModule.retrieveDetailFromApprove({approveNo: params.approveId});
        let staff = await Models.staff.get(tripApprove.accountId);

        let company = staff.company;

        //#@template
        let approve_url: string;
        let appMessageUrl: string;
        let version = params.version || config.link_version || 2  //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
        if (version == 2) {
            appMessageUrl = `#/trip-approval/approve-detail/${tripApprove.id}/1`
            approve_url = `${config.v2_host}/${appMessageUrl}` //参数为tripApproveId和titleId；
        } else {
            approve_url = `${config.host}/index.html#/trip-approval/detail?approveId=${tripApprove.id}`;
            let finalUrl = `#/trip-approval/detail?approveId=${tripApprove.id}`;
            finalUrl = encodeURIComponent(finalUrl);
            appMessageUrl = `#/judge-permission/index?id=${tripApprove.id}&modelName=tripApprove&finalUrl=${finalUrl}`;
        }

        let shortUrl = approve_url;
        try {
            shortUrl = await API.wechat.shorturl({longurl: approve_url});
        } catch(err) {
            console.warn(`转换短链接失败`, err);
        }

        if(company.isApproveOpen) {
            //给审核人发审核邮件
            // let approveUser = await Models.staff.get(tripApprove['approveUserId']);
            let approveUserId = params.approveUserId || tripApprove.approveUserId;

            try {
                await API.notify.submitNotify({
                    key: 'qm_notify_new_travelbudget',
                    userId: approveUserId,
                    values: {tripApprove: tripApprove, detailUrl: shortUrl, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPLY_NOTICE}
                });
            } catch(err) {
                console.error('发送通知失败', err.stack ? err.stack : err);
            }

            try {
                await API.ddtalk.sendLinkMsg({accountId: approveUserId, text: '有新的出差申请需要您审批', url: shortUrl})
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

        let approve = await Models.approve.get(params.approveId);
        let company = await Models.company.get(approve.companyId);

        let tripApprove = await TripApproveModule.retrieveDetailFromApprove({approveNo: params.approveId});
        // let tripApprove = await Models.tripApprove.get(params.approveId);
        // let staff = tripApprove.account;
        // let company = staff.company;

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
    @requireParams(['id', 'approveResult', 'isNextApprove'], ['approveRemark', "budgetId", 'nextApproveUserId', "version"])
    // @modelNotNull('tripApprove')
    static async approveTripPlan(params: {
        isNextApprove: boolean, id: string, approveResult: number, budgetId?: string,
        nextApproveUserId?: string, approveRemark?: string, version?: number
    }): Promise<boolean> {
        let isNextApprove = params.isNextApprove;
        let staff = await Staff.getCurrent();
        let tripApprove = await TripApproveModule.getTripApprove({id: params.id});
        let approveResult = params.approveResult;
        let budgetId = params.budgetId;
        let approveUser = await Models.staff.get(tripApprove.approveUserId);
        let approveCompany = approveUser.company;


        if(isNextApprove && !params.nextApproveUserId)
            throw new Error("审批人不能为空");

        if (!tripApprove.isSpecialApprove && !budgetId){
            // throw new Error(`预算信息已失效请重新生成`);   审批时预算拉取失败，使用提交时的预算数据
        }else if(approveResult != EApproveResult.PASS && approveResult != EApproveResult.REJECT) {
            throw L.ERR.PERMISSION_DENY(); //只能审批待审批的出差记录
        }else if(tripApprove.status != QMEApproveStatus.WAIT_APPROVE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR(); //只能审批待审批的出差记录
        }else if(approveUser.id != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        let budgetInfo: any;
        let number = 0;
        /*if(tripApprove.isSpecialApprove){
            number = 1;
        }*/

        //审批时预算拉取失败，使用提交时的预算数据
        if(!tripApprove.isSpecialApprove && budgetId){
            budgetInfo = await API.client.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.accountId});
            
            if (!budgetInfo || !budgetInfo.budgets)
                throw new Error(`预算信息已失效请重新生成`);
            let finalBudget = 0;
            budgetInfo.budgets.forEach((v: any) => {
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
            }else{
                budgetInfo = null;
            }
        }

        await DB.transaction(async function(t){
            // 特殊审批和非当月提交的审批不记录行程点数
            if(!tripApprove.isSpecialApprove){
                if(typeof tripApprove.query == 'string'){
                    tripApprove.query = JSON.parse(tripApprove.query);
                }
                let query = tripApprove.query;
                let frozenNum = query.frozenNum;
                let content = "";
                let destinationPlacesInfo = query.destinationPlacesInfo;

                if(query && query.originPlace){
                    let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
                    content = content + originCity.name + "-";
                }
                if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
                    for(let i = 0; i < destinationPlacesInfo.length; i++){
                        let segment: ISegment = destinationPlacesInfo[i]
                        let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                        if(i<destinationPlacesInfo.length-1){
                            content = content + destinationCity.name+"-";
                        }else{
                            content = content + destinationCity.name;
                        }
                    }
                }
                if(typeof(tripApprove.createdAt) == 'string'){
                    tripApprove.createdAt = new Date(tripApprove.createdAt);
                }

                if(tripApprove.createdAt.getMonth() == new Date().getMonth()){
                    //审批本月记录审批通过
                    if(approveResult == EApproveResult.PASS && !isNextApprove){
                        await approveCompany.beforeApproveTrip({number : frozenNum});
                        await approveCompany.approvePassReduceTripPlanNum({accountId: tripApprove.accountId, tripPlanId: tripApprove.id,
                            remark: "审批通过消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                    }
                    //审批本月记录审批驳回
                    if(approveResult == EApproveResult.REJECT){
                        await approveCompany.approveRejectFreeTripPlanNum({accountId: tripApprove.accountId, tripPlanId: tripApprove.id,
                            remark: "审批驳回释放冻结行程点数", content: content, frozenNum: frozenNum});
                    }
                }else{
                    //审批上月记录审批通过
                    if(approveResult == EApproveResult.PASS && !isNextApprove){
                        await approveCompany.beforeApproveTrip({number : frozenNum});
                        await approveCompany.approvePassReduceBeforeNum({accountId: tripApprove.accountId, tripPlanId: tripApprove.id,
                            remark: "审批通过上月申请消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                    }

                    //审批上月记录审批驳回
                    if(approveResult == EApproveResult.REJECT){
                        await approveCompany.approveRejectFreeBeforeNum({accountId: tripApprove.accountId, tripPlanId: tripApprove.id,
                            remark: "审批驳回上月申请释放冻结行程点数", content: content, frozenNum: frozenNum});
                    }
                }
            }

            let log = TripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id});

            if (approveResult == EApproveResult.PASS && !isNextApprove) {
                log.approveStatus = EApproveResult.PASS;
                log.remark = `审批通过`;
                await log.save();
                tripApprove.status = QMEApproveStatus.PASS;
                tripApprove.approveRemark = '审批通过';
                tripApprove.approvedUsers += `,${staff.id}`;
                //tripPlan = await TripPlanModule.saveTripPlanByApprove({tripApproveId: params.id});
            }else if(isNextApprove){ //指定下一级审批人
                log.approveStatus = EApproveResult.PASS;
                await log.save();
                let nextApproveUser = await Models.staff.get(params.nextApproveUserId);
                tripApprove.approvedUsers += `,${staff.id}`;
                tripApprove.approveUserId = nextApproveUser.id;
            }else if(approveResult == EApproveResult.REJECT) {
                let approveRemark = params.approveRemark;
                if(!approveRemark) {
                    throw {code: -2, msg: '拒绝原因不能为空'};
                }
                log.approveStatus = EApproveResult.REJECT;
                log.remark = approveRemark;
                await log.save();
                tripApprove.readNumber = 0;
                tripApprove.approveRemark = approveRemark;
                tripApprove.status = QMEApproveStatus.REJECT;
            }
            await TripApproveModule.updateTripApprove(tripApprove);

            //发送通知给监听程序
            await plugins.qm.tripApproveUpdateNotify(null, {
                approveNo: tripApprove.id,
                status: tripApprove.status,
                approveUser: staff.id,
                outerId: tripApprove.id,
                data: budgetInfo,
                oa: 'qm',
                budget: tripApprove.budget,
                version: params.version
            });

        }).catch(async function(err){
            if(err) {
                await approveCompany.reload();
                throw L.ERR.INTERNAL_ERROR();
            }
        });


        if(isNextApprove){
            //#@template
            await TripApproveModule.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: true, version: params.version});
        }else if(approveResult == EApproveResult.REJECT){
            //发送审核结果邮件
//             let self_url;
//             let appMessageUrl;
//             self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + tripApprove.id;
//             let finalUrl = '#/trip-approval/detail?approveId=' + tripApprove.id;
//             finalUrl = encodeURIComponent(finalUrl);
//             appMessageUrl = `#/judge-permission/index?id=${tripApprove.id}&modelName=tripApprove&finalUrl=${finalUrl}`;
//             let user = await Models.staff.get(tripApprove.accountId);

            let self_url: string;
            let appMessageUrl: string;
            let version = params.version || config.link_version || 2 //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
            if (version == 2) {
                appMessageUrl = `#/trip-approval/approve-detail/${tripApprove.id}/1`
                self_url = `${config.v2_host}/${appMessageUrl}`
            } else {
                self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + tripApprove.id;
                let finalUrl = '#/trip-approval/detail?approveId=' + tripApprove.id;
                finalUrl = encodeURIComponent(finalUrl);
                appMessageUrl = `#/judge-permission/index?id=${tripApprove.id}&modelName=tripApprove&finalUrl=${finalUrl}`;
            }
            let user = await Models.staff.get(tripApprove['accountId']);

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


        return true;
    }

    /* 第三方审批结果处理
    * @param params
    * @returns {boolean}
    */
    @clientExport
    @requireParams(['id', 'approveResult'], ['reason', 'isAutoApprove'])
    static async oaApproveTripPlan(params: {
        id: string, approveResult: number, isAutoApprove?: boolean, reason?: string
    }): Promise<boolean> {
        console.info("oaApproveTripPlan begin=====================");
        let approve = await Models.approve.get(params.id);
        let isAutoApprove = params.isAutoApprove;
        let extraStr = isAutoApprove ? '自动' : '';
        let approveResult = params.approveResult;
        let approveUser = await Models.staff.get(approve.approveUser);
        let approveCompany = approveUser.company;
        if(approveResult == 1){
            approveResult = EApproveResult.PASS;
        }else{
            approveResult = EApproveResult.REJECT;
        }

        if(typeof approve.data == 'string'){
            approve.data = JSON.parse(approve.data);
        }
        let budgetInfo: {budgets: ITravelBudgetInfo[], query: ICreateBudgetAndApproveParams} = approve.data;
        let {budgets, query} = budgetInfo;
        let number = 0;

        if(!approve.isSpecialApprove){
            budgets.forEach((v) => {
                if(v.tripType != ETripType.SUBSIDY){
                    number = number + 1;
                }
            });
        }

        await DB.transaction(async function(t){
            // 特殊审批和非当月提交的审批不记录行程点数
            if(!approve.isSpecialApprove){
                if(typeof query == 'string'){
                    query = JSON.parse(query);
                }
                let frozenNum = query.frozenNum;
                let content = "";
                let destinationPlacesInfo = query.destinationPlacesInfo;

                if(query && query.originPlace){
                    let originCity = await API.place.getCityInfo({cityCode: query.originPlace, companyId: approveCompany.id});
                    content = content + originCity.name + "-";
                }
                if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
                    for(let i = 0; i < destinationPlacesInfo.length; i++){
                        let segment: ISegment = destinationPlacesInfo[i]
                        let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace, companyId: approveCompany.id});
                        if(i<destinationPlacesInfo.length-1){
                            content = content + destinationCity.name+"-";
                        }else{
                            content = content + destinationCity.name;
                        }
                    }
                }

                if(approve.createdAt.getMonth() == new Date().getMonth()){
                    //审批本月记录审批通过
                    if(approveResult == EApproveResult.PASS){
                        await approveCompany.beforeApproveTrip({number : frozenNum});
                        await approveCompany.approvePassReduceTripPlanNum({accountId: approve.submitter, tripPlanId: approve.id,
                            remark: extraStr+"审批通过消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                    }
                    //审批本月记录审批驳回
                    if(approveResult == EApproveResult.REJECT){
                        await approveCompany.approveRejectFreeTripPlanNum({accountId: approve.submitter, tripPlanId: approve.id,
                            remark: extraStr+"审批驳回释放冻结行程点数", content: content, frozenNum: frozenNum});
                    }
                }else{
                    //审批上月记录审批通过
                    if(approveResult == EApproveResult.PASS){
                        await approveCompany.beforeApproveTrip({number : frozenNum});
                        await approveCompany.approvePassReduceBeforeNum({accountId: approve.submitter, tripPlanId: approve.id,
                            remark: extraStr+"审批通过上月申请消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                    }

                    //审批上月记录审批驳回
                    if(approveResult == EApproveResult.REJECT){
                        await approveCompany.approveRejectFreeBeforeNum({accountId: approve.submitter, tripPlanId: approve.id,
                            remark: extraStr+"审批驳回上月申请释放冻结行程点数", content: content, frozenNum: frozenNum});
                    }
                }
            }

            let notifyRemark = '';
            let log = TripPlanLog.create({tripPlanId: approve.id, userId: approve.approveUser});

            if (approveResult == EApproveResult.PASS) {
                log.approveStatus = EApproveResult.PASS;
                if(isAutoApprove) log.approveStatus = EApproveResult.AUTO_APPROVE;
                log.remark = extraStr+`审批通过`;
                await log.save();
                approve.status = EApproveStatus.SUCCESS;
                approve.approveRemark = '审批通过';
            }else if(approveResult == EApproveResult.REJECT) {
                let reason = params.reason;
                notifyRemark = extraStr+`审批未通过，原因：${reason}`;
                log.approveStatus = EApproveResult.REJECT;
                log.remark = notifyRemark;
                await log.save();
                approve.status = EApproveStatus.FAIL;
                approve.approveRemark = notifyRemark;
            }
            approve.approveDateTime = new Date();
            await approve.save();

            if (approve.type == EApproveType.TRAVEL_BUDGET && approve.status == EApproveStatus.SUCCESS) {
                await API.tripPlan.saveTripPlanByApprove({tripApproveId: approve.id})
            }

            if(approveResult == EApproveResult.REJECT){
                //发送审核结果邮件
                let self_url;
                let appMessageUrl;
                self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + approve.id;
                let finalUrl = '#/trip-approval/detail?approveId=' + approve.id;
                finalUrl = encodeURIComponent(finalUrl);
                appMessageUrl = `#/judge-permission/index?id=${approve.id}&modelName=tripApprove&finalUrl=${finalUrl}`;
                let user = await Models.staff.get(approve.submitter);
                try {
                    self_url = await API.wechat.shorturl({longurl: self_url});
                } catch(err) {
                    console.error(err);
                }
                try {
                    await API.notify.submitNotify({userId: user.id, key: 'qm_notify_approve_not_pass',
                        values: { tripApprove: approve, detailUrl: self_url, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPROVE_NOTICE}});
                } catch(err) { console.error(err);}
            }

        }).catch(async function(err){
            if(err) {
                await approveCompany.reload();
                throw L.ERR.INTERNAL_ERROR();
            }
        });
        console.info("oaApproveTripPlan end==================");
        return true;
    }

    /* 审批通过并转给下一个人
    * @param params
    * @returns {boolean}
    */
    @clientExport
    @requireParams(['id', 'approveUserId', 'nextApproveUserId'])
    static async nextApprove(params: {
        id: string, approveUserId: string, nextApproveUserId: string
    }): Promise<boolean> {
        console.info("nextApprove begin============");
        let approveUser = await Models.staff.get(params.approveUserId);
        let nextApproveUser = await Models.staff.get(params.nextApproveUserId);
        let log = TripPlanLog.create({tripPlanId: params.id, userId: params.approveUserId});

        log.approveStatus = EApproveResult.PASS;
        log.remark = `${approveUser.name}审批通过并转给${nextApproveUser.name}`;
        await log.save();

        await TripApproveModule.sendTripApproveNotice({approveId: params.id, nextApprove: true, approveUserId: params.nextApproveUserId});
        console.info("nextApprove end============");
        return true;
    }



    /**
     * 撤销tripApprove
     * @param params
     * @returns {boolean}
     */
    /*@clientExport
    @requireParams(['id'],['remark'])
    static async cancelTripApprove(params: {id: string, remark?: string}): Promise<boolean> {
        let tripApprove = await TripApproveModule.getTripApprove({id: params.id});
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
        if(!frozenNum){
            frozenNum = { extraFrozen: 0, limitFrozen: 0 };
        }

        let content = "";
        let destinationPlacesInfo = query.destinationPlacesInfo;

        if(query && query.originPlace){
            let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
            content = content + originCity.name + "-";
        }
        if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let segment: ISegment = destinationPlacesInfo[i]
                let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                if(i<destinationPlacesInfo.length-1){
                    content = content + destinationCity.name+"-";
                }else{
                    content = content + destinationCity.name;
                }
            }
        }

        if(tripApprove.createdAt.getMonth() == new Date().getMonth()){
            await company.approveRejectFreeTripPlanNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                remark: "审批前撤销行程释放冻结行程点数", content: content, frozenNum: frozenNum});
        }else{
            await company.approveRejectFreeBeforeNum({accountId: tripApprove.account.id, tripPlanId: tripApprove.id,
                remark: "审批前撤销上月行程释放冻结行程点数", content: content, frozenNum: frozenNum});

        }

        return true;
    }*/

    @clientExport
    @requireParams(['id'],['cancelRemark'])
    static async oaCancelTripApprove(params: {id: string, cancelRemark?: string}): Promise<boolean> {
        console.info( "oaCancelTripApprove begin==============");
        let tripApprove = await Models.approve.get(params.id);
        let staff = await Models.staff.get(tripApprove.submitter);
        let company = staff.company;
        await DB.transaction(async function(t){
            let log = Models.tripPlanLog.create({tripPlanId: params.id, userId: staff.id, remark: `撤销行程审批单`});
            await log.save();

            if(typeof tripApprove.data == "string"){
                tripApprove.data = JSON.parse(tripApprove.data);
            }
            let budgetInfo: {budgets: ITravelBudgetInfo[], query: ICreateBudgetAndApproveParams} = tripApprove.data;
            let {query} = budgetInfo;
            if (typeof query == 'string') {
                query = JSON.parse(query);
            }
            let frozenNum = query.frozenNum;
            console.info(frozenNum);
            if(!frozenNum){
                frozenNum = { extraFrozen: 0, limitFrozen: 0 };
            }

            let content = "";
            let destinationPlacesInfo = query.destinationPlacesInfo;

            if(query && query.originPlace){
                let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
                content = content + originCity.name + "-";
            }
            if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
                for(let i = 0; i < destinationPlacesInfo.length; i++){
                    let segment: ISegment = destinationPlacesInfo[i]
                    let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                    if(i<destinationPlacesInfo.length-1){
                        content = content + destinationCity.name+"-";
                    }else{
                        content = content + destinationCity.name;
                    }
                }
            }

            if(tripApprove.createdAt.getMonth() == new Date().getMonth()){
                await company.approveRejectFreeTripPlanNum({accountId: staff.id, tripPlanId: tripApprove.id,
                    remark: "审批前撤销行程释放冻结行程点数", content: content, frozenNum: frozenNum});
            }else{
                await company.approveRejectFreeBeforeNum({accountId: staff.id, tripPlanId: tripApprove.id,
                    remark: "审批前撤销上月行程释放冻结行程点数", content: content, frozenNum: frozenNum});

            }
        }).catch(async function(err){
            if(err) {
                await company.reload();
                throw L.ERR.INTERNAL_ERROR();
            }
        });
        console.info( "oaCancelTripApprove end==============");

        return true;
    }

    static async calculateAutoApproveTime( params: {
        type: AutoApproveType,
        config: AutoApproveConfig,
        submitAt:Date,
        tripStartAt:Date
    }):Promise<Date> {
        let {type, config, submitAt, tripStartAt} = params;
        if(typeof(config) == 'string') {
            config = JSON.parse(config)
        }
        config = <AutoApproveConfig>config;
        let autoApproveDateTime: Date;
        let expectedApproveTime: Date;
        let interval = 0;
        let day = config.day ? config.day : 0;
        let hour = config.hour;
        let defaultDelay:number = config.defaultDelay;
        if(!config.defaultDelay && config.defaultDelay != 0){
            defaultDelay = 1;
        }
        let isConfigured: boolean = true;
        //config.hour为null的情况
        if(!config.hour && config.hour != 0){
            isConfigured = false;
        }
        switch(type) {
            case AutoApproveType.AfterSubmit:  // 审批提交时间
                if(isConfigured){
                    expectedApproveTime = moment(submitAt).add(day, 'days').hour(hour).minute(0).toDate();
                } else {
                    expectedApproveTime = moment(submitAt).add(day, 'days').add(defaultDelay, 'hours').toDate();
                }
                interval = moment(tripStartAt).diff(expectedApproveTime, 'hours');
                if(interval > 0 ) {
                    autoApproveDateTime = expectedApproveTime;
                } else {
                    autoApproveDateTime = moment(submitAt).add(1, 'hours').toDate();
                }

                break;
            default:           //出行时间
                if(isConfigured){
                    expectedApproveTime = moment(tripStartAt).subtract(day, 'days').hour(hour).minute(0).toDate();
                } else {
                    expectedApproveTime = moment(tripStartAt).subtract(day, 'days').add(defaultDelay, 'hours').toDate();
                }
                interval = moment(expectedApproveTime).diff(submitAt, 'hours');
                if(interval > 0){
                    autoApproveDateTime = expectedApproveTime;
                } else {
                    autoApproveDateTime = moment(submitAt).add(1, 'hours').toDate();
                }
        }
        return autoApproveDateTime;
    }

    @clientExport
    @requireParams(['id'])
    static async getTripApprove(params: {id: string}): Promise<ITripApprove> {
        if(!params.id) return null;

        let approve = await Models.approve.get(params.id);

        // if(typeof approve.data == "string"){
        //     approve.data = JSON.parse(approve.data);
        // }
        // let budgetInfo: {budgets: any[], query: ICreateBudgetAndApproveParams} = approve.data;
        // let {budgets, query} = budgetInfo;
        //=====end 当budgetInfo可以获取到时，以上代码可以删除
        let companyId = params['companyId'] || approve.companyId;
        if(!companyId || typeof companyId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            companyId = currentStaff["companyId"];
        }

        let tripApprove = await API.eventListener.sendRequestToApprove({
            modelName: 'tripApprove',
            methodName:'getTripApprove',
            data: params,
            companyId: companyId
        });
        if(!tripApprove) return null;

        //=====begin 当budgetInfo可以获取到时，以下代码可以删除
        // if(tripApprove.budgetInfo && typeof tripApprove.budgetInfo == 'string') {
        //     tripApprove.budgetInfo = JSON.parse(tripApprove.budgetInfo);
        // }
        // if(tripApprove.query && typeof tripApprove.query == 'string') {
        //     tripApprove.query = JSON.parse(tripApprove.query);
        // }
        // if(!tripApprove.budgetInfo || (tripApprove.budgetInfo && tripApprove.budgetInfo.length == 0))
        //     tripApprove.budgetInfo = budgets;
        // tripApprove.query = query;

        return tripApprove;
    }

    @clientExport
    static async updateTripApprove(params: any): Promise<ITripApprove> {
        let companyId = params['companyId'];
        if(!companyId || typeof companyId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            companyId = currentStaff["companyId"];
        }
        //=====begin 当budgetInfo可以获取到时，以下代码可以删除
        // if(params.budgetInfo)
        //     delete params.budgetInfo;
        //=====end 当budgetInfo可以获取到时，以上代码可以删除

        let tripApprove = await API.eventListener.sendRequestToApprove({
            modelName: 'tripApprove',
            methodName:'updateTripApprove',
            data: params,
            companyId: companyId
        });
        return tripApprove;
    }

    @clientExport
    static async getTripApproves(params: any): Promise<ITripApprove[]> {
        let companyId = params['companyId'];
        if(!companyId || typeof companyId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            companyId = currentStaff["companyId"];
        }

        let tripApprove = await API.eventListener.sendRequestToApprove({
            modelName: 'tripApprove',
            methodName:'getTripApproves',
            data: params,
            companyId: companyId
        });
        return tripApprove;
    }

    @requireParams(['id'])
    static async deleteTripApprove(params: {id: string}): Promise<boolean> {
        let companyId = params['companyId'];
        if(!companyId || typeof companyId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            companyId = currentStaff["companyId"];
        }

        let tripApprove = await API.eventListener.sendRequestToApprove({
            modelName: 'tripApprove',
            methodName:'deleteTripApprove',
            data: params,
            companyId: companyId
        });
        return tripApprove;
    }
}


