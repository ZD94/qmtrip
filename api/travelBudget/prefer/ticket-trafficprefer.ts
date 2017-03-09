/**
 * Created by wlh on 16/9/2.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

class TrafficPrefer extends AbstractPrefer<IFinalTicket> {

    private score: number;
    private expectTraffic: string;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets: IFinalTicket[]) :Promise<IFinalTicket[]> {
        let self = this;
        if (!self.expectTraffic) return tickets;
        let _expectTraffic = self.expectTraffic == 'train' ? TRAFFIC.TRAIN : TRAFFIC.FLIGHT;
        tickets = tickets.map ( (v)=> {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            
            if (v.type == _expectTraffic) {
                v.score += self.score;
                v.reasons.push(`符合期望交通方式:${self.score}`);
            }
            return v;
        })
        return tickets;
    }
}

export= TrafficPrefer