/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {emitter} from "..";
import {EVENT} from "../index";

export interface createTripApproveParam {
    [key: string]: any;
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
    (err: any, params: any): any;
}

export interface createTripInvoiceAuditFlowParam {
    [key: string]: any;
    tripPlanId: string; //行程单ID
}

export interface createTripInvoiceAuditFlowResult {
    tripPlanId: string;
    outerId?: string;
}

export interface regTripInvoiceAuditUpdateCbParam {
    (err: any, params: any): any;
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

    async tripApproveUpdateNotify(err: any, result: any) {
        if (err) {
            return emitter.emitSerial(EVENT.TRIP_APPROVE_UPDATE, err);
        }
        return emitter.emitSerial(EVENT.TRIP_APPROVE_UPDATE, result);
    }

    async tripInvoiceUpdateNotify(err: any, result: any) {
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