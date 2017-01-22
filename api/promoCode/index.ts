/**
 * Created by wyl on 16-12-09.
 */
'use strict';
import {requireParams, clientExport} from 'common/api/helper';
import {conditionDecorator, condition} from "../_decorator";
import {Staff} from "api/_types/staff";
import { PromoCode } from 'api/_types/promoCode';
import { Models } from 'api/_types';
import {FindResult} from "common/model/interface";

const promoCodeCols = PromoCode['$fieldnames'];

class PromoCodeModule{
    /**
     * 创建优惠码
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["code","type"], promoCodeCols)
    static async createPromoCode (params) : Promise<PromoCode>{
        let result = await Models.promoCode.find({where: {code: params.code}});
        if(result && result.length>0){
            throw {msg: "该城市优惠码已设置"};
        }
        let code = randomWord(false, 6, 6);
        params.code = code;
        var promoCode = PromoCode.create(params);
        return promoCode.save();
    }


    /**
     * 删除优惠码
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deletePromoCode(params) : Promise<any>{
        var id = params.id;
        var pc_delete = await Models.promoCode.get(id);

        await pc_delete.destroy();
        return true;
    }


    /**
     * 更新优惠码
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], promoCodeCols)
    static async updatePromoCode(params) : Promise<PromoCode>{
        var id = params.id;

        var ah = await Models.promoCode.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询优惠码
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getPromoCode(params: {id: string}) : Promise<PromoCode>{
        let id = params.id;
        var ah = await Models.promoCode.get(id);

        return ah;
    };


    /**
     * 根据属性查找优惠码
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getPromoCodes(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();
        params.order = params.order || [['createdAt', 'desc']];

        let paginate = await Models.promoCode.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

}

/*
 ** randomWord 产生任意长度随机字母数字组合
 ** randomFlag-是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
 */

function randomWord(randomFlag, min, max){
    var str = "",
        range = min,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    // 随机产生
    if(randomFlag){
        range = Math.round(Math.random() * (max-min)) + min;
    }
    for(var i=0; i<range; i++){
        var index = Math.round(Math.random() * (arr.length-1));
        str += arr[index];
    }
    return str;
}

export = PromoCodeModule;