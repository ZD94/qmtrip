/**
 * Created by wangyali on 2017/5/8.
 */
import {Models} from "_types";
import {EStaffRole} from "_types/staff";

export = async function transform(values: any): Promise<any>{
    if(values.staff && values.staff.id){
        let staff = await Models.staff.get(values.staff.id);
        let travelPolicy = await staff.getTravelPolicy();
        values.travelPolicy = travelPolicy;
        values.EStaffRole = EStaffRole;
        values.departmentNames  = await staff.getDepartmentsStr();
    }
    return values;
}