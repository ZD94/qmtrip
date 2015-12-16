/**
 * Created by yumiao on 15-12-11.
 */


var moment = require("moment");
var Q = require("q");
var Seeds = require("common/model").importModel("./models").models.Seeds;
var Logger = require('../../common/logger');
var logger = new Logger("seeds");

var typeString = "^tripPlanOrderNo^";
var seeds = {};

/**
 * 获取团队信息
 * @param params
 * @param params.type goods_no:商品编号 goods_order_no:实物商品订单编号
 * @param cb
 */
seeds.getSingleSeedCode = function(type, options, callback){
    var defer = Q.defer();
    if (!options) {
        options = {};
    }
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    var minNo = options.minNo;
    var maxNo = options.maxNo;
    if (!minNo) {
        minNo = 1000;
    }
    if (!maxNo) {
        maxNo = 9999;
    }
    var str = '^' + type + '^';
    if(typeString.indexOf(str) !== 0){
        defer.reject({code: -1, msg: '编号类型不在配置中'});
        return defer.promise.nodeify(callback);
    }

    return Seeds.findOne({type: type})
        .then(function(seeds) {
            if (!seeds) {
                return Seeds.create({type: type, minNo: minNo, maxNo: maxNo, nowNo: minNo})
            }
            var nowNo = 0;
            if (parseInt(seeds.nowNo) >= maxNo) {
                nowNo = minNo;
            } else {
                nowNo = parseInt(seeds.nowNo) + 1;
            }
            return Seeds.update({nowNo: nowNo}, {returning: true, where: {type: type}} );
        })
        .then(function(seeds) {
            var seeds = seeds[1][0];
            return seeds.nowNo;
        })
        .nodeify(callback);
}


seeds.getSeedNo = function(type, options, callback){
    if (!options) {
        options = {};
    }
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    var formatDate = formatDate = options.formatDate || "YYMMDDHHmmss";
    return seeds.getSingleSeedCode(type, options)
        .then(function(seeds){
            var now = moment().format(formatDate);
            return now + seeds;
        }).nodeify(callback);
}

module.exports = seeds;
