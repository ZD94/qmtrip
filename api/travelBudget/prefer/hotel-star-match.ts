/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "_types/travelbudget";
import {AbstractPrefer} from "./index";


class StarMatchPrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private expectStar:number;
    
    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }
    
    async markScoreProcess(hotels:IFinalHotel[]):Promise<IFinalHotel[]> {
        let self = this;
        hotels = hotels.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];

            if (!v.outPriceRange && v.star == self.expectStar) {
                v.score += self.score;
                v.reasons.push(`符合星级标准+${self.score}`);
            }
            return v;
        })
        return hotels;
    }
    
}

export= StarMatchPrefer;