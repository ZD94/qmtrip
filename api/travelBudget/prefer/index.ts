/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import _ = require("lodash");
import Logger = require('common/logger');
import moment = require("moment");
let defaultTicketPrefer = require('./default-ticket-prefer.json');
let defaultHotelPrefer = require('./default-hotel-prefer.json');
let defaultInternalTicketPrefer = require('./default-internal-ticket-prefer.json');
let logger = new Logger('travel-budget');
export interface IPrefer<T> {
    markScore(tickets: T[]): Promise<T[]>;
}

export abstract class AbstractPrefer<T> implements IPrefer<T> {
    constructor(public name: string, options: any) {
        if (options) {
            for(let k in options) {
                this[k] = options[k];
            }
        }
    }
    abstract async markScoreProcess(data: T[]) : Promise<T[]>;
    async markScore(data: T[]): Promise<T[]> {
        logger.info(`. BEGIN ${this.name}`);
        let ret = await this.markScoreProcess(data);
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

export function loadDefaultPrefer(qs: {local: any}, type?: DEFAULT_PREFER_CONFIG_TYPE) {
    let defaultPrefer;
    switch(type) {
        case DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_HOTEL:
            defaultPrefer = defaultHotelPrefer;
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.INTERNAL_TICKET:
            defaultPrefer = defaultInternalTicketPrefer;
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_TICKET:
            defaultPrefer = defaultTicketPrefer;
            break;
        case DEFAULT_PREFER_CONFIG_TYPE.INTERNAL_HOTEL:
            defaultPrefer = defaultHotelPrefer;
            break;
        default:
            defaultPrefer = defaultTicketPrefer;
    }
    
    let _prefers = JSON.stringify(defaultPrefer);
    let _compiled = _.template(_prefers, { 'imports': { 'moment': moment } });
    return JSON.parse(_compiled(qs));
}

export var hotelPrefers = {
    starMatch: require('./hotel-star-match'),
    blackList: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    maxPriceLimit: require('./hotel-max-price-limit'),
    price: require('./hotel-price'),
    priceRange: require('./hotel-pricerange')
}

export var ticketPrefers = {
    arrivalTime: require('./ticket-arrivaltime'),
    selectTraffic: require('./ticket-selectTrafficByTime'),
    departTime: require('./ticket-departtime'),
    trafficPrefer: require('./ticket-trafficprefer'),
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
    lowestPrice: require('./ticket-lowestprice'),
    directArrive: require('./ticket-directArrive'),
    transitWaitDuration: require('./ticket-transitWaitDurationPrefer'),
    transitCityInChina: require("./ticket-transitCityInChinaPrefer"),
}