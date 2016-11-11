/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {EPlanStatus, EApproveStatus} from 'api/_types/tripPlan/tripPlan';

export interface createTripApproveParam {
    budgetNo: string;  //预算单号
    submitter: string;      //员工ID
}

export interface createTripApproveResult {
    budgetNo: string;      //预算单号
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
    $regTripApproveUpdateCb(params: regTripApproveUpdateCbParam);
    $createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult>;
    $regTripInvoiceAuditUpdateCb(params: regTripInvoiceAuditUpdateCbParam);
}

export abstract class AbstractOAPlugin implements IOAPlugin {
    tripApproveUpdateListeners;
    tripInvoiceAuditUpdateListeners;

    constructor() {
        this.tripApproveUpdateListeners = [];
        this.tripInvoiceAuditUpdateListeners = [];
    }

    $createTripApproveFlow(params: createTripApproveParam): Promise<createTripApproveResult> {
        return this.createTripApproveFlow(params);
    }

    $regTripApproveUpdateCb(fn: regTripApproveUpdateCbParam) {
        this.tripApproveUpdateListeners.push(fn);
    }

    $createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam) :Promise<createTripInvoiceAuditFlowResult> {
        return this.createTripInvoiceAuditFlow(params);
    }

    $regTripInvoiceAuditUpdateCb(fn: regTripInvoiceAuditUpdateCbParam){
        this.tripInvoiceAuditUpdateListeners.push(fn);
    }

    async tripApproveUpdateNotify(result) {
        this.tripApproveUpdateListeners.forEach( (fn) => {
            if (fn && typeof fn == 'function') {
                fn(null, result);
            }
        })
    }

    async tripInvoiceUpdateNotify(result) {
        this.tripInvoiceAuditUpdateListeners.forEach( (fn) => {
            if (fn && typeof fn == 'function') {
                fn (null, result);
            }
        })
    }

    abstract createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult>;
    abstract createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult>;
}

export * from './qm';