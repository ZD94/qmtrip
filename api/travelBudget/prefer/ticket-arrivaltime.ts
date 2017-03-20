/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

class ArrivalTimePrefer extends AbstractPrefer<IFinalTicket> {

    private begin: Date;
    private end: Date;
    private score: number;

    constructor(public name: string, options: any) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }
    async markScoreProcess(tickets: IFinalTicket[]) : Promise<IFinalTicket[]> {
        let self = this;
        let d1 = this.begin;
        let d2 = this.end;
        if (d1 && typeof d1 == 'string') {
            d1 = new Date(d1 as string);
        }
        if (d2 && typeof d2 == 'string') {
            d2 = new Date(d2 as string);
        }

        tickets = tickets.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v.reasons) v['reasons'] = [];
            let d = new Date(v.arrivalDateTime).valueOf();
            if (d1) {
                let _d1 = d1.valueOf();
                if (_d1 - d > 0) {
                    v['score'] += self.score;
                    v.reasons.push(`到达时间早于规定时间 ${self.score}`)
                    return v;
                }
            }

            if (d2) {
                let _d2 = d2.valueOf();
                if (d - _d2 > 0) {
                    v['score'] += self.score;
                    v.reasons.push(`到达时间晚于规定时间 ${self.score}`)
                    return v;
                }
            }
            return v;
        })
        return tickets;
    }
}

export= ArrivalTimePrefer;