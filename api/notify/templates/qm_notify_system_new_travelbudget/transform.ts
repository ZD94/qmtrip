import {Models} from "_types";
import {Staff} from "_types/staff";
import {EApproveResult, ETripType} from "_types/tripPlan";
import moment = require("moment");
var API = require('@jingli/dnode-api');
import {MPlaneLevel, MTrainLevel, MHotelLevel} from '_types/travelPolicy';

export = async function transform(values: any): Promise<any>{
    let cityMap = {};
    let staffMap = {};
    let staff = await Models.staff.get(values.staffId);
    let travelPolicy = await staff.getTravelPolicy();
    values.staff =  staff;
    values.travelPolicy =  travelPolicy;
    values.MPlaneLevel =  MPlaneLevel;
    values.MTrainLevel =  MTrainLevel;
    values.MHotelLevel =  MHotelLevel;
    let budgetInfo = await API.travelBudget.getBudgetInfo({id: values.cacheId, accountId : staff.id});

    let {budgets, query} = budgetInfo;
    let totalBudget = 0;
    budgets.forEach((b) => {totalBudget += Number(b.price);});
    values.totalBudget =  totalBudget;
    values.budgets =  budgets;
    values.query =  query;
    let destinationPlacesInfo = query.destinationPlacesInfo;
    if(typeof destinationPlacesInfo == 'string'){
        destinationPlacesInfo = JSON.parse(destinationPlacesInfo);
    }
    if(query.originPlace){
        let originPlace = await API.place.getCityInfo({cityCode: query.originPlace});
        cityMap[query.originPlace] = originPlace;
    }
    if(query.goBackPlace){
        let goBackPlace = await API.place.getCityInfo({cityCode: query.goBackPlace});
        cityMap[query.goBackPlace] = goBackPlace;
    }
    if(destinationPlacesInfo && destinationPlacesInfo.length > 0){
        await Promise.all(destinationPlacesInfo.map(async function(item, index){
            let arrivalInfo = await API.place.getCityInfo({cityCode: item.destinationPlace});
            cityMap[item.destinationPlace] = arrivalInfo;
        }))
    }
    values.destinationPlacesInfo = destinationPlacesInfo;
    values.cityMap = cityMap;
    if(!query.staffList){
        query.staffList = [staff.id];
    }

    let staffIds = query.staffList;
    if(typeof staffIds == 'string'){
        staffIds = JSON.parse(staffIds);
    }
    await Promise.all(staffIds.map(async function(item, index){
        let s = await Models.staff.get(item);
        staffMap[item] = s;
    }))
    values.staffMap = staffMap;
    return values;
}