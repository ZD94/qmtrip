/**
 * Created by wyl on 16/9/20.
 */

'use strict';
import {IFinalTicket} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

class EarliestGoBackTimePrefer extends AbstractPrefer<IFinalTicket> {

    private earliestGoBackTime: Date;
    private score: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let d1 = this.earliestGoBackTime;

        if (!d1)    //如果没有设置条件直接跳过打分
            return tickets;

        if (d1 && typeof d1 == 'string') {
            d1 = new Date(d1 as string);
        }

        let score = this.score;

        tickets = tickets.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v['reasons']) v['reasons'] = [];
            let d = new Date(v.departDateTime).valueOf();
            if (d1) {
                let _d1 = d1.valueOf();
                if (d - _d1 > 0) {
                    v['score'] += score;
                    v['reasons'].push(`回程出发时间符合出行条件 ${score}`)
                }
            }
            return v;
        })
        return tickets;
    }
}

export= EarliestGoBackTimePrefer;