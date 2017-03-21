/**
 * Created by wlh on 2016/12/13.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalTicket} from "_types/travelbudget";

class DirectArrivePrefer extends AbstractPrefer<IFinalTicket> {


    private baseScore: number;
    private rate: number;

    constructor(name, options) {
        super(name, options);
        this.baseScore = options.baseScore || 20000;
        this.rate = options.rate || 1.05;
    }

    async markScoreProcess(data:IFinalTicket[]):Promise<IFinalTicket[]> {
        let self = this;
        data = data.map( (v) => {
            if (!v.score) {
                v.score = 0;
            }
            if (!v.reasons) {
                v.reasons = [];
            }

            if (v.segs && v.segs.length) {
                let l = v.segs.length || 1;
                let score = self.baseScore * ( 1- Math.pow((l - 1), self.rate));
                v.score += score;
                v.reasons.push(`需经过${l-1}次中转: ${score}`);
            }
            return v;
        })
        return data;
    }
}

export= DirectArrivePrefer;