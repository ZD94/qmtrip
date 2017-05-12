///<reference path="../../../_types/travelbudget.ts"/>
'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "_types/travelbudget";
import {RemarkCondition} from "../_interface";

class DistancePrefer extends AbstractPrefer<IFinalHotel>{
    private score:number;
    private remarkCondition:any;
    constructor(name,options){
        super(name,options);
        if (!this.score) {
            this.score = 0;
        }
    }
    toRadian(coor:any):number{
        if(typeof coor =='string' ){
            coor=Number(coor);
        }
        return coor * Math.PI/ 180;
    }

    async markScoreProcess(hotels: IFinalHotel[],remarkCondition?:RemarkCondition) {
        let self = this;
        let {landmark}=remarkCondition;
        if (!hotels.length && !landmark) return hotels;
        if(typeof landmark =="string"){
            landmark=JSON.parse(landmark);
        }
        let distances=new Array();
        let dLat: any;
        let dLon: any;
        let R = 6371;
        let temp: number;
        let minDistance: number;
        let distance:number;
        for(let i=0;i<hotels.length;i++){
            if (!hotels[i]['score']) hotels[i].score = 0;
            if (!hotels[i]['reasons']) hotels[i].reasons = [];

            if (!hotels[i]['latitude'] || !hotels[i]['longitude']) {
                continue;
            }
            dLat = self.toRadian(Number(hotels[i]['latitude']) - Number(landmark.latitude));
            dLon = self.toRadian(Number(hotels[i]['longitude']) - Number(landmark.longitude));
            temp = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(self.toRadian(hotels[i]['latitude'])) * Math.cos(self.toRadian(landmark.latitude)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
            distance = R * 2 * Math.atan2(Math.sqrt(temp), Math.sqrt(1 - temp));
            distances.push(distance);
        }
        minDistance = Math.min.apply(Math,distances);
        let cscore:number;
        for (let i = 0; i < hotels.length; i++) {
            if(distances[i]>0){
                cscore=Math.round(2000 - Math.pow(minDistance, 1 / 6) *
                       Math.pow(distances[i] / minDistance, 1 / 3) * (distances[i] - minDistance));
                hotels[i].score +=cscore;
            }
        }
        return hotels;
    }
}

module.exports=DistancePrefer;



