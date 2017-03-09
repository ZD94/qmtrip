/**
 * Created by wlh on 16/8/11.
 */

'use strict';
import {IFinalHotel} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

class MaxPriceLimitPrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private maxPrice: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[]) : Promise<IFinalHotel[]> {
        let self = this;
        hotels = hotels.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons=[];

            if (!v.outPriceRange && v.price > self.maxPrice) {
                v.score += self.score;
                v.reasons.push(`超过限价${self.maxPrice} -${self.score}`);
            }
            return v;
        })
        return hotels;
    }
}

export= MaxPriceLimitPrefer;