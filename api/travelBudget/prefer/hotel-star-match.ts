/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";
import _ = require("lodash");

class StarMatchPrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private expectStar: any;
    
    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (/,/.test(options.expectStar)) {
            this.expectStar = options.expectStar.split(/,/g);
        }
        if (!_.isArray(this.expectStar)) {
            this.expectStar = [this.expectStar];
        }
        this.expectStar = this.expectStar.map( (v)=> {
            return parseInt(v);
        })
    }
    
    async markScoreProcess(hotels:IFinalHotel[]):Promise<IFinalHotel[]> {
        let self = this;
        hotels = hotels.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];

            if (self.expectStar.indexOf(v.star) >= 0) {
                v.score += self.score;
                v.reasons.push(`符合星级标准+${self.score}`);
            } else {
                v.reasons.push(`不符合星际标准0`)
            }
            return v;
        })
        return hotels;
    }
    
}

export= StarMatchPrefer;