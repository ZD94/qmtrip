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
import {Models} from "_types/index";
import {ETripType, TripApprove, QMEApproveStatus, EApproveResult, Project} from "_types/tripPlan/tripPlan";
import _ = require('lodash');
const L = require("@jingli/language");
import moment = require("moment");
var API = require("@jingli/dnode-api");
import {ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan"
//鲸力商旅OA对接实现
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');

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

        let budgetInfo: {budgets: any[], query: ICreateBudgetAndApproveParams} = approve.data;

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

        let arrivalCityCodes = [];//目的地代码
        let project: Project;
        let projectName = query.projectName;
        if(projectName){
            project = await API.tripPlan.getProjectByName({companyId: company.id, name: projectName,
                userId: staff.id, isCreate: true});
        }

        if(query.originPlace) {
            let placeCode = query.originPlace;
            if (typeof placeCode != 'string') {
                placeCode = placeCode['id']
            }
            let deptInfo = await API.place.getCityInfo({cityCode: placeCode}) || {name: null};
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
                    let arrivalInfo = await API.place.getCityInfo({cityCode: placeCode}) || {name: null};
                    arrivalCityCodes.push(arrivalInfo.id);
                    if(i == (destinationPlacesInfo.length - 1)){//目的地存放最后一个目的地
                        tripApprove.arrivalCityCode = arrivalInfo.id;
                        tripApprove.arrivalCity = arrivalInfo.name;
                    }
                }

                //处理其他数据
                if(i == 0){
                    tripApprove.isNeedTraffic = segment.isNeedTraffic;
                    tripApprove.isNeedHotel = segment.isNeedHotel;
                    
                    tripApprove.startAt = segment.leaveDate;
                }
                if(i == (destinationPlacesInfo.length - 1)){
                    tripApprove.backAt = segment.goBackDate;
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
        tripApprove.arrivalCityCodes = JSON.stringify(arrivalCityCodes);

        tripApprove.budgetInfo = budgets;
        tripApprove.budget = totalBudget;
        tripApprove.oldBudget = totalBudget;
        tripApprove.status = totalBudget < 0 ? QMEApproveStatus.NO_BUDGET : QMEApproveStatus.WAIT_APPROVE;

        tripApprove.staffList=approve.staffList;
        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, approveStatus: EApproveResult.WAIT_APPROVE, remark: '提交审批单，等待审批'});

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == QMEApproveStatus.WAIT_APPROVE) {
            tripApprove.autoApproveTime = await TripApproveModule.calculateAutoApproveTime({
                type: company.autoApproveType,
                config: company.autoApprovePreference,
                submitAt: tripApprove.createdAt,
                tripStartAt: tripApprove.startAt,
            });
        }

        await tripPlanLog.save();
        tripApprove = await tripApprove.save();
        await API.tripApprove.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
        // await API.tripApprove.sendTripApproveNoticeToSystem({approveId: tripApprove.id});
        
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