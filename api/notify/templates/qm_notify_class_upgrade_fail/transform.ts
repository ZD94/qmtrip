/**
 * Created by yuchanglong on 2018/01/15
 */
const config = require("@jingli/config");
var API = require("@jingli/dnode-api");

export = async function transform(values: any): Promise<any>{

    let detailUrl;
    let appMessageUrl: string;
    let shortUrl: string;
    if(config.version == 2) {
        detailUrl = config.v2_host + '#/card-coupons/card-coupons';
        appMessageUrl = '#/card-coupons/card-coupons';
    } else {
        detailUrl = config.host +'/index.html#/card-coupons/card-coupons';
        appMessageUrl = '#/card-coupons/card-coupons';
    }

    try{
        shortUrl = await API.wechat.shortUrl({longurl: detailUrl});
    } catch (err) {
        console.log("errors in obtaining shorturl: ",err)
    }

    values.detailUrl = shortUrl;
    values.appMessageUrl = appMessageUrl;

    return values;
}