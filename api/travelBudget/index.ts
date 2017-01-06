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
import {ITicket, TravelBudgeItem, TRAFFIC} from "api/_types/travelbudget";
import {
    TrafficBudgetStrategyFactory, HotelBudgetStrategyFactory
} from "./strategy/index";
import {loadDefaultPrefer} from "./prefer";


export interface BudgetOptions{
    originPlace: string,
    destinationPlace: string,
    isNeedHotel: boolean,
    leaveDate: Date,
    isRoundTrip: boolean,
    isNeedTraffic: boolean,
    goBackDate?: Date,
    latestGoBackDateTime?: Date,   //返程最晚到达时间
    earliestGoBackDateTime?: Date, //返程最早出发时间
    earliestLeaveDateTime?: Date, //最早出发时间
    latestArrivalDateTime?: Date, //最晚到达时间
    checkInDate?: Date,
    checkOutDate?: Date,
    businessDistrict?: string,
    staffId?: string,
    subsidy: any,
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
        let {
            leaveDate,  //离开日期
            goBackDate, //返回日期
            isRoundTrip, //是否往返
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
        } = params;

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
            // if (!validate.isDate(checkInDate)) {
            //     checkInDate = moment(checkInDate).format(momentDateFormat);
            // }
            // if (!validate.isDate(checkOutDate)) {
            //     checkOutDate = moment(checkOutDate).format(momentDateFormat);
            // }
        }
        //返程需要参数
        if (isRoundTrip){
            if (!Boolean(goBackDate)) throw L.ERR.GO_BACK_DATE_FORMAT_ERROR();
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

        let budgets = [];

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

                if (isNeedTraffic && isRoundTrip) {
                    try {
                        let _params = {
                            originPlace: destinationPlace,
                            destinationPlace: originPlace,
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
                            checkInDate: checkInDate,
                            checkOutDate: checkOutDate
                        });
                        budget.tripType = ETripType.HOTEL;
                        budgets.push(budget);
                    } catch (err) {
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
                        budget.template = {id: subsidy.template.target.id, name: subsidy.template.target.name}
                        budgets.push(budget);
                    }
                }
                resolve(true);
            })
        })

        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
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
     * @param {String} params.city    城市ID
     * @param {String} params.businessDistrict 商圈ID
     * @param {Date} params.checkInDate 入住时间
     * @param {Date} params.checkOutDate 离开时间
     * @return {Promise} {prize: 1000, hotel: "酒店名称"}
     */
    @clientExport
    static async getHotelBudget(params: {city: any, businessDistrict: string,
        checkInDate: Date, checkOutDate: Date}) :Promise<TravelBudgeItem> {
        let {city, businessDistrict, checkInDate, checkOutDate} = params;

        if (!Boolean(city)) {
            throw L.ERR.CITY_NOT_EXIST();
        }
        if (!checkInDate) {
            throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR();
        }
        if (!checkOutDate) {
            throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR();
        }
        if (checkOutDate < checkInDate) {
            throw {code: -1, msg: "离开日期大于入住日期"};
        }
        let days = moment(checkOutDate).diff(checkInDate, 'days');

        var staff = await Staff.getCurrent();
        if (!staff || !staff["travelPolicyId"]) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        //查询是否有协议酒店
        let accordHotel;
        try {
            accordHotel= await API.accordHotel.getAccordHotelByCity({cityId: city.id || city});
        } catch(err) {
        }
        if (accordHotel) {
            return {price: accordHotel.accordPrice * days, type: EInvoiceType.HOTEL} as TravelBudgeItem;
        }

        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();
        let hotelStar = [EHotelLevel.THREE_STAR];
        city = await API.place.getCityInfo({cityCode: city.id || city});
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
            } else {
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
            isAbroad: city.isAbroad
        }
        let budgetConfig = staff.company.budgetConfig;
        if (budgetConfig && budgetConfig.hotel) {
            let compiled = _.template(JSON.stringify(budgetConfig.hotel));
            qs.prefers = JSON.parse(compiled(query));
        } else {
            qs.prefers = loadDefaultPrefer(query, 'hotel');
        }
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

     }) : Promise<TravelBudgeItem> {
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

        if (!latestArrivalDateTime) {
            params.latestArrivalDateTime = undefined;
        }
        if (!earliestLeaveDateTime) {
            params.earliestLeaveDateTime = undefined;
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

        if (isAbroad) {   //国际
            if (preferConfig && preferConfig.abroadTraffic) {
                let compiled = _.template(JSON.stringify(preferConfig.abroadTraffic), { 'imports': { 'moment': moment } });
                qs.prefers = JSON.parse(compiled(params));
            } else {
                qs.prefers = loadDefaultPrefer(params, 'abroadTicket');
            }
        } else {            //国内
            if (preferConfig && preferConfig.traffic) {
                let compiled = _.template(JSON.stringify(preferConfig.traffic), { 'imports': { 'moment': moment } });
                qs.prefers = JSON.parse(compiled(params));
            } else {
                qs.prefers = loadDefaultPrefer(params, 'ticket');
            }
        }

        if (!qs.prefers) {
            qs.prefers = [];
        }

        // qs.prefers = qs.prefers.map( (p) => {
        //     if (p.name == 'cabin') {
        //         p.options['expectTrainCabins'] = trainCabins || [];
        //         p.options['expectFlightCabins'] = cabins || [];
        //     }
        //     return p;
        // });

        qs.query = params;
        qs.query.originPlace = m_originCity;
        qs.query.destination = m_destination;
        let tickets: ITicket[] = _.concat(flightTickets, trainTickets) as ITicket[];
        let strategy = await TrafficBudgetStrategyFactory.getStrategy(qs, {isRecord: true});
        let result =  await strategy.getResult(tickets);
        result.cabinClass = result.cabin;
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
