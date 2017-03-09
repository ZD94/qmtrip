/**
 * Created by wyl on 16/9/20.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

const TRAIN_DURATION = 6 * 60;

class TrainDurationPrefer extends AbstractPrefer<IFinalTicket> {
    private trainDuration: number;
    private score: number;

    constructor(name, options) {
        super(name, options);
        if (!this.trainDuration) {
            this.trainDuration = TRAIN_DURATION;
        }
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;
        tickets = tickets.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            if (v.type == TRAFFIC.TRAIN) {
                if (v.duration <= self.trainDuration) {
                    v.score += self.score;
                    v.reasons.push(`符合火车时长${self.score}`);
                }
            }
            return v;
        })
        return tickets;
    }
}

export= TrainDurationPrefer