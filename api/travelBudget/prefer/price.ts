/**
 * Created by wyl on 16/9/21.
 */

'use strict';
import {IFinalTicket, IFinalHotel, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";

function price(price:number, type:string, min:number, mid:number, max:number):{scale:number, up:boolean}{
    switch(type){
        case 'line':
            if(price < mid){
                let scale = (mid!=min) ? (price - min)/(mid - min) : (price - min)/(max - min);
                return {
                    scale,
                    up: false
                };
            }else{
                let scale = (mid!=max) ? (max - price)/(max - mid) : (max - price)/(max - min);
                return {
                    scale,
                    up: true
                };
            }
        default:
            if(price < mid){
                let scale = 1 - Math.pow((1 - (price - min)/(mid - min)),3);
                return {
                    scale,
                    up: false
                };
            }else if(price > mid){
                let scale = 1 - Math.pow((1 - (max - price)/(max - mid)),3);
                return {
                    scale,
                    up: true
                };
            }else{
                let scale = 1;
                return {
                    scale,
                    up: false
                }
            }
    }
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
        targetTickets.forEach((v)=>{
            if(!v.reason) v.reason = [];
            if(!v.score) v.score = 0;
            let {scale, up} = price(v.price, this.type, minPrice, midPrice, maxPrice);
            let score = Math.floor(scale*this.score);
            v.score += score;
            if(scale != 1){
                v.reason.push(`价格偏好以${up?'上':'下'}价格 ${score}`);
            }else{
                v.reason.push(`价格偏好相等价格 ${score}`);
            }
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
