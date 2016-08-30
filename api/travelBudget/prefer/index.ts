/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalTicket} from "../../_types/travelbudget";
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

export var hotelPrefer = {
    lowestprice: require('./hotel-lowestprice'),
    blacklist: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    starmatch: require('./hotel-starmatch'),
    maxpricelimit: require('./hotel-maxpricelimit')
}

export var hotelPrefers = {
    starMatch: require('./hotel-starmatch'),
}

export var ticketPrefers = {
    arrivalTime: require('./ticket-arrivaltime'),
    cheapSupplier: require('./ticket-cheapsupplier'),
    selectTraffic: require('./ticket-selecttraffic'),
    cabin: require('./ticket-cabin'),
    departTime: require('./ticket-departtime')
}