
import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from '@jingli/language';
const CityCodes = require("./cityCode.json");

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

    async getBookLink(options: { [key: string]: any }): Promise<ReserveLink>{
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
    async getAirTicketReserveLink(options: { [key: string]: any }):Promise<ReserveLink> {
        let startStation = encodeURI(options.fromCity),
            endStation   = encodeURI(options.toCity),
            date         = moment(options.leaveDate).format("YYYY-MM-DD"),
            startCode    = CityCodes[options.fromCity].airCode,
            endCode      = CityCodes[options.toCity].airCode;
        let link = `https://h5.m.taobao.com/trip/flight/searchlist/index.html?searchType=1&depCityCode=${startCode}&arrCityCode=${endCode}&leaveDate=${date}&depCityName=${startStation}&arrCityName=${endStation}`;

        return {url:link, jsCode: ''};
    }

    async getHotelReserveLink(options: { [key: string]: any }):Promise<ReserveLink> {
        let city = encodeURI(options.city),
            checkInDate   = moment(options.leaveDate).format("YYYY-MM-DD"),
            checkOutDate  = moment(options.backDate).format("YYYY-MM-DD"),
            cityCode      = CityCodes[options.city];
        if(cityCode){
            cityCode = cityCode.code;
        }else{
            cityCode = 110100;
        }

        let link = `https://h5.m.taobao.com/trip/hotel/searchlist/index.html?cityCode=${cityCode}&cityName=${city}&checkIn=${checkInDate}&checkOut=${checkOutDate}`;
        return {url:link, jsCode: ''};
    }

    async getTrainTicketReserveLink(options: { [key: string]: any}):Promise<ReserveLink> {
        let startStation = encodeURI(options.fromCity),
            endStation   = encodeURI(options.toCity),
            date         = moment(options.leaveDate).format("YYYY-MM-DD");
        let trafficBookLink = `https://h5.m.taobao.com/trip/train/searchlist/index.html?depCity=${startStation}&arrCity=${endStation}&depDate=${date}`;

        return {url:trafficBookLink, jsCode: ''};
    }
}
