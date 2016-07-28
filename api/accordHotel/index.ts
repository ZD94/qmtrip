/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
var _ = require('lodash');
var API = require("common/api");
let L = require("common/language");
import {validateApi, requireParams, clientExport} from 'common/api/helper';
import {requirePermit, conditionDecorator, condition} from "../_decorator";
import {Staff, Credential, PointChange, EStaffRole, EStaffStatus} from "api/_types/staff";
import types = require("api/_types/accordHotel");
import { AccordHotel } from 'api/_types/accordHotel';
import { Models, EAccountType } from 'api/_types';
import {FindResult} from "common/model/interface";

const accordHotelCols = AccordHotel['$fieldnames'];

class AccordHotelModule{
    /**
     * 创建协议酒店
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["accordPrice","cityName","cityCode","companyId"], accordHotelCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async createAccordHotel (params) : Promise<AccordHotel>{

        let result = await Models.accordHotel.find({where: {cityCode: params.cityCode, companyId: params.companyId}});
        if(result && result.length>0){
            throw {msg: "该城市协议酒店已设置"};
        }
        var accordHotel = AccordHotel.create(params);
        return accordHotel.save();
    }


    /**
     * 删除协议酒店
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["companyId"])
    @conditionDecorator([
        {if: condition.isAccordHotelAdminOrOwner("0.id")},
        {if: condition.isAccordHotelAgency("0.id")}
    ])
    static async deleteAccordHotel(params) : Promise<any>{
        var id = params.id;
        var ah_delete = await Models.accordHotel.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新协议酒店
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], accordHotelCols)
    @conditionDecorator([
        {if: condition.isAccordHotelAdminOrOwner("0.id")},
        {if: condition.isAccordHotelAgency("0.id")}
    ])
    static async updateAccordHotel(params) : Promise<AccordHotel>{
        var id = params.id;
        var staff = await Staff.getCurrent();

        var ah = await Models.accordHotel.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询协议酒店
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["companyId"])
    @conditionDecorator([
        {if: condition.isAccordHotelAdminOrOwner("0.id")},
        {if: condition.isAccordHotelAgency("0.id")}
    ])
    static async getAccordHotel(params: {id: string, companyId?: string}) : Promise<AccordHotel>{
        let id = params.id;
        var ah = await Models.accordHotel.get(id);

        return ah;
    };

    /**
     * 根据cityCode查询协议酒店
     * @param obj  params.cityCode, params.companyId
     * @returns {*}
     */
    @clientExport
    @requireParams(["cityCode"])
    static async getAccordHotelByCity(params: {cityId: string}) : Promise<AccordHotel>{
        let cityId = params.cityId;
        var staff = await Staff.getCurrent();
        var options: any = {
            where: {cityCode: cityId}
        };
        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的协议酒店
        }
        let paginate = await Models.accordHotel.find(options);

        if(paginate && paginate.length>0){
            return paginate[0];
        }else{
            throw {code: -1,msg: "没有符合要求的记录"}
        }
    };


    /**
     * 根据属性查找协议酒店
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.companyId"],['attributes','where.accordPrice', 'where.cityName', 'where.cityCode', 'where.createdAt'])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("where.companyId")},
        {if: condition.isCompanyAgency("where.companyId")}
    ])
    static async getAccordHotels(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();
        let companyId = params.companyId;

        var options: any = {
            where:  _.pick(params, Object.keys(DBM.AccordHotel.attributes))
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [['createdAt', 'desc']];
        if(params.$or) {
            options.where.$or = params.$or;
        }

        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的协议酒店
        }

        let paginate = await Models.accordHotel.find(options);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

}

export = AccordHotelModule;