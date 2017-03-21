/**
 * Created by wyl on 16/12/13.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";


class PlaneNumberPrefer extends AbstractPrefer<IFinalTicket> {
    private score: number;
    private percent: number;
    private cabins: string[];

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
        let midNumber = 0;
        let maxNumber = 0;
        let minNumber = 0;

        tickets.forEach( (v) => {
            if (self.cabins.indexOf(v.cabin) >= 0){
                targetTickets.push(v);
            }
        })

        if (targetTickets.length){
            targetTickets.sort( function(v1, v2) {
                return v1.price - v2.price;
            });
            maxNumber = targetTickets.length-1;
            midNumber = minNumber + (maxNumber - minNumber) * self.percent;
        }else{
            return targetTickets;
        }

        tickets = tickets.map( (v, index) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            if (self.cabins.indexOf(v.cabin) >= 0){
                if (index < midNumber) {
                    var a = 1 - Math.pow((1 - (index - minNumber)/(midNumber - minNumber)),3);
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`位置偏好以下 ${addScore}`)
                }else if(index > midNumber){
                    var a = 1 - Math.pow((1 - (maxNumber - index)/(maxNumber - midNumber)),3);
                    var addScore = self.score * a;
                    v.score += addScore;
                    v.reasons.push(`位置偏好以上 ${addScore}`)
                }else if(index = midNumber){
                    var addScore = self.score;
                    v.score += addScore;
                    v.reasons.push(`等于位置偏好 ${addScore}`)
                }
            }
            return v;
        })
        return tickets;
    }
}

export = PlaneNumberPrefer;