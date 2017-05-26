/**
 * Created by wyl on 16/9/21.
 */

'use strict';
import {IFinalTicket, IFinalHotel, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

function price(v:any, param:any):any{
    if (!v.score) v.score = 0;
    if (!v.reasons) v.reasons = [];
    let level = v.cabin || v["star"];
    if (this.level.indexOf(parseInt(level)) >= 0){
        if (v.price < param.midPrice) {
            var a = 1 - Math.pow((1 - (v.price - param.minPrice)/(param.midPrice - param.minPrice)),3);
            if(this.type && this.type == "line"){
                a = (v.price - param.minPrice)/(param.midPrice - param.minPrice);
            }
            var addScore = this.score * a;
            v.score += addScore;
            v.reasons.push(`价格偏好以下价格 ${addScore}`)
        }else{
            var a = 1 - Math.pow((1 - (param.maxPrice - v.price)/(param.maxPrice - param.midPrice)),3);
            if(this.type && this.type == "line"){
                a = (param.maxPrice - v.price)/(param.maxPrice - param.midPrice);
            }
            var addScore = this.score * a;
            v.score += addScore;
            v.reasons.push(`价格偏好以上价格 ${addScore}`)
        }
        v.score = Math.floor(v.score * 100) / 100;
    }
    return v;
}

class PricePrefer extends AbstractPrefer<any> {
    private score: number;
    private percent: number;
    private level: number[];
    private type: string;

    constructor(name: string, options: any) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        this.level = options.level || [];
    }

    async markScoreProcess(data: any[]): Promise<any[]> {
        if (!data.length) return data;
        let self = this;
        let targetTickets = [];
        let midPrice = 0;
        let maxPrice = 0;
        let minPrice = 0;

        data.forEach( (v: any) => {
            if (v.type == TRAFFIC.TRAIN) {
                return;
            }

            if (self.level.indexOf(parseInt(v['cabin'])) >= 0 || self.level.indexOf(parseInt(v['star'])) >= 0) {
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

        data = data.map( (v) => {
            return price.apply(self, [v, {
                midPrice : midPrice,
                minPrice : minPrice,
                maxPrice : maxPrice
            }]);
        })
        return data;
    }

}

export= PricePrefer;

// export class hotelPricePrefer extends AbstractPrefer<IFinalHotel> {
//     private score: number;
//     private percent: number;
//     private level: number[];
//     private type: string;

//     constructor(name, options) {
//         super(name, options);

//         // console.log("good man: ", options);

//         if (!this.score) {
//             this.score = 0;
//         }
//         this.level = options.level || [];
//     }

//     async markScoreProcess(tickets:IFinalHotel[]):Promise<IFinalHotel[]> {
//         if (!tickets.length) return tickets;
//         let self = this;
//         let targetTickets: IFinalTicket[] = [];
//         let midPrice = 0;
//         let maxPrice = 0;
//         let minPrice = 0;

//         if (targetTickets.length){
//             targetTickets.sort( function(v1, v2) {
//                 return v1.price - v2.price;
//             });
//             maxPrice = targetTickets[targetTickets.length-1].price;
//             minPrice = targetTickets[0].price;
//             midPrice = minPrice + (maxPrice - minPrice) * self.percent;
//         }

//         tickets = tickets.map( (v) => {
//             return Price(v, {
//                 level: self.level,
//                 midPrice : midPrice,
//                 minPrice : minPrice,
//                 maxPrice : maxPrice,
//                 score    : self.score,
//                 self     : self
//             });
//         })
//         return tickets;
//     }
// }


// export class PlanePricePrefer extends AbstractPrefer<IFinalTicket> {
//     private score: number;
//     private percent: number;
//     private level: number[];
//     private type: string;

//     constructor(name, options) {
//         super(name, options);
//         if (!this.score) {
//             this.score = 0;
//         }
//         this.level = options.level || [];
//     }

//     async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
//         if (!tickets.length) return tickets;
//         let self = this;
//         let targetTickets: IFinalTicket[] = [];
//         let midPrice = 0;
//         let maxPrice = 0;
//         let minPrice = 0;

//         if (targetTickets.length){
//             targetTickets.sort( function(v1, v2) {
//                 return v1.price - v2.price;
//             });
//             maxPrice = targetTickets[targetTickets.length-1].price;
//             minPrice = targetTickets[0].price;
//             midPrice = minPrice + (maxPrice - minPrice) * self.percent;
//         }

//         tickets = tickets.map( (v) => {
//             return Price(v, {
//                 level: self.level,
//                 midPrice : midPrice,
//                 minPrice : minPrice,
//                 maxPrice : maxPrice,
//                 score    : self.score,
//                 self     : self
//             });
//         })
//         return tickets;
//     }
// }
