/**
 * Created by wyl on 16/9/20.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";

class DepartStandardTimePrefer extends AbstractPrefer<IFinalTicket> {

    private begin: Date;
    private end: Date;
    private score: number;
    private scoreInterval: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!this.scoreInterval) {
            this.scoreInterval = 0;
        }
    }

    async markScoreProcess(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let d1 = this.begin;
        let self = this;
        if (d1 && typeof d1 == 'string') {
            d1 = new Date(d1 as string);
        }
        let d2 = this.end;
        if (d2 && typeof d2 == 'string') {
            d2 = new Date(d2 as string);
        }
        let score = this.score;

        tickets = tickets.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v['reasons']) v['reasons'] = [];
            let d = new Date(v.departDateTime).valueOf();
            let _d1 = d1.valueOf();
            let _d2 = d2.valueOf();
            const oneMinute = 1000 * 60;
            if (_d1 - d > 0) {
                let cutScore = self.scoreInterval * Math.ceil((_d1 - d)/oneMinute);
                v['score'] += cutScore;
                v['reasons'].push(`出发时间早于出发基准时间 ${cutScore}`)
            }else if (d - _d2> 0) {
                let cutScore = self.scoreInterval * Math.ceil((d - _d2)/oneMinute);
                v['score'] += cutScore;
                v['reasons'].push(`出发时间晚于出发基准时间 ${cutScore}`)
            }else{
                v['score'] += score;
                v['reasons'].push(`出发时间符合出发基准时间 ${score}`)
            }
            return v;
        })
        return tickets;
    }
}

export= DepartStandardTimePrefer;