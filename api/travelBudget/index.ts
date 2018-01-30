/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types'
import { ETripType, ICreateBudgetAndApproveParams, ICreateBudgetAndApproveParamsNew, QMEApproveStatus, EApproveResult, EBackOrGo } from "_types/tripPlan";
import {Approve, EApproveStatus} from '_types/approve';
import { Staff } from "_types/staff";
const API = require("@jingli/dnode-api");
import L from '@jingli/language';

require("moment-timezone");
const cache = require("common/cache");
const utils = require("common/utils");

let systemNoticeEmails = require('@jingli/config').system_notice_emails;
let config = require('@jingli/config');
export var NoCityPriceLimit = 0;
const DefaultCurrencyUnit = 'CNY';
import {restfulAPIUtil} from "api/restful";
import {
    getMeiyaFlightData,
    getMeiyaTrainData,
    getMeiyaHotelData,
    handleTrainData,
    handleFlightData,
    handelHotelsData,
    IMeiyaAuthData
} from "./meiya";
import {Application, Request, Response, NextFunction} from 'express';

let RestfulAPIUtil = restfulAPIUtil;

import { DB } from "@jingli/database";
import { EApproveType, STEP } from '_types/approve';
import { Transaction } from 'sequelize';
import {ECostCenterType} from "_types/costCenter/costCenter";

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

export enum EBudgetType {
    TRAFFIC = 1,
    HOTEL = 2,
    SUBSIDY = 3
}

export interface IQueryBudgetParams {
    fromCity?: ICity | string;       //出发城市
    backCity?: ICity | string;       //返回城市
    segments: any;      //每段查询条件
    ret: boolean;       //是否往返
    staffs: any;  //出差员工
    travelPolicyId?: string;
    companyId?: string;
    expiredBudget?: boolean;  //过期是否可以生成预算
    combineRoom?: boolean;   //同性是否合并
    isRetMarkedData?: boolean;
    preferedCurrency?: string;
}


// interface SegmentsBudgetResult {
//     id: string;
//     cities: string[];
//     /**
//      * 数组每一项为多人每段预算信息,分为交通与住宿
//      */
//     budgets: Array<{
//         hotel: any[],   //数组每项为每个人的住宿预算
//         traffic: any[]  //数组每项为每个人的交通预算
//         subsidy: any  //每个人的补助
//     }>
// }

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


