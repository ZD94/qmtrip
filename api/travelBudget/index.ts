/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import {Models } from '_types'
import {ETripType, EInvoiceType, ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan";
import {Staff} from "_types/staff";
const API = require("@jingli/dnode-api");
const validate = require("common/validate");
import L from '@jingli/language';
const moment = require('moment');
require("moment-timezone");
const cache = require("common/cache");
const utils = require("common/utils");
import _ = require("lodash");
import {Place} from "_types/place";
import {EPlaneLevel, ETrainLevel, MTrainLevel, EHotelLevel, DefaultRegion} from "_types"
import {where} from "sequelize";
let systemNoticeEmails = require('@jingli/config').system_notice_emails;
export var NoCityPriceLimit = 0;
const DefaultCurrencyUnit = 'CNY';
var request = require("request");

const cloudAPI = require('@jingli/config').cloudAPI;
const cloudKey = require('@jingli/config').cloudKey;
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

let sequelize = require('sequelize');
export default class ApiTravelBudget {

    @clientExport
    static async getBudgetInfo(params: {id: string, accountId? : string}) {
        let { id, accountId }= params;
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
    static async getTravelPolicyBudget(params: ICreateBudgetAndApproveParams) :Promise<string> {
        let staffId = params['staffId'];
        let preferedCurrency = params["preferedCurrency"];
        preferedCurrency = preferedCurrency && typeof(preferedCurrency) != 'undefined' ? preferedCurrency :DefaultCurrencyUnit;

        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw L.ERR.ERROR_CODE_C(500, `差旅标准还未设置`);
        }

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
        let segments: any[] = await Promise.all(destinationPlacesInfo.map(async(placeInfo) => {
            var segment: any = {};
            segment.city = placeInfo.destinationPlace;
            let city: Place = (await API.place.getCityInfo({cityCode: placeInfo.destinationPlace}));
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
                    obj = API.place.getCityInfo({cityCode: businessDistrict});
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

        let companyId = staff.company.id;
        let segmentsBudget: SegmentsBudgetResult = await API.budget.createBudget({
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
                let cityObj = await API.place.getCityInfo({cityCode: city});
                let isAccordHotel = await Models.accordHotel.find({where: {cityCode: cityObj.id, companyId: staff['companyId']}});
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;

                     /* 出差时间计算 */
                    let residentPlace = await API.place.getCityInfo({cityCode: budget.city});
                    let timezone = residentPlace.timezone && typeof(residentPlace.timezone) != undefined ?
                        residentPlace.timezone : 'Asia/shanghai';
                    let beginTime = moment(budget.checkInDate).tz(timezone).hour(12);
                    let endTime = moment(budget.checkOutDate).tz(timezone).hour(12);
                    let days = moment(endTime).diff(beginTime,'days');
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

            /*let destLength = destinationPlacesInfo.length;
            if (!placeInfo && i == destLength) {
                let lastDest = destinationPlacesInfo[destLength - 1];
                placeInfo = {
                    leaveDate: lastDest.earliestGoBackDateTime,
                    goBackDate: moment(lastDest.earliestGoBackDateTime).add(1, 'days').toDate(),
                    subsidy: lastDest.subsidy,
                    reason: lastDest.reason,
                }
            }

            let isHasBackSubsidy = false;
            if (i == destLength-1 && !goBackPlace) {
                isHasBackSubsidy = true;
            }
            let budget = await getSubsidyBudget(city, placeInfo, isHasBackSubsidy, preferedCurrency);
            if (budget) {
                budget.city = city;
                budget.price = budget.price * count;
                if (budget) {
                    budgets.push(budget);
                }
            }*/

            //补助
            let subsidy = _budgets[i].subsidy;
            let destLength = destinationPlacesInfo.length;
            let lastDest = destinationPlacesInfo[destLength - 1];
            if (subsidy) {
                let budget = subsidy;
                budget.price = budget.price * count;
                if(budget.templates){
                    budget.templates.forEach((t) => {
                        t.price = t.price * count;
                    })
                }
                budget.reason =placeInfo ? placeInfo.reason : lastDest.reason;
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


        /*async function getSubsidyBudget(city, destination, isHasBackSubsidy: boolean = false, preferedCurrency: string) {
            let { subsidy, leaveDate, goBackDate, reason } = destination;
            let budget: any = null;
            if (subsidy && subsidy.template) {
                city = await API.place.getCityInfo({cityCode: city});
                let timezone = city.timezone ? city.timezone : "Asia/shanghai";
                let goBackDay = moment(goBackDate).tz(timezone).format("YYYY-MM-DD");
                let leaveDay = moment(leaveDate).tz(timezone).format("YYYY-MM-DD");
                let days = moment(goBackDay).diff(moment(leaveDay), 'days');
                if (isHasBackSubsidy) { //解决如果只有住宿时最后一天补助无法加到返程目的地上
                    days += 1;
                }
                if (days > 0) {
                    budget = {};
                    budget.fromDate = leaveDay;
                    budget.endDate = (goBackDate == leaveDay || isHasBackSubsidy) ? goBackDate: moment(goBackDate).add(-1, 'days').format('YYYY-MM-DD');
                    budget.tripType = ETripType.SUBSIDY;
                    budget.type = EInvoiceType.SUBSIDY;
                    budget.price = subsidy.template.subsidyMoney * days;
                    budget.unit = preferedCurrency && typeof(preferedCurrency) != 'undefined' ? preferedCurrency: DefaultCurrencyUnit,
                    budget.duringDays = days;
                    budget.template = { id: subsidy.template.id, name: subsidy.template.name };
                    budget.reason = reason;
                }
                let rate;
                if(preferedCurrency != DefaultCurrencyUnit) {
                    try{
                        rate = await new Promise<any>(async function(resolve,reject){
                            let qs = {
                                key: cloudKey,
                                currencyTo: preferedCurrency
                            }
                            request({
                                uri: cloudAPI + `/currencyRate`,
                                qs: qs,
                                method: 'get',
                                json: true
                            },async (err, res) => {
                                if(err){
                                    reject(err)
                                }
                                let body = res.body;
                                if(body && typeof(body) == 'string') {
                                    body = JSON.parse(body)
                                }
                                return resolve(body);
                            });
                        });
                        if(typeof(rate) == 'string') rate = JSON.parse(rate);
                        rate = rate.data;
                        if( typeof(rate) != 'undefined' && rate && rate.length ) {
                            budget.rate = rate[0]['rate'];
                        }
                    } catch(err) {
                        console.log(err)
                    }
                } else {
                    budget.rate = 1;
                }
            }
            return budget;
        }*/

        function limitHotelBudgetByPrefer(min: number, max:number, hotelBudget: number){
            if(hotelBudget == -1) {
                if(max != NoCityPriceLimit) return max;
                return hotelBudget;
            }
            if(min == NoCityPriceLimit && max == NoCityPriceLimit) return hotelBudget;

            if(max != NoCityPriceLimit && min > max) {
                let tmp = min;
                min = max;
                max = tmp;
            }

            if(hotelBudget > max ) {
                if(max != NoCityPriceLimit) return max;
            }
            if(hotelBudget < min ) {
                if(min != NoCityPriceLimit) return min;
            }
            return hotelBudget;
        }


    }

    static async sendTripApproveNoticeToSystem(params: {cacheId: string, staffId: string}) {
        let {cacheId, staffId } = params;
        if(!staffId || staffId == 'undefined'){
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let company = staff.company;

        if(company.name != "鲸力智享"){

            try {
                await Promise.all(systemNoticeEmails.map(async function(s) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: {cacheId: cacheId, name: s.name, staffId: staffId}
                        })

                    } catch(err) {
                        console.error(err);
                    }
                }));
            } catch(err) {
                console.error('发送系统通知失败', err)
            }
        }
        return true;
    }

    @clientExport
    static async reportBudgetError(params: { budgetId: string}) {
        let staff = await Staff.getCurrent();
        let {budgetId} = params;
        let content = await ApiTravelBudget.getBudgetInfo({id: budgetId, accountId: staff.id});
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
            let {p, pz, type} = req.query;
            if (!p || !/^\d+$/.test(p) || p< 1) {
                p = 1;
            }
            if (!pz || !/^\d+$/.test(pz) || pz < 1) {
                pz = 5;
            }

            API.budget.getBudgetItems({page: p, pageSize: pz, type: type,})
                .then( (data) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(data);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, function(req, res, next) {
            let {query, prefers, policy, originData, type} = req.body;
            originData = JSON.parse(originData);
            query = JSON.parse(query);
            prefers = JSON.parse(prefers);

            return API.budget.debugBudgetItem({query, originData, type, prefers})
                .then( (result) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(result);
                })
                .catch(next);
        })
    }
}