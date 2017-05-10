/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "_types/travelbudget";
import {AbstractPrefer} from "./index";
import {RemarkCondition} from "../_interface";



class RemarkPrefer extends AbstractPrefer<IFinalHotel> {
    private score: number;
    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[],remarkCondition?:RemarkCondition) : Promise<IFinalHotel[]> {
        let self = this;
        console.log("============score: ",self.score);
        hotels = hotels.map( (v) => {
            if(!v.remark){
                return v;
            }
            if(!v.score) v.score=0;
            if(!v.reasons) v.reasons=[];
            let channel:any;
            let rate:any;
            if(!remarkCondition || !remarkCondition.channel){
                 channel='ctrip';
            }
            channel=remarkCondition.channel;
            switch(channel){
                case "ctrip":
                    rate=2;
                    break;
                case "skyscanner":
                    rate=2;
                    break;
                default:
                    rate=1;
            }
            v.score+=Math.round(self.score* Math.sqrt(v.remark*rate+1));
            return v;
        })
        return hotels;
    }
}

export= RemarkPrefer;