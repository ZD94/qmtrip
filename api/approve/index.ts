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
import {TripPlan, ETripType} from "../_types/tripPlan/tripPlan";
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
        return ApproveModule._submitApprove({
            submitter: submitter.id,
            data: budgetInfo,
            title: project,
            channel: submitter.company.oa,
            type: EApproveType.TRAVEL_BUDGET,
        });
    }

    @clientExport
    @requireParams(['query', 'budget'], ['project', 'specialApproveRemark'])
    static async submitSpecialApprove(params: {query: any, budget: number, project?: string, specialApproveRemark?: string}):Promise<Approve> {
        let {query, budget, project, specialApproveRemark} = params;
        let submitter = await Staff.getCurrent();
        let budgetInfo = {
            query: query,
            budgets: [
                {
                    startAt: query.leaveDate,
                    backAt: query.goBackDate,
                    price: budget,
                    tripType: ETripType.SPECIAL_APPROVE,
                    reason: specialApproveRemark,
                }
            ]
        }
        return ApproveModule._submitApprove({
            submitter: submitter.id,
            data: budgetInfo,
            title: project,
            channel: submitter.company.oa,
            type: EApproveType.TRAVEL_BUDGET,
            isSpecialApprove: true,
            specialApproveRemark: specialApproveRemark,
        });
    }

    static async _submitApprove(params: {
        submitter: string,
        data?: any,
        approveUser?: string,
        title?: string,
        channel?: EApproveChannel,
        type?: EApproveType,
        isSpecialApprove?: boolean,
        specialApproveRemark?: string,
    }) {
        let {submitter, data, approveUser, title, channel, type, isSpecialApprove, specialApproveRemark } = params;

        let approve = Models.approve.create({
            submitter: submitter,
            data: data,
            channel: channel,
            title: title,
            type: type,
            approveUser: approveUser,
            isSpecialApprove: isSpecialApprove,
            specialApproveRemark: specialApproveRemark,
        });
        approve = await approve.save();

        let oas = {
        }
        oas[EApproveChannel.QM] = 'qm';
        oas[EApproveChannel.AUTO] = 'auto';
        oas[EApproveChannel.DING_TALK] = 'ddtalk';

        //对接第三方OA
        emitter.emit(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: submitter,
            submitter: submitter,
            status: EApproveStatus.WAIT_APPROVE,
            oa: oas[channel] || 'qm'
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