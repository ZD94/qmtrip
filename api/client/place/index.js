/**
 * Created by wlh on 15/12/12.
 */
"use strict";
/**
 * @module API
 * @type {API|exports|module.exports}
 */

var API = require("common/api");

/**
 * @class place 地点信息
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
place.queryPlace = function(placeName) {
    if (!placeName) {
        throw {code: -1, msg: "地点名称不能为空"};
    }

    return API.place.queryCity(placeName);
}

/**
 * @method queryBusinessDistrict
 *
 * 查询商圈信息
 *
 * @param {Object} params 参数
 * @param {String} params.keyword 关键字
 * @param {String} params.code 城市代码
 * @return {Promise} [{"id":"ID", "name": "Name"}, {"id":"ID2", "name": "NAME2"}]
 */
place.queryBusinessDistrict = function(params) {
    return API.place.queryBusinessDistrict(params);
}

/**
 * @method hotCities
 *
 * 热门城市
 *
 * @param {Object} params
 * @param {Number} params.limit
 * @return {Promise} [{id: "ID", name: "Name"}]
 */
place.hotCities = function(params) {
    if (!params) {
        params = {};
    }

    return API.place.queryHotCity(params);
}

/**
 * @method hotBusinessDistricts
 *
 * 热门商圈
 *
 * @param {Object} params
 * @param {String} params.cityId 城市ID
 * @return {Promise} [{id:"ID", name:"Name"}]
 */
place.hotBusinessDistricts = function(params) {
    return API.place.hotBusinessDistricts(params);
}

/**
 * @method getCityInfo
 * 获取城市信息(名称)
 *
 * @param {string} params.cityCode 城市代码
 * @return {Promise} {id: id, name: name}
 */
place.getCityInfo = getCityInfo;
getCityInfo.required_params = ['cityCode'];
function getCityInfo(params) {
    return API.place.getCityInfo(params)
}

/**
 * @method  getAirPortsByCity
 * 根据城市代码获取机场信息
 * @param   {string}    params.cityCode     城市代码
 * @type {Promise} array
 */
place.getAirPortsByCity = getAirPortsByCity;
getAirPortsByCity.required_params = ['cityCode'];
function getAirPortsByCity(params) {
    return API.place.getAirPortsByCity(params);
}

module.exports = place;