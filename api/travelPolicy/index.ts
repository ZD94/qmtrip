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
import {Staff, EStaffStatus,EStaffRole} from "_types/staff";
// import { TravelPolicy, SubsidyTemplate,TravelPolicyRegion,CompanyRegion,RegionPlace } from '_types/travelPolicy';
import { Models } from '_types';
import { FindResult, PaginateInterface } from "common/model/interface";
import setPrototypeOf = Reflect.setPrototypeOf;
import {AgencyUser} from "_types/agency"
var request = require("request-promise");
import {ITravelPolicyRegion, IRegionPlace, ITravelPolicy, ICompanyRegion,ISubsidyTemplate} from "_types/travelPolicy";

let API = require("@jingli/dnode-api");
import {DefaultRegion} from "_types";
var BASE_URL = 'http://localhost:8080/policy';
var Config = require("@jingli/config");

export interface ITravelPolicyParams {
    id?:string,
    name?: string,
    idDefault?: boolean,
    companyId?: string,
    isOpenAbroad?: boolean
}

export interface ITravelPolicyRegionParams {
    id:string,
    travelPolicyId?:string,
    companyPolicyId?: string,
    planeLevels?: Array<number>,
    trainLevels?: Array<number>,
    hotelLevels?: Array<number>,
    hotelPrefer?: number,
    trafficPrefer?: number,
    maxPriceLimit?: number,
    minPriceLimit?: number
}


export default class TravelPolicyModule{

    // async getBestTravelPolicy(params:{travelPolicyId: string, placeId: string, type: string}): Promise<any>{
    //     let {placeId,type, travelPolicyId} = params;
    //     let policy = await TravelPolicyModule.operateOnPolicy({
    //         url: BASE_URL,
    //         params: {
    //             fileds:params
    //         },
    //         method:''
    //     });
    //     return policy;
    // }


    @clientExport
    async getDefaultTravelPolicy(params: {companyId: string, isDefault?: boolean}): Promise<ITravelPolicy> {
        // return API.policy.getDefaultTravelPolicy(params);
        if(params.companyId) {
            throw L.ERR.BAD_REQUEST();
        }
        if(!params.isDefault) params.isDefault = true;
        let defaultTp = await TravelPolicyModule.operateOnPolicy({
            url: BASE_URL,
            params: {
                fileds:params,
                method: "getTravelPolicies",
            },
            method: 'get'
        });
        if(defaultTp && typeof(defaultTp) == 'string') {
            defaultTp =JSON.parse(defaultTp);
        }
        if(!defaultTp || defaultTp.length == 0){
            return null;
        }
        return new ITravelPolicy(defaultTp[0]);
    }


    @clientExport
    static async getStaffs(params:{travelPolicyId: string, companyId:string}){
        let {companyId, travelPolicyId} = params;
        let staff = await Staff.getCurrent();
        let query = {where: {companyId: companyId, travelPolicyId: travelPolicyId}}
        let pager = await Models.staff.find(query);
        return pager;
    }
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    static async createTravelPolicy (params: ITravelPolicyParams):Promise<ITravelPolicy>{
        if(!params.companyId || !params.name){
            throw L.ERR.BAD_REQUEST();
        }
        let staff = await Staff.getCurrent();
        let company = await Models.company.get(params.companyId);
        if(!company) company = staff.company;
        let agencyUser = await AgencyUser.getCurrent();

        if((staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER) ||
            (agencyUser && agencyUser["companyId"] != company["id"])) {
            throw L.ERR.PERMISSION_DENY();
        }

        // let tp = await API.policy.createTravelPolicy(params);

        let tp = await TravelPolicyModule.operateOnPolicy({
            url: BASE_URL,
            params: {
                fileds: params,
                method: "createTravelPolicies",
            },
        });
        if(!tp) {
            throw L.ERR.SYSTEM_ERROR();
        }
        return new ITravelPolicy(tp);
    }