export default class ApiTravelBudget {
    @clientExport
    static async getBudgetInfo(params: { id: string, accountId?: string }) {
        let {id, accountId} = params;
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
    static async sendSaleSteam(params: any) {
        try {
            await API.notify.submitNotify({
                key: 'qm_tmc',
                email: config.email_address.tmcsale,
                values: {orderTyp: params.orderType, passenger: params.passenger || []}
            });
            console.log("qm_tmc is ok");
        } catch (err) {
            console.error(err);
        }
    }


    @clientExport
    static async getHotelsData(params: ISearchHotelParams): Promise<any> {
        let commonData;
        // let result;
        // try {
        //     result = await RestfulAPIUtil.operateOnModel({
        //         params: {
        //             method: 'post',
        //             fields: params
        //         },
        //         addUrl: 'getHotelsData',
        //         model: "budget"
        //     })
        // } catch (err) {
        //     console.log(err);
        // }
        let companyInfo = await ApiTravelBudget.getCompanyInfo();
        let data = companyInfo;
        let authData: IMeiyaAuthData[] = [];
        data.map((item: {identify: any, sname: string}) => {
            let identify = item.identify;
            let sname = item.sname;
            authData.push({identify, sname});
            return authData
        })

        // if (result.code == 0) {
        //     commonData = result.data.data;
        // }

        // if (!commonData || typeof commonData == 'undefined')
        //     return [];
        // 检查是否需要美亚数据，返回美亚数据
        // let needMeiya = await meiyaJudge();
        // if (!needMeiya) {
        //     return commonData;
        // }
        if (config.tmcFake == 1) {
            console.log("getHotelsData ===> fake data.");
            return require("meiyaFake/finallyUsingHotel");
        } else {
            let meiyaHotel = await getMeiyaHotelData(params, authData);
            console.log("meiyaHotel ===> meiyaHotel data.", meiyaHotel.length)
            if (meiyaHotel && meiyaHotel.length)
                // commonData = compareHotelData(commonData, meiyaHotel);
                commonData = handelHotelsData(meiyaHotel, params);
            // writeData(moment().format("YYYY_MM_DD_hh_mm_ss") + ".finallyHotel.json", commonData);
            return commonData;
        }
    }

    @clientExport
    static async getTrafficsData(params: ISearchTicketParams): Promise<any> {
        let commonData = [];
        let commonData2 = [];
        // let result;
        // try {
        //     result = await RestfulAPIUtil.operateOnModel({
        //         params: {
        //             method: 'post',
        //             fields: params
        //         },
        //         addUrl: 'getTrafficsData',
        //         model: "budget"
        //     })
        //
        // } catch (err) {
        //     console.log(err);
        // }




        let companyInfo = await ApiTravelBudget.getCompanyInfo(); 
        let data = companyInfo;
        let authData: IMeiyaAuthData[] = [];
        data.map((item: {identify: any, sname: string}) => {
            let identify = item.identify;
            let sname = item.sname;
            authData.push({identify, sname});
            return authData
        });

        // if (result.code == 0) {
        //     commonData = result.data.data;
        // }
        //
        // if (!commonData || typeof commonData == 'undefined')
        //     return [];
        //检查是否需要美亚数据，返回美亚数据
        // let needMeiya = await meiyaJudge();
        // if (!needMeiya) {
        //     return commonData;
        // }
        // console.log("commonData ===> commonData data.", commonData.length)
        if (config.tmcFake == 1) {
            console.log("getTrafficsData ===> fake data.")
            return require("meiyaFake/finallyUsingTraffic");
        } else {
            let arr = await Promise.all([
                await getMeiyaTrainData(params, authData),
                await getMeiyaFlightData(params, authData)
            ]);
            let meiyaTrain = arr[0];
            let meiyaFlight = arr[1];
            console.log("meiyaFlight ===> meiyaFlight data.", meiyaFlight.length);
            console.log("meiyaTrain ===> meiyaTrain data.", meiyaTrain.length);
            if (meiyaFlight && meiyaFlight.length)
            //     commonData = compareFlightData(commonData, meiyaFlight);
                commonData = handleFlightData(meiyaFlight,params);
            if (meiyaTrain && meiyaTrain.length)
            // commonData = compareTrainData(commonData, meiyaTrain);
                 commonData2 = handleTrainData(meiyaTrain, params)
            console.log("commonData ===> commonData data.", typeof (commonData));
            return [...commonData, ...commonData2];
        }
    }

    @clientExport
    static async getTripTravelPolicy(travelPolicyId: string, destinationId: string) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: {
                        travelPolicyId: travelPolicyId,
                        destinationId: destinationId
                    }
                },
                addUrl: 'getTravelPolicy',
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        if (result && result.code == 0) {
            return result.data;
        } else {
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

        /*let staffId = params['staffId'];
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

        if(params.costCenterId){
            let cc = await Models.costCenter.get(params.costCenterId);
            if(cc.type == ECostCenterType.PROJECT){
                let pts = await Models.projectStaffTravelPolicy.all({where: {staffId: staffId, projectId: params.projectId}, order: [['createdAt', 'desc']]});
                if(pts && pts.length){
                    params.travelPolicyId = pts[0].travelPolicyId;
                }
            }

        }

        if (!params.staffList) {
            params.staffList = [];
        }
        if (params.staffList.indexOf(staffId) < 0) {
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;
        let destinationPlacesInfo = params.destinationPlacesInfo;
        let _staff = {
            gender: staff.sex,
            policy: 'domestic',
        }
        let staffs = [_staff];
        // let priceLimitSegments: any =[];
        let segments = await Promise.all(destinationPlacesInfo.map(async (placeInfo) => {
            var segment: {
                city: string, staffs: object, beginTime: Date, endTime: Date,
                isNeedTraffic: boolean, isNeedHotel: boolean, location:{
                    latitude: number, longitude: number
                }
            }
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
                let cityObj = await API.place.getCityInfo({cityCode: budget.city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({ where: { cityCode: cityObj.id, companyId: staff['companyId'] } });
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;

                    /!* 出差时间计算 *!/
                    let timezone = cityObj.timezone || 'Asia/shanghai';
                    let beginTime = moment(budget.checkInDate).tz(timezone).hour(12);
                    let endTime = moment(budget.checkOutDate).tz(timezone).hour(12);
                    let days = moment(endTime).diff(beginTime, 'days');
                    budget.price = budget.price * days;
                    /!* 出差时间计算 END *!/
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
                    budget.templates.forEach((t: {price: number}) => {
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
        return _id;*/

        //     function limitHotelBudgetByPrefer(min: number, max: number, hotelBudget: number) {
        //         if (hotelBudget == -1) {
        //             if (max != NoCityPriceLimit) return max;
        //             return hotelBudget;
        //         }
        //         if (min == NoCityPriceLimit && max == NoCityPriceLimit) return hotelBudget;

        //         if (max != NoCityPriceLimit && min > max) {
        //             let tmp = min;
        //             min = max;
        //             max = tmp;
        //         }

        //         if (hotelBudget > max) {
        //             if (max != NoCityPriceLimit) return max;
        //         }
        //         if (hotelBudget < min) {
        //             if (min != NoCityPriceLimit) return min;
        //         }
        //         return hotelBudget;
        //     }

        return null;

    }

