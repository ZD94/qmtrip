/**
 * Created by wlh on 15/12/12.
 */

/**
 * @module API
 */

var API = require("common/api");
var validate = require("common/validate");
var Q = require("q");
var L = require("common/language");
var utils = require("common/utils");

/**
 * @class travelBudget 旅行预算
 */
var travelBudget = {};

/**
 * @method getTravelPolicyBudget
 *
 * 获取合适差旅预算
 *
 * @param {Object} params 参数
 * @param {String} params.originPlace 出发地
 * @param {String} params.destinationPlace 目的地
 * @param {String} params.outboundDate 出发时间 YYYY-MM-DD
 * @param {String} params.inboundDate 返回时间(可选) YYYY-MM-DD
 * @param {String} [params.inLatestArriveTime] 返程最晚时间
 * @param {String} [params.outLatestArriveTime] 出发最晚到达时间 HH:mm
 * @param {String} [params.checkInDate] 如果不传=outboundDate 入住时间
 * @param {String} [params.checkOutDate] 如果不传=inboundDate 离开时间
 * @param {String} [params.businessDistrict] 商圈ID
 * @param {Boolean} [params.isRoundTrip] 是否往返 [如果为true,inboundDate必须存在]
 * @param {Callback} [callback]
 * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
 */
travelBudget.getTravelPolicyBudget = function(params, callback) {
    var outboundDate = params.outboundDate; //离开时间
    var inboundDate = params.inboundDate;   //出发时间
    var isRoundTrip = params.isRoundTrip || false;  //是否往返
    var originPlace = params.originPlace;
    var destinationPlace = params.destinationPlace;
    var checkInDate = params.checkInDate;
    var checkOutDate = params.checkOutDate;
    var businessDistrict = params.businessDistrict;
    var outLatestArriveTime = params.outLatestArriveTime;
    var inLatestArriveTime = params.inLatestArriveTime;
    var self = this;
    return Q()
        .then(function() {
            if (!outboundDate || !validate.isDate(outboundDate)) {
                throw L.ERR.OUTBOUND_DATE_FORMAT_ERROR;
            }

            if (isRoundTrip && (!inboundDate || !validate.isDate(inboundDate))) {
                throw L.ERR.INBOUND_DATE_FORMAT_ERROR;
            }

            if (!originPlace) {
                throw L.ERR.CITY_NOT_EXIST;
            }

            if (!destinationPlace) {
                throw L.ERR.CITY_NOT_EXIST;
            }

            if (!checkInDate) {
                checkInDate = outboundDate;
            }

            if (!checkOutDate) {
                checkOutDate = inboundDate;
            }
            return travelBudget.getHotelBudget.call(self, {
                cityId: destinationPlace,
                businessDistrict: businessDistrict,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate
            })
        })
        .then(function(hotel) {
            return travelBudget.getTrafficBudget.call(self, {
                originPlace: originPlace,
                destinationPlace: destinationPlace,
                outboundDate: outboundDate,
                inboundDate: inboundDate,
                outLatestArriveTime: outLatestArriveTime,
                inLatestArriveTime: inLatestArriveTime,
                isRoundTrip: isRoundTrip
            })
            .then(function(traffic) {
                return {hotel: hotel.price, traffic: traffic.price, goTraffic: traffic.goTraffic, backTraffic: traffic.backTraffic};
            })
        })
        .then(function(result) {
            result.price = result.hotel + result.traffic;
            return result;
        })
        .nodeify(callback);
}

/**
 * @method getHotelBudget
 *
 * 获取酒店住宿预算
 *
 * @param {Object} params
 * @param {String} params.cityId    城市ID
 * @param {String} params.businessDistrict 商圈ID
 * @param {String} params.checkInDate 入住时间
 * @param {String} params.checkOutDate 离开时间
 * @param {Function} [callback]
 * @return {Promise} {prize: 1000, hotel: "酒店名称"}
 */
