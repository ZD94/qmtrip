/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult,
} from "../index";

import TripPlanModule = require("api/tripPlan/index");
import TripApproveModule = require("../../../../api/tripApprove/index");


//鲸力商旅OA对接实现
export class QmPlugin extends AbstractOAPlugin {
    constructor() {
        super();
    }

    //实现qm创建审批单流程
    async createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult> {
        let {approveNo} = params;
        await TripApproveModule.sendTripApproveNotice({approveId: approveNo, nextApprove: false});
        await TripApproveModule.sendTripApproveNoticeToSystem({approveId: approveNo});
        return;
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}