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

/**
 * @class travelBudget 旅行预算
 * @type {{__public: boolean}}
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
 * @param {String} params.inLatestArriveTime 返程最晚时间
 * @param {String} params.outLatestArriveTime 出发最晚到达时间 HH:mm
 * @param {String} params.checkInDate 如果不传=outboundDate 入住时间
 * @param {String} params.checkOutDate 如果不传=inboundDate 离开时间
 * @param {String} params.businessDistrict 商圈ID
 * @param {Boolean} params.isRoundTrip 是否往返 [如果为true,inboundDate必须存在]
 * @param {Callback} callback
 * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
 */
travelBudget.getTravelPolicyBudget = function(params, callback) {
    var inboundDate = params.inboundDate;
    var isRoundTrip = params.isRoundTrip || false;

    if (isRoundTrip && (!inboundDate || !validate.isDate(inboundDate))) {
        throw L.ERR.DATA_FORMAT_ERROR;
    }

    return API.travelbudget.getTravelBudget(params, callback);
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
            if (cityId) {
                throw L.ERR.CITY_NOT_EXIST;
            }

            if (!checkInDate || !validate.isDate(checkInDate)) {
                throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR;
            }

            if (!checkOutDate || !validate.isDate(checkOutDate)) {
                throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR;
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
                businessDistrict: businessDistrict
            }
            return API.travelbudget.getHotelBudget(data);
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
 * @param {String} params.latestArriveTime 最晚到达时间 HH:mm
 * @param {Boolean} params.isRoundTrip 是否往返 [如果为true,inboundDate必须存在]
 * @param {Function} [callback] (err, {price: "1000"})
 * @return {Promise} {price: "1000"}
 */
travelBudget.getTrafficBudget = function(params, callback) {
    if (!params) {
        throw L.ERR.DATA_FORMAT_ERROR;
    }

    if (!params.destinationPlace) {
        throw {code: -1, msg: "目的地城市信息不存在"};
    }

    if (!params.originPlace) {
        throw {code: -1, msg: "出发城市信息不存在"};
    }

    if (!params.outboundDate) {
        throw {code: -1, msg: "出发时间不存在"};
    }

    if (params.isRoundTrip && !params.inboundDate) {
        throw {code: -1, msg: "往返预算,返程日期不能为空"};
    }

    return API.travelbudget.getTrafficBudget(params, callback);
}

module.exports = travelBudget;