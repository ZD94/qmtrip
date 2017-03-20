/**
 * Created by wyl on 16/9/19.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";


class RunningTimePrefer extends AbstractPrefer<IFinalTicket> {
    private trainScore: number;
    private planeScore: number;
    private trainScoreInterval: number;
    private planeScoreInterval: number;

    constructor(name, options) {
        super(name, options);
        if (!this.trainScore) {
            this.trainScore = 250;
        }

        if (!this.planeScore) {
            this.planeScore = 500;
        }
        if (!this.trainScoreInterval) {
            this.trainScoreInterval = 5;
        }
        if (!this.planeScoreInterval) {
            this.planeScoreInterval = 5;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;
        //分离火车,飞机预算
        let trains: IFinalTicket[] = [];
        let flights: IFinalTicket[] = [];
        tickets.forEach( (v) => {
            if (v.type == TRAFFIC.TRAIN) {
                trains.push(v);
            }else{
                flights.push(v);
            }
        });
        if (trains.length){
            trains.sort( function(v1, v2) {
                return v1.duration - v2.duration;
            });
        }
        if (flights.length){
            flights.sort( function(v1, v2) {
                return v1.duration - v2.duration;
            });
        }
        tickets = tickets.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            if (v.type == TRAFFIC.TRAIN) {
                var addScore = self.trainScore - (v.duration - trains[0].duration)*self.trainScoreInterval;
                v.score += addScore;
                v.reasons.push(`火车运行时长 ${addScore}`)
            }else{
                var addScore = self.planeScore - (v.duration - flights[0].duration)*self.planeScoreInterval;
                v.score += addScore;
                v.reasons.push(`飞机运行时长 ${addScore}`)
            }
            return v;
        })
        return tickets;
    }
}

export= RunningTimePrefer