/**
 * Created by wangyali on 2017/4/26.
 */
import {TripApprove} from "_types/tripPlan/tripPlan";
import {Models} from "_types";
import moment = require("moment");
var API = require('@jingli/dnode-api');

export = async function transform(params: any): Promise<any>{
        let tripPlan = await Models.tripPlan.get(params.id);
        let tripApprove = await Models.tripApprove.get(params.id);

        let arrivalCityCodes = tripPlan.arrivalCityCodes;
        let cityNames = tripPlan.deptCity+"-";
        if(typeof arrivalCityCodes == 'string')arrivalCityCodes = JSON.parse(arrivalCityCodes);
        if(arrivalCityCodes && arrivalCityCodes.length > 0){
            await Promise.all(arrivalCityCodes.map(async function(item, index){
                let arrivalInfo = await API.place.getCityInfo({cityCode: item});
                if(arrivalInfo){
                    cityNames = cityNames + arrivalInfo.name;
                }
                if(index != (arrivalCityCodes.length - 1)){
                    cityNames = cityNames + '-';
                }
            }))
        }else{
            cityNames = cityNames + tripPlan.arrivalCity;
        }
        tripPlan["cityNames"] = cityNames;

        if(tripApprove){
            let approvedUsers = tripApprove.approvedUsers.split(',');
            let agreeUserNames = "";
            await Promise.all(approvedUsers.map(async function(item){
                if(item && item != ''){
                    let staff = await Models.staff.get(item);
                    agreeUserNames += staff.name + '(同意)、';
                }
            }))
            agreeUserNames = agreeUserNames.substr(0, agreeUserNames.length - 1);
            tripPlan["agreeUserNames"] = agreeUserNames;
        }else{
            tripPlan["agreeUserNames"] = "";
        }

        return tripPlan;
}