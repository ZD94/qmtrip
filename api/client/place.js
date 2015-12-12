/**
 * Created by wlh on 15/12/12.
 */

var API = require("../../common/api");
var Q = require("q");

var service = {
    __public: true
}

/**
 * 匹配城市名称
 *
 * @param {String} placeName 如北京
 * @param {Function} callback
 * @returns {Promise} [{"id": "BJSA-sky", name: "北京"}, ...]
 */
service.queryPlace = function(placeName, callback) {
    var defer = Q.defer();
    if (!placeName) {
        defer.reject({code: -1, msg: "地点名称不能为空"});
        return defer.promise.nodeify(callback);
    }

    return API.skyscanner.queryCity(placeName, callback);
}

module.exports = service;