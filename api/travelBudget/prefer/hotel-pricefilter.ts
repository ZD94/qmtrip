/**
 * Created by wlh on 16/9/4.
 */

'use strict';
import {IFinalHotel} from "../../_types/travelbudget";
import {AbstractPrefer} from "./index";

const VALID_PRICE = {
    "5": [450, 2300],
    "4": [280, 1000],
    "3": [180, 600],
    "2": [120, 380],
}

const score = 10 * 10000;

class PriceFilter extends AbstractPrefer<IFinalHotel> {

    constructor(name, options) {
        super(name, options);
    }

    async markScoreProcess(data:IFinalHotel[]):Promise<IFinalHotel[]> {
        data = data.map( (v)=> {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            let prices = VALID_PRICE[v.star];
            if (prices) {
                let min = prices[0];
                let max = prices[1];
                if (!(v.price >= min && v.price <= max)) {
                    v.score -= score;
                    v.reasons.push(`价格不在有效区间内`);
                }
            }
            return v;
        })
        return data;
    }
}

export= PriceFilter