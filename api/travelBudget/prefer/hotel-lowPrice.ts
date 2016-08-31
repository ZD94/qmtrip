/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "../../_types/travelbudget";

class LowPricePrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private percent: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[]) :Promise<IFinalHotel[]> {

        return hotels;
    }
}

export= LowPricePrefer;