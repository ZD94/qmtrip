import {Models} from "_types";
import {Staff} from "_types/staff";
import {EApproveResult, ETripType} from "_types/tripPlan";
import moment = require("moment");
var API = require('@jingli/dnode-api');
import {MPlaneLevel, MTrainLevel, MHotelLevel,DefaultRegion} from '_types';
import {Model, where} from "sequelize";

export = async function transform(values: any): Promise<any>{
    let cityMap = {};
    let staffMap = {};
    let staff = await Models.staff.get(values.staffId);
    let travelPolicy = await staff.getTravelPolicy();

    let travelp: {
        name: string,
        planeLevels?: number[],
        trainLevels?: number[],
        hotelLevels?: number[],
        isOpenAbroad?: boolean,
        abroadPlaneLevels?: number[],
        abroadHotelLevels?: number[]
    }  = {
        name: travelPolicy.name,
        isOpenAbroad: travelPolicy.isOpenAbroad
    };
    values.staff =  staff;
    values.MPlaneLevel =  MPlaneLevel;
    values.MTrainLevel =  MTrainLevel;
    values.MHotelLevel =  MHotelLevel;

    let currentCompany = staff.company;
    async function getAbroadPolicy() {
        let policyRegions = await API.travelPolicy.getCompanyRegion({companyId: currentCompany.id, name: DefaultRegion.abroad});
        let abroadRegion = await API.travelPolicy.getTravelPolicyRegion({travelPolicyId: travelPolicy.id, companyRegionId: policyRegions[0].id});

        if (abroadRegion && abroadRegion.length > 0) {
            travelp.abroadPlaneLevels = abroadRegion[0].planeLevels;
            travelp.abroadHotelLevels = abroadRegion[0].hotelLevels;
        }
    }

    async function getDomesticPolicy() {
        let policyRegions = await API.travelPolicy.getCompanyRegion({companyId: currentCompany.id, name: DefaultRegion.domestic});
        let domesticRegion = await API.travelPolicy.getTravelPolicyRegion({travelPolicyId: travelPolicy.id, companyRegionId: policyRegions[0].id});
        if (domesticRegion && domesticRegion.length > 0) {
            travelp.planeLevels = domesticRegion[0].planeLevels;
            travelp.hotelLevels = domesticRegion[0].hotelLevels;
            travelp.trainLevels = domesticRegion[0].trainLevels;
        }
    }

    travelp.isOpenAbroad = travelPolicy.isOpenAbroad;
    await getAbroadPolicy();
    await getDomesticPolicy();


    values.travelPolicy =  travelp;


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
    values.date = moment().format('YYYY-MM-DD HH:mm');

    return values;
}