///<reference path="../../../_types/travelbudget.ts"/>
'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "_types/travelbudget";
import {LandMark} from "../_interface";
const API=require("@jingli/dnode-api");

class DistancePrefer extends AbstractPrefer<IFinalHotel>{
    private score:number;
    private landmark:any;
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
    async markScoreProcess(hotels: IFinalHotel[],landmark?:LandMark) {
        let self = this;
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
        hotels.forEach(function (hotel) {
            if (!hotel['score']) hotel.score = 0;
            if (!hotel['reasons']) hotel.reasons = [];
            console.log("latitude: %s, %s",landmark.latitude,landmark.longitude);
            console.log("latitude: %s, %s",hotel.latitude,hotel.longitude);
            dLat = self.toRadian(Number(hotel['latitude']) - Number(landmark.latitude));
            dLon = self.toRadian(Number(hotel['longitude']) - Number(landmark.longitude));
            temp = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(self.toRadian(hotel.latitude)) * Math.cos(self.toRadian(landmark.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            distance=R * 2 * Math.atan2(Math.sqrt(temp), Math.sqrt(1 - temp));
            distances.push(distance);
        });
        minDistance = Math.min.apply(Math,distances);
        for (let i = 0; i < hotels.length; i++) {
            hotels[i].score +=Math.round(2000 - Math.pow(minDistance, 1 / 6) * Math.pow(distances[i] / minDistance, 1 / 3) * (distances[i] - minDistance));
        }
        console.log("========hotels: ",hotels);

        return hotels;
    }
}

module.exports=DistancePrefer;



