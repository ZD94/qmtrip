/**
 * Created by lizeilin on 31/10/2017.
 */

import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from '@jingli/language';


export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('http://ct.ctrip.com');
    }

    async login(authDate?: any): Promise<any>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getOrderList(): Promise<SupplierOrder[]>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getBookLink(options: { [key: string]: any }): Promise<ReserveLink>{
        var reserveType = options.reserveType;
        var bookLink: any = {};

        if(reserveType == "travel_plane"){
            bookLink = await this.getAirTicketReserveLink({data: options.data, fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate});
        }

        if(reserveType == "travel_train"){
            bookLink = await this.getTrainTicketReserveLink({data: options.data, fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate});
        }

        if(reserveType == "hotel"){
            bookLink = await this.getHotelReserveLink(options);
        }
        return bookLink;
    }

    async getAirTicketReserveLink(options: { [key: string]: any }):Promise<ReserveLink> {
        let data = options.data;
        let deeplinkData = data.deeplinkData;
        let deeplink, jsCode;
        if (deeplinkData.type == 'domestic') {
            deeplink = `http://m.ctrip.com/html5/flight/swift/domestic/cabinlist?fromlist=true&triptype=1&dcode=${deeplinkData.originPlace}&acode=${deeplinkData.destination}&ddate=${deeplinkData.datetime}&dfltno=${deeplinkData.flgno}`;
            jsCode = '';
            return {url: deeplink, jsCode: jsCode};
        }
        if (deeplinkData.type == 'international') {
            deeplink = `http://m.ctrip.com/html5/flight/swift/international/${deeplinkData.originPlace}/${deeplinkData.destination}/${deeplinkData.datetime}/1-0-0`;
            jsCode = `
            var timer = setTimeout(function() {
                var list = document.getElementsByClassName('flight-plane');
                for (let i = 0; i < list.length; i++) {
                    var noStr = list[i].children[0].innerText;
                    var reg = /([\da-zA-Z]+)$/;
                    if (reg.test(noStr)) {
                        var no = RegExp.$1;
                    if (no == "${data['No']}") {
                        var btn = list[i];
                        btn.click();
                    }
                }
        }, 0.5 * 1000);`;
            return {url: deeplink, jsCode: jsCode};
        }
    }

    async getHotelReserveLink(options: { [key: string]: any }):Promise<ReserveLink> {
        let data = options.data;
        let deeplinkData = data.deeplinkData;
        let deeplink, jsCode;
        if (deeplinkData.type == 'domestic') {
            let dayslater = (moment(deeplinkData.checkInDate).unix() - moment(moment().format('YYYY-MM-DD')).unix())/60/60/24;
            let days = (moment(deeplinkData.checkOutDate).unix()-moment(deeplinkData.checkInDate).unix())/60/60/24;

            deeplink = `http://m.ctrip.com/webapp/hotel/hoteldetail/${deeplinkData.hotelId}.html?daylater=${dayslater}&days=${days}&contrl=0&pay=0&latlon=#fromList`
            jsCode = '';

            return {url:deeplink, jsCode: jsCode};
        }
        if (deeplinkData.type == 'international') {
            let atime = moment(deeplinkData.checkInDate).format('YYYYMMDD');
            let _checkInDate = moment(deeplinkData.checkInDate).hour(12);
            let _checkOutDate = moment(deeplinkData.checkOutDate).hour(12);
            let interval = moment(_checkOutDate).diff(_checkInDate,'days') || 1;

            deeplink = `http://m.ctrip.com/webapp/hotel/hoteldetail/${deeplinkData.hotelId}.html?atime=${atime}&days=${interval}&contrl=0&pay=0&latlon=#fromList`;
            jsCode = '';

            return {url: deeplink, jsCode: jsCode};
        }
    }

    async getTrainTicketReserveLink(options: { [key: string]: any }):Promise<ReserveLink> {
        let trafficBookLink = "http://m.ctrip.com/webapp/train/v2/index#!/list";
        let indexBookLink = 'http://m.ctrip.com/webapp/train/v2/index';
        let param = {
            "value":
                {
                    "from": {
                        "name": "",
                        "cityName": ""
                    },
                    "to": {
                        "name": "",
                        "cityName": ""
                    },
                    "date": "",
                    "isGaotie": false
                },
            "timeout":"",
            "savedate":""
        };
        param.value.to.name = param.value.to.cityName = options.toCity;
        param.value.from.name = param.value.from.cityName = options.fromCity;
        param.value.date = options.leaveDate.getTime();
        param.savedate = moment().format("YYYY/MM/DD HH:mm:ss");
        param.timeout = moment().add(1, 'month').format("YYYY/MM/DD HH:mm:ss");

        var param_str = JSON.stringify(param);

        let date = moment(options.leaveDate).format("YYYY-MM-DD");
        let jsCode = `
            var canGo = sessionStorage.getItem("canGo");
            if(canGo){

            }else{
                sessionStorage.setItem("canGo" , true);
                var Info = localStorage.getItem('TRAIN_SEARCH_STORE_LIGHT');
                Info = JSON.parse(Info);
                Info.value.date = "${date}";
                Info.value.from.cityName = Info.value.from.name = "${options.fromCity}";
                Info.value.to.cityName   = Info.value.to.name   = "${options.toCity}";
                Info = JSON.stringify(Info);
                localStorage.setItem('TRAIN_SEARCH_STORE_LIGHT' , Info);
                location.reload();
                
                var timer1 = setTimeout(function() {
                    var btn = document.getElementsByClassName('g_btn_s');
                    btn[0].click();
                }, 0.2 * 1000);
                
                var timer2 = setTimeout(function() {
                    var list = document.getElementsByClassName('sel-checi');
                    for (let i = 0; i < list.length; i++) {
                        if (list[i].children[0].innerText == "${options.data['No']}") {
                            var btn = list[i].children[0];
                            btn.click();
                        }
                    }
                }, 0.5 * 1000);
            }
        `;

        return {url:trafficBookLink, indexUrl:indexBookLink, jsCode: jsCode};
    }

    async queryFlightCityCode(city: string): Promise<string>{
        var res = await this.client.post({
            json: true,
            uri: 'https://sec-m.ctrip.com/restapi/soa2/11783/Flight/Common/FlightSimilarNearAirportSearch/Query?_fxpcqlniredt=09031117210396050637',
            form: {
                head: {},
                key: city,
            },
            headers: {
                'Referer': 'http://m.ctrip.com/html5/flight/matrix.html',
            },
        })
        if(res.body && res.body.fpairinfo && res.body.fpairinfo.length){
            var arr = res.body.fpairinfo;
            var code = arr[0].code;
            return code;
        }
        return "";
    }

    async queryHotelCityCode(city: string): Promise<string>{
        var res = await this.client.post({
            uri: 'http://m.ctrip.com/restapi/soa2/10932/hotel/static/destinationget?_fxpcqlniredt=09031117210396050637',
            json: true,
            form:{
                head:{},
                word: city,
            },
            headers: {
                'Referer': 'http://m.ctrip.com/webapp/hotel/citylist',
            },
        })

        if(res.body && res.body.keywords && res.body.keywords.length){
            var arr = res.body.keywords;
            var cityCode = arr[0].region['cid'];
            var cityPy = arr[0].region['cengname'];
            return cityPy + cityCode;
        }
        return "";
    }

}


