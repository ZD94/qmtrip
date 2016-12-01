/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult,
} from "../index";

import TripPlanModule = require("api/tripPlan/index");
import TripApproveModule = require("api/tripApprove/index");
import {Models} from "api/_types/index";
import {ETripType, TripApprove, QMEApproveStatus, EApproveResult} from "api/_types/tripPlan/tripPlan";
const L = require("common/language");
import moment = require("moment");
var API = require("common/api");

//鲸力商旅OA对接实现
export class QmPlugin extends AbstractOAPlugin {
    constructor() {
        super();
    }

    //实现qm创建审批单流程
    async createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult> {
        let {approveNo, submitter, approveUser} = params;
        let tripApprove = await Models.tripApprove.create({approveUserId: approveUser, id: approveNo});
        let staff = await Models.staff.get(submitter);
        let company = staff.company;
        let approve = await Models.approve.get(approveNo);

        let budgetInfo = approve.data;

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

        let project = await API.tripPlan.getProjectByName({companyId: company.id, name: approve.title, userId: staff.id, isCreate: true});
        // let tripApprove =  TripApprove.create(params);

        // if(params.approveUserId) {
        //     let approveUser = await Models.staff.get(params.approveUserId);
        //     if(!approveUser)
        //         throw {code: -3, msg: '审批人不存在'}
        //     tripApprove.approveUser = approveUser;
        // }
        tripApprove.isSpecialApprove = approve.isSpecialApprove;
        tripApprove.specialApproveRemark = approve.specialApproveRemark;
        tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
        tripApprove.account = staff;
        tripApprove['companyId'] = company.id;
        tripApprove.project = project;
        tripApprove.title = approve.title;
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
        await tripPlanLog.save();
        tripApprove = await tripApprove.save();
        return {
            approveNo: approveNo,
            outerId: tripApprove.id,
            submitter: submitter,
        } as createTripApproveResult;
    }

    async tripApproveFail(params: {approveId: string, reason?: string}) {
        let {approveId, reason} = params;
        let tripApprove = await Models.tripApprove.get(approveId);
        tripApprove.status = QMEApproveStatus.REJECT;
        tripApprove.approveRemark = reason || '系统自动处理';
        await tripApprove.save();
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}