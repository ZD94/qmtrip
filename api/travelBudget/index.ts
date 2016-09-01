/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from 'common/api/helper';
import {Models } from 'api/_types'
import {ETripType, EInvoiceType} from "../_types/tripPlan";
import {EHotelLevel, EPlaneLevel, ETrainLevel, MHotelLevel, MPlaneLevel, MTrainLevel} from "../_types/travelPolicy";
import {Staff} from "../_types/staff";
const API = require("common/api");
const validate = require("common/validate");
const L = require("common/language");
const moment = require('moment');
const cache = require("common/cache");
const utils = require("common/utils");
import _ = require("lodash");
import {ITicket, TravelBudgeItem} from "api/_types/travelbudget";
import {
    TrafficBudgetStrategyFactory, HotelBudgetStrategyFactory
} from "./strategy/index";
import {loadDefaultPrefer} from "./prefer/index";

const defaultPrice = {
    "5": 500,
    "4": 450,
    "3": 400,
    "2": 350
}

interface BudgetOptions{
    originPlace: string,
    destinationPlace: string,
    isNeedHotel: boolean,
    leaveDate: Date| string,
    isRoundTrip: boolean,
    isNeedTraffic: boolean,
    goBackDate?: Date| string,
    goBackTime?: string,
    leaveTime?: string,
    checkInDate?: Date| string,
    checkOutDate?: Date|string,
    businessDistrict?: string,
    staffId?: string,
    subsidy: any,
}


