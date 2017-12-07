/**
 * Created by wlh on 2016/11/10.
 */


'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult,
} from "../index";

import TripPlanModule = require("api/tripPlan/index");
import TripApproveModule from "api/tripApprove/index";
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

        let {approveNo, submitter, approveUser, version} = params;

        let staff = await Models.staff.get(submitter);
        let company = staff.company;
        console.info(company.id, company.name, "0000000000009*****************");
        let approve = await Models.approve.get(approveNo);
        let tripApprove = await API.tripApprove.retrieveDetailFromApprove(params);

        //如果出差计划是待审批状态，增加自动审批时间
        if(tripApprove.status == QMEApproveStatus.WAIT_APPROVE) {
            tripApprove.autoApproveTime = await TripApproveModule.calculateAutoApproveTime({
                type: company.autoApproveType,
                config: company.autoApprovePreference,
                submitAt: new Date(),
                tripStartAt: tripApprove.startAt,
            });
        }

        if(tripApprove.budgetInfo)
            delete tripApprove.budgetInfo;
        let returnApprove = await API.eventListener.sendEventNotice({eventName: "NEW_TRIP_APPROVE", data: tripApprove, companyId: company.id});
        if(returnApprove || returnApprove == 0){
            return DB.transaction(async function(t){
                approve.oaAddResult = OAAddResult.SUCCESS;
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
        let approve = await Models.approve.get(approveId);
        let tripApprove: any = {};
        tripApprove.id = approveId;
        tripApprove.status = QMEApproveStatus.REJECT;
        tripApprove.approveRemark = reason || '系统自动处理';
        let result = await API.eventListener.sendEventNotice({eventName: "APPROVE_FAIL", data: tripApprove, companyId: approve.companyId});//数据库增加该事件注册
        if(result){
            let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripApprove.id, userId: approve.submitter, approveStatus: EApproveResult.REJECT, remark: tripApprove.approveRemark});
            await tripPlanLog.save();
        }
        // await API.tripApprove.updateTripApprove(tripApprove);
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}