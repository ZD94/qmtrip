/**
 * Created by yumiao on 15-12-11.
 */


var moment = require("moment");
var Q = require("q");
var Seeds = require("common/model").importModel("./models").models.Seeds;
var Logger = require('../../common/logger');
var logger = new Logger("seeds");
var typeString = ['tripPlanNo', 'qm_order'];
var seeds = {};

/**
 * 获取团队信息
 * @param params
 * @param params.type goods_no:商品编号 goods_order_no:实物商品订单编号
 * @param cb
 */
seeds.getSingleSeedCode = function(type, options){
    if (!options) {
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
    if(typeString.indexOf(type) < 0){
        throw {code: -1, msg: '编号类型不在配置中'};
    }

    return Seeds.findOne({where: {type: type}})
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

            return Seeds.update({nowNo: nowNo}, {returning: true, where: {type: type}})
                .spread(function(affect, rows) {
                    return rows[0];
                })
        })
        .then(function(seed) {
            return seed.nowNo;
        });
}


seeds.getSeedNo = function(type, options){
    if (!options) {
        options = {};
    }
    var formatDate = formatDate = options.formatDate || "YYMMDDHHmmss";
    return seeds.getSingleSeedCode(type, options)
        .then(function(seeds){
            var now = moment().format(formatDate);
            return now + seeds;
        });
}

module.exports = seeds;
