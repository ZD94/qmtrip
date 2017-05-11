/**
 * Created by wlh on 16/9/2.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel, IFinalTicket, TRAFFIC} from "_types/travelbudget";
import _ = require("lodash");

class PricePrefer extends AbstractPrefer<IFinalTicket> {

    private score: number;
    private percent: number;
    private type: string;

    constructor(name, options, type = 'traffic') {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!options.percent) {
            this.percent = 0.7;
        }

        this.type = type == 'traffic' ? 'cabins' : 'star';
    }

      async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;        

        /* group by star or cabins */
        let groups = {};
        if(self.type =="cabins"){
            groups["train"] = {};
            groups["flight"]= {};
        }
        tickets.forEach( (v)=>{
            let obj;
            if(self.type == "cabins"){
                if(v.type == TRAFFIC.FLIGHT){
                    obj = groups["flight"];
                }else{
                    obj = groups["train"];
                }
            }else{
                obj = groups;
            }


            if(!obj[v[self.type]]){
                obj[v[self.type]] = [];
            }
            obj[v[self.type]].push(v);
        });

        let Result = [];
        for(let k in groups){
            let arr;
            if(k == "train" || k == "flight"){
                for(let key in groups[k]){
                    Result = _.concat(Result, await _markScore(groups[k][key]));
                }
            }else{
                Result = _.concat(Result, await _markScore(groups[k]));
            }
        }

        return Result;

        async function _markScore( targetTickets:any ){
            let midPrice = 0;
            let maxPrice = 0;
            let minPrice = 0;
            if (targetTickets.length){
                targetTickets.sort( function(v1, v2) {
                    return v1.price - v2.price;
                });
                maxPrice = targetTickets[targetTickets.length-1].price;
                minPrice = targetTickets[0].price;
                midPrice = minPrice + (maxPrice - minPrice) * self.percent;
            }

            targetTickets = targetTickets.map( (v) => {
                if (!v.score) v.score = 0;
                if (!v.reasons) v.reasons = [];
                if (v.type != TRAFFIC.FLIGHT) return v;

                if (v.price < midPrice) {
                    // var a = 1 - Math.pow((midPrice - v.price)/(midPrice - minPrice),2);
                    var a = 1 - Math.pow((1 - (v.price - minPrice)/(midPrice - minPrice)),3);
                    if(this.type && this.type == "line"){
                        a = (v.price - minPrice)/(midPrice - minPrice);
                    }
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`价格偏好以下价格 ${addScore}`)
                }else if(v.price >= midPrice){
                    // var a = 1 - Math.pow((v.price - midPrice)/(maxPrice - midPrice),2);
                    var a = 1 - Math.pow((1 - (maxPrice - v.price)/(maxPrice - midPrice)),3);
                    if(this.type && this.type == "line"){
                        a = (maxPrice - v.price)/(maxPrice - midPrice);
                    }
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`价格偏好以上价格 ${addScore}`)
                }/*else{
                    var addScore = self.score;
                    v.score += addScore;
                    v.reasons.push(`等于价格偏好的价格 ${addScore}`)
                }*/

                return v;
            })
            return tickets;
        }            
    }
}

export=PricePrefer