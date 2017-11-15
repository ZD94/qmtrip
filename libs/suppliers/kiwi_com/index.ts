/**
 * Created by lizeilin on 31/10/2017.
 */


import _ = require('lodash');
import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from '@jingli/language';

var iconv = require('iconv-lite');

export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('https://www.kiwi.com/cn/');
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
        let data = options.data;
        let deeplinkData = data.deeplinkData;
        let deeplink, jsCode;

        deeplink = deeplinkData.deeplink;
        jsCode = '';

        return {url:deeplink, jsCode: jsCode};
    }

    async getHotelReserveLink(options):Promise<ReserveLink> {
        let link = `https://www.kiwi.com/cn/`;
        return {url:link, jsCode: ''};
    }

    async getTrainTicketReserveLink(options):Promise<ReserveLink> {
        let deeplink, jsCode;

        deeplink = `https://www.kiwi.com/cn/`
        jsCode = '';

        return {url:deeplink, jsCode: jsCode};
    }
}

