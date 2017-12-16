/**
 * Created by wlh on 15/12/12.
 */
import { Headers } from 'request';
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types'
import { ETripType, EInvoiceType, ISegment, ICreateBudgetAndApproveParams, ICreateBudgetAndApproveParamsNew } from "_types/tripPlan";
import { Staff } from "_types/staff";
const API = require("@jingli/dnode-api");
const validate = require("common/validate");
import L from '@jingli/language';
const moment = require('moment');
require("moment-timezone");
const cache = require("common/cache");
const utils = require("common/utils");
import _ = require('lodash');
import { Place } from "_types/place";
import { EPlaneLevel, ETrainLevel, MTrainLevel, EHotelLevel, DefaultRegion } from "_types"
import { where } from "sequelize";
let systemNoticeEmails = require('@jingli/config').system_notice_emails;
export var NoCityPriceLimit = 0;
const DefaultCurrencyUnit = 'CNY';
import { restfulAPIUtil } from "api/restful";
import { meiyaJudge, getMeiyaFlightData, getMeiyaTrainData, writeData, compareFlightData, compareTrainData, getMeiyaHotelData, compareHotelData } from "./meiya";
import { EApproveType } from '_types/approve';

const cloudAPI = require('@jingli/config').cloudAPI;
const cloudKey = require('@jingli/config').cloudKey;

let RestfulAPIUtil = restfulAPIUtil;

export interface ICity {
    name: string;
    id: string;
    isAbroad: boolean;
    letter: string;
    timezone: string;
    longitude: number;
    latitude: number;
    code?: string;  //三字码
}

export interface IQueryBudgetParams {
    fromCity?: ICity| string;       //出发城市
    backCity?: ICity| string;       //返回城市
    segments: any;      //每段查询条件
    ret: boolean;       //是否往返
    staffs: any;  //出差员工
    travelPolicyId?: string;
    companyId? : string;
    expiredBudget? : boolean;  //过期是否可以生成预算
    combineRoom?: boolean;   //同性是否合并
    isRetMarkedData?: boolean;
    preferedCurrency?: string;
}


interface SegmentsBudgetResult {
    id: string;
    cities: string[];
    /**
     * 数组每一项为多人每段预算信息,分为交通与住宿
     */
    budgets: Array<{
        hotel: any[],   //数组每项为每个人的住宿预算
        traffic: any[]  //数组每项为每个人的交通预算
        subsidy: any  //每个人的补助
    }>
}

export interface ISearchHotelParams {
    checkInDate: string;
    checkOutDate: string;
    cityId: string;
    travelPolicyId: string;
    location?: {
        latitude: number,
        longitude: number,
    }
}

export interface ISearchTicketParams {
    leaveDate: string;
    originPlaceId: string;
    destinationId: string;
    travelPolicyId: string;
}

let sequelize = require('sequelize');
export default class ApiTravelBudget {

    @clientExport
    static async getBudgetInfo(params: { id: string, accountId?: string }) {
        let { id, accountId } = params;
        if (!accountId || accountId == 'undefined') {
            let staff = await Staff.getCurrent();
            accountId = staff.id;
        }

        let key = `budgets:${accountId}:${id}`;
        return cache.read(key);
    }

    @clientExport
    static getDefaultPrefer() {
        // return {};
    }

    @clientExport
    static async getHotelsData(params: ISearchHotelParams): Promise<any> {
        let commonData;
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: params
                },
                addUrl: 'getHotelsData',
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        if (result.code == 0) {
            commonData = result.data;
        } else {
            return null;
        }

        // writeData("commonHotelData.json", commonData);
        //检查是否需要美亚数据，返回美亚数据
        let needMeiya = await meiyaJudge();
        if (!needMeiya) {
            return commonData;
        }

        let meiyaHotel = await getMeiyaHotelData(params);
        compareHotelData(commonData, meiyaHotel);
        // writeData(moment().format("YYYY_MM_DD_hh_mm_ss")+".finallyHotel.json", commonData);
        return commonData;

