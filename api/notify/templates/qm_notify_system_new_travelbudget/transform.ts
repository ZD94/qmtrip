import {Models} from "_types";
import {Staff} from "_types/staff";
const moment = require("moment");
var API = require('@jingli/dnode-api');
import {MPlaneLevel, MTrainLevel, MHotelLevel,DefaultRegion} from '_types';
import { ITravelBudgetInfo } from 'http/controller/budget';
require("moment-timezone")

export = async function transform(values: {staffId: string, approveId?: string
    staff?: Staff, MPlaneLevel?: object,   MTrainLevel?: object, MHotelLevel?: object,
    travelPolicy?: {[key: string]: any}, cacheId?: string, totalBudget?: number, budgets?: ITravelBudgetInfo[],
    query?: object, destinationPlacesInfo?: any, cityMap?: any, date?: string, staffs?: Staff[]
}): Promise<any>{
    let cityMap = {};
    let staff = await Models.staff.get(values.staffId);
    if (!staff) throw new Error('staff is null')
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
        policyRegions = policyRegions.data;
        if(policyRegions && policyRegions.length) {
            let abroadRegion = await API.travelPolicy.getTravelPolicyRegions({travelPolicyId: travelPolicy.id, companyRegionId: policyRegions[0].id, companyId: currentCompany.id});
            abroadRegion = abroadRegion.data;
            if (abroadRegion && abroadRegion.length > 0) {
                travelp.abroadPlaneLevels = abroadRegion[0].planeLevels;
                travelp.abroadHotelLevels = abroadRegion[0].hotelLevels;
            }
        }
    }

    async function getDomesticPolicy() {
        let policyRegions = await API.travelPolicy.getCompanyRegion({companyId: currentCompany.id, name: DefaultRegion.domestic});
        policyRegions = policyRegions.data;
        if(policyRegions && policyRegions.length) {
            let domesticRegion = await API.travelPolicy.getTravelPolicyRegions({travelPolicyId: travelPolicy.id, companyRegionId: policyRegions[0].id, companyId: currentCompany.id});
            domesticRegion = domesticRegion.data;
            if (domesticRegion && domesticRegion.length > 0) {
                travelp.planeLevels = domesticRegion[0].planeLevels;
                travelp.hotelLevels = domesticRegion[0].hotelLevels;
                travelp.trainLevels = domesticRegion[0].trainLevels;
            }
        }
    }

    travelp.isOpenAbroad = travelPolicy.isOpenAbroad;
    await getAbroadPolicy();
    await getDomesticPolicy();

    values.travelPolicy =  travelp;

    let budgetInfo: any;
    if(values.cacheId){
        budgetInfo = await API.travelBudget.getBudgetInfo({id: values.cacheId, accountId : staff.id});
    }
    if(values.approveId){
        let approve = await Models.approve.get(values.approveId);
        budgetInfo = approve.data;
    }

    if(typeof budgetInfo == 'string'){
        budgetInfo = JSON.parse(budgetInfo);
    }
    let {budgets, query} = budgetInfo;
    let totalBudget = 0;
    budgets.forEach((b: any) => {totalBudget += Number(b.price);});
    values.totalBudget =  totalBudget;
    values.budgets =  budgets;
    values.query =  query;
    let destinationPlacesInfo = query.destinationPlacesInfo;
    if(typeof destinationPlacesInfo == 'string'){
        destinationPlacesInfo = JSON.parse(destinationPlacesInfo);
    }
    if(query.originPlace){
        let originPlace = await API.place.getCityInfo({cityCode: query.originPlace, companyId: currentCompany.id});
        cityMap[query.originPlace] = originPlace;
    }
    if(query.goBackPlace){
        let goBackPlace = await API.place.getCityInfo({cityCode: query.goBackPlace, companyId: currentCompany.id});
        cityMap[query.goBackPlace] = goBackPlace;
    }
    if(destinationPlacesInfo && destinationPlacesInfo.length > 0){
        await Promise.all(destinationPlacesInfo.map(async function(item: {
            destinationPlace: string, latestArrivalDateTime: string, earliestGoBackDateTime: string
        }, index: number){
            let arrivalInfo = await API.place.getCityInfo({cityCode: item.destinationPlace, companyId: currentCompany.id});
            item.latestArrivalDateTime = moment(item.latestArrivalDateTime).tz(arrivalInfo.timezone).format("YYYY-MM-DD HH:mm")  
            item.earliestGoBackDateTime = moment(item.earliestGoBackDateTime).tz(arrivalInfo.timezone).format("YYYY-MM-DD HH:mm");
            cityMap[item.destinationPlace] = arrivalInfo;
        }))
    }
    values.destinationPlacesInfo = destinationPlacesInfo;
    values.cityMap = cityMap;
    if(!query.staffList){
        query.staffList = [staff.id];
    }

    let staffIds: string[] = query.staffList;
    if(typeof staffIds == 'string'){
        staffIds = JSON.parse(staffIds);
    }

    values.staffs = await Promise.all(staffIds.map(id => Models.staff.get(id))) as Staff[]
    values.date = moment().format('YYYY-MM-DD HH:mm');

    return values;
}