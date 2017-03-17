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
import {ETripType, TripApprove, QMEApproveStatus, EApproveResult, Project} from "api/_types/tripPlan/tripPlan";
import _ = require('lodash');
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
        let destinationPlacesInfo = query.destinationPlacesInfo;
        let totalBudget = 0;
        budgets.forEach((b) => {totalBudget += Number(b.price);});
        /*budgets = budgets.map( (v) => {
            if (v.type == ETripType.HOTEL) {
                v.placeName = budgetInfo.query.hotelName;
            }
            return v;
        });*/

        let projectIds = [];//事由名称
        let arrivalCityCodes = [];//目的地代码
        let project: Project;

        if(query.originPlace) {
            let deptInfo = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace}) || {name: null};
            tripApprove.deptCityCode = deptInfo.id;
            tripApprove.deptCity = deptInfo.name;
        }

        tripApprove.isRoundTrip = query.isRoundTrip;
        if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let q = destinationPlacesInfo[i];
                //处理出差事由放入projectIds 原project存放第一程出差事由
                if(q.reason){
                    let projectItem = await API.tripPlan.getProjectByName({companyId: company.id, name: q.reason,
                        userId: staff.id, isCreate: true});
                    if(i == 0){
                        project = projectItem;
                    }
                    if(projectIds.indexOf(projectItem.id) == -1){
                        projectIds.push(projectItem.id);
                    }
                }

                //处理目的地 放入arrivalCityCodes 原目的地信息存放第一程目的地信息
                if(q.destinationPlace){
                    let arrivalInfo = await API.place.getCityInfo({cityCode: q.destinationPlace.id|| q.destinationPlace}) || {name: null};
                    arrivalCityCodes.push(arrivalInfo.id);
                    if(i == (destinationPlacesInfo.length - 1)){//目的地存放最后一个目的地
                        tripApprove.arrivalCityCode = arrivalInfo.id;
                        tripApprove.arrivalCity = arrivalInfo.name;
                    }
                }

                //处理其他数据
                if(i == 0){
                    tripApprove.isNeedTraffic = q.isNeedTraffic;
                    tripApprove.isNeedHotel = q.isNeedHotel;
                    
                    tripApprove.startAt = q.leaveDate;
                }
                if(i == (destinationPlacesInfo.length - 1)){
                    tripApprove.backAt = q.goBackDate;
                }
            }
        }

        // let tripApprove =  TripApprove.create(params);

        if(params.approveUser) {
            let approveUser = await Models.staff.get(params.approveUser);
            if(!approveUser)
                throw {code: -3, msg: '审批人不存在'}
            tripApprove.approveUser = approveUser;
        }
        tripApprove.isSpecialApprove = approve.isSpecialApprove;
        tripApprove.specialApproveRemark = approve.specialApproveRemark;
        tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
        tripApprove.account = staff;
        tripApprove['companyId'] = company.id;
        tripApprove.project = project;
        tripApprove.title = approve.title;

        tripApprove.query = JSON.stringify(query);
        tripApprove.projectIds = JSON.stringify(projectIds);
        tripApprove.arrivalCityCodes = JSON.stringify(arrivalCityCodes);

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
        await API.tripApprove.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        await API.tripApprove.sendTripApproveNoticeToSystem({approveId: tripApprove.id});
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