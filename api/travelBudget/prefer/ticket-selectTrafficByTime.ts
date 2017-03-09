/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

const ONLY_TRAIN_DURATION = 3.5 * 60;
const ONLY_FLIGHT_DURATION = 6 * 60;

class SelectTrafficByTimePrefer extends AbstractPrefer<IFinalTicket> {
    private selectTrainDuration: number;
    private selectFlightDuration: number;
    private score: number;
    private commonTrainScore: number;

    constructor(name, options) {
        super(name, options);
        if (!this.selectTrainDuration) {
            this.selectTrainDuration = ONLY_TRAIN_DURATION;
        }

        if (!this.selectFlightDuration) {
            this.selectFlightDuration = ONLY_FLIGHT_DURATION;
        }
        if (!this.score) {
            this.score = 0;
        }
        if (!this.commonTrainScore) {
            this.commonTrainScore = 0;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        let self = this;
        //分离火车,飞机预算
        let trains: IFinalTicket[] = [];
        let highTrains: IFinalTicket[] = [];
        let trains2: IFinalTicket[] = [];
        let trains3: IFinalTicket[] = [];
        let flights: IFinalTicket[] = [];
        tickets.forEach( (v) => {
            if (v.type == TRAFFIC.TRAIN && /^[gc]/i.test(v.No)) {
                highTrains.push(v);
                return;
            }
            if (v.type == TRAFFIC.TRAIN && /^[d]/i.test(v.No)) {
                trains2.push(v);
                return;
            }
            if (v.type == TRAFFIC.TRAIN) {
                trains3.push(v);
            }
            flights.push(v);
        });
        if (highTrains.length) {
            trains = highTrains;
        }
        if (!trains.length) trains = trains2;
        if (!trains.length) trains = trains3;
        if (!trains.length) return flights;

        trains.sort( function(v1, v2) {
            return v1.duration - v2.duration;
        });
        let midIdx = Math.ceil(trains.length / 2) - 1;
        let gainScoreTraffic: TRAFFIC = null;
        if (typeof trains[midIdx] == 'string') {
            trains[midIdx].duration = <number>trains[midIdx].duration;
        }
        if (trains[midIdx].duration <= self.selectTrainDuration) {
            console.info(`时长小于只选火车:${trains[midIdx].duration} < ${self.selectTrainDuration}`)
            //火车加分
            gainScoreTraffic = TRAFFIC.TRAIN;
        } else if (trains[midIdx].duration > self.selectFlightDuration) {
            console.info(`时长大于只选飞机:${trains[midIdx].duration} > ${self.selectFlightDuration}`)
            gainScoreTraffic = TRAFFIC.FLIGHT;
        } else {
            console.info(`平均时长无法决定选择飞机火车:${self.selectFlightDuration} < ${trains[midIdx].duration} < ${self.selectTrainDuration}`)
        }
        tickets = tickets.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            //普通车减掉score
            if (v.type == TRAFFIC.TRAIN) {
                if (/^d/i.test(v.No)) {
                    v.score += self.commonTrainScore / 2;
                    v.reasons.push(`动车${self.commonTrainScore / 2}`);
                } else if (/^[^gcd]/i.test(v.No)) {
                    v['score'] += self.commonTrainScore;
                    v.reasons.push(`普通车${self.commonTrainScore}`);
                }
            }
            if (gainScoreTraffic !== null && gainScoreTraffic !== undefined && v.type == gainScoreTraffic) {
                v.score += self.score;
                v.reasons.push(`正确交通方式 +${self.score}`)
            }
            return v;
        })
        return tickets;
    }
}

export= SelectTrafficByTimePrefer