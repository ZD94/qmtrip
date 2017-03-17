/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from 'common/api/helper';
import {Models } from 'api/_types'
import {ETripType, EInvoiceType} from "../_types/tripPlan";
import {EPlaneLevel, ETrainLevel, MTrainLevel, EHotelLevel} from "../_types/travelPolicy";
import {Staff} from "../_types/staff";
const API = require("common/api");
const validate = require("common/validate");
import L from 'common/language';
const moment = require('moment');
const cache = require("common/cache");
const utils = require("common/utils");
import _ = require("lodash");
import {ITicket, TRAFFIC, TravelBudgeTraffic, TravelBudgetHotel} from "api/_types/travelbudget";

import {
    TrafficBudgetStrategyFactory, HotelBudgetStrategyFactory
} from "./strategy/index";
import {DEFAULT_PREFER_CONFIG_TYPE, loadDefaultPrefer} from "./prefer";


export interface BudgetOptions{
    originPlace: string,
    staffId?: string,
    isRoundTrip?: boolean,
    destinationPlacesInfo: BudgetOptionsItem[]
}

export interface BudgetOptionsItem{
    destinationPlace: string,
    isNeedHotel: boolean,
    isNeedTraffic: boolean,
    leaveDate: Date,
    goBackDate?: Date,
    earliestLeaveDateTime?: Date, //最早出发时间
    latestArrivalDateTime?: Date, //最晚到达时间
    earliestGoBackDateTime?: Date, //返程最早出发时间
    latestGoBackDateTime?: Date,   //返程最晚到达时间
    checkInDate?: Date,
    checkOutDate?: Date,
    businessDistrict?: string,
    subsidy: any,
    reason?: string,
    hotelName?: string
}


export default class ApiTravelBudget {