class ApiTravelBudget {

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
        let {leaveDate, goBackDate, isRoundTrip, originPlace, destinationPlace, checkInDate,
            checkOutDate, businessDistrict, leaveTime, goBackTime, isNeedHotel, isNeedTraffic, subsidy} = params;

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
                            leaveTime: leaveTime
                        });
                        budget.tripType = ETripType.OUT_TRIP;
                        budgets.push(budget);
                    } catch (err) {
                        reject(err);
                    }
                }

                if (isNeedTraffic && isRoundTrip) {
                    try {
                        let budget = await ApiTravelBudget.getTrafficBudget({
                            originPlace: destinationPlace,
                            destinationPlace: originPlace,
                            leaveDate: goBackDate,
                            leaveTime: '09:00',
                            latestArrivalTime: goBackTime
                        });
                        budget.tripType = ETripType.BACK_TRIP;
                        budgets.push(budget);
                    } catch (err) {
                        reject(err);
                    }
                }

                if (isNeedHotel) {
                    try {
                        let budget = await ApiTravelBudget.getHotelBudget({
                            cityId: destinationPlace,
                            businessDistrict: businessDistrict,
                            checkInDate: checkInDate as string,
                            checkOutDate: checkOutDate as string
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
                        budget.price = subsidy.template.subsidyMoney * days;
                        budget.template = {id: subsidy.template.id, name: subsidy.template.name}
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
     * @param {String} params.cityId    城市ID
     * @param {String} params.businessDistrict 商圈ID
     * @param {String} params.checkInDate 入住时间
     * @param {String} params.checkOutDate 离开时间
     * @return {Promise} {prize: 1000, hotel: "酒店名称"}
     */
    @clientExport
    static async getHotelBudget(params: {cityId: string, businessDistrict: string,
        checkInDate: string, checkOutDate: string}) :Promise<TravelBudgeItem> {
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
        let days = moment(checkOutDate).diff(checkInDate, 'days');

        var staff = await Staff.getCurrent();
        if (!staff || !staff["travelPolicyId"]) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        //查询是否有协议酒店
        let accordHotel;
        try {
            accordHotel= await API.accordHotel.getAccordHotelByCity({cityId: cityId});
        } catch(err) {
        }
        if (accordHotel) {
            return {price: accordHotel.accordPrice * days, type: EInvoiceType.HOTEL} as TravelBudgeItem;
        }

        //查询员工差旅标准
        let policy = await staff.getTravelPolicy();
        let hotelStar: number = 3;
        let city = await API.place.getCityInfo({cityCode: cityId});
        if (!policy) {
            throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
        }
        if(policy.hotelLevel){
            hotelStar = policy.hotelLevel;
        }
        let gps = [];
        if (/,/g.test(businessDistrict)) {
            gps = businessDistrict.split(/,/);
        } else {
            let obj = API.plae.getCityInfo({cityCode: businessDistrict});
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
            checkOutDate: checkOutDate
        }
        qs.prefers = loadDefaultPrefer(query, 'hotel');
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
    static async getTrafficBudget(params: {originPlace: string, destinationPlace: string,
        leaveDate: Date | string, leaveTime?: string, latestArrivalTime?: string}) : Promise<TravelBudgeItem> {
        let {originPlace, destinationPlace, leaveDate, leaveTime, latestArrivalTime} = params;

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

        let cabinClass: string[] = [];
        if (policy.planeLevel == EPlaneLevel.ECONOMY ) {
            cabinClass.push('Economy');
        }
        if (policy.planeLevel == EPlaneLevel.BUSINESS_FIRST) {
            cabinClass.push('PremiumEconomy');
            cabinClass.push('Business');
            cabinClass.push('First');
        }

        let trainCabinClass = MTrainLevel[ETrainLevel.SECOND_CLASS].replace(/\//g, ",");
        if (policy.trainLevel) {
            trainCabinClass = MTrainLevel[policy.trainLevel];
            trainCabinClass = trainCabinClass.replace(/\//g, ",");
        }
        if (leaveDate && !validate.isDate(leaveDate)) {
            leaveDate = moment(leaveDate).format("YYYY-MM-DD");
        }

        let companyPolicy = staff.company.budgetPolicy;
        let m_originCity = await API.place.getCityInfo({cityCode: originPlace});
        let m_destination = await API.place.getCityInfo({cityCode: destinationPlace});

        let flightTickets:ITicket[] = [];
        if (m_originCity && m_destination) {
            flightTickets = await API.flight.search_ticket({
                originPlace: m_originCity,
                destination: m_destination,
                leaveDate: leaveDate,
                cabin: cabinClass
            });
        }

        let trainCabins = trainCabinClass.split(/,/g)
        let trainTickets = await API.train.search_ticket( {
            originPlace: m_originCity,
            destination: m_destination,
            leaveDate: leaveDate,
            cabin: trainCabins
        });

        let qs: any = staff.company.budgetConfig;
        if (!params.leaveTime) {
            params.leaveTime = '09:00'
        }
        if (!params.latestArrivalTime) {
            params.latestArrivalTime = '21:00'
        }
        qs.prefers = loadDefaultPrefer(params);
        qs.prefers = qs.prefers.map( (p) => {
            if (p.name == 'cabin') {
                p.options['expectCabins'] = _.concat(cabinClass, trainCabins)
            }
            return p;
        })
        qs.query = params;
        qs.query.originPlace = m_originCity;
        qs.query.destination = m_destination;
        let tickets: ITicket[] = _.concat(flightTickets, trainTickets) as ITicket[];
        let strategy = await TrafficBudgetStrategyFactory.getStrategy(qs, {isRecord: true});
        let result =  await strategy.getResult(tickets);
        result.cabinClass = result.cabin;
        let fullPriceObj = await API.place.getFlightFullPrice({
            originPlace: originPlace,
            destination: destinationPlace,
        });
        result.fullPrice = fullPriceObj.EPrice;
        return result;
    }

    @clientExport
    static async reportBudgetError(params: { budgetId: string}) {
        let {accountId} = Zone.current.get('session');
        let {budgetId} = params;
        let staff = await Staff.getCurrent();
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
                    res.json(datas);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, async function(req, res, next) {
            let {query, prefers, policy, originData, type} = req.body;
            let qs = {
                policy: policy,
                prefers: JSON.parse(prefers),
                query: JSON.parse(query),
            }

            try {
                let factory = (type == 1) ? TrafficBudgetStrategyFactory : HotelBudgetStrategyFactory;
                let strategy = await factory.getStrategy(qs, {isRecord: false});
                let result = await strategy.getResult(JSON.parse(originData));
                res.json(result);
            } catch(err) {
                next(err);
            }
        })
    }
}

export= ApiTravelBudget;