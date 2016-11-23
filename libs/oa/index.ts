/**
 * Created by wlh on 2016/11/10.
 */

'use strict';

import {emitter, OAEmitter} from './emitter';
import {QmPlugin, IOAPlugin} from './plugin';
import {AutoPlugin} from "./plugin/auto";
// import {DDTalkPlugin} from "./plugin/ddtalk/index";

export const EVENT = {
    // NEW_TRAVEL_BUDGET: 'NEW_TRAVEL_BUDGET',
    NEW_TRIP_APPROVE: 'NEW_TRIP_APPROVE',
    NEW_TRIP_INVOICE_AUDIT: 'NEW_TRIP_INVOICE_AUDIT',
    TRIP_APPROVE_UPDATE: 'TRIP_APPROVE_UPDATE',
    TRIP_INVOICE_AUDIT_UPDATE: 'TRIP_INVOICE_AUDIT_UPDATE',
}

let plugins = {
    auto: new AutoPlugin(),
    qm: new QmPlugin(),
    // ddtalk: new DDTalkPlugin(),
}

//新出差审批事件
emitter.on(EVENT.NEW_TRIP_APPROVE, function(params) {
    // console.info('接收到消息,新的申请到达===>', params);
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
emitter.on(EVENT.NEW_TRIP_INVOICE_AUDIT, function(err, params) {
    let oa = params.oa;
    if (!oa) {
        oa = 'qm';
    }
    let plugin: IOAPlugin = plugins[oa];
    if (plugin) {
        return plugin.$createTripInvoiceAuditFlow(params);
    }
});

export {emitter, OAEmitter}
export {plugins}