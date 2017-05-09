///<reference path="../../../_types/travelbudget.ts"/>
'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "_types/travelbudget";
import {LandMark,RemarkCondition} from "../_interface";
const API=require("@jingli/dnode-api");
var request=require("request");
const baiduCoordKey=`6vAKY71IUSzT3mrhFC5HdMHkUDZHKo6G`;

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

    async coordConversion(params:{latitude:any,longitude:any}):Promise<any>{
        var coordinates=`${params.latitude},${params.longitude}`;
        let sourceType=3;
        let toType=5;

        var url=`http://api.map.baidu.com/geoconv/v1/?coords=${coordinates}&from=${sourceType}&to=${toType}&ak=${baiduCoordKey}`;
        let coords=await new Promise<any>((resolve,reject)=>{
            request.get({
                        uri:url,
                    },function(err,res){
                        resolve(res.body)
                    }
                )
            }
        );
        if(coords && typeof coords =="string"){
            coords=JSON.parse(coords)
        }
        if(!coords || coords.status !=0){
            return null;
        }
        return coords.result[0];
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
            let coords = await self.coordConversion({latitude: hotels[i].latitude, longitude: hotels[i].longitude});
            if (coords && typeof coords == "string") {
                coords = JSON.parse(coords)
            }
            if (!coords) {
                distances.push(-1);
            }
            dLat = self.toRadian(Number(coords.x) - Number(landmark.latitude));
            dLon = self.toRadian(Number(coords.y) - Number(landmark.longitude));
            temp = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(self.toRadian(coords.x)) * Math.cos(self.toRadian(landmark.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            distance = R * 2 * Math.atan2(Math.sqrt(temp), Math.sqrt(1 - temp));
            distances.push(distance);
        }
        console.log("=======hotels: ",distances);
        minDistance = Math.min.apply(Math,distances);
        let cscore:number;
        console.log("length of hotels: ",hotels.length);
        console.log("length of distances",distances.length);
        for (let i = 0; i < hotels.length; i++) {
            if(distances[i]>0){
                cscore=Math.round(2000 - Math.pow(minDistance, 1 / 6) * Math.pow(distances[i] / minDistance, 1 / 3) * (distances[i] - minDistance));
                console.log("===========scores: ",cscore);
                hotels[i].score +=cscore;
            }
        }
        console.log("=======hotels: ",hotels);
        return hotels;
    }
}

module.exports=DistancePrefer;



