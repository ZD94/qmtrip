/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalTicket} from "../../_types/travelbudget";

export interface IPrefer {
    markScore(tickets: IFinalTicket[]): Promise<IFinalTicket[]>;
}

export abstract class AbstractPrefer implements IPrefer {
    constructor(public name: string, options: any) {
        if (options) {
            for(let k in options) {
                this[k] = options[k];
            }
        }
    }
    abstract async markScoreProcess(tickets: IFinalTicket[]) : Promise<IFinalTicket[]>;
    async markScore(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        console.log(`. BEGIN ${this.name}`);
        let ret = await this.markScoreProcess(tickets);
        console.log(`. END ${this.name}`);
        return ret;
    }
}

export var ticketPrefer = {
    lowestprice: require('./ticket-lowestprice'),
    maxpricelimit: require('./ticket-maxpricelimit'),
    selecttraffic: require('./ticket-selecttraffic'),
    priceprefer: require('./ticket-priceprefer'),
    preferagent: require('./ticket-preferagent'),
    preferaircompany: require('./ticket-preferaircompany')
};

export var hotelPrefer = {
    lowestprice: require('./hotel-lowestprice'),
    blacklist: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    starmatch: require('./hotel-starmatch'),
    maxpricelimit: require('./hotel-maxpricelimit')
}


export var ticketPrefers = {
    arrivalTime: require('./ticket-arrivaltime'),
    cheapSupplier: require('./ticket-cheapsupplier'),
    selectTraffic: require('./ticket-selecttraffic'),
    cabin: require('./ticket-cabin'),
    departTime: require('./ticket-departtime')
}