    @clientExport
    static getBudgetInfo(params: {id: string, accountId? : string}) {
        let accountId = params.accountId;
        if (!accountId) {
            accountId = Zone.current.get('session')["accountId"];
        }
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
    * @param {Striing} [params.reason] 出差事由
    * @param {String} [params.hotelName] 住宿地标名称
    * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
    */
    @clientExport
    static async getTravelPolicyBudget(params: BudgetOptions) :Promise<string> {
        let {accountId} = Zone.current.get('session');
        let staffId = params.staffId || accountId;
        let staff = await Models.staff.get(staffId);
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw new Error(`差旅标准还未设置`);
        }
        let paramsToBudget = [];
        let destinationPlacesInfo = params.destinationPlacesInfo;
        if(destinationPlacesInfo && destinationPlacesInfo.length > 0){
            for(let j = 0; j < destinationPlacesInfo.length; j++){
                let paramsItem : any = {};
                for(let key in destinationPlacesInfo[j]) {
                    paramsItem[key] = destinationPlacesInfo[j][key];
                }
                paramsItem.staffId = params.staffId;
                if(j == 0){
                    if(params.originPlace){
                        paramsItem.originPlace = params.originPlace;
                    }else{
                        paramsItem.isNeedTraffic = false;
                        paramsItem.isRoundTrip = false;
                    }
                }else{
                    paramsItem.originPlace = destinationPlacesInfo[j-1].destinationPlace;
                }
                paramsToBudget.push(paramsItem);
            }
        }

        let isRoundTrip = params.isRoundTrip;
        let momentDateFormat = "YYYY-MM-DD";
        let budgets = [];

        for(let i = 0; i < paramsToBudget.length; i++){
            let {
                leaveDate,  //离开日期
                goBackDate, //返回日期
                originPlace,    //出发城市
                destinationPlace,   //目的地
                checkInDate,    //入住日期
                checkOutDate,   //离开日期
                businessDistrict,   //商圈
                earliestLeaveDateTime,  //最早离开时间
                latestArrivalDateTime,  //最晚到达时间
                earliestGoBackDateTime, //最早返回日期
                latestGoBackDateTime,   //最晚返回日期
                isNeedHotel,    //是否需要住宿
                isNeedTraffic,  //是否需要交通
                subsidy,        //补助信息
                hotelName        //住宿地标名称
            } = paramsToBudget[i];


            if (!Boolean(leaveDate)) {
                throw L.ERR.LEAVE_DATE_FORMAT_ERROR();
            }

            if (!isNeedTraffic && !isNeedHotel) {
                throw new Error("住宿和交通不能同时不需要");
            }


            //住宿需要参数
            if (isNeedHotel) {
                if (!Boolean(checkInDate)) {
                    checkInDate = leaveDate;
                }
                if (!Boolean(checkOutDate)) {
                    checkOutDate = goBackDate;
                }
            }

            //去程参数
            if (isNeedTraffic && !leaveDate) {
                throw L.ERR.LEAVE_DATE_FORMAT_ERROR();
            }

            if (isNeedTraffic && !originPlace) {
                throw L.ERR.CITY_NOT_EXIST();
            }
            if (!destinationPlace) {
                throw L.ERR.CITY_NOT_EXIST();
            }

            //返程需要参数
            if (isRoundTrip){
                if (!Boolean(goBackDate)) throw L.ERR.GO_BACK_DATE_FORMAT_ERROR();
            }

            await new Promise(function(resolve, reject) {
                let session = {accountId: staffId}
                Zone.current.fork({name: "getTravelPolicy",properties: { session: session}})
                    .run(async function() {
                        if (isNeedTraffic) {
                            try {
                                //去程预算
                                let budget = await ApiTravelBudget.getTrafficBudget({
                                    originPlace: originPlace,
                                    destinationPlace: destinationPlace,
                                    leaveDate: leaveDate,
                                    earliestLeaveDateTime: earliestLeaveDateTime,
                                    latestArrivalDateTime: latestArrivalDateTime,
                                });
                                budget.tripType = ETripType.OUT_TRIP;
                                budgets.push(budget);
                            } catch (err) {
                                reject(err);
                            }
                        }

                        if (isNeedTraffic && isRoundTrip && i == (paramsToBudget.length - 1)) {
                            try {
                                let _params = {
                                    originPlace: destinationPlace,
                                    destinationPlace: paramsToBudget[0].originPlace,
                                    leaveDate: goBackDate,
                                    earliestLeaveDateTime: earliestGoBackDateTime,
                                    latestArrivalTime: latestGoBackDateTime,
                                }
                                let budget = await ApiTravelBudget.getTrafficBudget(_params);
                                budget.tripType = ETripType.BACK_TRIP;
                                budgets.push(budget);
                            } catch (err) {
                                reject(err);
                            }
                        }

                        if (isNeedHotel) {
                            try {
                                let budget = await ApiTravelBudget.getHotelBudget({
                                    city: destinationPlace,
                                    businessDistrict: businessDistrict,
                                    checkInDate: leaveDate,
                                    checkOutDate: goBackDate,
                                    hotelName: hotelName
                                });
                                budget.tripType = ETripType.HOTEL;
                                budgets.push(budget);
                            } catch (err) {
                                console.info(err);
                                reject(err)
                            }
                        }

                        if (subsidy && subsidy.template) {
                            let days = moment(goBackDate).diff(moment(leaveDate), 'days');
                            days = days + 1;
                            if (!subsidy.hasFirstDaySubsidy) {
                                days = days -1;
                            }
                            if (!subsidy.hasLastDaySubsidy) {
                                days = days - 1;
                            }
                            if (days > 0) {
                                let budget: any = {};
                                budget.fromDate = leaveDate;
                                budget.endDate = goBackDate;
                                budget.hasFirstDaySubsidy = subsidy.hasFirstDaySubsidy;
                                budget.hasLastDaySubsidy = subsidy.hasLastDaySubsidy;
                                budget.tripType = ETripType.SUBSIDY;
                                budget.type = EInvoiceType.SUBSIDY;
                                budget.price = subsidy.template.target.subsidyMoney * days;
                                budget.duringDays = days;
                                budget.template = {id: subsidy.template.target.id, name: subsidy.template.target.name}
                                budgets.push(budget);
                            }
                        }
                        resolve(true);
                    })
            })

        }

        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        console.info(JSON.stringify(obj));
        console.info("redis-budgets====================================================================");
        return _id;
    }

