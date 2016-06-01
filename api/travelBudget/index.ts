/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from 'common/api/helper';
import {Models } from 'api/_types'
import {ETripType, EInvoiceType} from "../_types/tripPlan";
import {Staff} from "../_types/staff";
const API = require("common/api");
const validate = require("common/validate");
const L = require("common/language");
const moment = require('moment');
const cache = require("common/cache");
const utils = require("common/utils");

const defaultPrice = {
    "5": 500,
    "4": 450,
    "3": 400,
    "2": 350
}

interface TravelBudgeItem {
    price: number;
    type?: EInvoiceType;
    tripType?: ETripType;
}

interface BudgetOptions{
    originPlace: string,
    destinationPlace: string,
    leaveDate: Date| string,
    goBackDate?: Date| string,
    isNeedHotel: boolean,
    goBackTime?: string,
    leaveTime?: string,
    checkInDate?: Date| string,
    checkOutDate?: Date|string,
    businessDistrict?: string,
    isRoundTrip: boolean,
    isNeedTraffic: boolean
}

class ApiTravelBudget {

    @clientExport
    static getBudgetInfo(params: {id: string}) {
        let {accountId} = Zone.current.get('session');
        let key = `budgets:${accountId}:${params.id}`;
        return cache.read(key);
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
    * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
    */
    @clientExport
    static async getTravelPolicyBudget(params: BudgetOptions) :Promise<string> {
        let {accountId} = Zone.current.get('session');
        let staff = await Models.staff.get(accountId);
        let travelPolicy = await Models.travelPolicy.get(staff['travelPolicyId']);
        let self: any = this;
        let {leaveDate, goBackDate, isRoundTrip, originPlace, destinationPlace, checkInDate,
            checkOutDate, businessDistrict, leaveTime, goBackTime, isNeedHotel, isNeedTraffic} = params;

        if (!Boolean(leaveDate)) {
            throw L.ERR.LEAVE_DATE_FORMAT_ERROR();
        }

        if (!isNeedTraffic && !isNeedHotel) {
            throw new Error("住宿和交通不能同时不需要");
        }

        let momentDateFormat = "YYYY-MM-DD";
        //住宿需要参数
        if (isNeedHotel) {
            if (!Boolean(checkInDate)) {
                checkInDate = leaveDate;
            }
            if (!Boolean(checkOutDate)) {
                checkOutDate = goBackDate;
            }
            if (!validate.isDate(checkInDate)) {
                checkInDate = moment(checkInDate).format(momentDateFormat);
            }
            if (!validate.isDate(checkOutDate)) {
                checkOutDate = moment(checkOutDate).format(momentDateFormat);
            }
        }
        //返程需要参数
        if (isRoundTrip){
            if (!Boolean(goBackDate)) throw L.ERR.GO_BACK_DATE_FORMAT_ERROR();
            if (!validate.isDate(goBackDate as string)) {
                goBackDate = moment(goBackDate).format(momentDateFormat);
            }
        }

        //去程参数
        if (isNeedTraffic && !leaveDate) {
            throw L.ERR.LEAVE_DATE_FORMAT_ERROR();
        } else if (!validate.isDate(leaveDate as string)){
            leaveDate = moment(leaveDate).format(momentDateFormat);
        }

        if (isNeedTraffic && !originPlace) {
            throw L.ERR.CITY_NOT_EXIST();
        }
        if (!destinationPlace) {
            throw L.ERR.CITY_NOT_EXIST();
        }

        let budgets = [];

        if (isNeedTraffic) {
            //去程预算
            let budget = await ApiTravelBudget.getTrafficBudget.call(self, {
                originPlace: originPlace,
                destinationPlace: destinationPlace,
                leaveDate: leaveDate,
                leaveTime: leaveTime
            });
            budget.tripType = ETripType.OUT_TRIP;
            budgets.push(budget);
        }

        if (isNeedTraffic && isRoundTrip) {
            let budget = await ApiTravelBudget.getTrafficBudget.call(self, {
                originPlace: destinationPlace,
                destinationPlace: originPlace,
                leaveDate: goBackDate,
                leaveTime: goBackTime
            });
            budget.tripType = ETripType.BACK_TRIP;
            budgets.push(budget);
        }

        if (isNeedHotel) {
            let budget = await ApiTravelBudget.getHotelBudget.call(self, {
                cityId: destinationPlace,
                businessDistrict: businessDistrict,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate
            });
            budget.tripType = ETripType.HOTEL;
            budgets.push(budget);
        }


        if (Boolean(travelPolicy['subsidy']) && travelPolicy['subsidy'] > 0) {
            let budget: any = {};
            budget.tripType = ETripType.SUBSIDY;
            budget.price = travelPolicy['subsidy'];
            budgets.push(budget);
        }

        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${accountId}:${_id}`;
        await cache.write(key, JSON.stringify(obj))
        return _id;
    }

    /**
     * @method getHotelBudget
     *
     * 获取酒店住宿预算
     *
     * @param {Object} params
     * @param {UUID} params.accountId 账号ID
     * @param {String} params.cityId    城市ID
     * @param {String} params.businessDistrict 商圈ID
     * @param {String} params.checkInDate 入住时间
     * @param {String} params.checkOutDate 离开时间
     * @return {Promise} {prize: 1000, hotel: "酒店名称"}
     */
    @clientExport
    static async getHotelBudget(params: {cityId: string, businessDistrict: string,
        checkInDate: string, checkOutDate: string}) :Promise<TravelBudgeItem> {

        let self: any = this;
        let accountId = self.accountId;
        let {cityId, businessDistrict, checkInDate, checkOutDate} = params;

        if (!Boolean(cityId)) {
            throw L.ERR.CITY_NOT_EXIST();
        }

        if (!checkInDate || !validate.isDate(checkInDate)) {
            throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR();
        }

        if (!checkOutDate || !validate.isDate(checkOutDate)) {
            throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR();
        }

        if (new Date(checkOutDate) < new Date(checkInDate)) {
            throw {code: -1, msg: "离开日期大于入住日期"};
        }

        // let staff = await API.staff.getStaff({id: accountId});
        var staff = await Staff.getCurrent();
        if (!staff || !staff["travelPolicyId"]) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();
        let hotelStar: number = 3;
        if (!policy) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        if (/二星级/g.test(policy.hotelLevel)) {
            hotelStar = 2;
        }

        if (/三星级/g.test(policy.hotelLevel)) {
            hotelStar = 3;
        }

        if (/四星级/g.test(policy.hotelLevel)) {
            hotelStar = 4;
        }
        if (/五星级/g.test(policy.hotelLevel)) {
            hotelStar = 5;
        }
        let data = {
            maxMoney: policy.hotelPrice,
            hotelStar: hotelStar,
            cityId: cityId,
            businessDistrict: businessDistrict,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate
        }

        let budget = await API.travelbudget.getHotelBudget(data);
        let days = moment(checkOutDate).diff(checkInDate, 'days');
        if (!budget.price || budget.price < 0) {
            days = days<= 0 ? 1 :days;
            if (policy.hotelPrice) {
                budget = {price: policy.hotelPrice * days, type: EInvoiceType.HOTEL} as TravelBudgeItem;
            } else {
                budget = {price: defaultPrice[hotelStar] * days, type: EInvoiceType.HOTEL} as TravelBudgeItem;
            }
        }
        return budget;
    }

    /**
     * @method getTrafficBudget
     * 获取交通预算
     *
     * @param {String} params.originPlace 出发地
     * @param {String} params.destinationPlace 目的地
     * @param {String} params.leaveDate 出发时间 YYYY-MM-DD
     * @param {String} params.leaveTime 最晚到达时间 HH:mm
     * @return {Promise} {price: "1000"}
     */
    @clientExport
    static async getTrafficBudget(params: {originPlace: string, destinationPlace: string,
        leaveDate: Date | string, leaveTime: string}) : Promise<TravelBudgeItem> {

        let {originPlace, destinationPlace, leaveDate, leaveTime} = params;
        let {accountId} = Zone.current.get('session');

        if (!destinationPlace) {
            throw new Error(JSON.stringify({code: -1, msg: "目的地城市信息不存在"}));
        }

        if (!originPlace) {
            throw new Error(JSON.stringify({code: -1, msg: "出发城市信息不存在"}));
        }

        if (!leaveDate) {
            throw {code: -1, msg: "出发时间不存在"};
        }

        //查询员工信息
        // staff.travelPolicyId = "dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a";
        let staff = await Staff.getCurrent();

        if (!staff || !staff['travelPolicyId']) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }

        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();

        if (!policy) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }

        let cabinClass = '';
        if (policy.planeLevel == '经济舱') {
            cabinClass = 'Economy';
        } else if (policy.planeLevel == '高端经济舱') {
            cabinClass = 'PremiumEconomy'
        } else if (policy.planeLevel == '商务舱') {
            cabinClass = 'Business';
        } else if (policy.planeLevel == '头等舱') {
            cabinClass = 'First';
        }

        let trainCabinClass = '二等座,硬卧';
        if (policy.trainLevel) {
            trainCabinClass = policy.trainLevel;
            trainCabinClass = trainCabinClass.replace(/\//g, ",");
        }
        if (leaveDate && !validate.isDate(leaveDate)) {
            leaveDate = moment(leaveDate).format("YYYY-MM-DD");
        }


        let budget = await API.travelbudget.getTrafficBudget({
                        originPlace: originPlace,
                        destinationPlace: destinationPlace,
                        leaveDate: leaveDate,
                        leaveTime: leaveTime,
                        cabinClass: cabinClass,
                        trainCabinClass: trainCabinClass
                    }) as TravelBudgeItem;

        return budget;
    }
}

//
// export function getBookUrl(params: {spval: string, epval:string, st: string, et: string}) :Promise<string> {
//     let spval = params.spval,
//         epval = params.epval,
//         st = params.st,
//         et = params.et,
//         url = "";
//     if(!st || st == "" ){
//         throw {code:-1, msg:"出发时间不能为空"};
//     }
//     return Promise.all([
//             API.place.getCityInfo({cityCode: spval}),
//             API.place.getCityInfo({cityCode: epval})
//         ])
//         .spread<string>(function(deptCity, endPlace){
//             let scode = "",
//                 ecode = "";
//             if(deptCity && deptCity.skyCode){
//                 scode = deptCity.skyCode.split("-")[0].toLowerCase();
//             }
//             if(endPlace && endPlace.skyCode){
//                 ecode = endPlace.skyCode.split("-")[0].toLowerCase();
//             }
//             if(et && et != ""){
//                 url = "http://www.tianxun.com/round-"+ scode +"-"+ ecode +".html?depdate="+st+"&rtndate="+et+"&cabin=Economy";
//             }else{
//                 url = "http://www.tianxun.com/oneway-"+ scode +"-"+ ecode +".html?depdate="+st+"&cabin=Economy";
//             }
//             return url;
//         })
// }


//
// /**
//  *@method getBookListUrl
//  * 得到飞机 火车 酒店预订列表链接
//  * @param params
//  * @param params.spval  出发城市id或出发地名称
//  * @param params.epval  目的地城市id或目的地名称
//  * @param params.st      出发时间
//  * @param params.hotelCity   订酒店城市
//  * @param params.hotelAddress  酒店所在商圈
//  * @param params.type 类型 air (飞机) train（火车） hotel（酒店）
//  * @param params.from 设备 computer (电脑) mobile（手机）
//  * @param params.hotelSt 住宿开始时间
//  * @param params.hotelEt 住宿结束时间
//  * @returns {*}
//  */
// export function getBookListUrl(params: {spval: string, epval: string, st: string, hotelCity: string,
//     hotelAddress: string, type: string, from: string, hotelSt: string, hotelEt: string}) :Promise<string> {
//     let spval = params.spval,
//         epval = params.epval,
//         st = params.st,
//         hotelCity = params.hotelCity,
//         hotelAddress = params.hotelAddress,
//         type = params.type,
//         from = params.from,
//         hotelSt = params.hotelSt,
//         hotelEt = params.hotelEt,
//         url = "";
//     if(!type || type == "" ){
//         throw {code:-1, msg:"类型不能为空"};
//     }
//     if(type == "air"){
//         if(!spval || spval == "" ){
//             throw {code:-1, msg:"出发城市不能为空"};
//         }
//         if(!epval || epval == "" ){
//             throw {code:-1, msg:"目的地不能为空"};
//         }
//         if(!st || st == "" ){
//             throw {code:-1, msg:"出发时间不能为空"};
//         }
//         st = moment(st).format('YYYY-MM-DD');
//         return Promise.all([
//                 API.place.getCityInfo({cityCode: spval}),
//                 API.place.getCityInfo({cityCode: epval})
//             ])
//             .spread<string>(function(deptCity, endPlace){
//                 let scode = "",
//                     ecode = "";
//                 if(deptCity && deptCity.skyCode){
//                     scode = deptCity.skyCode.split("-")[0].toLowerCase();
//                 }
//                 if(endPlace && endPlace.skyCode){
//                     ecode = endPlace.skyCode.split("-")[0].toLowerCase();
//                 }
//                 if(!scode) {
//                     throw {code: -6, msg: '您选择的出发地没有机场'};
//                 }
//
//                 if(!ecode) {
//                     throw {code: -6, msg: '您选择的目的地没有机场'};
//                 }
//                 url = "http://www.tianxun.com/oneway-"+ scode +"-"+ ecode +".html?depdate="+st+"&cabin=Economy";
//                 return url;
//             })
//     }else if(type == "train"){
//         url = "https://kyfw.12306.cn/otn/leftTicket/init";
//         return Promise.resolve(url);
//     }else if(type == "hotel"){
//         if(!hotelCity || hotelCity == "" ){
//             throw {code:-1, msg:"目的地不能为空"};
//         }
//         return API.place.getCityInfo({cityCode: hotelCity})
//             .then(function(result){
//                 if(result){
//                     hotelSt = moment(hotelSt).format('YYYY-MM-DD');
//                     hotelEt = moment(hotelEt).format('YYYY-MM-DD');
//                     if(from == "computer"){
//                         if(!hotelAddress || hotelAddress == "" ){
//                             url = "http://hotel.tianxun.com/domestic/"+result.pinyin+"/";
//                         }else{
//                             url = "http://hotel.tianxun.com/domestic/"+result.pinyin+"/key_"+hotelAddress;
//                         }
//                     }else{
//                         url = "http://m.tianxun.com/hotel/domestic/"+result.pinyin+"/?hotelDate1="+hotelSt+"&hotelDate2="+hotelEt;
//                     }
//                 }else{
//                     url = "http://hotel.tianxun.com/?_ga=1.18929464.1095670645.1456827902";
//                 }
//                 return url;
//             })
//     }
// }

export= ApiTravelBudget;