    //用于接收更新预算，并更新approve表和tripapprove上次
    @clientExport
    static async updateBudget(params: { approveId: string, budgetResult: any, isFinalFirstResponse?: boolean }) {

        console.log('updateBudtetApproveId=======', params.approveId);
        let approve = await Models.approve.get(params.approveId);

        // check tripApprove status; if passed, rejected or locked, the budget will not be updated
        let checkTripApproveStatus = await API.tripApprove.getTripApprove({id: approve.id});
        let lockBudget: boolean = checkTripApproveStatus ? checkTripApproveStatus['lockBudget'] : null;
        let tripApproveStatus = checkTripApproveStatus ? checkTripApproveStatus['status'] : null;

        if (approve.status == EApproveStatus.UNDO ||(tripApproveStatus && (tripApproveStatus == QMEApproveStatus.PASS ||
             tripApproveStatus == QMEApproveStatus.REJECT)) || lockBudget) {
            console.log('tripApproveStatus----->  ', tripApproveStatus);
            console.log('lockBudget------------->   ', lockBudget);
            console.log('NO UPDATE BUDGET ANY MORE');
        } else {  // else update as usual
            let isFinalInApprove: boolean = false;
            let approveStep = approve.step;  //approve表中现有的是否为最终结果 budgetStep
            if (approveStep == STEP.FINAL) {
                isFinalInApprove = true;
            }

            let queryParams = approve.data;
            if (typeof approve.data == 'string') {
                queryParams = JSON.parse(approve.data);
            }

            let staffId = queryParams.query['staffId'];
            if (!staffId || staffId == 'undefined') {
                staffId = approve.submitter;
            }

            let staff = await Models.staff.get(staffId);
            let companyId = staff.company.id;

            let _budgets = params.budgetResult.budgets;
            let ps: Promise<any>[] = _budgets.map(async (item: ICreateBudgetAndApproveParamsNew) => {
                return await ApiTravelBudget.transformBudgetData(item, companyId);
            });
            let budgets = await Promise.all(ps);
            // console.log("budgets budgets budgets ====>", budgets.length, budgets);
            let totalBudget = 0;
            if (budgets && budgets.length > 0) {
                budgets.forEach(function (item) {
                    totalBudget += item.price;
                })
            }

            // console.log('--------update totalBudget------', totalBudget);
            //TODO 如果分段 有一段是FIN 要走那一条 ？？？lizeilin
            if (!isFinalInApprove || params.isFinalFirstResponse) {  //看表中的budget是否是最终结果，最终结果还没返回过，则更新approve表，表示还不可以进行审批，或者是第一次请求时候返回为最终结果
                console.log('first time--------------');
                approve.budget = totalBudget;
                approve.step = params.budgetResult.step;
                if (typeof approve.data == 'string') {
                    approve.data = JSON.parse(approve.data);
                }
                approve.data = {budgets: budgets, query: approve.data.query};
                approve = await approve.save();
                console.log('approve.step---------------->', approve.step);
                if (approve.step === STEP.FINAL) {
                    console.log('------------enter FIN---------');
                    let params = {approveNo: approve.id};
                    let tripApprove = await API.tripApprove.retrieveDetailFromApprove(params);

                    let returnApprove = await API.eventListener.sendEventNotice({ eventName: "NEW_TRIP_APPROVE", data: tripApprove, companyId: approve.companyId });
                    if(returnApprove){
                        let tripPlanLog = Models.tripPlanLog.create({
                            tripPlanId: approve.id,
                            userId: approve.submitter,
                            remark: '提交审批单，等待审批',
                            approveStatus: EApproveResult.WAIT_APPROVE
                        });
                        await tripPlanLog.save();
                        await API.tripApprove.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
                    }

                }
            } else {  //最终结果已经返回过，现在只用新预算中的最终结果进行比较，若大于现在显示的最终预算则更新，否则不更新
                console.log('second time------------->');
                if (approve.budget > totalBudget) {   //旧的预算大于新的预算，则不更新预算，显示现有预算
                    console.log('all little')
                    await approve.save();
                    API.broadcast(`tripApproveBudgetUpdate:${approve.id}`, 'FIN', 'SAME');
                    console.log('send to app============', `tripApproveBudgetUpdate:${approve.id}`);
                } else {                    //旧的预算小于新的预算，则更新预算同时更新approve和tripApprove表
                    console.log('isFinalInBudget', params.budgetResult.step);
                    if (params.budgetResult.step == STEP.FINAL) {
                        console.log('ENTER isFinalInBudget');
                        // await Bluebird.delay(5000);
                        approve.budget = totalBudget;
                        await approve.save();
                        console.log('-----------update traipApprove;,', totalBudget);
                        await API.tripApprove.updateTripApprove({
                            id: approve.id,
                            budget: totalBudget,
                            companyId: companyId,
                            budgetInfo: budgets
                        });
                        console.log('asdfadfasdfbroadcast===========');
                        console.log(`'tripApproveBudgetUpdate:'${approve.id}`);
                        API.broadcast('tripApproveBudgetUpdate:' + approve.id, 'FIN', 'UPDATED');
                    }
                }
            }
        }
    }


