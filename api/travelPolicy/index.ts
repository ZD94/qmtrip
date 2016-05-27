/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
var _ = require('lodash');
import {Paginate} from 'common/paginate';
var API = require("common/api");
let L = require("common/language");
import {validateApi, requireParams, clientExport} from 'common/api/helper';
import {requirePermit, conditionDecorator, condition} from "../_decorator";
import {Staff, Credential, PointChange, EStaffRole, EStaffStatus} from "api/_types/staff";
import types = require("api/_types/travelPolicy");
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Models, EAccountType } from 'api/_types';

const travalPolicyCols = TravelPolicy['$fieldnames'];

class TravelPolicyModule{
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name","planeLevel","planeDiscount","trainLevel","hotelLevel","companyId"], travalPolicyCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async createTravelPolicy (params) : Promise<TravelPolicy>{

        let result = await Models.travelPolicy.find({where: {name: params.name, companyId: params.companyId}});
        if(result && result.length>0){
            throw {msg: "该等级名称已存在，请重新设置"};
        }
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

        let staffs = await Models.staff.find({where: {travelPolicyId: id, status: 0}});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
        }

        var staff = await Staff.getCurrent();
        var id = params.id;
        var tp_delete = await Models.travelPolicy.get(id);

        if(staff && tp_delete["companyId"] != staff["companyId"]){
            throw L.ERR.PERMISSION_DENY();
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
        var staff = await Staff.getCurrent();

        var tp = await Models.travelPolicy.get(id);
        for(var key in params){
            tp[key] = params[key];
        }
        if(staff){
            tp["companyId"] = staff["companyId"];
            // tp.company = staff.company;
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
        {if: condition.isTravelPolicyAdminOrOwner("0.id")},
        {if: condition.isTravelPolicyAgency("0.id")}
    ])
    static async getTravelPolicy(params: {id: string, companyId?: string}) : Promise<TravelPolicy>{
        let id = params.id;
        var staff = await Staff.getCurrent();
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
    static async getAllTravelPolicy(params){

        var staff = await Staff.getCurrent();
        let companyId = params.companyId;

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
    @requireParams(["companyId"],['columns','name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getTravelPolicies(params): Promise<string[]>{
        var staff = await Staff.getCurrent();
        let companyId = params.companyId;

        var options: any = {
            where:  _.pick(params, Object.keys(DBM.TravelPolicy.attributes))
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order || "createdAt desc";
        }
        if(params.$or) {
            options.where.$or = params.$or;
        }

        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的差旅标准
        }

        let travelPolicies = await Models.travelPolicy.find(options);
        return travelPolicies.map(function(t){
            return t.id;
        })

    }

    /**
     * 分页查询差旅标准集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    static async listAndPaginateTravelPolicy(params){
        let {accountId} = Zone.current.get("session");

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

        let role = await API.auth.judgeRoleById({id:accountId});
        if(role == EAccountType.STAFF){

            let staff = await Models.staff.get(accountId);

            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff["companyId"];//只允许查询该企业下的差旅标准
            return DBM.TravelPolicy.findAndCountAll(options)
                .then(function(result){
                    return new Paginate(page, perPage, result.count, result.rows);
                });

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});

            if(result){
                return DBM.TravelPolicy.findAndCountAll(options)
                    .then(function(result){
                        return new Paginate(page, perPage, result.count, result.rows);
                    });
            }else{
                throw {code: -1, msg: '无权限'};
            }

        }

    }
}

export = TravelPolicyModule;