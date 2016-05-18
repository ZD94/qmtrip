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
import types = require("api/_types/travelPolicy");
import { ServiceInterface } from 'common/model';
import { TravelPolicy } from 'api/_types/travelPolicy';

const travalPolicyCols = TravelPolicy['$fieldnames'];

class TravelPolicyModule{
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @requireParams(["name","planeLevel","planeDiscount","trainLevel","hotelLevel","companyId"], travalPolicyCols)
    static async create(data): Promise<TravelPolicy>{
        if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
            data.hotelPrice = null;
        }
        let result = await DBM.TravelPolicy.findOne({where: {name: data.name, companyId: data.companyId}});
        if(result){
            throw {msg: "该等级名称已存在，请重新设置"};
        }
        return DBM.TravelPolicy.create(data)
            .then(function(result){
                return new TravelPolicy(result);
            })
    }

    @clientExport
    static async createTravelPolicy (params) : Promise<TravelPolicy>{
        let {accountId} = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});

            if(staff.code){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许添加该企业下的差旅标准
            return this.create(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});

            if(result){
                return this.create(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }

        }
    }


    /**
     * 删除差旅标准
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static async delete(params): Promise<any>{
        var id = params.id;
        let staffs = await API.staff.getStaffs({travelLevel: id, status: 0});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
        }
        let obj = await DBM.TravelPolicy.destroy({where: params});
        return true;
    }

    @clientExport
    static async deleteTravelPolicy(params: {id : string, companyId?: string}) : Promise<any>{
        let {accountId} = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});

            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            return this.delete({companyId: staff.companyId, id: params.id});

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});

            if(result){
                return this.delete(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
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
    @requireParams(["id"], travalPolicyCols)
    static update(data): Promise<TravelPolicy>{
        var id = data.id;
        delete data.id;
        var options : any = {};
        options.where = {id: id};
        options.returning = true;
        if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
            data.hotelPrice = null;
        }
        return DBM.TravelPolicy.update(data, options)
            .spread(function(rownum, rows){
                return new TravelPolicy(rows[0]);
            });
    }

    @clientExport
    static async updateTravelPolicy(params) : Promise<TravelPolicy>{
        let {accountId} = Zone.current.get("session");
        let company_id;
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            company_id = staff.companyId;

            let tp = await API.travelPolicy.getTravelPolicy({id: params.id});
            if(tp.companyId != company_id){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = company_id;//只允许删除该企业下的差旅标准
            return this.update(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return this.update(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * 根据id查询差旅标准
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @requireParams(["id"])
    static async get(params): Promise<TravelPolicy>{
        var id = params.id;

        var isReturnDefault = params.isReturnDefault;
        if (isReturnDefault !== false) {
            isReturnDefault = true;
        }

        if(!id){
            if (isReturnDefault) {
                let data = await DBM.TravelPolicy.findById('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a');
                return new TravelPolicy(data);

            } else {
                throw {code: -1, msg: "id不能为空"};
            }
        }

        let result = await DBM.TravelPolicy.findById(id);
        return new TravelPolicy(result);
    }

    @clientExport
    static async getTravelPolicy(params: {id: string, companyId?: string}) : Promise<TravelPolicy>{
        let id = params.id;
        let {accountId} = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: accountId});
            let tp = await this.get({id:id});

            if(!tp){
                throw {code: -1, msg: '查询结果不存在'};
            }

            if(tp['companyId'] && tp['companyId'] != staff.companyId){
                throw {code: -1, msg: '无权限'};
            }

            return tp;
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return this.get({id:id});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    };

    /**
     * 得到全部差旅标准
     * @param params
     * @returns {*}
     */
    /*static getAllTravelPolicy(params){
        let options: any = {
            where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order;
        }
        return DBM.TravelPolicy.findAll(options);
    }*/

    @clientExport
    static async getAllTravelPolicy(params){
        let {accountId} = Zone.current.get("session");
        let companyId = params.companyId;

        let options: any = {
            where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order;
        }

        let role = await API.auth.judgeRoleById({id:accountId});
        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id:accountId});
            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            return  DBM.TravelPolicy.findAll(options);

        }else{
            let result = await API.company.checkAgencyCompany({companyId: companyId, userId: accountId});
            if(result){
                return  DBM.TravelPolicy.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 根据属性查找差旅标准
     * @param params
     * @returns {*}
     */
    /*static getTravelPolicies(params): Promise<TravelPolicy[]>{
        var options: any = {
            where:  _.pick(params, Object.keys(DBM.TravelPolicy.attributes))
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order;
        }
        if(params.$or) {
            options.where.$or = params.$or;
        }
        return DBM.TravelPolicy.findAll(options);
    }*/

    @clientExport
    static async getTravelPolicies(params){
        let {accountId} = Zone.current.get("session");
        let companyId = params.companyId;
        let role = await API.auth.judgeRoleById({id:accountId});

        var options: any = {
            where:  _.pick(params, Object.keys(DBM.TravelPolicy.attributes))
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        if(params.order){
            options.order = params.order;
        }
        if(params.$or) {
            options.where.$or = params.$or;
        }

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id:accountId});
            if(!staff){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            let travelPolicies = await DBM.TravelPolicy.findAll(options);
            return travelPolicies.map(function(t){
                return t.id;
            })
        }else{
            let result = await API.company.checkAgencyCompany({companyId: companyId, userId: accountId});
            if(result){
                let travelPolicies = await DBM.TravelPolicy.findAll(options);
                return travelPolicies.map(function(t){
                    return t.id;
                })
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 分页查询差旅标准集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    static paginateTravelPolicy(params){
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

    @clientExport
    static async listAndPaginateTravelPolicy(params){
        let {accountId} = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});
        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});

            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            return this.paginateTravelPolicy(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});

            if(result){
                return this.paginateTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }

        }

    }
}

export = TravelPolicyModule;