/**
 * Created by wlh on 2016/11/17.
 */

'use strict';
import {clientExport, requireParams} from "../../common/api/helper";
import {Approve} from "../_types/approve/index";
import {Staff} from "../_types/staff/staff";
import {Models} from "../_types/index";
import {emitter, EVENT} from "libs/oa";
import {EApproveStatus, EApproveChannel, EApproveType} from "../_types/approve/types";
import {TripPlan} from "../_types/tripPlan/tripPlan";
import TripPlanModule = require("../tripPlan/index");
var API = require("common/api");

class ApproveModule {

    @clientExport
    @requireParams(["budgetId"], ["approveUser", "project"])
    static async submitApprove(params: {budgetId: string, project?: string, approveUser?: string}) :Promise<Approve>{
        let {budgetId, project} = params;
        let submitter = await Staff.getCurrent();

        //获取预算详情
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: submitter.id});
        let approve = Models.approve.create({submitter: submitter.id, data: budgetInfo, channel: submitter.company.oa, title: project});
        approve = await approve.save();

        let oas = {
        }
        oas[EApproveChannel.QM] = 'qm';
        oas[EApproveChannel.AUTO] = 'auto';
        oas[EApproveChannel.DING_TALK] = 'ddtalk';

        //对接第三方OA
        emitter.emit(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: submitter.id,
            submitter: submitter.id,
            status: EApproveStatus.WAIT_APPROVE,
            oa: oas[submitter.company.oa] || 'qm'
        });
        return approve;
    }
}

//监听审批单变化
emitter.on(EVENT.TRIP_APPROVE_UPDATE, function(result) {
    let p = (async function(){
        let {approveNo, submitter, outerId, status, approveUser, data} = result;
        let approve = await Models.approve.get(approveNo);
        if (approve.status == status) {
            return;
        }

        approve.status = status;
        approve.approveUser = approveUser;
        approve.approveDateTime = new Date();
        approve.outerId = outerId;
        if (data) {
            approve.data = data;
        }
        approve = await approve.save();

        //预算审批完成
        if (approve.type == EApproveType.TRAVEL_BUDGET && approve.status == EApproveStatus.SUCCESS) {
            await API.tripPlan.saveTripPlanByApprove({tripApproveId: approve.id})
        }
    })();

    //捕获事件中错误
    p.catch((err) => {
        console.error(err.stack);
    });
})

export= ApproveModule;