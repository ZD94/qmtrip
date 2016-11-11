/**
 * Created by wlh on 2016/11/11.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult, regTripApproveUpdateCbParam,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult, regTripInvoiceAuditUpdateCbParam
} from "./index";
import {EApproveStatus} from "api/_types/tripPlan/tripPlan";
import {EInvoiceStatus} from "api/_types/tripPlan/index";

export class AutoPlugin extends AbstractOAPlugin {
    
    constructor() {
        super();
    }
    
    async createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult> {
        let self = this;
        //生成外部ID
        let outerId = 'OA' + Date.now() + Math.ceil(Math.random() * 100);
        params['outerId'] = outerId;

        //1秒以后返回结果
        setTimeout(() => {
            params['status'] = EApproveStatus.PASS;
            params['approveUser'] = '系统';
            self.tripApproveUpdateNotify(params);
        }, 1000);

        return params as createTripApproveResult;
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        let self = this;
        let outerId = 'OA' + Date.now() + Math.ceil(Math.random() * 100);
        params['outerId'] = outerId;
        setTimeout(() => {
            params['status'] = EInvoiceStatus.AUDIT_PASS;
            params['auditUser'] = '系统';
            self.tripInvoiceUpdateNotify(params);
        }, 1000);
        return params as createTripInvoiceAuditFlowResult;
    }
}