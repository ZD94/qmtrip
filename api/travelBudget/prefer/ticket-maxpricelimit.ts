/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelBudget";

/**
 * 最高价格策略,超过最高价格的将减分
 */
function maxpricelimit(data: IFinalTicket[], maxPrice, score) : IFinalTicket[]{
    data = data.map( (v) => {
        if (!v.score) v.score = 0;
        if (v.price > maxPrice) {
            v.score -= score;
        }
        return v;
    })
    return data;
}

export= maxpricelimit;