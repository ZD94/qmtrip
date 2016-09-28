/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import _ = require("lodash");
var defaultTicketPrefer = require('./default-ticket-prefer.json');
var defaultHotelPrefer = require('./default-hotel-prefer.json');

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
        console.log(`. BEGIN ${this.name}`);
        let ret = await this.markScoreProcess(data);
        console.log(`. END ${this.name}`);
        return ret;
    }
}

export function loadDefaultPrefer(qs: any, type?: string) {
    let defaultPrefer;
    if (type && type == 'hotel') {
        defaultPrefer = defaultHotelPrefer;
    } else {
        defaultPrefer = defaultTicketPrefer;
    }
    let _prefers = JSON.stringify(defaultPrefer);
    let _compiled = _.template(_prefers);
    return JSON.parse(_compiled(qs));
}

export var hotelPrefers = {
    starMatch: require('./hotel-starMatch'),
    blackList: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    maxPriceLimit: require('./hotel-maxPriceLimit'),
    price: require('./hotel-price'),
    priceRange: require('./hotel-priceRange')
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
    permitOnlySupplier: require('./ticket-permitOnlySupplier'),
    priorSupplier: require('./ticket-priorSupplier')
}