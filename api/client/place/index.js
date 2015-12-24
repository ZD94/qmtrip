/**
 * Created by wlh on 15/12/12.
 */

/**
 * @module API
 * @type {API|exports|module.exports}
 */

var API = require("common/api");
var Q = require("q");

/**
 * @class place 地点信息
 * @type {{__public: boolean}}
 */
var place = {
    __public: true
}

/**
 * @method queryPlace
 *
 * 获取匹配城市名称
 *
 * @param {String} placeName 如北京
 * @param {Function} [callback]
 * @returns {Promise} [{"id": "BJSA-sky", name: "北京"}, ...]
 * @exapme
 * ```
 * API.place.queryPlace("北京", function(err, result) {
 *      if (err) {
 *          return alert(err);
 *      }
 *
 *      console.info(result);
 * });
 * ```
 */
place.queryPlace = function(placeName, callback) {
    var defer = Q.defer();
    if (!placeName) {
        defer.reject({code: -1, msg: "地点名称不能为空"});
        return defer.promise.nodeify(callback);
    }

    return API.place.queryCity(placeName, callback);
}

/**
 * @method queryBusinessDistrict
 *
 * 查询商圈信息
 *
 * @param {Object} params 参数
 * @param {String} params.keyword 关键字
 * @param {String} params.code 城市代码
 * @param {Function} [callback] 可选回调函数 [{"id":"ID", "name": "Name"}, {"id":"ID2", "name": "NAME2"}]
 * @return {Promise} [{"id":"ID", "name": "Name"}, {"id":"ID2", "name": "NAME2"}]
 */
place.queryBusinessDistrict = function(params, callback) {
    return API.place.queryBusinessDistrict(params, callback);
}

module.exports = place;