    /**
     * @method getHotelBudget
     *
     * 获取酒店住宿预算
     *
     * @param {Object} params
     * @param {UUID} params.accountId 账号ID
     * @param {String} params.city    城市ID
     * @param {String} params.businessDistrict 商圈ID
     * @param {Date} params.checkInDate 入住时间
     * @param {Date} params.checkOutDate 离开时间
     * @return {Promise} {prize: 1000, hotel: "酒店名称"}
     */
    @clientExport
    static async getHotelBudget(params: {city: any, businessDistrict: string,
        checkInDate: Date, checkOutDate: Date, hotelName?: string}) :Promise<TravelBudgetHotel> {
        let {city, businessDistrict, checkInDate, checkOutDate, hotelName} = params;
        if (!Boolean(city)) {
            throw L.ERR.CITY_NOT_EXIST();
        }
        if (!checkInDate) {
            throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR();
        }
        if (!checkOutDate) {
            throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR();
        }
        checkOutDate = new Date(moment(checkOutDate).format('YYYY-MM-DD'));
        checkInDate = new Date(moment(checkInDate).format('YYYY-MM-DD'));
        if (checkOutDate < checkInDate) {
            throw {code: -1, msg: "离开日期大于入住日期"};
        }
        let days = moment(checkOutDate).diff(checkInDate, 'days');

        var staff = await Staff.getCurrent();
        if (!staff || !staff["travelPolicyId"]) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        city = await API.place.getCityInfo({cityCode: city.id || city});
        //查询是否有协议酒店
        let accordHotel;
        try {
            accordHotel= await API.accordHotel.getAccordHotelByCity({cityId: city.id || city});
        } catch(err) {
        }
        if (accordHotel) {
            return {price: accordHotel.accordPrice * days, type: EInvoiceType.HOTEL,
                hotelName: hotelName, cityName: city.name, checkInDate: checkInDate, checkOutDate: checkOutDate} as TravelBudgetHotel;
        }

        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();
        let hotelStar = [EHotelLevel.THREE_STAR];
        if (!policy) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        if (city.isAbroad && (!policy.isOpenAbroad || !policy.abroadHotelLevels.length)) {
            throw L.ERR.ABROAD_TRAVEL_POLICY_NOT_EXIST();
        }
        //区分国内国外标准
        if (city.isAbroad ) {
            hotelStar = policy.abroadHotelLevels;
        } else {
            hotelStar = policy.hotelLevels;
        }

        let gps = [];
        if (businessDistrict && /,/g.test(businessDistrict)) {
            gps = businessDistrict.split(/,/);
        } else {
            let obj;
            if (businessDistrict) {
                obj = API.place.getCityInfo({cityCode: businessDistrict});
            }
            if (!obj || !obj.latitude || !obj.longitude) {
                obj = city;
            }
            gps = [obj.latitude, obj.longitude];
        }

        let qs: any = {};
        let query = {
            star: hotelStar,
            city: city,
            latitude: gps[0],
            longitude: gps[1],
            businessDistrict: businessDistrict,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            isAbroad: city.isAbroad,
            hotelName: hotelName
        }
        let budgetConfig = staff.company.budgetConfig;
        let defaults = loadDefaultPrefer({local: query}, DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_HOTEL);
        if (budgetConfig && budgetConfig.hotel) {
            let compiled = _.template(JSON.stringify(budgetConfig.hotel));
            defaults = mergePrefers(defaults, JSON.parse(compiled({local: query})));
        }
        qs.prefers = defaults;
        qs.query = query;
        let hotels = await API.hotel.search_hotels(query);

        let strategy = await HotelBudgetStrategyFactory.getStrategy(qs, {isRecord: true});
        let budget = await strategy.getResult(hotels);
        budget.type = EInvoiceType.HOTEL;
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
    static async getTrafficBudget(params: {
        originPlace: any,
        destinationPlace: any,
        leaveDate: Date,
        latestArrivalDateTime?: Date,   //最晚到达时间
        earliestLeaveDateTime?: Date,   //最早出发时间

     }) : Promise<TravelBudgeTraffic> {
        let {originPlace, destinationPlace, leaveDate, latestArrivalDateTime, earliestLeaveDateTime} = params;

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
        let staff = await Staff.getCurrent();
        if (!staff || !staff['travelPolicyId']) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }

        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();

        if (!policy) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }

