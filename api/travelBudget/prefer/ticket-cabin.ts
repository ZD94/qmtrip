/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";
import {TRAFFIC} from "api/_types/travelbudget";
/* * * * * * * * *
 * 仓位信息打分
 * * * * * * * * */

class CabinPrefer extends AbstractPrefer<IFinalTicket> {

    private expectTrainCabins;
    private expectFlightCabins;
    private score;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!this.expectTrainCabins) {
            this.expectTrainCabins = [];
        }
        if (!this.expectFlightCabins) {
            this.expectFlightCabins = [];
        }
        if (typeof this.expectFlightCabins == 'string') {
            this.expectFlightCabins = this.expectFlightCabins.split(/,/);
            this.expectFlightCabins = this.expectFlightCabins.map( (v) => {
                if (typeof v == 'string') {
                    v = parseInt(v);
                }
                return v;
            })
        }
        if (typeof this.expectTrainCabins == 'string') {
            this.expectTrainCabins = this.expectTrainCabins.split(/,/);
            this.expectTrainCabins = this.expectTrainCabins.map( (v)=> {
                if (typeof v == 'string') {
                    v= parseInt(v);
                }
                return v;
            })
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        let self = this;
        tickets = tickets.map( (v) => {
            if (!v['score']) v['score']=0;
            if (!v.reasons) v.reasons = [];
            if (v.type == TRAFFIC.FLIGHT) {
                if (this.expectFlightCabins.indexOf(parseInt(v.cabin)) >= 0) {
                    v['score'] += self.score;
                    v.reasons.push(`座次符合规定: ${self.score}`)
                }
            } else if (v.type == TRAFFIC.TRAIN) {
                if (this.expectTrainCabins.indexOf(parseInt(v.cabin)) >= 0) {
                    v['score'] += self.score;
                    v.reasons.push(`座次符合规定: ${self.score}`)
                }
            }
            return v;
        });
        return tickets;
    }
}

export= CabinPrefer