travelBudget.getHotelBudget = function(params, callback) {
    if (!params || !(typeof params == 'object')) {
        params = {};
    }
    var self = this;
    var cityId = params.cityId;
    var accountId = self.accountId;
    var businessDistrict = params.businessDistrict;
    var checkInDate = params.checkInDate;
    var checkOutDate = params.checkOutDate;

    return Q()
        .then(function() {
            if (!cityId) {
                throw L.ERR.CITY_NOT_EXIST;
            }

            if (!checkInDate || !validate.isDate(checkInDate)) {
                throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR;
            }

            if (!checkOutDate || !validate.isDate(checkOutDate)) {
                throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR;
            }

            if (new Date(checkOutDate) < new Date(checkInDate)) {
                throw {code: -1, msg: "离开日期大于入住日期"};
            }

            //查询员工信息
            return API.staff.getStaff({id: accountId})
        })
        .then(function(staff) {
            if (!staff || !staff.travelLevel) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST;
            }
            //查询员工差旅标准
            return API.travelPolicy.getTravelPolicy({id: staff.travelLevel})
        })
        .then(function(travelPolicy) {
            if (!travelPolicy) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST;
            }
            var hotelStar = 3;
            if (/四星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 4;
            }
            if (/五星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 5;
            }

            var data = {
                maxMoney: travelPolicy.hotelPrice,
                hotelStar: hotelStar,
                cityId: cityId,
                businessDistrict: businessDistrict,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate
            }

            var getHotelBudget = Q.denodeify(API.travelbudget.getHotelBudget);
            return getHotelBudget(data)
                .then(function(result) {
                    //如果没有查询到结果,直接扔回最大金额
                    if (result.price <=0) {
                        var days = utils.diffDate(checkInDate, checkOutDate) || 1;
                        return {price: travelPolicy.hotelPrice * days};
                    }
                    return result;
                })
        })
        .then(function(result) {
            console.info("====>住店数据", result);
            return result;
        })
        .nodeify(callback);
}

/**
 * @method getTrafficBudget
 * 获取交通预算
 *
 * @param {String} params.originPlace 出发地
 * @param {String} params.destinationPlace 目的地
 * @param {String} params.outboundDate 出发时间 YYYY-MM-DD
 * @param {String} params.inboundDate 返回时间(可选) YYYY-MM-DD
 * @param {String} params.outLatestArriveTime 最晚到达时间 HH:mm
 * @param {String} params.inLatestArriveTime 返程最晚到达时间 HH:mm
 * @param {Boolean} params.isRoundTrip 是否往返 [如果为true,inboundDate必须存在]
 * @param {Function} [callback] (err, {price: "1000"})
 * @return {Promise} {price: "1000"}
 */
travelBudget.getTrafficBudget = function(params, callback) {
    var self = this;
    return Q()
        .then(function() {
            if (!params) {
                throw new Error(L.ERR.DATA_FORMAT_ERROR);
            }

            if (!params.destinationPlace) {
                throw new Error({code: -1, msg: "目的地城市信息不存在"});
            }

            if (!params.originPlace) {
                throw new Error({code: -1, msg: "出发城市信息不存在"});
            }

            if (!params.outboundDate) {
                throw {code: -1, msg: "出发时间不存在"};
            }

            if (params.isRoundTrip && !params.inboundDate) {
                throw {code: -1, msg: "往返预算,返程日期不能为空"};
            }

            var getTrafficBudget = Q.denodeify(API.travelbudget.getTrafficBudget);
            if (params.isRoundTrip) {
                return Q.all([
                    getTrafficBudget({
                        originPlace: params.originPlace,
                        destinationPlace: params.destinationPlace,
                        outboundDate: params.outboundDate,
                        inboundDate: params.inboundDate,
                        outLatestArriveTime: params.outLatestArriveTime
                    }),
                    getTrafficBudget({
                        originPlace: params.destinationPlace,
                        destinationPlace: params.originPlace,
                        outboundDate: params.inboundDate,
                        outLatestArriveTime: params.inLatestArriveTime
                    })
                ])
                    .spread(function(goTraffic, backTraffic) {

                        var result = {
                            goTraffic: goTraffic.price,
                            backTraffic: backTraffic.price,
                            traffic: Number(goTraffic.price) + Number(backTraffic.price),
                            price: Number(goTraffic.price) + Number(backTraffic.price)
                        };
                        return result;
                    })
            } else {
                return getTrafficBudget({
                    originPlace: params.originPlace,
                    destinationPlace: params.destinationPlace,
                    outboundDate: params.outboundDate,
                    inboundDate: params.inboundDate,
                    outLatestArriveTime: params.outLatestArriveTime
                })
                .then(function(traffic) {
                    var result = {
                        goTraffic: traffic.price,
                        backTraffic: 0,
                        traffic: traffic.price,
                        price: traffic.price
                    }
                    return result;
                })
            }
        })
        .nodeify(callback);
}

module.exports = travelBudget;