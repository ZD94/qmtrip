/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import _ = require("lodash");
import Logger from '@jingli/logger';
import moment = require("moment");
let logger = new Logger('travel-budget');
import {RemarkCondition} from "../_interface";
export interface IPrefer<T> {
    markScore(tickets: T[],remarkCondition?:RemarkCondition): Promise<T[]>;
}

export abstract class AbstractPrefer<T> implements IPrefer<T> {
    constructor(public name: string, options: any) {
        if (options) {
            for(let k in options) {
                this[k] = options[k];
            }
        }
    }
    abstract async markScoreProcess(data: T[],remarkConditon?:RemarkCondition) : Promise<T[]>;
    async markScore(data: T[],remarkCondition?:RemarkCondition): Promise<T[]> {
        logger.info(`. BEGIN ${this.name}`);
        let ret = await this.markScoreProcess(data,remarkCondition);
        logger.info(`. END ${this.name}`);
        return ret;
    }
}

export enum DEFAULT_PREFER_CONFIG_TYPE  {
    INTERNAL_TICKET = 1,
    INTERNAL_HOTEL = 2,
    DOMESTIC_TICKET = 3,
    DOMESTIC_HOTEL = 4,
}

const sysDefaultPrefer = require("./default-prefer/sys-prefer.json");
const companyDefaultPrefer = require("./default-prefer/default-company-prefer.json");

export function loadPrefers(prefers: any[], qs: {local: any}, type?: DEFAULT_PREFER_CONFIG_TYPE) {
    let allPrefers;
    let sysPrefers;
    switch(type) {
        case DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_HOTEL:
            sysPrefers = _.cloneDeep(sysDefaultPrefer.domesticHotel);
            if (!prefers || !prefers.length) {
                prefers = _.cloneDeep(companyDefaultPrefer.domesticHotel);
            }
            allPrefers = mergePrefers(sysPrefers, prefers);
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.INTERNAL_TICKET:
            sysPrefers = _.cloneDeep(sysDefaultPrefer.abroadTraffic);
            if (!prefers || !prefers.length) {
                prefers = _.cloneDeep(companyDefaultPrefer.abroadTraffic);
            }
            allPrefers = mergePrefers(sysPrefers, prefers);
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_TICKET:
            sysPrefers = _.cloneDeep(sysDefaultPrefer.domesticTraffic);
            if (!prefers || !prefers.length) {
                prefers = _.cloneDeep(companyDefaultPrefer.domesticTraffic);
            }
            allPrefers = mergePrefers(sysPrefers, prefers);
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.INTERNAL_HOTEL:
            sysPrefers = _.cloneDeep(sysDefaultPrefer.abroadHotel);
            if (!prefers || !prefers.length) {
                prefers = _.cloneDeep(companyDefaultPrefer.abroadHotel);
            }
            allPrefers = mergePrefers(sysPrefers, prefers);
            break;
    }
    let _prefers = JSON.stringify(allPrefers);
    let _compiled = _.template(_prefers, { 'imports': { 'moment': moment } });
    return JSON.parse(_compiled(qs));
}

function mergePrefers(prefers: any[], newPrefers: any[]) {
    let allPrefers = _.cloneDeep(prefers);
    if (!newPrefers) {
        newPrefers = [];
    }
    newPrefers.forEach( (prefer) => {
        allPrefers.push(prefer);
    });
    return allPrefers;
}


export var hotelPrefers = {
    starMatch: require('./hotel-star-match'),
    blackList: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    price: require('./hotel-price'),
    priceRange: require('./hotel-pricerange'),
    distance:require('./hotel-distance'),
    commentScore:require("./hotel-commentScore")
    
}

export var ticketPrefers = {
    arrivalTime: require('./ticket-arrivaltime'),
    departTime: require('./ticket-departtime'),
    cheapSupplier: require('./ticket-cheapsupplier'),
    cabin: require('./ticket-cabin'),
    runningTimePrefer: require('./ticket-runningTimePrefer'),
    departStandardTimePrefer: require('./ticket-departStandardTimePrefer'),
    arriveStandardTimePrefer: require('./ticket-arriveStandardTimePrefer'),
    trainDurationPrefer: require('./ticket-trainDurationPrefer'),
    latestArrivalTimePrefer: require('./ticket-latestArrivalTimePrefer'),
    earliestGoBackTimePrefer: require('./ticket-earliestGoBackTimePrefer'),
    trainPricePrefer: require('./ticket-trainPricePrefer'),
    planePricePrefer: require('./ticket-planePricePrefer'),
    planeNumberPrefer: require('./ticket-planeNumberPrefer'),
    permitOnlySupplier: require('./ticket-permitOnlySupplier'),
    priorSupplier: require('./ticket-priorSupplier'),
    directArrive: require('./ticket-directArrive'),
    transitWaitDuration: require('./ticket-transitWaitDurationPrefer'),
    transitCityInChina: require("./ticket-transitCityInChinaPrefer"),
}