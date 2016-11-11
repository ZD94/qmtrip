/**
 * Created by wlh on 2016/11/11.
 */

'use strict';
import {
    AbstractOAPlugin, createTripApproveParam, createTripApproveResult, regTripApproveUpdateCbParam,
    createTripInvoiceAuditFlowParam, createTripInvoiceAuditFlowResult, regTripInvoiceAuditUpdateCbParam
} from "../index";

export class DDTalkPlugin extends AbstractOAPlugin {
    constructor() {
        super();
    }

    async createTripApproveFlow(params:createTripApproveParam):Promise<createTripApproveResult> {
        return null;
    }

    async createTripInvoiceAuditFlow(params:createTripInvoiceAuditFlowParam):Promise<createTripInvoiceAuditFlowResult> {
        return null;
    }
}