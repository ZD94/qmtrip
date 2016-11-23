
import _ = require('lodash');
import { SupplierWebRobot, SupplierOrder } from '../index';
import { EPayType, EInvoiceFeeTypes } from '../../../api/_types/tripPlan/index';
import L from 'common/language';

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

    async getAirTicketReserveLink(options):Promise<string> {
        throw L.ERR.NOT_IMPLEMENTED();
    }

    async getHotelReserveLink(options):Promise<string> {
        throw L.ERR.NOT_IMPLEMENTED();
    }
}
