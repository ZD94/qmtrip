
import _ = require('lodash');
import moment = require("moment");
import { SupplierWebRobot, SupplierOrder, ReserveLink } from '../index';
import L from 'common/language';

var iconv = require('iconv-lite');

export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('http://ct.ctrip.com');
    }

    async login(authDate: any): Promise<any>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getOrderList(): Promise<SupplierOrder[]>{
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getAirTicketReserveLink(options):Promise<ReserveLink> {
        var fromCityCode = await this.queryFlightCityCode(options.fromCityName);
        var toCityCode = await this.queryFlightCityCode(options.toCityName);
        var values = {fromCityCode: fromCityCode, toCityCode: toCityCode, departDate: options.leaveDate};
        var template = "http://m.ctrip.com/html5/flight/flight-list.html?triptype=1&dcode=<%=fromCityCode%>&acode=<%=toCityCode%>&ddate=<%=departDate%>";
        var temp = _.template(template);
        var link = temp(values);
        return {url:link, jsCode: ""};
    }

    async getHotelReserveLink(options):Promise<ReserveLink> {
        var cityInfo = await this.queryHotelCityCode(options.cityName);
        var values = {cityInfo: cityInfo};
        var template = "http://m.ctrip.com/webapp/hotel/<%=cityInfo%>/?fr=index";
        var temp = _.template(template);
        var link = temp(values);
        return {url:link, jsCode: ""};
    }

    async getTrainTicketReserveLink(options):Promise<ReserveLink> {
        let trafficBookLink = "http://m.ctrip.com/webapp/train/home/list";
        let param = {
            "value":
            {
                "privateCustomType":null,
                "aStation":"",
                "dStation":"",
                "dDate":0,
                "setField":"aStation",
                "dStationCityName":"",
                "dStationCityId":1,
                "aStationCityName":"",
                "aStationCityId":1,
                "isFirstToListPage":true
            },
            "timeout":"",
            "tag":null,
            "savedate":"",
            "oldvalue":{}
        }
        param.value.aStation = param.value.aStationCityName = options.toCityName;
        param.value.dStation = param.value.dStationCityName = options.fromCityName;
        param.value.dDate = moment(options.leaveDate).toDate().getTime();
        let aStationCityId = await this.queryHotelCityCode(options.toCityName);
        let dStationCityId = await this.queryHotelCityCode(options.fromCityName);
        param.value.dStationCityId = parseInt(dStationCityId);
        param.value.aStationCityId = parseInt(aStationCityId);
        param.savedate = moment().format("YYYY/MM/DD HH:mm:ss");
        param.timeout = moment().add(1, 'years').format("YYYY/MM/DD HH:mm:ss")

        var param_str = JSON.stringify(param);
        var linkJS = "localStorage.setItem('TRAIN_SEARCH_PARAM', \'"+param_str+"\');console.log('train_search_param');";
        return {url:trafficBookLink, jsCode: linkJS};
    }

    async queryFlightCityCode(cityName: string): Promise<string>{
        var res = await this.client.post({
            json: true,
            uri: 'https://sec-m.ctrip.com/restapi/soa2/11783/Flight/Common/FlightSimilarNearAirportSearch/Query?_fxpcqlniredt=09031117210396050637',
            form: {
                head: {},
                key: cityName,
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

    async queryHotelCityCode(cityName: string): Promise<string>{
        var requestPromise = require('request-promise');
        var res = await this.client.post({
            uri: 'http://m.ctrip.com/restapi/soa2/10932/hotel/static/destinationget?_fxpcqlniredt=09031117210396050637',
            json: true,
            form:{
                head:{},
                word: cityName,
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
