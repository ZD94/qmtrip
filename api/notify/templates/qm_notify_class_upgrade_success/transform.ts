/**
 * Created by yuchanglong on 2018/01/15
 */
const config = require("@jingli/config");

export = async function transform(values: any): Promise<any>{
    let detailUrl = config.v2_host + '';
    if(values.result) 
        values.msg = '已开通成功';
    if(values.result) 
        values.msg = '开通失败';
    return values;
}