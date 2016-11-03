
import { SupplierWebRobot, SupplierOrder } from '../index';
import { EPayType } from 'api/_types/tripPlan';

var iconv = require('iconv-lite');

export default class SupplierCtripCT extends SupplierWebRobot{
    constructor(){
        super('http://ct.ctrip.com');
    }

    async login(authDate: any): Promise<any>{
        var res = await this.client.get({
            uri: 'http://ct.ctrip.com/',
        });

        let m = res.body.match(/<input\s+type=\"hidden\"\s+name=\"p1\"\s+value=\"([a-z0-9]+)\"\s+\/>/i);
        if(!m)
            throw new Error('login can not fetch p1.');
        let p1 = m[1];
        //console.log(p1);

        res = await this.client.post({
            uri: 'https://www.corporatetravel.ctrip.com/crptravel/login?lang=zh-cn',
            form: {
                loginname: authDate.username,
                passwd: authDate.password,
                needVCode: 'F',
                vcode: '',
                backurl: 'http://ct.ctrip.com/corptravel/zh-cn',
                p1,
            },
            headers: {
                'Referer': 'http://ct.ctrip.com/',
            },
        })
        //console.log(res.body);
    }

    async getOrderList(): Promise<SupplierOrder[]>{
        let token = this.getCookie('token');
        let res = await this.client.post({
            uri: 'http://ct.ctrip.com/My/zh-cn/AllOrder/GetAllCorpOrder',
            headers: {
                'Referer': 'http://ct.ctrip.com/My/zh-cn/allOrder',
            },
            form: {
                ed: '',
                isnext: 0,
                isprev: 0,
                name: '',
                op: 'SelectOrder',
                orderid: '',
                pageCount: 10,
                pageNum: 1,
                ped: '',
                precount: 0,
                sd: '',
                so: 3,
                st: 1,
            },
            encoding: null,
        })
        let body = iconv.decode(res.body, 'gbk');
        //fs.writeFileSync('orderlist.json', body, 'utf-8');
        //console.log(body);
        let data = JSON.parse(body);
        //console.log(JSON.stringify(data, null, ' '));
        let ret = [] as SupplierOrder[];
        if(data[2]){
            let list = data[2];
            for(let item of list){
                if(item.OrderStatu !== '已成交')
                    continue;
                ret.push({
                    id: 'ct_ctrip_com_'+item.OrderID,
                    price: item.Price,
                    date: new Date(item.StrJourneyDate.split('<br/>')[0]),
                    persons: [],
                    desc: item.JourneyName || item.ProductName,
                    parType: item.CorpPayType == 'pub' ? EPayType.COMPANY_PAY : EPayType.PERSONAL_PAY
                });
            }
        }
        return ret;
    }
}
