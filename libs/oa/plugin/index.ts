/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {emitter} from "..";
import {EVENT} from "../index";
import {ICreateBudgetAndApproveParams} from "_types/tripPlan"

export interface IDestination{
    city: string;
    arrivalDateTime: Date;
    leaveDateTime: Date;
}
export interface ITripApprove {
    id: string;
    deptCityCode: string;//出发城市ID 对应接口文档from
    deptCity?: string;//出发城市名称（接口文档中没有）
    title?: string;//projectName;
    projectId?: string;//projectName;
    reason?: string;//出差原因
    destinations: IDestination[];//目的地数组
    accountId: string;//提交人ID
    staffList: string[];//出差人ID数组 对应文档staffs
    isRoundTrip: boolean;//是否往返
    arrivalCityCode: string;//返程返回城市   对应文档backCity
    arrivalCity?: string;//返程返回城市名称（接口文档中没有）
    backAt: Date;//返回时间 对应文档的backDateTime
    budgetId: string;//预算ID
    budget: number;//预算金额
    approveUserId?: string;//审批人
    createdAt: Date;//创建时间
    status: number;//状态 1.审批完成 0. 待审批 -1.审批失败 -2已撤销
    startAt: Date;//开始时间（文档中没有）
    autoApproveTime?: Date;//自动审批通过时间（文档中没有）
    isSpecialApprove?: boolean;//是否为自动审批（文档中没有）
    specialApproveRemark?: string;//特殊审批备注（文档中没有）
    // query?: ICreateBudgetAndApproveParams;//查询参数（文档中没有）
    arrivalCityCodes?: string[];//目的地ID数组（文档中没有）
    // budgetInfo?: any[];//目的地ID数组（文档中没有）
    oldBudget?: number;//审批时保存生成预算是预算金额（文档中没有）
}

export interface createTripApproveParam {
    approveNo: string;  //审核单号
    submitter: string;      //员工ID
    approveUser?: string;    //审核人ID
}

export interface createTripApproveResult {
    approveNo: string;      //预算单号
    submitter: string;        //提交人
    outerId?: string;       //第三方ID
}

export interface regTripApproveUpdateCbParam {
    (err, params): any;
}

export interface createTripInvoiceAuditFlowParam {
    tripPlanId: string; //行程单ID
}

export interface createTripInvoiceAuditFlowResult {
    tripPlanId: string;
    outerId?: string;
}

export interface regTripInvoiceAuditUpdateCbParam {
    (err, params): any;
}

export interface IOAPlugin {
    $createTripApproveFlow(params: createTripApproveParam): Promise<createTripApproveResult>;
    $createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult>;
    tripApproveFail(params: {approveId: string, reason: string}): Promise<void>;
}

export abstract class AbstractOAPlugin implements IOAPlugin {
    constructor() {
    }

    $createTripApproveFlow(params: createTripApproveParam): Promise<createTripApproveResult> {
        return this.createTripApproveFlow(params);
    }

    $createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam) :Promise<createTripInvoiceAuditFlowResult> {
        return this.createTripInvoiceAuditFlow(params);
    }

    async tripApproveUpdateNotify(err, result) {
        if (err) {
            return emitter.emitSerial(EVENT.TRIP_APPROVE_UPDATE, err);
        }
        return emitter.emitSerial(EVENT.TRIP_APPROVE_UPDATE, result);
    }

    async tripInvoiceUpdateNotify(err, result) {
        if (err) {
            return emitter.emitSerial(EVENT.TRIP_INVOICE_AUDIT_UPDATE, err);
        }
        return emitter.emitSerial(EVENT.TRIP_INVOICE_AUDIT_UPDATE, result);
    }

    async tripApproveFail(params: {approveId: string, reason?: string}) {
    }
    
    abstract createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult>;
    abstract createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult>;
}

export * from './qm';