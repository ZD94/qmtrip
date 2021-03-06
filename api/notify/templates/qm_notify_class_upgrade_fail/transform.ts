/**
 * Created by yuchanglong on 2018/01/15
 */
const config = require("@jingli/config");
var API = require("@jingli/dnode-api");

export = async function transform(values: any): Promise<any>{

    let detailUrl;
    let appMessageUrl: string;
    let shortUrl: string;
    detailUrl = config.v2_host + '#/my/card-coupons/card-coupons';
    appMessageUrl = '#/my/card-coupons/card-coupons';

    try{
        shortUrl = await API.wechat.shortUrl({longurl: detailUrl});
    } catch (err) {
        console.log("errors in obtaining shorturl: ",err)
    }

    values.detailUrl = shortUrl;
    values.appMessageUrl = appMessageUrl;

    return values;
}