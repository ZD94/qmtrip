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
        if(!hotels || !hotels.length){
            return;
        }
        let channel=hotels[0].channel;
        hotels = hotels.map( (v) => {
            if(!v.remark){
                return v;
            }
            if(!v.score) v.score=0;
            if(!v.reasons) v.reasons=[];
            let rate:any;

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