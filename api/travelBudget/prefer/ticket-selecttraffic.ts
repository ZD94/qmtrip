/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "api/_types/travelBudget";

function selecttraffic(data: IFinalTicket[], selectTrainDuration: number, selectFlightDuration: number, score: number) :IFinalTicket[] {
    //分离火车,飞机预算
    let trains: IFinalTicket[] = [];
    let highTrains: IFinalTicket[] = [];
    let trains2: IFinalTicket[] = [];
    let flights: IFinalTicket[] = [];
    data.forEach( (v) => {
        if (v.type == TRAFFIC.TRAIN && /^[gc]/i.test(v.No)) {
            highTrains.push(v);
            return;
        }
        if (v.type == TRAFFIC.TRAIN && /^[d]/i.test(v.No)) {
            trains2.push(v);
            return;
        }
        flights.push(v);
    });
    if (highTrains.length) {
        trains = highTrains;
    }
    if (!trains.length) trains = trains2;
    if (!trains.length) return flights;

    trains.sort( function(v1, v2) {
        return v1.duration - v2.duration;
    });
    let midIdx = Math.ceil(trains.length / 2) - 1;
    let gainScoreTraffic: TRAFFIC = null;
    if (typeof trains[midIdx] == 'string') {
        trains[midIdx].duration = <number>trains[midIdx].duration;
    }
    if (trains[midIdx].duration <= selectTrainDuration) {
        console.info(`时长小于只选火车:${trains[midIdx].duration} < ${selectTrainDuration}`)
        //火车加分
        gainScoreTraffic = TRAFFIC.TRAIN;
    }

    if (trains[midIdx].duration > selectFlightDuration) {
        console.info(`时长大于只选飞机:${trains[midIdx].duration} > ${selectFlightDuration}`)
        gainScoreTraffic = TRAFFIC.FLIGHT;
    }

    if (gainScoreTraffic != TRAFFIC.TRAIN && gainScoreTraffic != TRAFFIC.FLIGHT) {
        console.info(`平均时长无法决定选择飞机火车:${selectTrainDuration} < ${trains[midIdx].duration} < ${selectFlightDuration}`)
    }

    data = data.map( (v) => {
        if (!v.score) v.score = 0;
        if (!v.reasons) v.reasons = [];
        //普通车减掉score
        if (v.type == TRAFFIC.TRAIN) {
            if (/^d/i.test(v.No)) {
                v.score -= 500;
                v.reasons.push(`动车-500`);
            } else if (/^[^gcd]/i.test(v.No)) {
                v['score'] -= 1000;
                v.reasons.push(`普通车-1000`);
            }
        }
        if (gainScoreTraffic && v.type == gainScoreTraffic) {
            v.score += score;
            v.reasons.push(`正确交通方式 +${score}`)
        }
        return v;
    })
    return data;
}

export= selecttraffic;