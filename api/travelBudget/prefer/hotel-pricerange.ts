/**
 * Created by wlh on 16/9/2.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "api/_types/travelbudget";
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
            let days = d2.diff(d1, "days");
            let oneDayPrice = v.price / days;

            if (!self.range) return v;  //配置不存在
            if (!self.range[v.star]) return v;  //当前星际配置不存在
            if (!self.range[v.star].length) return v;   //当前星际配置不存在
            let priceLimit = self.range[v.star];

            let maxLimit = Number.POSITIVE_INFINITY;//+无穷
            let minLimit = Number.NEGATIVE_INFINITY;//-无穷
            if (priceLimit[0]) {
                minLimit = priceLimit[0];
            }
            if (priceLimit >= 2) {
                maxLimit = priceLimit[1];
            }
            if (oneDayPrice < minLimit || oneDayPrice > maxLimit) {
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