/**
 * Created by wlh on 2016/10/19.
 */

'use strict';

import _ = require('lodash');
import {Place} from 'api/_types/place';

export enum ECabin {
    PLANE_FIRST = 1,    //飞机头等舱
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

let _cabin_text: any = {};
_cabin_text[ECabin.PLANE_FIRST] = ['头等舱', 'first'];
_cabin_text[ECabin.PLANE_BUSINESS] = ['商务舱', 'business'];
_cabin_text[ECabin.PLANE_ECONOMY] = ['经济舱', 'economy'];
_cabin_text[ECabin.TRAIN_BUSINESS] = '商务座';
_cabin_text[ECabin.TRAIN_FIRST] = '一等座';
_cabin_text[ECabin.TRAIN_SECOND] = '二等座'

export function getECabinByName(name: string) {
    let cabinKey = undefined;
    for(let key of Object.keys(_cabin_text)) {
        if (_cabin_text[key].indexOf(name.toLowerCase()) >= 0) {
            cabinKey = key;
            break;
        }
    }
    return cabinKey;
}

export function getNameByECabin(key: ECabin) {
    let r = _cabin_text[key];
    if (_.isArray(r)) {
        return r[0]
    }
    return r;
}

export enum  EInvoiceFeeTypes {
    PLANE_TICKET = 1,
    TRAIN_TICKET = 2, 
    TICKET_CHANGE_FEE = 3,
    CANCEL_TICKET_FEE = 4,
    HOTEL = 5,
    INSURANCE = 6,
    EXPRESS = 7,
    ORDER_TICKET_FEE = 8,
    OTHER = 99,
}
export var InvoiceFeeTypeNames = [];
InvoiceFeeTypeNames[EInvoiceFeeTypes.PLANE_TICKET] = '机票行程单';
InvoiceFeeTypeNames[EInvoiceFeeTypes.TRAIN_TICKET] = '火车票';
InvoiceFeeTypeNames[EInvoiceFeeTypes.TICKET_CHANGE_FEE] = '改签费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.CANCEL_TICKET_FEE] = '退票费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.HOTEL] = '住宿费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.INSURANCE] = '保险费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.EXPRESS] = '快递费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.ORDER_TICKET_FEE] = '订票费';
InvoiceFeeTypeNames[EInvoiceFeeTypes.OTHER] = '其他';

export enum EPayType {
    PERSONAL_PAY = 1,
    COMPANY_PAY = 2,
}
export var PayTypeNames = [];
PayTypeNames[EPayType.PERSONAL_PAY] = '个人支付';
PayTypeNames[EPayType.COMPANY_PAY] = '公司支付';

export enum ESourceType {
    MANUALLY_ADD = 1,
    RELATE_ORDER = 2
}

export enum EInvoiceStatus {
    WAIT_AUDIT = 0,
    AUDIT_PASS = 1,
    AUDIT_FAIL = -1,
}


export interface ISegment {
    destinationPlace?: string;
    leaveDate?: Date;
    goBackDate?: Date;
    isNeedTraffic?: boolean;
    isNeedHotel?: boolean;
    businessDistrict?: any;
    hotelName?: string;
    reason?: any;
    subsidy?: any;
    latestArrivalDateTime?: Date;
    earliestGoBackDateTime?: Date;
}

export interface ICreateBudgetAndApproveParams {
    originPlace: string;
    isRoundTrip?: boolean;
    auditUser?: string;
    destinationPlacesInfo: ISegment[];
}

export * from './tripPlan'
export * from './tripDetail'
export * from './tripDetailInfo'