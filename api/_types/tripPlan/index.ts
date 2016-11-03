/**
 * Created by wlh on 2016/10/19.
 */

'use strict';

import _ = require('lodash');

export enum ECabin {
    PLANE_FIRST = 1,
    PLANE_BUSINESS = 2,
    PLANE_ECONOMY = 4,
    TRAIN_BUSINESS = 10,
    TRAIN_FIRST = 11,
    TRAIN_SECOND = 12,
    TRAIN_HARD_SEAT = 13,   //硬座
    TRAIN_SOFT_SEAT = 14, //软座
    TRAIN_SOFT_SLEEPER = 15, //软卧
    TRAIN_HARD_SLEEPER = 16,   //硬卧
}


let _cabin_text = new Map();
_cabin_text.set(ECabin.PLANE_FIRST, ['头等舱', 'first']);
_cabin_text.set(ECabin.PLANE_BUSINESS, ['商务舱', 'business']);
_cabin_text.set(ECabin.PLANE_ECONOMY, ['经济舱', 'economy']);
_cabin_text.set(ECabin.TRAIN_BUSINESS, '商务座');
_cabin_text.set(ECabin.TRAIN_FIRST, '一等座');
_cabin_text.set(ECabin.TRAIN_SECOND, '二等座');

export function getECabinByName(name: string) {
    let cabinKey = undefined;
    for(let key of _cabin_text.keys()) {
        if (_cabin_text.get(key).indexOf(name.toLowerCase()) >= 0) {
            cabinKey = key;
            break;
        }
    }
    return cabinKey;
}

export function getNameByECabin(key: ECabin) {
    let r = _cabin_text.get(key);
    if (_.isArray(r)) {
        return r[0]
    }
    return r;
}

export enum  EInvoiceFeeTypes {
    PLANET_TICKET = 1,
    TRAIN_TICKET = 2,
    CANCEL_TRAIN_TICKET = 3,
    CANCEL_PLANET_TICKET = 4
}

export enum EPayType {
    PERSONAL_PAY = 1,
    COMPANY_PAY = 2,
}

export enum ESourceType {
    MANUALLY_ADD = 1,
    RELATE_ORDER = 2
}

export enum EInvoiceStatus {
    WAIT_AUDIT = 0,
    AUDIT_PASS = 1,
    AUDIT_FAIL = -1,
}

export * from './tripPlan'
export * from './tripDetail'
export * from './tripDetailInfo'