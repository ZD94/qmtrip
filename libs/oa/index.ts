/**
 * Created by wlh on 2016/11/10.
 */

'use strict';

const AsyncEmitter = require('carrack');
import {QmPlugin, IOAPlugin, createTripApproveParam, createTripInvoiceAuditFlowParam} from './plugin';
import {AutoPlugin} from "./plugin/auto";
import {EApproveType} from "../../_types/approve/types";
// import {DDTalkPlugin} from "./plugin/ddtalk/index";

export const EVENT = {
    // NEW_TRAVEL_BUDGET: 'NEW_TRAVEL_BUDGET',
    NEW_TRIP_APPROVE: 'NEW_TRIP_APPROVE',
    NEW_TRIP_INVOICE_AUDIT: 'NEW_TRIP_INVOICE_AUDIT',
    TRIP_APPROVE_UPDATE: 'TRIP_APPROVE_UPDATE',
    TRIP_INVOICE_AUDIT_UPDATE: 'TRIP_INVOICE_AUDIT_UPDATE',
    APPROVE_FAIL: 'APPROVE_FAIL',
}

export let plugins: { [key: string]: any} = {
    auto: new AutoPlugin(),
    qm: new QmPlugin(),
    // ddtalk: new DDTalkPlugin(),
}

export var emitter = new AsyncEmitter();

//新出差审批事件
emitter.on(EVENT.NEW_TRIP_APPROVE, function(params: createTripApproveParam) {
    let oa = params.oa;
    if (!oa) {
        oa = 'qm';
    }
    let plugin: IOAPlugin = plugins[oa];
    if (plugin) {
        return plugin.$createTripApproveFlow(params);
    }
});

//新的票据审批申请事件
emitter.on(EVENT.NEW_TRIP_INVOICE_AUDIT, function(err: any, params: createTripInvoiceAuditFlowParam) {
    let oa = params.oa;
    if (!oa) {
        oa = 'qm';
    }
    let plugin: IOAPlugin = plugins[oa];
    if (plugin) {
        return plugin.$createTripInvoiceAuditFlow(params);
    }
});

//接收审批强制结束事件
emitter.on(EVENT.APPROVE_FAIL, function(params: {approveId: string, oa: string, type: EApproveType, reason?: string}) {
    let {oa, approveId, type, reason} = params;
    if (!oa) {
        oa = 'qm';
    }
    let plugin: IOAPlugin = plugins[oa];
    console.info(plugin);
    if (type == EApproveType.TRAVEL_BUDGET) {
        return plugin.tripApproveFail({approveId, reason});
    }
})
