/**
 * Created by yuchanglong on 2018/01/15
 */
import * as moment from "moment";
export = async function transform(values: any): Promise<any>{
    if(values.updateTime)
        values.updateTime = moment(values.updateTime).format('YYYY-MM-DD');
    return values;
}