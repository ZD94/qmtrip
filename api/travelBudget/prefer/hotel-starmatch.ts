/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "../../_types/travelBudget";


function starMatch(hotels: IFinalHotel[], expectStar: number, score: number) {
    console.info(`期望星级:${expectStar}`)
    hotels = hotels.map( (v) => {
        if (!v.score) v.score = 0;
        if (!v.reasons) v.reasons = [];

        if (v.star == expectStar) {
            v.score += score;
            v.reasons.push(`符合星级标准+${score}`);
        }
        return v;
    })
    return hotels;
}

export= starMatch;