    /**
     * 创建地区差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    static async createTravelPolicyRegion(params: ITravelPolicyRegionParams): Promise<ITravelPolicy> {
        let {travelPolicyId, planeLevels, trainLevels, hotelLevels } = params;
        if(!travelPolicyId) {
            throw L.ERR.BAD_REQUEST();
        }

        // let tpr = await API.policy.createTravelPolicyRegion(params);
        let tpr = await TravelPolicyModule.operateOnPolicy({
            url: BASE_URL,
            params: {
                fields: params,
                method: "createTravelPolicyRegion"
            }
        });
        return new ITravelPolicy(tpr);
    }


    /**
     * 删除差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    // @requireParams(["id"], ["companyId"])
    static async deleteTravelPolicy(params: ITravelPolicyParams) : Promise<boolean>{
        let {id, companyId} = params;
        var staff = await Staff.getCurrent();
        if(!id || !companyId) {
            throw L.ERR.BAD_REQUEST();
        }
        let company = await Models.company.get(companyId);
        let agencyUser = await AgencyUser.getCurrent();

        let tp_delete = await API.policy.getTravelPolicy({id: id});
        if((staff && tp_delete && (staff['companyId'] != tp_delete['companyId'] || (staff['roleId'] != EStaffRole.ADMIN &&
            staff['roleId'] != EStaffRole.OWNER))) || (agencyUser['agencyId'] != company['agencyId'])) {
            throw L.ERR.PERMISSION_DENY();
        }

        if(tp_delete.isDefault){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        let staffs = await Models.staff.find({where: {travelPolicyId: id, staffStatus: EStaffStatus.ON_JOB}});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准请先移除'};
        }

        // let isDeleted = await API.policy.deleteTravelPolicy({id: id});
        let isDeleted = await TravelPolicyModule.operateOnPolicy({
            url: BASE_URL,
            params:{
                fields: params,
                method: "deleteTravelPolicy"
            }
        });
        return isDeleted;
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
    @requireParams(["id"])
    static async updateTravelPolicy(params: ITravelPolicyParams) : Promise<ITravelPolicy>{
        var {id, companyId} = params;

        var staff = await Staff.getCurrent();
        if(!id || !companyId) {
            throw L.ERR.BAD_REQUEST();
        }
        let company = await Models.company.get(companyId);
        let agencyUser = await AgencyUser.getCurrent();

        let tp_delete = await API.policy.getTravelPolicy({id: id});
        if((staff && tp_delete && (staff['companyId'] != tp_delete['companyId'] || (staff['roleId'] != EStaffRole.ADMIN &&
            staff['roleId'] != EStaffRole.OWNER))) || (agencyUser['agencyId'] != company['agencyId'])) {
            throw L.ERR.PERMISSION_DENY();
        }

        // return API.policy.updateTravelPolicy(params);
        let tpr = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicy",
            params: {
                fields: params,
                method: "put"
            }
        });
        return new ITravelPolicy(tpr);
    }

    @clientExport
    static async updateTravelPolicyRegion(params: ITravelPolicyRegionParams) : Promise<ITravelPolicyRegion>{
        let tpr = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicyRegion",
            params: {
                fields: params,
                method: "put"
            }
        });
        return new ITravelPolicyRegion(tpr);
    }

    /**
     * 删除差旅标准详情
     * @param params
     * @returns {*}
     */
    @clientExport
    // @requireParams(["id"])
    static async deleteTravelPolicyRegion(params: {id: string}) : Promise<boolean>{
        var staff = await Staff.getCurrent();
        var id = params.id;
        var tpr_delete = await API.policy.getTravelPolicyRegion(id);
        var tp = await API.policy.getTravelPolicy(tpr_delete['travelPolicyId']);

        if(staff["roleId"] != EStaffRole.ADMIN && staff["roleId"] != EStaffRole.OWNER){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        if(staff && tp["companyId"] != staff["companyId"]){
            throw L.ERR.PERMISSION_DENY();
        }

        let isDeleted = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicyRegion",
            params: {
                fields: params,
                method: "delete"
            }
        });
        return isDeleted;
    }

    // @clientExport
    // static async getDefaultTravelPolicy(): Promise<any>{
    //     let dep = await Models.travelPolicy.get('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a');
    //     return dep;
    // }
    /**
     * 根据id查询差旅标准
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getTravelPolicy(params: {id: string}) : Promise<ITravelPolicy>{
        let id = params.id;
        let travelPolicy = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicy",
            params: {
                fields: params,
                method: "get"
            }
        });
        return new ITravelPolicy(travelPolicy);
    };

    /**
     * 得到全部差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    // @requireParams(["companyId"])
    static async getAllTravelPolicy(params: {companyId: string}): Promise<any>{
        // var {companyId} = params;
        // var staff = await Staff.getCurrent();
        //
        // if(staff["roleId"] != EStaffRole.ADMIN && staff["roleId"] != EStaffRole.OWNER){
        //     throw {code: -2, msg: '不允许删除默认差旅标准'};
        // }
        //
        // let company = await Models.company.get(companyId);
        // let agencyUser = await AgencyUser.getCurrent();
        //
        // if((staff && (staff['roleId'] != EStaffRole.ADMIN || staff['roleId'] != EStaffRole.OWNER)) ||
        //     (agencyUser['agencyId'] != company['agencyId'])) {
        //     throw L.ERR.PERMISSION_DENY();
        // }
        //
        //
        // let options: any = {
        //     where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
        // };
        // if(params.columns){
        //     options.attributes = params.columns;
        // }
        // if(params.order){
        //     options.order = params.order || "createdAt desc";
        // }
        //
        // if(staff){
        //     options.where.companyId = staff["companyId"];
        // }
        //
        // return  Models.travelPolicy.find(options);
        return null;

    }

    /**
     * 根据属性查找差旅标准
     * @param params
     * @returns {*}
     */

    @requireParams(["companyId"])
    @clientExport
    static async getTravelPolicies(params: {companyId: string}): Promise<FindResult>{
        let {companyId } = params;
        var staff = await Staff.getCurrent();

        let company = await Models.company.get(companyId);
        let agencyUser = await AgencyUser.getCurrent();

        if((staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER) ||
            (agencyUser && agencyUser['agencyId'] != company['agencyId'])) {
            throw L.ERR.PERMISSION_DENY();
        }
        let travelPolicies = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicy",
            params: {
                fields: params,
                method: "get"
            }
        });
        if(typeof(travelPolicies) == 'string'){
            travelPolicies = JSON.parse(travelPolicies)
        }
        return travelPolicies;
    }

    /**
     * 分页查询差旅标准集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    // @requireParams(["companyId"],['columns','name', 'planeLevels', 'planeDiscount', 'trainLevels', 'hotelLevels', 'hotelPrice', 'companyId', 'isChangeLevel', 'createdAt'])
    // @conditionDecorator([
    //     {if: condition.isCompanyAdminOrOwner("0.companyId")},
    //     {if: condition.isCompanyAgency("0.companyId")}
    // ])
    //
    // static async listAndPaginateTravelPolicy(params){
    //     var options: any = {};
    //     if(params.options){
    //         options = params.options;
    //         delete params.options;
    //     }
    //     var page, perPage, limit, offset;
    //     if (options.page && /^\d+$/.test(options.page)) {
    //         page = options.page;
    //     } else {
    //         page = 1;
    //     }
    //     if (options.perPage && /^\d+$/.test(options.perPage)) {
    //         perPage = options.perPage;
    //     } else {
    //         perPage = 6;
    //     }
    //     limit = perPage;
    //     offset = (page - 1) * perPage;
    //     if (!options.order) {
    //         options.order = [["created_at", "desc"]]
    //     }
    //     options.limit = limit;
    //     options.offset = offset;
    //     options.where = params;
    //
    //     return DB.models.TravelPolicy.findAndCountAll(options)
    //         .then(function(result){
    //             return new Paginate(page, perPage, result.count, result.rows);
    //         });
    //
    // }

    /*************************************补助模板begin***************************************/
    /**
     * 创建补助模板
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["subsidyMoney","name","travelPolicyId"])
    static async createSubsidyTemplate (params) : Promise<any>{
        let {name, travelPolicyId, subsidyMondy} = params;
        if(!name || !travelPolicyId || !subsidyMondy) {
            throw L.ERR.BAD_REQUEST();
        }
        let staff = await Staff.getCurrent();
        if(staff["roleId"] != EStaffRole.ADMIN && staff["roleId"] != EStaffRole.OWNER){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        if(staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER) {
            throw L.ERR.PERMISSION_DENY();
        }

        /*let result = await Models.subsidyTemplate.find({where: {travelPolicyId: params.travelPolicyId}});
         if(result && result.length>0){
         throw {msg: "该城市补助模板已设置"};
         }*/
        let subsidy = await TravelPolicyModule.operateOnPolicy({
            model: "subsidyTemplate",
            params: {
                fields: params,
                method: "post"
            }
        });
        return subsidy;
    }


    /**
     * 删除补助模板
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteSubsidyTemplate(params) : Promise<any>{
        let isDeleted = await TravelPolicyModule.operateOnPolicy({
            model: "subsidyTemplate",
            params: {
                fields: params,
                method: "delete"
            }
        });
        return isDeleted;

    }


    /**
     * 更新补助模板
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async updateSubsidyTemplate(params) : Promise<any>{
        if(!params.id){
            throw L.ERR.BAD_REQUEST();
        }

        let subsidy = await TravelPolicyModule.operateOnPolicy({
            model: "subsidyTemplate",
            params: {
                fields: params,
                method: "put"
            }
        });
        return subsidy;

    }

    /**
     * 根据id查询补助模板
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getSubsidyTemplate(params: {id: string, travelPolicyId?: string}) : Promise<any>{
        if(!params.id){
            throw L.ERR.BAD_REQUEST();
        }
        let subsidy = await TravelPolicyModule.operateOnPolicy({
            model: "subsidyTemplate",
            params: {
                fields: params,
                method: "get"
            }
        });
        return subsidy;
    };


    /**
     * 根据属性查找补助模板
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["travelPolicyId"])
    static async getSubsidyTemplates(params): Promise<any>{
        let subsidies = await TravelPolicyModule.operateOnPolicy({
            model: "subsidyTemplate",
            params: {
                fields: params,
                method: "get"
            }
        });
        console.log("====>subsidies: ", subsidies);
        return subsidies;
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
    static async getTravelPolicyRegion(params:{id:string,travelPolicyId?:string}): Promise<any> {
        let id = params.id;
        // return API.policy.getTravelPolicyRegion(params);
        let tpr = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicyRegion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return tpr;
    }


    /**
     * 根据属性查找区域差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["travelPolicyId"])
    static async getTravelPolicyRegions(params): Promise<any>{
        let tprs = await TravelPolicyModule.operateOnPolicy({
            model: "travelPolicyRegion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return tprs;
    }


    /*************************************差旅标准的地区关系(CompanyRegion)begin***************************************/
    /**
     * 差旅标准的地区管理
     * @param data
     * @returns {*}
     */

    @clientExport
    @requireParams(["id"])
    static async getCompanyRegion(params: {id: string}) : Promise<any>{
        let id = params.id;
        // return API.policy.getCompanyRegion(params);
        let cr = await TravelPolicyModule.operateOnPolicy({
            model: "companyRegion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return cr;
    };

    @clientExport
    @requireParams(["companyId"])
    static async getCompanyRegions(params) : Promise<any>{

        let cr = await TravelPolicyModule.operateOnPolicy({
            model: "companyRegion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return cr;
    };

    @clientExport
    @requireParams(["companyId","name"])
    static async createCompanyRegion(params) : Promise<any>{
        let cr = await TravelPolicyModule.operateOnPolicy({
            model: "companyRegion",
            params: {
                fields: params,
                method: "post"
            }
        });
        return cr;
    };

    /*************************************差旅标准的地区关系(CompanyRegion)end***************************************/


    /*************************************地区管理(RegionPlace)begin***************************************/
    /**
     * 创建地区管理
     * @param data
     * @returns {*}
     */

    @clientExport
    @requireParams(["id"])
    static async getRegionPlace(params: {id: string}) : Promise<any>{
        let id = params.id;
        let pr = await TravelPolicyModule.operateOnPolicy({
            model: "regionPlace",
            params: {
                fields: params,
                method: "get"
            }
        });
        return API.policy.getRegionPlace(params);
    };

    @clientExport
    // @requireParams()
    static async getResgionPlaces(params) : Promise<any>{
        let pc = await TravelPolicyModule.operateOnPolicy({
            model: "regionPlace",
            params: {
                fields: params,
                method: "get"
            }
        });
        return API.policy.getRegionPlaces(params)
    };

    @clientExport
    @requireParams(["companyRegionId","placeId"])
    static async createRegionPlace(params) : Promise<any>{
        let pr = await TravelPolicyModule.operateOnPolicy({
            model: "regionPlace",
            params: {
                fields: params,
                method: "post"
            }
        });
        return API.policy.createRegionPlace(params);
    };

    /*************************************地区设置(RegionPlace)end***************************************/


    static async operateOnPolicy(options: {
        model: string,
        params?:any,
    }) {

        let {params,model} = options;
        let {fields,method} = params;

        let url = Config.openApiUrl + `/${model}`;
        console.log("======fields: ", fields);

        if(method == 'get') {
            if(!fields.hasOwnProperty("id")){
                url = url + "?";
            }
            for (let key in fields){
                if(key == 'id') {      //按照id查询
                    url = url + `/${fields[key]}`;
                    break;
                }
                url = url + `${key}=${fields[key]}&`;
            }
            url = encodeURI(url);
        }
        if(url.lastIndexOf("&") == url.length -1 ){
            url = url.slice(0, -1);
        }


        console.log("====>url: ", url);

        let result = await request({
            uri: url,
            // body: fields,  //JSON.stringify(params);
            json:true,
            method: method
        });
        console.log("====reuslt: ", result, JSON.stringify(result));
        return result;
    }
}

function tryConvertToArray(val) {
    if (val && !_.isArray(val)) {
        return [val];
    }
    return val;
}

// url = `http://localhost:8080/api/v1/travelPolicy/213412id`;
// url = `http://localhost:8080/api/v1/policy`;
// let result = await request.get({uri: url});
// params = {
// 	name: "jack",
// 	id: '12342341'
// }

// let result = await request({
//           uri: url,
//           body:  params, //JSON.stringify(params);
//           json:true,
//           method: "post"
//       });

// let result = await request({
//     uri: url,
// });
// console.log("===> result: ", result);