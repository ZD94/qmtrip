/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
var _ = require('lodash');
import {Paginate} from 'common/paginate';
import L from 'common/language';
import {requireParams, clientExport} from 'common/api/helper';
import {conditionDecorator, condition} from "../_decorator";
import {Staff, EStaffStatus} from "api/_types/staff";
import { TravelPolicy, SubsidyTemplate } from 'api/_types/travelPolicy';
import { Models } from 'api/_types';
import { FindResult, PaginateInterface } from "common/model/interface";

const travalPolicyCols = TravelPolicy['$fieldnames'];
const subsidyTemplateCols = SubsidyTemplate['$fieldnames'];

class TravelPolicyModule{
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name","planeLevels","trainLevels","hotelLevels","companyId"], travalPolicyCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async createTravelPolicy (params) : Promise<TravelPolicy>{
        let result = await Models.travelPolicy.find({where: {name: params.name, companyId: params.companyId}});
        if(result && result.length>0){
            throw {msg: "该等级名称已存在，请重新设置"};
        }
        params.planeLevels = tryConvertToArray(params.planeLevels);
        params.trainLevels = tryConvertToArray(params.trainLevels);
        params.hotelLevels = tryConvertToArray(params.hotelLevels);
        params.abroadHotelLevels = tryConvertToArray(params.abroadHotelLevels);
        params.abroadTrainLevels = tryConvertToArray(params.abroadTrainLevels)
        params.abroadPlaneLevels = tryConvertToArray(params.abroadPlaneLevels);
        var travelp = TravelPolicy.create(params);
        return travelp.save();
    }


    /**
     * 删除差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["companyId"])
    @conditionDecorator([
        {if: condition.isTravelPolicyAdminOrOwner("0.id")},
        {if: condition.isTravelPolicyAgency("0.id")}
    ])
    static async deleteTravelPolicy(params) : Promise<any>{
        var staff = await Staff.getCurrent();
        var id = params.id;

        let staffs = await Models.staff.find({where: {travelPolicyId: id, staffStatus: EStaffStatus.ON_JOB}});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准请先移除'};
        }


        var tp_delete = await Models.travelPolicy.get(id);

        if(staff && tp_delete["companyId"] != staff["companyId"]){
            throw L.ERR.PERMISSION_DENY();
        }

        var templates = await tp_delete.getSubsidyTemplates();
        if(templates && templates.length>0){
            await Promise.all(templates.map(async function(item){
                await item.destroy();
                return true;
            }))
        }

        await tp_delete.destroy();
        return true;
    }

    static deleteTravelPolicyByTest(params){
        return DBM.TravelPolicy.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
            .then(function(){
                return true;
            })
    }

    /**
     * 更新差旅标准
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], travalPolicyCols)
    @conditionDecorator([
        {if: condition.isTravelPolicyAdminOrOwner("0.id")},
        {if: condition.isTravelPolicyAgency("0.id")}
    ])
    static async updateTravelPolicy(params) : Promise<TravelPolicy>{
        var id = params.id;
        var tp = await Models.travelPolicy.get(id);
        params.planeLevels = tryConvertToArray(params.planeLevels);
        params.trainLevels = tryConvertToArray(params.trainLevels);
        params.hotelLevels = tryConvertToArray(params.hotelLevels);
        params.abroadHotelLevels = tryConvertToArray(params.abroadHotelLevels);
        params.abroadTrainLevels = tryConvertToArray(params.abroadTrainLevels)
        params.abroadPlaneLevels = tryConvertToArray(params.abroadPlaneLevels);
        for(var key in params){
            tp[key] = params[key];
        }
        return tp.save();
    }

    @clientExport
    static async getDefaultTravelPolicy(): Promise<TravelPolicy>{
        let dep = await Models.travelPolicy.get('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a');
        return dep;
    }
    /**
     * 根据id查询差旅标准
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["companyId"])
    @conditionDecorator([
        {if: condition.isTravelPolicyCompany("0.id")},
        {if: condition.isTravelPolicyAgency("0.id")}
    ])
    static async getTravelPolicy(params: {id: string, companyId?: string}) : Promise<TravelPolicy>{
        let id = params.id;
        //var staff = await Staff.getCurrent();
        var tp = await Models.travelPolicy.get(id);

        return tp;
    };

    /**
     * 得到全部差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"],['columns','name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getAllTravelPolicy(params): Promise<PaginateInterface<TravelPolicy> >{

        var staff = await Staff.getCurrent();
        //let companyId = params.companyId;

        let options: any = {
            where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order || "createdAt desc";
        }

        if(staff){
            options.where.companyId = staff["companyId"];
        }

        return  Models.travelPolicy.find(options);

    }

    /**
     * 根据属性查找差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.companyId"],['attributes','where.name', 'where.planeLevels', 'where.planeDiscount',
        'where.trainLevels', 'where.hotelLevels', 'where.hotelPrice', 'where.companyId', 'where.isChangeLevel', 'where.createdAt'])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("where.companyId")},
        {if: condition.isCompanyAgency("where.companyId")}
    ])
    static async getTravelPolicies(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();
        //let companyId = params.companyId;

        var options: any = {
            where:  _.pick(params, Object.keys(DBM.TravelPolicy.attributes))
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [['createdAt', 'desc']];
        if(params.$or) {
            options.where.$or = params.$or;
        }

        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的差旅标准
        }

        let paginate = await Models.travelPolicy.find(options);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /**
     * 分页查询差旅标准集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    @requireParams(["companyId"],['columns','name', 'planeLevels', 'planeDiscount', 'trainLevels', 'hotelLevels', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async listAndPaginateTravelPolicy(params){
        var options: any = {};
        if(params.options){
            options = params.options;
            delete params.options;
        }
        var page, perPage, limit, offset;
        if (options.page && /^\d+$/.test(options.page)) {
            page = options.page;
        } else {
            page = 1;
        }
        if (options.perPage && /^\d+$/.test(options.perPage)) {
            perPage = options.perPage;
        } else {
            perPage = 6;
        }
        limit = perPage;
        offset = (page - 1) * perPage;
        if (!options.order) {
            options.order = [["created_at", "desc"]]
        }
        options.limit = limit;
        options.offset = offset;
        options.where = params;

        return DBM.TravelPolicy.findAndCountAll(options)
            .then(function(result){
                return new Paginate(page, perPage, result.count, result.rows);
            });

    }

    /*************************************补助模板begin***************************************/
    /**
     * 创建补助模板
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["subsidyMoney","name","travelPolicyId"])
    @conditionDecorator([
        {if: condition.isTravelPolicyAdminOrOwner("0.travelPolicyId")}
    ])
    static async createSubsidyTemplate (params) : Promise<SubsidyTemplate>{

        /*let result = await Models.subsidyTemplate.find({where: {travelPolicyId: params.travelPolicyId}});
        if(result && result.length>0){
            throw {msg: "该城市补助模板已设置"};
        }*/
        var subsidyTemplate = SubsidyTemplate.create(params);
        return subsidyTemplate.save();
    }


    /**
     * 删除补助模板
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteSubsidyTemplate(params) : Promise<any>{
        var id = params.id;
        var st_delete = await Models.subsidyTemplate.get(id);

        await st_delete.destroy();
        return true;
    }


    /**
     * 更新补助模板
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], subsidyTemplateCols)
    @conditionDecorator([
        {if: condition.isTravelPolicyAdminOrOwner("0.travelPolicyId")}
    ])
    static async updateSubsidyTemplate(params) : Promise<SubsidyTemplate>{
        var id = params.id;
        //var staff = await Staff.getCurrent();

        var ah = await Models.subsidyTemplate.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询补助模板
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["travelPolicyId"])
    static async getSubsidyTemplate(params: {id: string, travelPolicyId?: string}) : Promise<SubsidyTemplate>{
        let id = params.id;
        var ah = await Models.subsidyTemplate.get(id);

        return ah;
    };


    /**
     * 根据属性查找补助模板
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.travelPolicyId"],['attributes','where.name', 'where.subsudyMoney'])
    @conditionDecorator([
        {if: condition.isTravelPolicyCompany("0.where.travelPolicyId")}
    ])
    static async getSubsidyTemplates(params): Promise<FindResult>{
        var options: any = {
            where: params.where
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [['subsidyMoney', 'desc']];
        if(params.$or) {
            options.where.$or = params.$or;
        }

        let paginate = await Models.subsidyTemplate.find(options);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }
    /*************************************补助模板end***************************************/

}

function tryConvertToArray(val) {
    if (val && !_.isArray(val)) {
        return [val];
    }
    return val;
}

export = TravelPolicyModule;