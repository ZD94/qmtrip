/**
 * Created by wlh on 2016/12/13.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalTicket} from "../../_types/travelbudget";

class DirectArrivePrefer extends AbstractPrefer<IFinalTicket> {


    private deductScorePerStop: number;

    constructor(name, options) {
        super(name, options);
        this.deductScorePerStop = options.deductScorePerStop;
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

            if (v.stops && v.stops.length) {
                let l = v.stops.length;
                v.score -= l * this.deductScorePerStop;
                v.reasons.push(`需经过${v.stops.join('、')}中转`);
            }
            return v;
        })
        return data;
    }
}

export= DirectArrivePrefer;