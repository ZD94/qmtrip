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
    static create(data): Promise<TravelPolicy>{
        if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
            data.hotelPrice = null;
        }
        return DBM.TravelPolicy.findOne({where: {name: data.name, companyId: data.companyId}})
            .then(function(result){
                if(result){
                    throw {msg: "该等级名称已存在，请重新设置"};
                }
                return DBM.TravelPolicy.create(data)
                    .then(function(result){
                        return new TravelPolicy(result);
                    })
            });
    }

    @clientExport
    static async createTravelPolicy (params) : Promise<TravelPolicy>{
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});

            if(staff.code){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许添加该企业下的差旅标准
            return this.create(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});

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
    static deleteTravelPolicy(params): Promise<any>{
        var id = params.id;
        return API.staff.getStaffs({travelLevel: id, status: 0})
            .then(function(staffs){
                if(staffs && staffs.length > 0){
                    throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
                }
                return DBM.TravelPolicy.destroy({where: params});
            })
            .then(function(obj){
                return true;
            });
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
    static updateTravelPolicy(data): Promise<TravelPolicy>{
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
    /**
     * 根据id查询差旅标准
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @requireParams(["id"])
    static getTravelPolicy(params): Promise<TravelPolicy>{
        var id = params.id;

        var isReturnDefault = params.isReturnDefault;
        if (isReturnDefault !== false) {
            isReturnDefault = true;
        }

        if(!id){
            if (isReturnDefault) {
                return DBM.TravelPolicy.findById('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a');
            } else {
                throw {code: -1, msg: "id不能为空"};
            }
        }

        return DBM.TravelPolicy.findById(id)
            .then(function(data){
                return new TravelPolicy(data);
            })
    }

    /**
     * 得到全部差旅标准
     * @param params
     * @returns {*}
     */
    static getAllTravelPolicy(params){
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
    }

    /**
     * 根据属性查找差旅标准
     * @param params
     * @returns {*}
     */
    static getTravelPolicies(params): Promise<TravelPolicy[]>{
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
    }

    /**
     * 分页查询差旅标准集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    static listAndPaginateTravelPolicy(params){
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
}

export = TravelPolicyModule;