/**
 * Created by wyl on 16/9/21.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";


class PlanePricePrefer extends AbstractPrefer<IFinalTicket> {
    private score: number;
    private percent: number;
    private cabins: number[];
    private type: string;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;
        let targetTickets: IFinalTicket[] = [];
        let midPrice = 0;
        let maxPrice = 0;
        let minPrice = 0;

        tickets.forEach( (v) => {
            if (v.type == TRAFFIC.FLIGHT && self.cabins.indexOf(parseInt(v.cabin)) >= 0){
                targetTickets.push(v);
            }
        })

        if (targetTickets.length){
            targetTickets.sort( function(v1, v2) {
                return v1.price - v2.price;
            });
            maxPrice = targetTickets[targetTickets.length-1].price;
            minPrice = targetTickets[0].price;
            midPrice = minPrice + (maxPrice - minPrice) * self.percent;
        }

        tickets = tickets.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            if (v.type != TRAFFIC.FLIGHT) return v;

            if (self.cabins.indexOf(parseInt(v.cabin)) >= 0){
                if (v.price < midPrice) {
                    // var a = 1 - Math.pow((midPrice - v.price)/(midPrice - minPrice),2);
                    var a = 1 - Math.pow((1 - (v.price - minPrice)/(midPrice - minPrice)),3);
                    if(this.type && this.type == "line"){
                        a = (v.price - minPrice)/(midPrice - minPrice);
                    }
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`价格偏好以下价格 ${addScore}`)
                }else if(v.price > midPrice){
                    // var a = 1 - Math.pow((v.price - midPrice)/(maxPrice - midPrice),2);
                    var a = 1 - Math.pow((1 - (maxPrice - v.price)/(maxPrice - midPrice)),3);
                    if(this.type && this.type == "line"){
                        a = (maxPrice - v.price)/(maxPrice - midPrice);
                    }
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`价格偏好以上价格 ${addScore}`)
                }else if(v.price = midPrice){
                    var addScore = self.score;
                    v.score += addScore;
                    v.reasons.push(`等于价格偏好的价格 ${addScore}`)
                }

            }
            return v;
        })
        return tickets;
    }
}

export= PlanePricePrefer;