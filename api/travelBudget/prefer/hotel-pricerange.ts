/**
 * Created by wlh on 16/9/2.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "../../_types/travelbudget";
import _ = require("lodash");
import moment = require("moment");

class PriceRangePrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private range: Object;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[]) : Promise<IFinalHotel[]> {
        if (!hotels.length) return hotels;
        let self = this;

        hotels = hotels.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v['reasons']) v['reasons'] = [];
            let d1 = moment(v.checkInDate);
            let d2 = moment(v.checkOutDate);
            let days = d2.diff(d1,"days");
            let oneDayPrice = v.price/days;
            if (self.range && v.star && self.range[v.star] && self.range[v.star][0] && self.range[v.star][1] && oneDayPrice < self.range[v.star][0] || oneDayPrice > self.range[v.star][1]) {
                v.outPriceRange = true;
                v['score'] += self.score;
                v['reasons'].push(`价格在价格区间以外 ${self.score}`)
            }
            return v;
        })

        return hotels;
    }
}

export=PriceRangePrefer