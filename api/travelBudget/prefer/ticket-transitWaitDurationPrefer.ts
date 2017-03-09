/**
 * Created by wlh on 2017/2/21.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalTicket, IFlightSeg, TRAFFIC} from "api/_types/travelbudget";
import moment = require("moment");

/**
 * 中转等待时长打分
 *
 * https://files.l.jingli365.com/#g=1&p=国际机票打分
 *
 * 中转等待时长
 *  中转换乘时长总和：T（分钟）
 *  时长下限（可变）：120（分钟）
 *  时长上限（可变）：360（分钟）
 *  基准分（可变）：500
 *  减分幅度（可变）：5
 *  IF(120<T<360),+500
 *  IF(T<120),=500-5*(120-T)
 *  IF(T>360),=500-5*(T-360
 */

class TransitWaiterDurationPrefer extends AbstractPrefer<IFinalTicket> {
    private baseScore: number;
    private subScore: number;
    private maxDuration: number;
    private minDuration: number;

    constructor(name, options: {
        maxDuration: number;
        minDuration: number;
        baseScore: number;
        subScore: number;
    }) {
        super(name, options);
        for(let key in options) {
            this[key] = options[key];
        }
    }

    async markScoreProcess(data: IFinalTicket[]): Promise<IFinalTicket[]> {
        let self = this;
        data = data.map( (ticket) => {
            if (!ticket.score)
                ticket.score = 0;
            if (!ticket.reasons)
                ticket.reasons = [];

            if (ticket.type != TRAFFIC.FLIGHT)
                return ticket;

            //第一段为出发到中转地
            //最后段为中转地到目的地
            //如果只有两段则说明没有经过中转
            if (ticket.segs && ticket.segs.length > 1) {
                let total = ticket.segs.length;
                let t = 0;
                for(var i=0; i< total-1; i++) {
                    let seg = <IFlightSeg>ticket.segs[i];
                    let seg2 = <IFlightSeg>ticket.segs[i+1];
                    let m1 = moment(seg.arriDateTime);
                    let m2 = moment(seg2.deptDateTime);
                    let minutes = m2.diff(m1, 'minutes');
                    t += minutes;
                }
                let score = 0;

                if (t > self.maxDuration) {
                    score = self.baseScore - self.subScore * (t- self.maxDuration);
                } else if (t < self.minDuration) {
                    score = self.baseScore - self.subScore * (self.minDuration - t);
                } else {
                    score = self.baseScore;
                }
                ticket.score += score;
                ticket.reasons.push(`中转等待时长打分${score}`);
            }
            return ticket;
        })
        return data;
    }
}

export= TransitWaiterDurationPrefer