        let isAbroad = false;
        let m_originCity = await API.place.getCityInfo({cityCode: originPlace.id || originPlace});
        let m_destination = await API.place.getCityInfo({cityCode: destinationPlace.id || destinationPlace});

        console.log("this is city info: ", m_originCity);
        //转换成当地时间
        if (!latestArrivalDateTime) {
            params.latestArrivalDateTime = undefined;
        } else {
            let endFix = ' GMT+0';
            if (m_destination.offsetUtc) {
                endFix = ' GMT+0' + (m_destination.offsetUtc / 60 / 60 * 100)
            }
            params.latestArrivalDateTime = new Date(moment(latestArrivalDateTime).format(`YYYY-MM-DD HH:mm:ss`) + endFix);
        }
        if (!earliestLeaveDateTime) {
            params.earliestLeaveDateTime = undefined;
        } else {
            let endFix = 'GMT+0';
            if (m_originCity.offsetUtc) {
                endFix = 'GMT+0' + (m_originCity.offsetUtc / 60 / 60 * 100)
            }
            params.earliestLeaveDateTime = new Date(moment(earliestLeaveDateTime).format(`YYYY-MM-DD HH:mm:ss`) + endFix);
        }

        if (m_destination.isAbroad || m_originCity.isAbroad) {
            isAbroad = true;
        }
        let cabins: EPlaneLevel[];
        if (isAbroad && (!policy.isOpenAbroad || !policy.abroadPlaneLevels.length)) {
            throw L.ERR.ABROAD_TRAVEL_POLICY_NOT_EXIST();
        }

        //区分国内国外标准
        if (isAbroad) {
            cabins = policy.abroadPlaneLevels;
        } else {
            cabins = policy.planeLevels
        }

        if (!cabins || !cabins.length) {
            cabins = [EPlaneLevel.ECONOMY, EPlaneLevel.BUSINESS, EPlaneLevel.FIRST]
        }

        let trainCabins: ETrainLevel[] = policy.trainLevels;
        if (!trainCabins || !trainCabins.length) {
            trainCabins = [];
        }


        let flightTickets:ITicket[] = [];

        if (m_originCity && m_destination) {
            flightTickets = await API.flight.search_ticket({
                originPlace: m_originCity,
                destination: m_destination,
                leaveDate: leaveDate,
                cabin: cabins,
                isAbroad: isAbroad,
            });

            if (!flightTickets) {
                flightTickets = [];
            }
        }



        let trainTickets = [];
        if (!isAbroad) {
            trainTickets = await API.train.search_ticket( {
                originPlace: m_originCity,
                destination: m_destination,
                leaveDate: leaveDate,
                cabin: trainCabins
            });
            if (!trainTickets) {
                trainTickets = [];
            }
        }

        let preferConfig: any = staff.company.budgetConfig;
        let qs: any = {};

