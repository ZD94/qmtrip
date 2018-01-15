/**
 * Created by wlh on 2016/11/11.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult
} from "../index";

export class DDTalkPlugin extends AbstractOAPlugin {
    constructor() {
        super();
    }

    async createTripApproveFlow(params: createTripApproveParam): Promise<createTripApproveResult> {
        return null;
    }

    async createTripInvoiceAuditFlow(params: createTripInvoiceAuditFlowParam): Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}