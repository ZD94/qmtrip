///<reference path="../../../_types/travelbudget.ts"/>
'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "_types/travelbudget";
var haversine=require("haversine");

class DistancePrefer extends AbstractPrefer<IFinalHotel>{
    private score:number;
    private landmark:any;
    constructor(name,options){
        super(name,options);
        if (!this.score) {
            this.score = 0;
        }
    }


    async markScoreProcess(hotels: IFinalHotel[]) {
        let self = this;
        let landmark=this.landmark;
        if (!hotels.length || !landmark) return hotels;
        if(typeof landmark =="string"){
            landmark=JSON.parse(landmark);
        }
        if (!landmark.longitude || !landmark.latitude) return hotels;
        let distances=new Array();
        let start: any;
        let end: any;
        let minDistance: number;
        let distance:number;
        for(let i=0;i<hotels.length;i++){
            if (!hotels[i]['score']) hotels[i].score = 0;
            if (!hotels[i]['reasons']) hotels[i].reasons = [];

            if (!hotels[i]['latitude'] || !hotels[i]['longitude']) {
                continue;
            }
            start={
                latitude:Number(hotels[i]['latitude']),
                longitude:Number(hotels[i]['longitude'])
            }
            end={
                latitude:Number(landmark.latitude),
                longitude:Number(landmark.longitude)
            }
            distance=haversine(start,end,{unit:'meter'})
            distances.push(distance);
        }
        
        minDistance = Math.min.apply(Math,distances);
        let cscore:number;
        console.log("minDistance: ",minDistance);
        for (let i = 0; i < hotels.length; i++) {
            if(distances[i]>0){
                cscore=Math.round(self.score - Math.pow(minDistance, 1 / 6) *
                       Math.pow(distances[i] / minDistance, 1 / 3) * (distances[i] - minDistance));
                hotels[i].score +=cscore;
                hotels[i].reasons.push(`距离打分+${cscore}`);
            }
        }
        return hotels;
    }
}

module.exports=DistancePrefer;