    /**
     * @method getTravelPolicyBudgetNew
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
    static async getTravelPolicyBudgetNew(params: ICreateBudgetAndApproveParamsNew, isIntoApprove: boolean, approveId?: string): Promise<any> {

        let staffId = params['staffId'];
        let preferedCurrency = params["preferedCurrency"];
        preferedCurrency = preferedCurrency && typeof (preferedCurrency) != 'undefined' ? preferedCurrency : DefaultCurrencyUnit;

        let tripNumCost = 0;  //企业行程点数花费

        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let companyId = staff.companyId;
        let company = await Models.company.get(companyId);
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw L.ERR.ERROR_CODE(500, `差旅标准还未设置`);
        }
        params.travelPolicyId = travelPolicy.id;

        if(params.feeCollected){
            let cc = await Models.costCenter.get(params.feeCollected);
            if(cc && cc.type == ECostCenterType.PROJECT){
                let pts = await Models.projectStaffTravelPolicy.all({where: {staffId: staffId, projectId: params.feeCollected}, order: [['createdAt', 'desc']]});
                if(pts && pts.length){
                    params.travelPolicyId = pts[0].travelPolicyId;
                }
            }

        }

        if (!params.staffList) {
            params.staffList = [];
        }
        if (params.staffList.indexOf(staffId) < 0) {
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;
        let staffs = [];
        for (let i = 0; i < count; i++) {
            let staff = params.staffList[i];
            let _staff = await Models.staff.get(staff);
            let __staff: any = {
                gender: _staff.sex,
                policy: 'domestic',
            };
            staffs.push(__staff);
        }
        

        let feeCollectedType = params['feeCollectedType'];
        let feeCollected = params['feeCollected'];
        let departmentId: string = '';
        let projectId: string = '';
        let feeCollectedName = '';
        if (feeCollectedType == 0) {
            departmentId = feeCollected;
            let department = await Models.department.get(departmentId);
            feeCollectedName = department.name;

        } else if (feeCollectedType == 1) {
            projectId = feeCollected;
            let project = await Models.project.get(projectId);
            feeCollectedName = project.name;
        }
        let approveUser: Staff = params['approveUser'];

        if (approveId) {
            let checkApprove = await Models.approve.get(approveId);
            let approveStatus = checkApprove['tripApproveStatus'];
            if (approveStatus == QMEApproveStatus.PASS || approveStatus == QMEApproveStatus.REJECT ||
                approveStatus == QMEApproveStatus.CANCEL) {  //若审批已通过、驳回或已撤销，锁定budget不再更新
                await API.tripApprove.updateTripApprove({id: approveId, lockBudget: true});
            } else {   // 否则将lockBudget标示置回初始值，接受budget更新
                await API.tripApprove.updateTripApprove({id: approveId, lockBudget: false});
            }
        }

        let approve;
        if (!isIntoApprove) {  //判断是否是审批人查看审批单时进行的第二次拉取数据 
            //创建approve，获得approveId用于URL和更新
            approve = Approve.Create({
                approveUser: params.approveUser.id,
                type: EApproveType.TRAVEL_BUDGET,
                companyId: companyId,
                staffList: params.staffList,
                submitter: staffId,
                tripApproveStatus: QMEApproveStatus.WAIT_APPROVE,
                title: feeCollectedName
            });
            approveId = approve.id;
            console.log('createApproveId', approveId);
        }


        console.log('approve--------, created, save', approveId);
        let budgetResult: any = await ApiTravelBudget.createNewBudget({
            callbackUrl: `${config.host}/api/v1/budget/${approveId}/updateBudget`,
            preferedCurrency: preferedCurrency,
            travelPolicyId: travelPolicy['id'],
            companyId,
            staffs,
            destinationPlacesInfo: params.destinationPlacesInfo,
            originPlace: params.originPlace,
            isRoundTrip: params.isRoundTrip,        //是否为往返
            goBackPlace: params.goBackPlace         //返回地
        });

        

        let segmentsBudget = budgetResult.budgets;


        let ps: Promise<any>[] = segmentsBudget.map(async (item: any) => {
            return await ApiTravelBudget.transformBudgetData(item, companyId);
        });
        let budgets = await Promise.all(ps);


        //计算总预算用于更新approve
        let eachBudgetSegIsOk: boolean = true;
        let totalBudget = 0;
        budgets.forEach(function (item) {
            if (item.tripType != ETripType.SUBSIDY) {
                tripNumCost = tripNumCost + 1;
            }
            if (item.price < 0) {
                eachBudgetSegIsOk = false;
            }
            totalBudget += item.price;
        })
        if (params && params.staffList) {
            tripNumCost *= params.staffList.length;
        }
        console.log('eachBudgetSet-----------', eachBudgetSegIsOk);
        if (eachBudgetSegIsOk && !isIntoApprove) {
            await approve.save();
        } 
        if (!eachBudgetSegIsOk) {
            throw new Error('预算有负值,提交失败');
        }
        

        console.log("======== ******************************** =====> ");
        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();

        await DB.transaction(async function (t: Transaction) {
            let result = await API.company.verifyCompanyTripNum({
                tripNum: tripNumCost,
                companyId: company.id,
                accountId: staff.id,
                query: params,
                isCheckTripNumStillLeft: (isIntoApprove && eachBudgetSegIsOk) //领导查看审批单时，要检查企业剩余流量包数是否足够
            });
            console.log('isCheckTripNumStillLeft', isIntoApprove && eachBudgetSegIsOk);
            obj.query['frozenNum'] = result.frozenNum;
            await company.frozenTripPlanNum(result.frozenNum); //企业冻结行程点数

            //拿到预算后更新approve表
            if (!isIntoApprove && eachBudgetSegIsOk) {//判断是否是审批人查看审批单时进行的第二次拉取数据
                let updateBudget = await Models.approve.get(approveId);
                // let submitter = await Staff.getCurrent();
                let submitter = await Models.staff.get(staff.id);
                updateBudget.submitter = submitter.id;
                updateBudget.data = obj;
                updateBudget.channel = submitter.company.oa;
                updateBudget.type = EApproveType.TRAVEL_BUDGET;
                updateBudget.approveUser = approveUser ? approveUser.id : null;
                updateBudget.staffList = obj.query.staffList;
                updateBudget.budget = totalBudget;
                updateBudget.step = budgetResult.step;

                console.log("approveId =======>", updateBudget.id);
                await updateBudget.save();
            }
            console.log('--------budgetResult', budgetResult.step);
            if (budgetResult.step == 'FIN' && eachBudgetSegIsOk) {
                console.log('updateBudget first time');
                await ApiTravelBudget.updateBudget({
                    approveId: approveId,
                    budgetResult: budgetResult,
                    isFinalFirstResponse: (isIntoApprove ? false : true)
                });
            }

            console.log('UPDATE-----BUDGET----',);
        }).catch(async function (err: Error) {
            if (err) {
                // company.extraTripPlanFrozenNum = extraTripPlanFrozenNum;
                // company.tripPlanFrozenNum = originTripPlanFrozenNum;
                await company.reload();
                console.info(err);
                throw new Error("提交审批失败");
            }
        });

        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        await ApiTravelBudget.sendTripApproveNoticeToSystem({cacheId: _id, staffId: staffId});

        return {approveId: approveId, budgetId: _id};
    }

    //获取公司信息
    static async getCompanyInfo(sname?:string): Promise<any> {
        let currentStaff = await Staff.getCurrent();
        let staffId = currentStaff.id;
        let staff = await Models.staff.get(staffId);
        let companyId = staff.company.id;
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'put',
                    fields: {
                        companyId: companyId,
                        sname
                    }
                },
                addUrl: `${companyId}/data`,
                model: "TmcSupplier"
            })
            return result.data
        } catch (err) {
            console.log(err);
        }

    }

    static async transformBudgetData(budget: any, companyId: string) {
        budget.index = budget.index;
        delete budget.markedScoreData;
        delete budget.prefers;
        switch (budget.type) {
            case EBudgetType.HOTEL:
                let cityObj = await API.place.getCityInfo({cityCode: budget.city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({where: {cityCode: cityObj.id, companyId}});
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;
               }

                budget.hotelName = budget.name;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price = budget.price;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                return budget;

            case EBudgetType.TRAFFIC:
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;

                budget.price = budget.price;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budget.type = budget.trafficType;
                budget.tripType = ETripType.OUT_TRIP;
                if(budget.backOrGo == EBackOrGo.BACK_TRIP){
                    budget.tripType = ETripType.BACK_TRIP;
                }
                return budget;

            case EBudgetType.SUBSIDY:
                budget.price = budget.price;
                budget.tripType = ETripType.SUBSIDY;
                if (budget.templates) {
                    budget.templates.forEach((t: any) => {
                        t.price = t.price;
                    })
                }
                return budget;
            default:
                return budget;
        }
    }


    static async sendTripApproveNoticeToSystem(params: { cacheId: string, staffId: string }) {
        let {cacheId, staffId} = params;
        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let company = staff.company;

        if (company.name != "鲸力智享") {

            try {
                await Promise.all(systemNoticeEmails.map(async function (s: {
                    email: string, name: string
                }) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: {cacheId: cacheId, name: s.name, staffId: staffId}
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
        let {budgetId} = params;
        let content = await ApiTravelBudget.getBudgetInfo({id: budgetId, accountId: staff.id});
        let budgets = content.budgets;
        let ps = budgets.map(async (budget: any): Promise<any> => {
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
    static async createNewBudget(params: any) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: params
                },
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        if(!result || !result.data) {
            throw new Error("拉取预算失败");
        }
        return result.data;
    }

    static async getBudgetById(params: { id: string }) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'GET',
                    fields: params
                },
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        return result.data;
    }

    static __initHttpApp(app: Application) {

        function _auth_middleware(req: Request, res: Response, next: NextFunction) {
            let key = req.query.key;
            if (!key || key != 'jingli2016') {
                return res.send(403)
            }
            next();
        }

        app.get("/api/budgets", _auth_middleware, function (req, res, next) {
            let {p, pz, type} = req.query;
            if (!p || !/^\d+$/.test(p) || p < 1) {
                p = 1;
            }
            if (!pz || !/^\d+$/.test(pz) || pz < 1) {
                pz = 5;
            }

            API.budget.getBudgetItems({page: p, pageSize: pz, type: type,})
                .then((data: any) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(data);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, function (req, res, next) {
            let {query, prefers, originData, type} = req.body;
            originData = JSON.parse(originData);
            query = JSON.parse(query);
            prefers = JSON.parse(prefers);

            return API.budget.debugBudgetItem({query, originData, type, prefers})
                .then((result: any) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(result);
                })
                .catch(next);
        })
    }
}

/* as ICreateBudgetAndApproveParamsNew; */

// setTimeout(async ()=>{
//     console.log("test go go");
//     let result = await ApiTravelBudget.getTravelPolicyBudgetNew(params, false);

// }, 8000);