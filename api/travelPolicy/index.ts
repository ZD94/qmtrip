/**
 * Created by wyl on 15-12-12.
 */
'use strict';
import {DB} from '@jingli/database';
var _ = require('lodash');
import {Paginate} from 'common/paginate';
import L from '@jingli/language';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import {conditionDecorator, condition} from "../_decorator";
import {Staff, EStaffStatus} from "_types/staff";
import { TravelPolicy, SubsidyTemplate,TravelPolicyRegion } from '_types/travelPolicy';
import { Models } from '_types';
import { FindResult, PaginateInterface } from "common/model/interface";
import setPrototypeOf = Reflect.setPrototypeOf;

const travalPolicyCols = TravelPolicy['$fieldnames'];
const travalPolicyRegionCols = TravelPolicyRegion['$fieldnames'];
const subsidyTemplateCols = SubsidyTemplate['$fieldnames'];

let API = require("@jingli/dnode-api");
import {DefaultRegion} from "_types/travelPolicy"
class TravelPolicyModule{
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name", "companyId"], travalPolicyCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async createTravelPolicy (params) : Promise<TravelPolicy>{
        let result = await Models.travelPolicy.find({where: {name: params.name, companyId: params.companyId}});
        if(result && result.length>0){
            throw L.ERR.TRAVEL_POLICY_NAME_REPEAT();
        }



        let travelPolicyParams:{name: string,companyId: string, isOpenAbroad?:boolean, isDefault?: boolean} = {
            name: params.name,
            companyId: params.companyId,
        };
        if(params.isOpenAbroad){
            travelPolicyParams.isOpenAbroad = params.isOpenAbroad;
        }
        if(params.isDefault){
            travelPolicyParams.isDefault = params.isDefault;
        }
        let travelp = TravelPolicy.create(travelPolicyParams);

        if(travelp.isDefault){
            let defaults = await Models.travelPolicy.find({where: {id: {$ne: travelp.id}, is_default: true, companyId: params.companyId}});
            if(defaults && defaults.length>0){
                await Promise.all(defaults.map(async function(item){
                    item.isDefault = false;
                    await item.save();
                }))
            }
        }
        travelp.company = await Models.company.get(params.companyId)

