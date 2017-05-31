/**
 * Created by wyl on 16/9/20.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {MTrainLevel, ETrainLevel} from "_types/travelPolicy";
import {AbstractPrefer} from "./index";

let  MTrainLevelPreferValue  = {
    1: 1,
    2: 0.502409533,
    3: 0.321417303,
    4: 0.607085125,
    5: 0.782798139,
    6: 0.340000152,
    7: 0.214002146,
    8: 0.179690326,
    9: 0.106839962,
    10: 0.106839962
}

class TrainPricePrefer extends AbstractPrefer<IFinalTicket> {
    private score: number;
    private expectTrainCabins;
    private type: string;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!this.expectTrainCabins) {
            this.expectTrainCabins = [];
        }
        if (typeof this.expectTrainCabins == 'string') {
            this.expectTrainCabins = this.expectTrainCabins.split(/,/);
            this.expectTrainCabins = this.expectTrainCabins.map( (v)=> {
                if (typeof v == 'string') {
                    v= parseInt(v);
                }
                return v;
            })
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;
        let minPrice = 0;
        let maxPrice = 0;
        let targetPrice = 0;
        let targetPercent = 0;

        tickets  = tickets.filter((t: any)=>{
            return t.type == TRAFFIC.TRAIN;
        })
        if (tickets.length){
            if(self.expectTrainCabins.length > 0){
                targetPercent = MTrainLevelPreferValue[self.expectTrainCabins[0]];
                self.expectTrainCabins.forEach((item) => {
                    if(MTrainLevelPreferValue[item] >  targetPercent){
                        targetPercent = MTrainLevelPreferValue[item];
                    }
                })
            }
            tickets.sort( function(v1, v2) {
                return v1.price - v2.price;
            });
            maxPrice = tickets[tickets.length-1].price;
            minPrice = tickets[0].price;
            targetPrice = minPrice + (maxPrice - minPrice) * targetPercent;
        }

        tickets = tickets.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            if (v.type != TRAFFIC.TRAIN) return v;

            if (v.price < targetPrice) {
                let a = 1 - Math.pow((1 - (v.price - minPrice)/(targetPrice - minPrice)),3);
                if(this.type && this.type == "line"){
                    a = (v.price - minPrice)/(targetPrice - minPrice);
                }
                let addScore = Math.floor(self.score * a);
                v.score += addScore;
                v.reasons.push(`火车价格偏好以下价格 ${addScore}`)
            }else if(v.price > targetPrice){
                let a = 1 - Math.pow((1 - (maxPrice - v.price)/(maxPrice - targetPrice)),3);
                if(this.type && this.type == "line"){
                    a = (maxPrice - v.price)/(maxPrice - targetPrice);
                }
                let addScore = Math.floor(self.score * a);
                v.score += addScore;
                v.reasons.push(`火车价格偏好以上价格 ${addScore}`)
            }else if(v.price == targetPrice){
                let addScore = self.score;
                v.score += addScore;
                v.reasons.push(`火车等于价格偏好的价格 ${addScore}`)
            }
            return v;
        })
        return tickets;
    }
}

export= TrainPricePrefer