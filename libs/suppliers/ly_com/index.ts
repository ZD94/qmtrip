
import _ = require('lodash');
import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from '@jingli/language';
const CityName = require("./cityName.json");
const CityCodes = require("./cityCode.json");

var iconv = require('iconv-lite');

export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('https://touch.qunar.com/h5');
    }

    async login(authDate: any): Promise<any>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getOrderList(): Promise<SupplierOrder[]>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getBookLink(options: { [key: string]: any}): Promise<ReserveLink>{
        var reserveType = options.reserveType;
        var bookLink: any = {};

        if(reserveType == "travel_plane"){
            bookLink = await this.getAirTicketReserveLink({fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate});
        }

        if(reserveType == "travel_train"){
            bookLink = await this.getTrainTicketReserveLink({fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate});
        }

        if(reserveType == "hotel"){
            bookLink = await this.getHotelReserveLink(options);
        }

        return bookLink;
    }
    async getAirTicketReserveLink(options: { [key: string]: any}):Promise<ReserveLink> {
        let date = moment(options.leaveDate).format("YYYY-MM-DD");
        let from = CityName[options.fromCity].c,
            to   = CityName[options.toCity].c;
        if(from == "BJS"){
            from = "PEK";
        }

        let link = `http://m.ly.com/flightnew/${from}_${to}.html?flyofftime=${date}`;
        return {url:link, jsCode: ''};
    }

    async getHotelReserveLink(options: { [key: string]: any}):Promise<ReserveLink> {
        let checkInDate   = moment(options.leaveDate).format("YYYY-MM-DD"),
            checkOutDate  = moment(options.backDate).format("YYYY-MM-DD"),
            cityCode      = CityCodes[options.city];
        if(cityCode){
            cityCode = cityCode.cId;
        }else{
            cityCode = 53;
        }

        let link = `http://m.ly.com/hotel/hotellist_${cityCode}_0_0_0_0_0.html`;
        let jsCode = `
            let isIn = sessionStorage.getItem("isIn");
            if(isIn){
            
            }else{
                sessionStorage.setItem("isIn" , true);
                document.cookie = "comedate=${checkInDate}";
                document.cookie = "leavedate=${checkOutDate}";
                location.href = location.href;
            };
        `;
        return {url:link, jsCode: jsCode};
    }

    async getTrainTicketReserveLink(options: { [key: string]: any}):Promise<ReserveLink> {
        let startStation = encodeURI(options.fromCity),
            endStation   = encodeURI(options.toCity),
            date         = moment(options.leaveDate).format("YYYY-MM-DD");
        let trafficBookLink = `http://m.ly.com/uniontrain/webapp/train/list.html?startname=${startStation}&arrivename=${endStation}`;
        let jsCode = `
            let isIn = sessionStorage.getItem("isIn");
            if(isIn){
            
            }else{
                sessionStorage.setItem("isIn" , true);
                localStorage.setItem("TrainList_QueryDate" , '{"value":"${date}"}' );
                location.href = location.href;                
            };
        `;

        return {url:trafficBookLink, jsCode: jsCode};
    }
}
