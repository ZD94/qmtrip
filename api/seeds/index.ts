import {ServiceInterface} from "../../common/model.client";
import {Seed} from "../_types/seed";
import {Model} from "sequelize";
/**
 * Created by yumiao on 15-12-11.
 */

let moment = require("moment");
let Models = require("common/model").DB.models;
let Logger = require('common/logger');
let logger = new Logger("seeds");
let typeString = ['TripPlanNo', 'qm_order'];

class SeedService implements ServiceInterface<Seed>{
    async create(obj: Object): Promise<Seed>{
        throw 'seeds error';
    }
    async get(id: string): Promise<Seed>{
        throw 'seeds error';
    }
    async find(where: any): Promise<Seed[]>{
        throw 'seeds error';
    }
    async update(id: string, fields: Object): Promise<Seed> {
        throw 'seeds error';
    }
    async destroy(id: string): Promise<any> {
        throw 'seeds error';
    }
}

class SeedModule {
    static SeedService = SeedService;

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

        let seeds = await Models.Seed.findOne({where: {type: type}});

        if (!seeds) {
            return Models.Seed.create({type: type, minNo: minNo, maxNo: maxNo, nowNo: minNo})
        }

        let nowNo = 0;

        if (parseInt(seeds.nowNo) >= maxNo) {
            nowNo = minNo;
        } else {
            nowNo = parseInt(seeds.nowNo) + 1;
        }

        let [affect, rows] = await Models.Seed.update({nowNo: nowNo}, {returning: true, where: {type: type}})
        return rows[0].nowNo;
    }

    static getSeedNo(type, options){
        if (!options) {
            options = {};
        }
        let formatDate = options.formatDate || "YYMMDDHHmmss";
        return this.getSingleSeedCode(type, options)
            .then(function(seeds){
                let now = moment().format(formatDate);
                return now + seeds;
            });
    }
}

export = SeedModule;