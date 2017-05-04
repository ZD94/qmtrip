
import _ = require('lodash');
import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from '@jingli/language';

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

    async getBookLink(options): Promise<ReserveLink>{
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
    async getAirTicketReserveLink(options):Promise<ReserveLink> {
        let startStation = encodeURI(options.fromCity),
            endStation   = encodeURI(options.toCity),
            date         = moment(options.leaveDate).format("YYYY-MM-DD");
        let trafficBookLink = `https://m.flight.qunar.com/ncs/page/flightlist?depCity=${startStation}&arrCity=${endStation}&goDate=${date}`;
        return {url:trafficBookLink, jsCode: ''};
    }

    async getHotelReserveLink(options):Promise<ReserveLink> {
        let city = encodeURI(options.city),
            checkInDate   = moment(options.leaveDate).format("YYYY-MM-DD"),
            checkOutDate  = moment(options.backDate).format("YYYY-MM-DD");
        let link = `https://touch.qunar.com/hotel/hotellist?city=${city}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
        return {url:link, jsCode: ''};
    }

    async getTrainTicketReserveLink(options):Promise<ReserveLink> {
        let startStation = encodeURI(options.fromCity),
            endStation   = encodeURI(options.toCity),
            date         = moment(options.leaveDate).format("YYYY-MM-DD");
        let trafficBookLink = `http://touch.train.qunar.com/trainList.html?startStation=${startStation}&endStation=${endStation}&date=${date}`;
        return {url:trafficBookLink, jsCode: ''};
    }
}