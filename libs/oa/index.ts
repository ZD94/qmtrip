/**
 * Created by wlh on 2016/11/10.
 */

'use strict';

import {emitter, OAEmitter} from './emitter';
import {QmPlugin, IOAPlugin} from './plugin';
import {AutoPlugin} from "./plugin/auto";
// import {DDTalkPlugin} from "./plugin/ddtalk/index";

export const EVENT = {
    NEW_TRAVEL_BUDGET: 'NEW_TRAVEL_BUDGET',
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

export function __initHttpApp(app) {
    app.post('/oa/notify', function(req, res, next) {
        let {oa, method} = req.query;
        let data: any = req.body;
        let key = data.key;
        delete data.key;
        //校验OA与系统通信的KEY
        if (!key || key != 'jingli2016') {
            res.send(403);
            return;
        }

        if (!oa)  {
            oa = 'qm';
        }
        //仅支持这两个回调
        let availableFns = ['tripApproveUpdateNotify', 'tripInvoiceUpdateNotify'];
        if (availableFns.indexOf(method) < 0) {
            res.send(403);
            return;
        }
        let fn = plugins[oa][method];
        if ( fn && typeof fn == 'function') {
            console.info('OA返回的数据===>', data)
            fn.bind(plugins[oa])(null, data);
        }
        res.send('success');
    });
}

function regPluginCallback() {
    for(let key in plugins) {
        let plugin: IOAPlugin= plugins[key];
        //出差预算审核状态变动后通知
        plugin.$regTripApproveUpdateCb((err, result) => {
            emitter.emit(EVENT.TRIP_APPROVE_UPDATE, result);
        })
        //票据审核状态变动后通知
        plugin.$regTripInvoiceAuditUpdateCb( (err, result) => {
            emitter.emit(EVENT.TRIP_INVOICE_AUDIT_UPDATE, result);
        })
    }
}
//注册回调函数
regPluginCallback();


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