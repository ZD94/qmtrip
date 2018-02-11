/**
 * Created by wangyali on 2017/5/4.
 */
import {Models} from "_types";
const config = require("@jingli/config");

export = async function transform(values: any): Promise<any>{

    let account = await Models.account.get( values.staff.accountId );
    if (!account) throw new Error('account is null')
    values.account.email = account.email;
    values.account.mobile = account.mobile;

    values.status = values.param.status ? "成功" : "失败";
    let appMessageUrl, detailUrl;

    if(values.param.status){
        //成功
        appMessageUrl = `#/trip-approval/detail?approveId=${values.param.approveId}`;
        detailUrl = config.host + `/index.html#/trip-approval/detail?approveId=${values.param.approveId}`;
    }else{
        //失败
        appMessageUrl = "#/trip/create";
        detailUrl = config.host + '/index.html#/trip/create';
    }
    
    values.appMessageUrl = appMessageUrl;
    values.detailUrl = detailUrl;
        
    return values;
}