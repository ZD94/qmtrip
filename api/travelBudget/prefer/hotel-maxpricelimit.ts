/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalHotel} from "api/_types/travelbudget";

function maxpricelimit(hotels: IFinalHotel[], maxprice: number, score: number) {
    hotels = hotels.map( (v) => {
        if (!v.score) v.score = 0;
        if (!v.reasons) v.reasons=[];

        if (v.price > maxprice) {
            v.score -= score;
            v.reasons.push(`超过限价${maxprice} -${score}`);
        }
        return v;
    })
    return hotels;
}

export= maxpricelimit;