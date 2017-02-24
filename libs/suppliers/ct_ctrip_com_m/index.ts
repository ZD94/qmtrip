
import _ = require('lodash');
import { SupplierWebRobot, SupplierOrder , ReserveLink } from '../index';
import { EPayType, EInvoiceFeeTypes } from '../../../api/_types/tripPlan/index';
import L from 'common/language';
import moment = require("moment");

var iconv = require('iconv-lite');

export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('http://ct.ctrip.com');
    }

    async login(authDate: any): Promise<any>{
        var res = await this.client.get({
            uri: 'http://ct.ctrip.com/m/',
        });

        let sToken = this.getCookie('sToken');
        res = await this.client.post({
            uri: 'https://www.corporatetravel.ctrip.com/m/Account/ValidateMember?'+Math.random(),
            json: true,
            form: {
                account: authDate.username,
                password: authDate.password,
                sToken,
            },
            headers: {
                'Referer': 'http://ct.ctrip.com/m/',
            },
        })

        if(!res.body.Result){
            //if(res.body.ErrorCode == '2'){ //需要验证码
            //    await downloadImage(clientRequest2, 'http://ct.ctrip.com/m/Account/GetCaptcha?'+Math.random(), 'checkcode.gif');
            //}
            throw new Error('login error');
        }
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
            bookLink = await this.getHotelReserveLink({city: options.city, leaveDate: options.leaveDate});
        }
        return bookLink;
    }

    async getAirTicketReserveLink(options):Promise<ReserveLink> {
        let AirLink = "'"+"http://ct.ctrip.com/m/Book/Flight"+"'";
        let fromCityCode = await this.queryFlightCityCode(options.fromCity);
        let toCityCode = await this.queryFlightCityCode(options.toCity);
        let fromCityinfo = await this.queryHotelCityCode(options.fromCity);
        let fromCityNum = fromCityinfo.split(":")[1];
        let fromCityChengName = fromCityinfo.split(":")[0];
        let toCityinfo = await this.queryHotelCityCode(options.toCity);
        let toCityNum = toCityinfo.split(":")[1];
        let toCityChengName = toCityinfo.split(":")[0];
        let DomesticFlights = {
            "FlightSearch":
            {
                "depCity":[fromCityNum,options.fromCity,options.fromCity+","+fromCityCode+"|"+fromCityNum+"|"+fromCityChengName,"0","0"],
                "arrCity":[toCityNum,options.toCity,options.toCity+","+toCityCode+"|"+toCityNum+"|"+toCityChengName,"0","0"],
                "SType":"S",
                "cityType":0,
                "BType":"",
                "CabType":"",
                "FlightDate":{"sDate":moment(options.leaveDate).format("YYYY-MM-DD"),"eDate":""}
            },
            "domesitcCityHistory":[options.fromCity+","+fromCityCode+"|"+fromCityNum+"|"+fromCityChengName,options.toCity+","+toCityCode+"|"+toCityNum+"|"+toCityChengName],
            "internationalCityHistory":""
        }
        let DomesticFlights_str = "'"+JSON.stringify(DomesticFlights)+"'";
        let jsCode = await this.getJsCode({key: "'"+"DomesticFlights"+"'", url: AirLink, json: DomesticFlights_str});
        return {url:"http://ct.ctrip.com/m/", jsCode: jsCode};
    }

    async getTrainTicketReserveLink(options):Promise<ReserveLink> {
        let TrainLink = "'"+"http://ct.ctrip.com/m/Book/Train"+"'";
        let fromCityinfo = await this.queryHotelCityCode(options.fromCity);
        let fromCityNum = fromCityinfo.split(":")[1];
        let fromCityChengName = fromCityinfo.split(":")[0];
        let toCityinfo = await this.queryHotelCityCode(options.toCity);
        let toCityNum = toCityinfo.split(":")[1];
        let toCityChengName = toCityinfo.split(":")[0];
        let train = {
            "TrainSearch":{
                "depCity":[fromCityChengName,options.fromCity,options.fromCity+",|"+fromCityChengName+"|"+fromCityChengName],
                "arrCity":[toCityChengName,options.toCity,options.toCity+",|"+toCityChengName+"|"+toCityChengName],
                "trainType":"",
                "TrainDate":{"sDate":moment(options.leaveDate).format("YYYY-MM-DD")},
            },
            "domesitcCityHistory":[options.fromCity+",|"+fromCityNum+"|"+fromCityChengName,options.toCity+",|"+toCityNum+"|"+toCityChengName]
        };
        let train_str = "'"+JSON.stringify(train)+"'";
        let jsCode = await this.getJsCode({key: "'"+"Train"+"'", url: TrainLink, json: train_str});
        return {url:"http://ct.ctrip.com/m/", jsCode: jsCode};
    }

    async getHotelReserveLink(options):Promise<ReserveLink> {
        let cityInfo = await this.queryHotelCityCode(options.city);
        let cityNum = cityInfo.split(":")[1];
        let cityChengName = cityInfo.split(":")[0];
        let HotelLink = "'"+"http://ct.ctrip.com/m/Book/Hotel"+"'";
        let domesticHotel = {
            "HotelSearch":{
                "City":[cityNum,options.city,options.city+"|"+cityNum+"|"+cityChengName,"0"],
                "CityType":"0","BType":"",
                "HotelDate":{"sDate":moment(options.leaveDate).format("YYYY-MM-DD"),"eDate":""},
                "Htype":"M",
                "choice":"0"},
            "domesitcCityHistory":[options.city+"|"+cityNum+"|"+cityChengName]
        }
        let domesticHotel_str = "'"+JSON.stringify(domesticHotel)+"'";
        let jsCode = await this.getJsCode({key: "'"+"DomesticHotel"+"'", url: HotelLink, json: domesticHotel_str});
        return {url:"http://ct.ctrip.com/m/", jsCode: jsCode};
    }

    async getJsCode(options): Promise<string>{
        var str = `
                    alert('go');
                    var hasEnter = sessionStorage.getItem("hasEnter");
                    localStorage.setItem(${options.key}, ${options.json});
                    if(window.location.href == "http://ct.ctrip.com/m/"&&!hasEnter){
                        var login = document.getElementById("login");
                        alert('go1');
                        if(login){
                            document.getElementById("login").style.background = "yellow";
                        }else{
                            window.location.href = ${options.url};
                        }
                    }else if(window.location.href == ${options.url}&&!hasEnter){
                        alert('go2');
                        var search = document.getElementById("btn_search");
                        search.click();
                        sessionStorage.setItem("hasEnter","true");
                    }
                    // if(window.location.href == ${options.url}&&!hasEnter){
                    //     var search = document.getElementById("btn_search");
                    //     search.click();
                    //     sessionStorage.setItem("hasEnter","true");
                    // }
                  `;
        return str;
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
        var requestPromise = require('request-promise');
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
            return cityPy+":"+cityCode;
        }
        return "";
    }



    async getOrderList(): Promise<SupplierOrder[]>{
        let all = await Promise.all([
            this.getFilghtOrderList(),
            this.getHotelOrderList(),
            this.getTrainOrderList(),
        ]);
        return _.flatten(all) as SupplierOrder[];
    }

    async getFilghtOrderList(): Promise<SupplierOrder[]>{
        let res = await this.asyncCall('http://ct.ctrip.com/m/Order/FlightOrders');
        //console.log(JSON.stringify(res.body, null, ' '));
        if(!res.body.Response.OrderList)
            return [];
        let list = _.values(res.body.Response.OrderList);
        list = list.filter((item: any)=>{
            return item.OrderStatus[0] === '已成交';
        })
        //console.log(JSON.stringify(list, null, ' '));
        let ret = await Promise.all(list.map(async (item: any) => {
            let res = await this.asyncCall('http://ct.ctrip.com/m/OrderDetail/Flight', { OrderNumber: item.OrderNumber });
            if(!res.body.Result)
                return null as SupplierOrder;
            let order = res.body.Response.OrderDetailBase;
            return {
                id: 'ct_ctrip_com_'+item.OrderNumber,
                price: item.Price,
                date: new Date(item.Time[0]),
                persons: order.Passenger.map((p)=>p.name),
                parType: order.Pay == '公司账户支付' ? EPayType.COMPANY_PAY : EPayType.PERSONAL_PAY,
                orderType: EInvoiceFeeTypes.PLANE_TICKET,
                number: order.Domestic[0].key,
                desc: item.Name,
                starCityName: order.Domestic[0].FlightRoute.indexOf('-')>=0 ? order.Domestic[0].FlightRoute.split('-')[0]: null,
                endCityName:  order.Domestic[0].FlightRoute.indexOf('-')>=0 ? order.Domestic[0].FlightRoute.split('-')[1]: null
            };
        }));
        return ret.filter((item)=>item);
    }

    async getHotelOrderList(): Promise<SupplierOrder[]>{
        let res = await this.asyncCall('http://ct.ctrip.com/m/Order/HotelOrders');
        //console.log(JSON.stringify(res.body, null, ' '));
        if(!res.body.Response.OrderList)
            return [];
        let list = _.values(res.body.Response.OrderList);
        list = list.filter((item: any)=>{
            return item.OrderStatus[0] === '已成交';
        })
        //console.log(JSON.stringify(list, null, ' '));
        let ret = await Promise.all(list.map(async (item: any) => {
            let res = await this.asyncCall('http://ct.ctrip.com/m/OrderDetail/Hotel', { OrderNumber: item.OrderNumber });
            if(!res.body.Result)
                return null as SupplierOrder;
            let order = res.body.Response.OrderDetailBase;
            return {
                id: 'ct_ctrip_com_'+item.OrderNumber,
                price: item.Price,
                date: new Date(item.Time[0]),
                persons: order.Passenger,
                parType: order.pay == '公司账户支付' ? EPayType.COMPANY_PAY : EPayType.PERSONAL_PAY,
                orderType: EInvoiceFeeTypes.HOTEL,
                desc: item.Name
            };
        }));
        return ret.filter((item)=>item);
    }
    async getTrainOrderList(): Promise<SupplierOrder[]>{
        let res = await this.asyncCall('http://ct.ctrip.com/m/Order/TrainOrders');
        //console.log(JSON.stringify(res.body, null, ' '));
        if(!res.body.Response.OrderList)
            return [];
        let list = _.values(res.body.Response.OrderList);
        list = list.filter((item: any)=>{
            return item.OrderStatus[0] === '已购票';
        })
        //console.log(JSON.stringify(list, null, ' '));
        let ret = await Promise.all(list.map(async (item: any) => {
            let res = await this.asyncCall('http://ct.ctrip.com/m/OrderDetail/Train', { OrderNumber: item.OrderNumber });
            if(!res.body.Result)
                return null as SupplierOrder;
            let order = res.body.Response.OrderDetailBase;
            return {
                id: 'ct_ctrip_com_'+item.OrderNumber,
                price: item.Price,
                date: new Date(item.Time[0]),
                persons: order.Passenger.map((p)=>p.name),
                parType: order.Pay == '公司账户支付' ? EPayType.COMPANY_PAY : EPayType.PERSONAL_PAY,
                orderType: EInvoiceFeeTypes.TRAIN_TICKET,
                number: order.Train.name,
                desc: item.Name,
                starCityName: item.Name.indexOf('-')>=0 ? item.Name.split('-')[0]: null,
                endCityName:  item.Name.indexOf('-')>=0 ? item.Name.split('-')[1]: null
            };
        }));
        return ret.filter((item)=>item);
    }
    async asyncCall(url: string, req?: any): Promise<any> {
        let body = _.cloneDeep(req || {});
        body.token = this.getCookie('token');
        return this.client.post({
            uri: url,
            json: true,
            headers: {
                'Referer': 'http://ct.ctrip.com/m/Main/MyOrder',
            },
            body
        })
    }
}
