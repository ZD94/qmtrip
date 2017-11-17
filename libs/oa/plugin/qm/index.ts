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
import {ETripType, QMEApproveStatus, EApproveResult, Project} from "_types/tripPlan/tripPlan";
import _ = require('lodash');
const L = require("@jingli/language");
import moment = require("moment");
var API = require("@jingli/dnode-api");
import {ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan"
//鲸力商旅OA对接实现
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
import {DB} from "@jingli/database";

import {IDestination, ITripApprove} from "_types/tripApprove"
import {OAAddResult} from "../../../../_types/approve/index";


export class QmPlugin extends AbstractOAPlugin {
    constructor() {
        super();
    }

    //实现qm创建审批单流程
    async createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult> {

        let {approveNo, submitter, approveUser} = params;

        let staff = await Models.staff.get(submitter);
        let company = staff.company;
        console.info(company.id, company.name, "0000000000009*****************");
        let approve = await Models.approve.get(approveNo);
        let tripApprove = await API.tripApprove.retrieveDetailFromApprove(params);

        // let budgetInfo: {budgets: any[], query: ICreateBudgetAndApproveParams} = approve.data;
        //
        // if(!budgetInfo) {
        //     throw L.ERR.TRAVEL_BUDGET_NOT_FOUND();
        // }
        // let {budgets, query} = budgetInfo;
        // let destinationPlacesInfo = query.destinationPlacesInfo;
        // let totalBudget = 0;
        // budgets.forEach((b) => {totalBudget += Number(b.price);});
        // /*budgets = budgets.map( (v) => {
        //     if (v.type == ETripType.HOTEL) {
        //         v.placeName = budgetInfo.query.hotelName;
        //     }
        //     return v;
        // });*/
        //
        // let arrivalCityCodes: string[] = [];//目的地代码
        // let destinations: IDestination[] = [];
        // let project: Project;
        // let projectName = query.projectName;
        // if(projectName){
        //     project = await API.tripPlan.getProjectByName({companyId: company.id, name: projectName,
        //         userId: staff.id, isCreate: true});
        // }
        // let tripApprove: any = {};
        // tripApprove.id = approveNo;
        // tripApprove.approveUserId = approveUser;
        // // let tripApprove = await Models.tripApprove.create({approveUserId: approveUser, id: approveNo});
        // if(query.originPlace) {
        //     let placeCode = query.originPlace;
        //     if (typeof placeCode != 'string') {
        //         placeCode = placeCode['id']
        //     }
        //     let deptInfo = await API.place.getCityInfo({cityCode: placeCode}) || {name: null};
        //     tripApprove.deptCityCode = deptInfo.id;
        //     tripApprove.deptCity = deptInfo.name;
        // }
        //
        // tripApprove.isRoundTrip = query.isRoundTrip;
        // if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
        //     for(let i = 0; i < destinationPlacesInfo.length; i++){
        //         let segment: ISegment = destinationPlacesInfo[i];
        //
        //         //处理目的地 放入arrivalCityCodes
        //         if(segment.destinationPlace){
        //             let placeCode = segment.destinationPlace;
        //             if (typeof placeCode != 'string') {
        //                 placeCode = placeCode['id'];
        //             }
        //             let arrivalInfo = await API.place.getCityInfo({cityCode: placeCode}) || {name: null};
        //             let destination: IDestination = {city:arrivalInfo.id, arrivalDateTime: segment.leaveDate, leaveDateTime: segment.goBackDate};
        //             arrivalCityCodes.push(arrivalInfo.id);
        //             destinations.push(destination);
        //             if(i == (destinationPlacesInfo.length - 1)){//目的地存放最后一个目的地
        //                 tripApprove.arrivalCityCode = arrivalInfo.id;
        //                 tripApprove.arrivalCity = arrivalInfo.name;
        //             }
        //         }
        //
        //         //处理其他数据
        //         if(i == 0){
        //             tripApprove.startAt = segment.leaveDate;
        //         }
        //         if(i == (destinationPlacesInfo.length - 1)){
        //             tripApprove.backAt = segment.goBackDate;
        //         }
        //     }
        // }
        //
        // if(params.approveUser) {
        //     let approveUser = await Models.staff.get(params.approveUser);
        //     if(!approveUser)
        //         throw {code: -3, msg: '审批人不存在'}
        //     tripApprove.approveUserId = approveUser.id;
        // }
        //
        // tripApprove.isSpecialApprove = approve.isSpecialApprove;
        // tripApprove.specialApproveRemark = approve.specialApproveRemark;
        // tripApprove.status = QMEApproveStatus.WAIT_APPROVE;
        // tripApprove.accountId = staff.id;
        // tripApprove['companyId'] = company.id;
        // tripApprove.title = project.name;
        // tripApprove.projectId = project.id;
        //
        // // tripApprove.query = query;
        // tripApprove.arrivalCityCodes = arrivalCityCodes;
        // tripApprove.destinations = destinations;
        //
        // // tripApprove.budgetInfo = budgets;
        // tripApprove.budget = totalBudget;
        // tripApprove.oldBudget = totalBudget;
        // tripApprove.status = totalBudget < 0 ? QMEApproveStatus.NO_BUDGET : QMEApproveStatus.WAIT_APPROVE;
        // tripApprove.staffList = approve.staffList;

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == QMEApproveStatus.WAIT_APPROVE) {
            tripApprove.autoApproveTime = await TripApproveModule.calculateAutoApproveTime({
                type: company.autoApproveType,
                config: company.autoApprovePreference,
                submitAt: new Date(),
                tripStartAt: tripApprove.startAt,
            });
        }
        if(tripApprove.query)
            delete tripApprove.query;
        if(tripApprove.budgetInfo)
            delete tripApprove.budgetInfo;
        let returnApprove = await API.eventListener.sendEventNotice({eventName: "NEW_TRIP_APPROVE", data: tripApprove, companyId: company.id});
        if(returnApprove || returnApprove == 0){
            return DB.transaction(async function(t){
                approve.oaResult = OAAddResult.SUCCESS;
                await approve.save();
                let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: staff.id, approveStatus: EApproveResult.WAIT_APPROVE, remark: '提交审批单，等待审批'});

                await tripPlanLog.save();
                // await API.tripApprove.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});//暂时注掉统一修改通知信息
                // await API.tripApprove.sendTripApproveNoticeToSystem({approveId: tripApprove.id});

            }).catch(async function(err){
                if(err){
                    throw L.ERR.INTERNAL_ERROR();
                }
            })
        }else{
            approve.oaAddResult = OAAddResult.FAILED;
            await approve.save();
        }
        return {
            approveNo: approveNo,
            outerId: tripApprove.id,
            submitter: submitter,
        } as createTripApproveResult;
    }

    async tripApproveFail(params: {approveId: string, reason?: string}) {
        let {approveId, reason} = params;
        let tripApprove: any = {};
        tripApprove.id = approveId;
        tripApprove.status = QMEApproveStatus.REJECT;
        tripApprove.approveRemark = reason || '系统自动处理';
        await API.tripApprove.updateTripApprove(tripApprove);
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}