        // return require("mytest/data/2017_11_30_04_16_08.finallyHotel");
    }

    @clientExport
    static async getTrafficsData(params: ISearchTicketParams): Promise<any> {
        let commonData;
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: params
                },
                addUrl: 'getTrafficsData',
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        if (result.code == 0) {
            commonData = result.data;
        } else {
            return null;
        }

        // writeData(moment().format("YYYY_MM_DD_hh_mm_ss") +".commonTraffic.json", commonData);

        let needMeiya = await meiyaJudge();
        if (!needMeiya) {
            return commonData;
        }

        let arr = await Promise.all([
            await getMeiyaTrainData(params),
            await getMeiyaFlightData(params)
        ]);
        let meiyaTrain = arr[0];
        let meiyaFlight = arr[1];
        compareFlightData(commonData, meiyaFlight);
        compareTrainData(commonData, meiyaTrain);
        // writeData(moment().format("YYYY_MM_DD_hh_mm_ss") +".meiyaTrain.json", meiyaTrain);
        // writeData(moment().format("YYYY_MM_DD_hh_mm_ss") +".meiyaFlight.json", meiyaFlight);

        // writeData(moment().format("YYYY_MM_DD_hh_mm_ss") +".finallyTraffic.json", commonData);
        return commonData;
    }

    @clientExport
    static async getTripTravelPolicy(travelPolicyId:string, destinationId:string){
        let result;
        try{
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: {
                        travelPolicyId: travelPolicyId,
                        destinationId: destinationId
                    }
                },
                addUrl: 'getTravelPolicy',
                model:"budget"
            })
        }catch(err) {
            console.log(err);
        }
        if(result.code == 0){
            return result.data;
        }else{
            return null;
        }
    }

    /**
    * @method getTravelPolicyBudget
    *
    * 获取合适差旅预算
    *
    * @param {Object} params 参数
    * @param {String} params.originPlace 出发地
    * @param {String} params.destinationPlace 目的地
    * @param {String} params.leaveDate 出发时间 YYYY-MM-DD
    * @param {String} [params.latestArriveTime] 最晚到达时间
    * @param {String} [params.leaveTime] 出发最晚到达时间 HH:mm
    * @param {String} [params.goBackDate] 返回时间(可选) YYYY-MM-DD
    * @param {String} [params.goBackTime] 返程最晚时间
    * @param {String} [params.checkInDate] 如果不传=leaveDate 入住时间
    * @param {String} [params.checkOutDate] 如果不传=goBackDate 离开时间
    * @param {String} [params.businessDistrict] 商圈ID
    * @param {Boolean} [params.isNeedHotel] 是否需要酒店
    * @param {Boolean} [params.isRoundTrip] 是否往返 [如果为true,goBackDate必须存在]
    * @param {Boolean} [params.isNeedTraffic] 是否需要交通
    * @param {Striing} [params.reason] 出差事由
    * @param {String} [params.hotelName] 住宿地标名称
    * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
    */
    @clientExport
    static async getTravelPolicyBudget(params: ICreateBudgetAndApproveParams): Promise<string> {
        // console.log("params===>", params);

        let staffId = params['staffId'];
        let preferedCurrency = params["preferedCurrency"];
        preferedCurrency = preferedCurrency && typeof (preferedCurrency) != 'undefined' ? preferedCurrency : DefaultCurrencyUnit;

        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let companyId = staff.company.id;
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw L.ERR.ERROR_CODE_C(500, `差旅标准还未设置`);
        }
        params.travelPolicyId = travelPolicy.id;

        if (!params.staffList) {
            params.staffList = [];
        }
        if (params.staffList.indexOf(staffId) < 0) {
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;
        let destinationPlacesInfo = params.destinationPlacesInfo;
        let _staff: any = {
            gender: staff.sex,
            policy: 'domestic',
        }
        let staffs = [_staff];
        let goBackPlace = params['goBackPlace'];
        // let priceLimitSegments: any =[];
        let segments: any[] = await Promise.all(destinationPlacesInfo.map(async (placeInfo) => {
            var segment: any = {};
            segment.city = placeInfo.destinationPlace;
            let city: Place = (await API.place.getCityInfo({cityCode: placeInfo.destinationPlace, companyId: companyId}));
            if (city.isAbroad) {
                let s = _.cloneDeep(_staff);
                s.policy = 'abroad';
                segment.staffs = [s];
            }

            segment.beginTime = placeInfo.latestArrivalDateTime;

            segment.endTime = placeInfo.earliestGoBackDateTime;
            segment.isNeedTraffic = placeInfo.isNeedTraffic;
            segment.isNeedHotel = placeInfo.isNeedHotel;

            let businessDistrict = placeInfo.businessDistrict;
            let gps = [];
            if (businessDistrict && /,/g.test(businessDistrict)) {
                gps = businessDistrict.split(/,/);
            } else {
                let obj;
                if (businessDistrict) {
                    obj = API.place.getCityInfo({cityCode: businessDistrict, companyId: companyId});
                }
                if (!obj || !obj.latitude || !obj.longitude) {
                    obj = city;
                }
                gps = [obj.latitude, obj.longitude];
            }
            segment.location = {
                longitude: gps[1],
                latitude: gps[0]
            }
            return segment;
        }));

        let segmentsBudget:any = await ApiTravelBudget.createNewBudget({
            preferedCurrency:preferedCurrency,
            travelPolicyId: travelPolicy['id'],
            companyId,
            staffs,
            segments,
            ret: params.isRoundTrip ? 1 : 0,
            fromCity: params.originPlace,
            backCity: params.goBackPlace,
            preferSet: staff.company.budgetConfig || {},
        });

        let cities = segmentsBudget.cities;
        let _budgets = segmentsBudget.budgets;
        let budgets = [];

        for (let i = 0, ii = cities.length; i < ii; i++) {
            let city = cities[i];

            let placeInfo = destinationPlacesInfo[i];

            //交通
            let traffic = _budgets[i].traffic;
            if (traffic && traffic.length) {
                let budget = traffic[0];
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;
                budget.tripType = ETripType.OUT_TRIP;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budget.type = budget.trafficType;
                budgets.push(budget);
            }

            //住宿
            let hotel = _budgets[i].hotel;
            if (hotel && hotel.length) {
                let budget = hotel[0];
                let cityObj = await API.place.getCityInfo({cityCode: city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({ where: { cityCode: cityObj.id, companyId: staff['companyId'] } });
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;

                    /* 出差时间计算 */
                    let residentPlace = await API.place.getCityInfo({ cityCode: budget.city });
                    let timezone = residentPlace.timezone && typeof (residentPlace.timezone) != undefined ?
                        residentPlace.timezone : 'Asia/shanghai';
                    let beginTime = moment(budget.checkInDate).tz(timezone).hour(12);
                    let endTime = moment(budget.checkOutDate).tz(timezone).hour(12);
                    let days = moment(endTime).diff(beginTime, 'days');
                    budget.price = budget.price * days;
                    /* 出差时间计算 END */
                }

                budget.hotelName = placeInfo ? placeInfo.hotelName : null;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budgets.push(budget);
            }


            //补助
            let subsidy = _budgets[i].subsidy;
            let destLength = destinationPlacesInfo.length;
            let lastDest = destinationPlacesInfo[destLength - 1];
            if (subsidy) {
                let budget = subsidy;
                budget.price = budget.price * count;
                if (budget.templates) {
                    budget.templates.forEach((t) => {
                        t.price = t.price * count;
                    })
                }
                budget.reason = placeInfo ? placeInfo.reason : lastDest.reason;
                budget.tripType = ETripType.SUBSIDY;
                budget.type = EInvoiceType.SUBSIDY;

                budgets.push(budget);
            }
        }

        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        await ApiTravelBudget.sendTripApproveNoticeToSystem({ cacheId: _id, staffId: staffId });
        return _id;



        function limitHotelBudgetByPrefer(min: number, max: number, hotelBudget: number) {
            if (hotelBudget == -1) {
                if (max != NoCityPriceLimit) return max;
                return hotelBudget;
            }
            if (min == NoCityPriceLimit && max == NoCityPriceLimit) return hotelBudget;

            if (max != NoCityPriceLimit && min > max) {
                let tmp = min;
                min = max;
                max = tmp;
            }

            if (hotelBudget > max) {
                if (max != NoCityPriceLimit) return max;
            }
            if (hotelBudget < min) {
                if (min != NoCityPriceLimit) return min;
            }
            return hotelBudget;
        }


    }

    //用于接收更新预算，并更新approve表和tripapprove上次
    @clientExport
    static async updateBudget(params: {approveId: string, budgets: any}) {
        let approve = await Models.approve.get(params.approveId);
        let budgetStep = approve.step;  //approve表中现有的是否为最终结果
     
        let queryParams = approve.data;
        if (typeof queryParams == 'string') {
            queryParams = JSON.parse(approve.data);
        }
        let destinationPlacesInfo = queryParams.query.destinationPlacesInfo;
        let count = queryParams.query.staffList.length;
        let staffId = queryParams.query['staffId'];
        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let companyId = staff.company.id;

        let budgetType = params.budgets.step;   //更新的预算是否是最终结果
        if (budgetStep == 'FIN') {
            budgetType = true;
        } else {
            budgetType = false;
        }  
        let cities = params.budgets.cities;
        let _budgets = params.budgets.budgets;
        let budgets = [];

        for (let i = 0, ii = cities.length; i < ii; i++) {
            let city = cities[i];

            let placeInfo = destinationPlacesInfo[i];

            //交通
            let traffic = _budgets[i].traffic;
            if (traffic && traffic.length) {
                let budget = traffic[0];
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;
                budget.tripType = ETripType.OUT_TRIP;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budget.type = budget.trafficType;
                budgets.push(budget);
            }

            //住宿
            let hotel = _budgets[i].hotel;
            if (hotel && hotel.length) {
                let budget = hotel[0];
                let cityObj = await API.place.getCityInfo({cityCode: city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({ where: { cityCode: cityObj.id, companyId: staff['companyId'] } });
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;

                    /* 出差时间计算 */
                    let residentPlace = await API.place.getCityInfo({ cityCode: budget.city });
                    let timezone = residentPlace.timezone && typeof (residentPlace.timezone) != undefined ?
                        residentPlace.timezone : 'Asia/shanghai';
                    let beginTime = moment(budget.checkInDate).tz(timezone).hour(12);
                    let endTime = moment(budget.checkOutDate).tz(timezone).hour(12);
                    let days = moment(endTime).diff(beginTime, 'days');
                    budget.price = budget.price * days;
                    /* 出差时间计算 END */
                }

                budget.hotelName = placeInfo ? placeInfo.hotelName : null;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budgets.push(budget);
            }


            //补助
            let subsidy = _budgets[i].subsidy;
            let destLength = destinationPlacesInfo.length;
            let lastDest = destinationPlacesInfo[destLength - 1];
            if (subsidy) {
                let budget = subsidy;
                budget.price = budget.price * count;
                if (budget.templates) {
                    budget.templates.forEach((t) => {
                        t.price = t.price * count;
                    })
                }
                budget.reason = placeInfo ? placeInfo.reason : lastDest.reason;
                budget.tripType = ETripType.SUBSIDY;
                budget.type = EInvoiceType.SUBSIDY;

                budgets.push(budget);
            }
        }


        let totalBudget = 0;
        if (budgets && budgets.length > 0) {
            budgets.forEach(function(item) {
                totalBudget += item.price;
            })
        }
        if (!budgetStep) {  //看表中的budget是否是最终结果，最终结果还没返回过，则更新approve表，表示还不可以进行审批
            approve.budget = totalBudget;
            await approve.save();
        } else {  //最终结果已经返回过，现在只用新预算中的最终结果进行比较，若大于现在显示的最终预算则更新，否则不更新
            if (approve.budget > totalBudget) {   //旧的预算大于新的预算，则不更新预算，显示现有预算
                await approve.save();
            } else {                    //旧的预算小于新的预算，则更新预算同时更新approve和tripApprove表
                if (budgetType) {  
                    approve.budget = totalBudget;
                    await approve.save();
                    let tripApproveUpdate = API.tripApprove.updateTripApprove({
                        budget: totalBudget
                    });
                }
                
            }  
        }
    }

    @clientExport
    static async getTravelPolicyBudgetNew(params: ICreateBudgetAndApproveParamsNew): Promise<any> {
        // console.log("params===>", params);

        let staffId = params['staffId'];
        let preferedCurrency = params["preferedCurrency"];
        preferedCurrency = preferedCurrency && typeof (preferedCurrency) != 'undefined' ? preferedCurrency : DefaultCurrencyUnit;

        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let companyId = staff.company.id;
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw L.ERR.ERROR_CODE_C(500, `差旅标准还未设置`);
        }
        params.travelPolicyId = travelPolicy.id;

        if (!params.staffList) {
            params.staffList = [];
        }
        if (params.staffList.indexOf(staffId) < 0) {
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;
        let destinationPlacesInfo = params.destinationPlacesInfo;
        let _staff: any = {
            gender: staff.sex,
            policy: 'domestic',
        }
        let staffs = [_staff];
        let goBackPlace = params['goBackPlace'];

        let feeCollectedType = params['feeCollectedType'];
        let feeCollected = params['feeCollected'];
        let departmentId: string = '';
        let projectId: string = '';
        if (feeCollectedType == 0) {
            departmentId = feeCollected;
        } else if (feeCollectedType == 1) {
            projectId = feeCollected;
        } else {

        }
        let approveUser: Staff = params['approveUser']; 
        // let priceLimitSegments: any =[];
        let segments: any[] = await Promise.all(destinationPlacesInfo.map(async (placeInfo) => {
            var segment: any = {};
            segment.city = placeInfo.destinationPlace;
            let city: Place = (await API.place.getCityInfo({cityCode: placeInfo.destinationPlace, companyId: companyId}));
            if (city.isAbroad) {
                let s = _.cloneDeep(_staff);
                s.policy = 'abroad';
                segment.staffs = [s];
            }

            segment.beginTime = placeInfo.latestArrivalDateTime;

            segment.endTime = placeInfo.earliestGoBackDateTime;
            segment.isNeedTraffic = placeInfo.isNeedTraffic;
            segment.isNeedHotel = placeInfo.isNeedHotel;

            let businessDistrict = placeInfo.businessDistrict;
            let gps = [];
            if (businessDistrict && /,/g.test(businessDistrict)) {
                gps = businessDistrict.split(/,/);
            } else {
                let obj;
                if (businessDistrict) {
                    obj = API.place.getCityInfo({cityCode: businessDistrict, companyId: companyId});
                }
                if (!obj || !obj.latitude || !obj.longitude) {
                    obj = city;
                }
                gps = [obj.latitude, obj.longitude];
            }
            segment.location = {
                longitude: gps[1],
                latitude: gps[0]
            }
            return segment;
        }));

        //创建approve，获得approveId用于URL和更新
        let approve = Models.approve.create({
            approveUser: params.approveUser.id,
            type: EApproveType.TRAVEL_BUDGET,
            data: params,
            staffList: params.staffList
        });
        approve = await approve.save();
        let approveId = approve.id;

        let segmentsBudget:any = await ApiTravelBudget.createNewBudget({
            approveId: approveId,   //TODO
            qmUrl: '',
            preferedCurrency:preferedCurrency,
            travelPolicyId: travelPolicy['id'],
            companyId,
            staffs,
            segments,
            ret: params.isRoundTrip ? 1 : 0,
            fromCity: params.originPlace,
            backCity: params.goBackPlace,
            preferSet: staff.company.budgetConfig || {},
        });

        let cities = segmentsBudget.cities;
        let _budgets = segmentsBudget.budgets;
        let budgets = [];

        for (let i = 0, ii = cities.length; i < ii; i++) {
            let city = cities[i];

            let placeInfo = destinationPlacesInfo[i];

            //交通
            let traffic = _budgets[i].traffic;
            if (traffic && traffic.length) {
                let budget = traffic[0];
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;
                budget.tripType = ETripType.OUT_TRIP;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budget.type = budget.trafficType;
                budgets.push(budget);
            }

            //住宿
            let hotel = _budgets[i].hotel;
            if (hotel && hotel.length) {
                let budget = hotel[0];
                let cityObj = await API.place.getCityInfo({cityCode: city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({ where: { cityCode: cityObj.id, companyId: staff['companyId'] } });
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;

                    /* 出差时间计算 */
                    let residentPlace = await API.place.getCityInfo({ cityCode: budget.city });
                    let timezone = residentPlace.timezone && typeof (residentPlace.timezone) != undefined ?
                        residentPlace.timezone : 'Asia/shanghai';
                    let beginTime = moment(budget.checkInDate).tz(timezone).hour(12);
                    let endTime = moment(budget.checkOutDate).tz(timezone).hour(12);
                    let days = moment(endTime).diff(beginTime, 'days');
                    budget.price = budget.price * days;
                    /* 出差时间计算 END */
                }

                budget.hotelName = placeInfo ? placeInfo.hotelName : null;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price = budget.price * count;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budgets.push(budget);
            }


            //补助
            let subsidy = _budgets[i].subsidy;
            let destLength = destinationPlacesInfo.length;
            let lastDest = destinationPlacesInfo[destLength - 1];
            if (subsidy) {
                let budget = subsidy;
                budget.price = budget.price * count;
                if (budget.templates) {
                    budget.templates.forEach((t) => {
                        t.price = t.price * count;
                    })
                }
                budget.reason = placeInfo ? placeInfo.reason : lastDest.reason;
                budget.tripType = ETripType.SUBSIDY;
                budget.type = EInvoiceType.SUBSIDY;

                budgets.push(budget);
            }
        }

        //计算总预算用于更新approve
        let totalBudget = 0;
        budgets.forEach(function(item) {
            totalBudget += item.price;
        })


        //get approveId from returned budget
        // let approveIdFromBudget; 
        // if (_budgets[0].traffic) {
        //     approveIdFromBudget = _budgets[0].traffic.request.approveId;
        // } else if (_budgets[0].hotel) {
        //     approveIdFromBudget = _budgets[0].hotel.request.approveId;
        // } else {
        //     console.log(' ---------------NO hotel or traffic return from jlbudget to qm-------------- ');
        // }
        
        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        
        //拿到预算后更新approve表
        let updateBudget = await Models.approve.get(approveId);
        let submitter = await Staff.getCurrent();
        updateBudget.submitter = submitter.id;
        updateBudget.data = obj;
        updateBudget.title = obj.query['projectName'];
        updateBudget.channel = submitter.company.oa;
        updateBudget.type = EApproveType.TRAVEL_BUDGET;
        updateBudget.approveUser = approveUser ? approveUser.id : null;
        updateBudget.staffList = obj.query.staffList;
        updateBudget.budget = totalBudget;
        await approve.save();
        




        
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        await ApiTravelBudget.sendTripApproveNoticeToSystem({ cacheId: _id, staffId: staffId });

        //TODO  yanfang  call the submitApprove
        // let approveParams = {
        //     approveId: approveIdFromBudget,
        //     budgetId: key,
        //     approveUser: approveUser,
        //     submiter: await Staff.getCurrent(),
        //     version: 2
        // };
        // await API.approve.submmitApproveNew(approveParams);
        return {approveId: approveId, budgetId: _id};



        function limitHotelBudgetByPrefer(min: number, max: number, hotelBudget: number) {
            if (hotelBudget == -1) {
                if (max != NoCityPriceLimit) return max;
                return hotelBudget;
            }
            if (min == NoCityPriceLimit && max == NoCityPriceLimit) return hotelBudget;

            if (max != NoCityPriceLimit && min > max) {
                let tmp = min;
                min = max;
                max = tmp;
            }

            if (hotelBudget > max) {
                if (max != NoCityPriceLimit) return max;
            }
            if (hotelBudget < min) {
                if (min != NoCityPriceLimit) return min;
            }
            return hotelBudget;
        }


    }

    static async sendTripApproveNoticeToSystem(params: { cacheId: string, staffId: string }) {
        let { cacheId, staffId } = params;
        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let company = staff.company;

        if (company.name != "鲸力智享") {

            try {
                await Promise.all(systemNoticeEmails.map(async function (s) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: { cacheId: cacheId, name: s.name, staffId: staffId }
                        })

                    } catch (err) {
                        console.error(err);
                    }
                }));
            } catch (err) {
                console.error('发送系统通知失败', err)
            }
        }
        return true;
    }

    @clientExport
    static async reportBudgetError(params: { budgetId: string }) {
        let staff = await Staff.getCurrent();
        let { budgetId } = params;
        let content = await ApiTravelBudget.getBudgetInfo({ id: budgetId, accountId: staff.id });
        let budgets = content.budgets;
        let ps = budgets.map(async (budget): Promise<any> => {
            if (!budget.id) {
                return true;
            }
            let log = await Models.travelBudgetLog.get(budget.id);
            log.status = -1;
            return log.save();
        });
        await Promise.all(ps);
        return true;
    }

    // params: IQueryBudgetParams
    static async createNewBudget(params: any){
        let result;
        try{
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: params
                },
                model:"budget"
            })
        }catch(err) {
            console.log(err);
        }
        return result.data;
    }

    static async getBudgetById(params: {id: string}){
        let result;
        try{
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'GET',
                    fields: params
                },
                model:"budget"
            })
        }catch(err) {
            console.log(err);
        }
        return result.data;
    }

    static __initHttpApp(app) {

        function _auth_middleware(req, res, next) {
            let key = req.query.key;
            if (!key || key != 'jingli2016') {
                return res.send(403)
            }
            next();
        }

        app.get("/api/budgets", _auth_middleware, function (req, res, next) {
            let { p, pz, type } = req.query;
            if (!p || !/^\d+$/.test(p) || p < 1) {
                p = 1;
            }
            if (!pz || !/^\d+$/.test(pz) || pz < 1) {
                pz = 5;
            }

            API.budget.getBudgetItems({ page: p, pageSize: pz, type: type, })
                .then((data) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(data);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, function (req, res, next) {
            let { query, prefers, policy, originData, type } = req.body;
            originData = JSON.parse(originData);
            query = JSON.parse(query);
            prefers = JSON.parse(prefers);

            return API.budget.debugBudgetItem({ query, originData, type, prefers })
                .then((result) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(result);
                })
                .catch(next);
        })
    }
}