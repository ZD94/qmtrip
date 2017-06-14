/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import {Models } from '_types'
import {ETripType, EInvoiceType, ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan";
import {EPlaneLevel, ETrainLevel, MTrainLevel, EHotelLevel} from "_types/travelPolicy";
import {Staff} from "_types/staff";
const API = require("@jingli/dnode-api");
const validate = require("common/validate");
import L from '@jingli/language';
const moment = require('moment');
const cache = require("common/cache");
const utils = require("common/utils");
import _ = require("lodash");
import {Place} from "_types/place";
import {DefaultRegion} from "_types/travelPolicy"
let systemNoticeEmails = require('@jingli/config').system_notice_emails;

interface SegmentsBudgetResult {
    id: string;
    cities: string[];
    /**
     * 数组每一项为多人每段预算信息,分为交通与住宿
     */
    budgets: Array<{
        hotel: any[],   //数组每项为每个人的住宿预算
        traffic: any[]  //数组每项为每个人的交通预算
    }>
}

export default class ApiTravelBudget {

    @clientExport
    static async getBudgetInfo(params: {id: string, accountId? : string}) {
        let staffId;
        if(params.accountId){
            staffId = params.accountId;
        }else{
            let staff = await Staff.getCurrent();
            staffId = staff.id;
        }

        let key = `budgets:${staffId}:${params.id}`;
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
        let currentStaff = await Staff.getCurrent();
        let staffId = params['staffId'] || currentStaff.id;
        let staff = await Models.staff.get(staffId);

        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw L.ERR.ERROR_CODE_C(500, `差旅标准还未设置`);
        }
        let domestic:any = {};
        let abroad:any = {};

        let travelPolicyRegions = await travelPolicy.getTravelPolicyRegions();
        travelPolicyRegions.map(async function(item){
            if(!(item.regionId == DefaultRegion.abroad)){
                abroad.cabin = item.planeLevels ;
                abroad.trainSeat = item.trainLevels;
                abroad.hotelStar = item.hotelLevels ;
                abroad.hotelPrefer = item.hotelPrefer;
                abroad.trafficPrefer = item.trafficPrefer;
            }
            if(item.regionId == DefaultRegion.domestic){
                domestic.cabin = item.planeLevels;
                domestic.trainSeat = item.trainLevels;
                domestic.hotelStar = item.hotelLevels ;
                domestic.hotelPrefer = item.hotelPrefer;
                domestic.trafficPrefer = item.trafficPrefer;
            }
        });

        if(!params.staffList){
            params.staffList = [];
        }
        if(params.staffList.indexOf(staffId) < 0){
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;

        let destinationPlacesInfo = params.destinationPlacesInfo;
        let policies = {
            "domestic": domestic,
            "abroad": abroad
        }

        let _staff: any = {
            gender: staff.sex,
            policy: 'domestic',
        }
        let staffs = [_staff];
        let goBackPlace = params['goBackPlace'];
        let segments: any[] = await Promise.all(destinationPlacesInfo.map( async (placeInfo) => {
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

        let segmentsBudget: SegmentsBudgetResult = await API.budget.createBudget({
            policies,
            staffs,
            segments,
            ret: params.isRoundTrip ? 1: 0,
            fromCity: params.originPlace,
            preferSet: staff.company.budgetConfig || {},
        });

        let cities = segmentsBudget.cities;
        let _budgets = segmentsBudget.budgets;
        let budgets = [];
        for(let i=0, ii=cities.length;i<ii;i++) {
            let city = cities[i];
            //补助信息
            let placeInfo = destinationPlacesInfo[i];

            //交通
            let traffic = _budgets[i].traffic;
            if (traffic && traffic.length) {
                let budget = traffic[0];
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;
                budget.tripType = ETripType.OUT_TRIP;
                budget.price=budget.price * count;
                budgets.push(budget);
            }

            //住宿
            let hotel = _budgets[i].hotel;
            if (hotel && hotel.length) {
                let budget = hotel[0];
                let cityObj = await API.place.getCityInfo({cityCode: city});
                budget.hotelName = placeInfo ? placeInfo.hotelName: null;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price=budget.price * count;
                budgets.push(budget);
            }

            let destLength = destinationPlacesInfo.length;
            if (!placeInfo && i == destLength) {
                let lastDest = destinationPlacesInfo[destLength-1];
                placeInfo = {
                    leaveDate: lastDest.earliestGoBackDateTime,
                    goBackDate: moment(lastDest.earliestGoBackDateTime).add(1, 'days').toDate(),
                    subsidy: lastDest.subsidy,
                    reason: lastDest.reason,
                }
            }

            let budget = await getSubsidyBudget(placeInfo);
            if(budget){
                budget.city = city;
                budget.price=budget.price * count;
                if (budget) {
                    budgets.push(budget);
                }
            }
        }


        let obj: any = {};
        obj.budgets = budgets;
        obj.query = params;
        obj.createAt = Date.now();
        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staff.id}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        await ApiTravelBudget.sendTripApproveNoticeToSystem({cacheId: _id, staffId: staffId});
        return _id;


        function getSubsidyBudget(destination) {
            let {subsidy, leaveDate, goBackDate, reason} = destination;
            let budget: any = null
            if (subsidy && subsidy.template) {
                let goBackDay = moment(goBackDate).format("YYYY-MM-DD");
                let leaveDay = moment(leaveDate).format("YYYY-MM-DD");
                let days = moment(goBackDay).diff(moment(leaveDay), 'days');
                if (days > 0) {
                    budget = {};
                    budget.fromDate = leaveDate;
                    budget.endDate = goBackDate;
                    budget.tripType = ETripType.SUBSIDY;
                    budget.type = EInvoiceType.SUBSIDY;
                    budget.price = subsidy.template.subsidyMoney * days;
                    budget.duringDays = days;
                    budget.template = {id: subsidy.template.id, name: subsidy.template.name};
                    budget.reason = reason;
                }
            }
            return budget;
        }
    }

    static async sendTripApproveNoticeToSystem(params: {cacheId: string, staffId: string}) {
        let staff = await Staff.getCurrent();
        let company = staff.company;

        if(company.name != "鲸力智享"){

            try {
                await Promise.all(systemNoticeEmails.map(async function(s) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: {cacheId: params.cacheId, name: s.name, staffId: params.staffId}
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