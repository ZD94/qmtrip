/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "api/_types/travelbudget";

function blacklist(hotels: IFinalHotel[], score: number) : IFinalHotel[] {
    const FILTER_HOTEL_AGENTS = ['hotels.com', '好订'];
    hotels = hotels.map( (hotel) => {
        if (!hotel.score) hotel.score = 0;
        if (!hotel.reasons) hotel.reasons=[];

        if (FILTER_HOTEL_AGENTS.indexOf(hotel.agent) >= 0) {
            hotel.score -= score;
            hotel.reasons.push(`供应商黑名单-${score}`);
        }
        return hotel;
    })
    return hotels;
}

export= blacklist;