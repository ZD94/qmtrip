/**
 * Created by wlh on 2016/11/11.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult
} from "./index";

import { EApproveStatus } from "_types/approve";
import { EInvoiceStatus } from "_types/tripPlan/index";

export class AutoPlugin extends AbstractOAPlugin {

    constructor() {
        super();
    }

    async createTripApproveFlow(params: createTripApproveParam): Promise<createTripApproveResult> {
        let self = this;
        //生成外部ID
        let outerId = 'auto' + Date.now() + Math.ceil(Math.random() * 100);
        params['outerId'] = outerId;

        //1秒以后返回结果
        process.nextTick(function () {
            params['status'] = EApproveStatus.SUCCESS;
            params['approveUser'] = null;
            params['oa'] = 'auto';
            self.tripApproveUpdateNotify(null, params);
        });
        return params as createTripApproveResult;
    }

    async createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam): Promise<createTripInvoiceAuditFlowResult> {
        let self = this;
        let outerId = 'auto' + Date.now() + Math.ceil(Math.random() * 100);
        params['outerId'] = outerId;
        process.nextTick(function () {
            params['status'] = EInvoiceStatus.AUDIT_PASS;
            params['auditUser'] = null;
            self.tripInvoiceUpdateNotify(null, params);
        })
        return params as createTripInvoiceAuditFlowResult;
    }
}