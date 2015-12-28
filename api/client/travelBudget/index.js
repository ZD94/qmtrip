/**
 * Created by wlh on 15/12/12.
 */

/**
 * @module API
 */

var API = require("common/api");
var validate = require("common/validate");
var Q = require("q");
/**
 * @class travelBudget 旅行预算
 * @type {{__public: boolean}}
 */
var travelBudget = {
    /**
     * @property __public 是否公共模块
     * @type {Boolean}
     */
    __public: true
};

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
 * @param {String} params.latestArriveTime 最晚到达时间 HH:mm
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
 * @param {Function} [callback]
 * @return {Promise} {prize: 1000, hotel: "酒店名称"}
 */
travelBudget.getHotelBudget = function(params, callback) {
    return API.travelbudget.getHotelBudget(params, callback);
}

module.exports = travelBudget;