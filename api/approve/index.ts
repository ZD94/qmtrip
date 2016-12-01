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
import Config = require('config');
var API = require("common/api");

function oaStr2Enum(str: string) :EApproveChannel{
    let obj = {
        'qm':       EApproveChannel.QM,
        'auto':     EApproveChannel.AUTO,
        'ddtalk':   EApproveChannel.DING_TALK
    }
    return obj[str];
}

function oaEnum2Str(e: EApproveChannel) {
    let obj = {}
    obj[EApproveChannel.QM] = 'qm';
    obj[EApproveChannel.AUTO] = 'auto';
    obj[EApproveChannel.DING_TALK] = 'ddtalk';
    return obj[e];
}

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

        let staff = await Models.staff.get(submitter);
        let approve = Models.approve.create({
            submitter: submitter,
            data: data,
            channel: channel,
            title: title,
            type: type,
            approveUser: approveUser,
            isSpecialApprove: isSpecialApprove,
            specialApproveRemark: specialApproveRemark,
            companyId: staff.company.id,
        });
        approve = await approve.save();

        //对接第三方OA
        emitter.emit(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: approveUser,
            submitter: submitter,
            status: EApproveStatus.WAIT_APPROVE,
            oa: oaEnum2Str(channel) || 'qm'
        });
        return approve;
    }

    @clientExport
    static async reportHimOA(params: {oaName: string, oaUrl?: string}) {
        let {oaName, oaUrl} = params;
        let staff = await Staff.getCurrent();
        try {
            let ret = await API.notify.submitNotify({
                email: Config.reportHimOAReceive,
                key: 'qm_report_him_oa',
                values: {
                    oaName: oaName,
                    oaUrl: oaUrl,
                    companyName: staff.company.name,
                    name: staff.name,
                    mobile: staff.mobile,
                },
            });
        } catch( err) {
            throw err;
        }
    }
}

//监听审批单变化
emitter.on(EVENT.TRIP_APPROVE_UPDATE, function(result) {
    let p = (async function(){
        let {approveNo, submitter, outerId, status, approveUser, data, oa} = result;
        let approve = await Models.approve.get(approveNo);
        if (approve.status == status) {
            return;
        }

        let company = await Models.company.get(approve['companyId']);
        //OA流程已经切换,旧的处理渠道不再支持
        if (company.oa != oaStr2Enum(oa)) {
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