        return travelp.save();

    }

    /**
     * 创建地区差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["policyId","planeLevels","hotelLevels"], travalPolicyRegionCols)
    static async createTravelPolicyRegion(params):Promise<any>{
        let {policyId, planeLevels, trainLevels, hotelLevels } = params;
        let multiAreaTravelPolicy = [];

        // let result = await Models.travelPolicyRegion.find({where: {regionId: params.regionId}});
        // if(result && result.length>0){
        //     throw L.ERR.TRAVEL_POLICY_NAME_REPEAT();
        // }

        let domesticPolicy = {
            policyId: policyId,
            regionId: DefaultRegion.domestic,
            planeLevels: tryConvertToArray(params.planeLevels),
            trainLevels: tryConvertToArray(params.trainLevels),
            hotelLevels: tryConvertToArray(params.hotelLevels)
        }

        multiAreaTravelPolicy.push(domesticPolicy);
        if(params.isOpenAbroad){
            let abroadPolicy = {
                policyId: policyId,
                regionId: DefaultRegion.abroad,
                planeLevels: tryConvertToArray(params.aplaneLevels),
                trainLevels: tryConvertToArray(params.trainLevels),
                hotelLevels: tryConvertToArray(params.hotelLevels)
            }
            multiAreaTravelPolicy.push(abroadPolicy);
        }

        for(let i =0; i < multiAreaTravelPolicy.length; i++){
            let travelPolicyRegion = await Models.travelPolicyRegion.create(multiAreaTravelPolicy[i]);
            await travelPolicyRegion.save();
        }

        return true;
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

        var tp_delete = await Models.travelPolicy.get(id);

        if(tp_delete.isDefault){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        let staffs = await Models.staff.find({where: {travelPolicyId: id, staffStatus: EStaffStatus.ON_JOB}});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准请先移除'};
        }

        if(staff && tp_delete["companyId"] != staff["companyId"]){
            throw L.ERR.PERMISSION_DENY();
        }

        var travelPolicyRegions = await tp_delete.getTravelPolicyRegions();
        if(travelPolicyRegions && travelPolicyRegions.length > 0){
            await Promise.all(travelPolicyRegions.map(async function(item){
                await item.destroy();
                return true;
            }))
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

    static async deleteTravelPolicyByTest(params){
        await DB.models.TravelPolicy.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}});
        return true;
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
        if(params.name){
            let result = await Models.travelPolicy.find({where: {name: params.name, companyId: tp.company.id}});
            if(result && result.length>0){
                throw L.ERR.TRAVEL_POLICY_NAME_REPEAT();
            }
        }

        if(params.isDefault){
            let defaults = await Models.travelPolicy.find({where: {id: {$ne: tp.id}, is_default: true, companyId: tp.company.id}});
            if(defaults && defaults.length>0){
                await Promise.all(defaults.map(async function(item){
                    item.isDefault = false;
                    await item.save();
                }))
            }
        }
        params.planeLevels = tryConvertToArray(params.planeLevels);
        params.trainLevels = tryConvertToArray(params.trainLevels);
        params.hotelLevels = tryConvertToArray(params.hotelLevels);
        params.abroadHotelLevels = tryConvertToArray(params.abroadHotelLevels);
        params.abroadTrainLevels = tryConvertToArray(params.abroadTrainLevels)
        params.abroadPlaneLevels = tryConvertToArray(params.abroadPlaneLevels);

        let travelPolicyRegions = await tp.getTravelPolicyRegions();
        await Promise.all(travelPolicyRegions.map(async function(item){
            if(!(item.regionId == DefaultRegion.abroad)){
                item.planeLevels = params.abroadplaneLevels;
                item.trainLevels = params.abroadtrainLevels;
                item.hotelLevels = params.abroadhotelLevels;
            }
            if(item.regionId == DefaultRegion.domestic){
                item.planeLevels = params.planeLevels;
                item.trainLevels = params.trainLevels;
                item.hotelLevels = params.hotelLevels;
            }
            await item.save();
            return true;
        }));

        // for(var key in params){
        //     tp[key] = params[key];
        // }
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
        {if: condition.isCompanyAdminOrOwner("0.where.companyId")},
        {if: condition.isCompanyAgency("0.where.companyId")}
    ])
    static async getTravelPolicies(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();

        params.order = params.order || [['createdAt', 'desc']];

        if(staff){
            params.where.companyId = staff["companyId"];//只允许查询该企业下的差旅标准
        }

        let paginate = await Models.travelPolicy.find(params);
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

        return DB.models.TravelPolicy.findAndCountAll(options)
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
        {if: condition.isTravelPolicyCompany("0.where.travelPolicyId")},
        {if: condition.isTravelPolicyAgency("0.where.travelPolicyId")}
    ])
    static async getSubsidyTemplates(params): Promise<FindResult>{
        params.order = params.order || [['subsidyMoney', 'desc']];

        let paginate = await Models.subsidyTemplate.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }
    /*************************************补助模板end***************************************/
    
    /**
     * 根据id查询区域差旅标准
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["travelPolicyId"])
    static async getTravelPolicyRegion(params:{id:string,travelPolicyId?:string}): Promise<TravelPolicyRegion> {
        let id = params.id
        let tpr = await Models.travelPolicyRegion.get(id);
        return tpr;
    }

    /**
     * 根据属性查找区域差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.travelPolicyId"],['attributes','where.name', 'where.subsudyMoney'])
    @conditionDecorator([
        {if: condition.isTravelPolicyCompany("0.where.travelPolicyId")},
        {if: condition.isTravelPolicyAgency("0.where.travelPolicyId")}
    ])
    static async getTravelPolicyRegions(params): Promise<FindResult>{
        params.order = params.order || [['subsidyMoney', 'desc']];

        let paginate = await Models.travelPolicyRegion.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }


    @clientExport
    @requireParams(["policyId"])
    async getAvaliableRegionIds(params: {where: any}) : Promise<TravelPolicyRegion[]>{
        return Models.travelPolicyRegion.find(params);
    }

}

function tryConvertToArray(val) {
    if (val && !_.isArray(val)) {
        return [val];
    }
    return val;
}

export = TravelPolicyModule;