/**
 * Created by wlh on 2016/11/17.
 */

'use strict';
import {clientExport, requireParams} from "../../common/api/helper";
import {Approve} from "../_types/approve/index";
import {Staff} from "../_types/staff/staff";
import {Models} from "../_types/index";
import {emitter, EVENT} from "libs/oa";
import {EApproveStatus} from "../_types/approve/types";
var API = require("common/api");

class ApproveModule {

    @clientExport
    @requireParams(["budgetId"], ["approveUser"])
    static async submitApprove(params: {budgetId: string}) :Promise<Approve>{
        let {budgetId } = params;
        let submitter = await Staff.getCurrent();

        //获取预算详情
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: submitter.id});
        let approve = Models.approve.create({submitter: submitter.id, data: budgetInfo});
        approve = await approve.save();

        //对接第三方OA
        emitter.emit(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: submitter.id,
            submitter: submitter.id,
            status: EApproveStatus.WAIT_APPROVE,
        });
        return approve;
    }
}

export= ApproveModule;