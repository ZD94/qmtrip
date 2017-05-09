/**
 * Created by wangyali on 2017/5/8.
 */
import {Models} from "_types";

export = async function transform(values: any): Promise<any>{
    if(values.staff && values.staff.id){
        let staff = await Models.staff.get(values.staff.id);
        let travelPolicy = await staff.getTravelPolicy();
        values.travelPolicy = travelPolicy;
    }
    return values;
}