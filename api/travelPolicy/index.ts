/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var travalPolicyModel = sequelize.models.TravelPolicy;
import {Paginate} from 'common/paginate';
var API = require("common/api");
import {validateApi} from 'common/api/helper';
import types = require("api/_types/travelPolicy");
import { ServiceInterface } from '../_types/index';
import { TravelPolicy } from '../_types/travelPolicy';

export const travalPolicyCols = Object.keys(travalPolicyModel.attributes);

export class TravelPolicyService implements ServiceInterface<TravelPolicy>{
    async create(obj: Object): Promise<TravelPolicy>{
        return API.travalPolicy.createTravelPolicy(obj);
    }
    async get(id: string): Promise<TravelPolicy>{
        return API.travalPolicy.getTravelPolicy({id: id});
    }
    async find(where: any): Promise<TravelPolicy[]>{
        return API.travalPolicy.getTravelPolicies(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields[id] = id;
        return API.travalPolicy.updateTravelPolicy(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.travalPolicy.deleteTravelPolicy({id: id});
    }
}

/**
 * 创建差旅标准
 * @param data
 * @returns {*}
 */
validateApi(createTravelPolicy, ["name","planeLevel","planeDiscount","trainLevel","hotelLevel","companyId"], travalPolicyCols);
export function createTravelPolicy(data){
    console.info("createData=>", data);
    if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
        data.hotelPrice = null;
    }
    return travalPolicyModel.findOne({where: {name: data.name, companyId: data.companyId}})
        .then(function(result){
            if(result){
                throw {msg: "该等级名称已存在，请重新设置"};
            }
            return travalPolicyModel.create(data);
        });
}

/**
 * 删除差旅标准
 * @param params
 * @returns {*}
 */
validateApi(deleteTravelPolicy, ["id"]);
export function deleteTravelPolicy(params){
    var id = params.id;
    return API.staff.getStaffs({travelLevel: id, status: 0})
        .then(function(staffs){
            if(staffs && staffs.length > 0){
                throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
            }
            return travalPolicyModel.destroy({where: params});
        })
        .then(function(obj){
            return true;
        });
}

export function deleteTravelPolicyByTest(params){
    return travalPolicyModel.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
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
validateApi(updateTravelPolicy, ["id"], travalPolicyCols);
export function updateTravelPolicy(data){
    var id = data.id;
    delete data.id;
    var options : any = {};
    options.where = {id: id};
    options.returning = true;
    if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
        data.hotelPrice = null;
    }
    return travalPolicyModel.update(data, options)
        .spread(function(rownum, rows){
            return rows[0];
        });
}
/**
 * 根据id查询差旅标准
 * @param {String} params.id
 * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
 * @returns {*}
 */
validateApi(getTravelPolicy, ["id"]);
export function getTravelPolicy(params){
    var id = params.id;

    var isReturnDefault = params.isReturnDefault;
    if (isReturnDefault !== false) {
        isReturnDefault = true;
    }

    if(!id){
        if (isReturnDefault) {
            return travalPolicyModel.findById('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a');
        } else {
            throw {code: -1, msg: "id不能为空"};
        }
    }

    return travalPolicyModel.findById(id);
}

/**
 * 得到全部差旅标准
 * @param params
 * @returns {*}
 */
export function getAllTravelPolicy(options){
    return travalPolicyModel.findAll(options);
}

/**
 * 根据属性查找差旅标准
 * @param params
 * @returns {*}
 */
export function getTravelPolicies(params){
    var options : any = {};
    options.where = _.pick(params, Object.keys(travalPolicyModel.attributes));
    if(params.$or) {
        options.where.$or = params.$or;
    }
    if(params.columns){
        options.attributes = params.columns;
    }
    return travalPolicyModel.findAll(options);
}

/**
 * 分页查询差旅标准集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 */
export function listAndPaginateTravelPolicy(params){
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
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = params;
    return travalPolicyModel.findAndCountAll(options)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}