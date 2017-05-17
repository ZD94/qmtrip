/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

class RemarkPrefer extends AbstractPrefer<IFinalHotel> {
    private score: number;
    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }
    async markScoreProcess(hotels: IFinalHotel[]) : Promise<IFinalHotel[]> {
        let self = this;
        if(!hotels || !hotels.length){
            return;
        }
        let cscore:any;
        hotels = hotels.map( (v) => {
            if(!v.commentScore || v.commentScore<0){
                return v;
            }
            if(!v.score) v.score=0;
            if(!v.reasons) v.reasons=[];

            cscore = Math.round(self.score* Math.sqrt(v.commentScore+1));
            v.score+=cscore;
            v.reasons.push(`用户评分打分+${cscore}`);
            return v;
        })
        return hotels;
    }
}
export= RemarkPrefer;