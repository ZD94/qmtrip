/**
 * Created by wlh on 15/12/12.
 */

/**
 * @module API
 * @type {API|exports|module.exports}
 */

var API = require("../../common/api");


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
 * @param {String} params.outboundDate 出发时间
 * @param {String} params.inboundDate 返回时间(可选)
 * @param {Callback} callback
 * @return {Promise} {"price": "合理预算值"}
 */
travelBudget.getTravelPolicyBudget = function(params, callback) {
    return API.skyscanner.getLowestPrice(params, callback);
}

module.exports = travelBudget;