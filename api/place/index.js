/**
 * Created by wlh on 15/12/10.
 */

/**
 * @module API
 */
var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;

/**
 * @class place
 */
var place = {};

/**
 * @method queryCity
 *
 * 查询城市信息
 *
 * @param {Object} data 参数
 * @param {String} data.keyword 检索关键字
 * @param {Function} callback
 * @return {Promise}
 */
place.queryCity = function(data, callback) {
    var keyword = data.keyword;
    var max = data.max || 10;
    if (max > 20) {
        max = 10;
    }
    var defer = Q.defer();
    if (!keyword) {
        defer.reject({code: -1, msg: "检索关键字为空"});
        return defer.promise.nodeify(callback);
    }

    return Model.City.findAll({where: {name: {$like: "%"+keyword+"%"}}, limit: max})
        .then(function(result) {
            var result = result.map(function(item) {
                return item.toJSON();
            })
            return result;
        })
        .nodeify(callback);
}

/**
 * @method queryBusinessDistrict
 * 查询商圈
 *
 * @param {Object} data 参数
 * @param {String} [data.keyword] 关键字
 * @param {STRING} [data.code] 城市代码
 * @param {Function} [callback] 可选回调函数
 */
place.queryBusinessDistrict = function(data, callback) {
    var keyword = data.keyword;
    var max = data.max || 10;
    if (max > 20) {
        max = 20;
    }

    var code = data.code;
    keyword = keyword.replace(/\s/g, "");
    var defer = Q.defer();
    if (!keyword && !code) {
        defer.reject({code: -1, msg: "缺少查询关键字"});
        return defer.promise.nodeify(callback);
    }

    return Models.BusinessDistrict.findAll({where: {}, limit: max})
        .then(function(result) {
            var result = result.map(function(item) {
                return item.toJSON();
            })
            return result;
        })
        .nodeify(callback);
}


module.exports = place;