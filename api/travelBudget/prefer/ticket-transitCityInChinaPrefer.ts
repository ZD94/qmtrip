/**
 * Created by wlh on 2017/2/21.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalTicket, IFlightSeg, TRAFFIC} from "../../_types/travelbudget";
var API = require("common/api");

class TransitCityInChinaPrefer extends AbstractPrefer<IFinalTicket> {
    private baseScore: number;

    constructor(name, options: {baseScore: number}) {
        super(name, options);
        this.baseScore = options.baseScore;
    }

    async markScoreProcess(data: IFinalTicket[]): Promise<IFinalTicket[]> {
        let self = this;
        let ps = data.map(async (ticket) => {
            if (!ticket.score)
                ticket.score = 0;

            if (!ticket.reasons) {
                ticket.reasons = [];
            }
            //不是机票信息
            if (ticket.type != TRAFFIC.FLIGHT)
                return ticket;
            //没有中转信息
            if (!ticket.segs || ticket.segs.length < 1)
                return ticket;

            //查看中转城市中国外城市数据
            let transitInChinaNum = 0;
            for(let i=1, ii=ticket.segs.length; i<ii; i++) {
                let seg = <IFlightSeg>ticket.segs[i];
                let city = await API.place.getCityInfo({cityCode: seg.deptAirport.city});
                if (city && !city.isAbroad) {
                    transitInChinaNum += 1;
                }
            }
            if (!transitInChinaNum || transitInChinaNum < 1)
                return ticket;

            let score = self.baseScore * Math.sqrt(transitInChinaNum);
            ticket.score += score;
            ticket.reasons.push(`中转城市在国内:${score}`);
            return ticket;
        });
        data = await Promise.all(ps);
        return data;
    }
}

export= TransitCityInChinaPrefer