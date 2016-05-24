import {ModelInterface} from "common/model";
import {Seed} from "../_types/seed";
import {Model} from "sequelize";
/**
 * Created by yumiao on 15-12-11.
 */

let moment = require("moment");
let DBM = require("common/model").DB.models;
let Logger = require('common/logger');
let logger = new Logger("seeds");
let typeString = ['TripPlanNo', 'AgencyNo', 'CompanyNo'];

class SeedModule {
    /**
     * 获取团队信息
     * @param params
     * @param params.type goods_no:商品编号 goods_order_no:实物商品订单编号
     * @param cb
     */
    static async getSingleSeedCode(type, options){
        if (!options) {
            options = {};
        }
        let minNo = options.minNo;
        let maxNo = options.maxNo;
        if (!minNo) {
            minNo = 1000;
        }
        if (!maxNo) {
            maxNo = 9999;
        }
        if(typeString.indexOf(type) < 0){
            throw {code: -1, msg: '编号类型不在配置中'};
        }

        let seeds = await DBM.Seed.findOne({where: {type: type}});

        if (!seeds) {
            let en = await DBM.Seed.create({type: type, minNo: minNo, maxNo: maxNo, nowNo: minNo});
            return en.nowNo;
        }

        let nowNo = 0;

        if (parseInt(seeds.nowNo) >= maxNo) {
            nowNo = minNo;
        } else {
            nowNo = parseInt(seeds.nowNo) + 1;
        }

        let [affect, rows] = await DBM.Seed.update({nowNo: nowNo}, {returning: true, where: {type: type}})
        return rows[0].nowNo;
    }

    static getSeedNo(type, options){
        if (!options) {
            options = {};
        }
        let formatDate = options.formatDate || "YYMMDDHHmmss";
        return SeedModule.getSingleSeedCode(type, options)
            .then(function(seeds){
                let now = moment().format(formatDate);
                return now + seeds;
            });
    }
}

export = SeedModule;