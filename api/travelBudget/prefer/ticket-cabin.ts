/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";
/* * * * * * * * *
 * 仓位信息打分
 * * * * * * * * */

class CabinPrefer extends AbstractPrefer<IFinalTicket> {

    private expectCabins;
    private score;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!this.expectCabins) {
            this.expectCabins = [];
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        let self = this;
        tickets = tickets.map( (v) => {
            if (!v['score']) v['score']=0;
            if (!v.reasons) v.reasons = [];
            if (this.expectCabins.indexOf(v.cabin) >= 0) {
                v['score'] += self.score;
                v.reasons.push(`座次符合规定: ${self.score}`)
            }
            return v;
        });
        return tickets;
    }
}

export= CabinPrefer