        params['expectTrainCabins'] = trainCabins;
        params['expectFlightCabins'] = cabins;
        let defaults: any[] = [];
        if (isAbroad) {   //国际
            defaults = loadDefaultPrefer({local: params}, DEFAULT_PREFER_CONFIG_TYPE.INTERNAL_TICKET);
            let corpAbroadTrafficPrefer = {}
            if (preferConfig && preferConfig.abroadTraffic) {
                corpAbroadTrafficPrefer = preferConfig.abroadTraffic
            }
            let compiled = _.template(JSON.stringify(corpAbroadTrafficPrefer), { 'imports': { 'moment': moment } });
            defaults = mergePrefers(defaults, JSON.parse(compiled({local: params})));
            qs.prefers = defaults;
        } else {            //国内
            defaults = loadDefaultPrefer({local: params}, DEFAULT_PREFER_CONFIG_TYPE.DOMESTIC_TICKET);
            let corpHomeTrafficPrefer = {};
            if (preferConfig && preferConfig.traffic) {
                corpHomeTrafficPrefer = preferConfig.traffic;
            }
            let compiled = _.template(JSON.stringify(corpHomeTrafficPrefer), { 'imports': { 'moment': moment } });
            defaults = mergePrefers(defaults, JSON.parse(compiled({local: params})));
            qs.prefers = defaults;
        }

        if (!qs.prefers) {
            qs.prefers = [];
        }

        qs.query = params;
        qs.query.originPlace = m_originCity;
        qs.query.destination = m_destination;
        let tickets: ITicket[] = _.concat(flightTickets, trainTickets) as ITicket[];
        let strategy = await TrafficBudgetStrategyFactory.getStrategy(qs, {isRecord: true});
        let result =  await strategy.getResult(tickets);
        console.log("result: ",result);
        result.cabinClass = result.cabin;
        result.originPlace = m_originCity;
        result.destination = m_destination;
        if (<number>result.type == <number>TRAFFIC.FLIGHT) {
            let fullPriceObj = await API.place.getFlightFullPrice({
                originPlace: m_originCity.id,
                destination: m_destination.id,
            });
            result.fullPrice = fullPriceObj ? fullPriceObj.EPrice : 0;
        }
        return result;
    }

    @clientExport
    static async reportBudgetError(params: { budgetId: string}) {
        let {accountId} = Zone.current.get('session');
        let {budgetId} = params;
        //let staff = await Staff.getCurrent();
        let content = await ApiTravelBudget.getBudgetInfo({id: budgetId, accountId: accountId});
        let budgets = content.budgets;
        let ps = budgets.map( async (budget): Promise<any> => {
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

    static __initHttpApp(app) {

        function _auth_middleware(req, res, next) {
            let key = req.query.key;
            if (!key || key != 'jingli2016') {
                return res.send(403)
            }
            next();
        }

        app.get("/api/budgets", _auth_middleware, function(req, res, next) {
            let {p, pz} = req.query;
            if (!p || !/^\d+$/.test(p) || p< 1) {
                p = 1;
            }
            if (!pz || !/^\d+$/.test(pz) || pz < 1) {
                pz = 20;
            }

            let offset = (p - 1) * pz;
            Models.travelBudgetLog.find({where: {}, limit: pz, offset: offset, order: 'created_at desc'})
                .then( (travelBudgetLogs) => {
                    let datas = travelBudgetLogs.map( (v)=> {
                        return v.target;
                    });
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(datas);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, function(req, res, next) {
            let {query, prefers, policy, originData, type} = req.body;
            let qs = {
                policy: policy,
                prefers: JSON.parse(prefers),
                query: JSON.parse(query),
            }

            let factory = (type == 1) ? TrafficBudgetStrategyFactory : HotelBudgetStrategyFactory;
            factory.getStrategy(qs, {isRecord: false})
                .then( (strategy) => {
                    return strategy.getResult(JSON.parse(originData), true);
                })
                .then( (result) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(result);
                })
                .catch(next)
        })
    }
}



function mergePrefers(defaults, news) {
    for(let i=0, ii =news.length; i<ii; i++) {
        let v = news[i];
        let isHas = false;  //是否包含
        //查找defaults中是否包含
        for(let j=0, jj=defaults.length; j<jj; j++) {
            if (v.name == defaults[j].name) {
                isHas = true;
                defaults[j] = _.defaultsDeep(v, defaults[j]);
                break;
            }
        }
        if (!isHas) {
            defaults.push(v);
        }
    }
    return defaults;
}