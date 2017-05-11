/**
 * Created by wangyali on 2017/5/4.
 */
import {Models} from "_types";
import {EApproveResult} from "_types/tripPlan";
import moment = require("moment");
var API = require('@jingli/dnode-api');

export = async function transform(values: any): Promise<any>{
    let tripApprove = values.tripApprove;
    let tripPlan = values.tripPlan;
    let cityMap:any = {};
    let approveUserMap:any = {};
    if(tripPlan && tripPlan.id){
        tripApprove = await Models.tripApprove.get(values.tripPlan.id);
        values.tripApprove = tripApprove;
    }
    if(!values.tripApprove || !values.tripApprove.id){
        return values;
    }
    let arrivalCityCodes = tripApprove.arrivalCityCodes;
    if(typeof arrivalCityCodes == 'string')arrivalCityCodes = JSON.parse(arrivalCityCodes);
    tripApprove.arrivalCityCodes = arrivalCityCodes;

    if(arrivalCityCodes && arrivalCityCodes.length > 0){
        await Promise.all(arrivalCityCodes.map(async function(item, index){
            let arrivalInfo = await API.place.getCityInfo({cityCode: item});
            cityMap[item] = arrivalInfo;
        }))
    }
    values.cityMap = cityMap;

    if(tripApprove){
        let approvedUsers = tripApprove.approvedUsers.split(',');
        let agreeUserNames = "";
        await Promise.all(approvedUsers.map(async function(item){
            if(item && item != ''){
                let staff = await Models.staff.get(item);
                approveUserMap[item] = staff;
            }
        }))

        let lastApproveUser = await Models.staff.get(tripApprove.approveUserId);
        approveUserMap[lastApproveUser.id] = lastApproveUser;
    }
    values.approveUserMap = approveUserMap;

    let logs = await Models.tripPlanLog.find({tripPlanId: tripApprove.id, approveStatus: EApproveResult.AUTO_APPROVE, remark: '自动通过'});
    if(logs && logs.length > 0){
        values.isAutoApprove = true;
    }else{
        values.isAutoApprove = true;
    }
    return values;
}