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

class PriceFilter extends AbstractPrefer<IFinalHotel> {

    constructor(name, options) {
        super(name, options);
    }

    async markScoreProcess(data:IFinalHotel[]):Promise<IFinalHotel[]> {
        data = data.filter( (v)=> {
            let prices = VALID_PRICE[v.star];
            if (prices) {
                let min = prices[0];
                let max = prices[1];
                return v.price >= min && v.price <= max;
            }
            return true;
        })
        return data;
    }
}

export= PriceFilter