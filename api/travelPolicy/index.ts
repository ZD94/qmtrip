/**
 * Created by wyl on 15-12-12.
 */
'use strict';
import {DB} from '@jingli/database';
import Logger from '@jingli/logger';
const logger = new Logger('travelPolicy');

import L from '@jingli/language';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import {Staff, EStaffStatus,EStaffRole} from "_types/staff";
// import { TravelPolicy, SubsidyTemplate,TravelPolicyRegion,CompanyRegion,RegionPlace } from '_types/travelPolicy';
import { Models } from '_types';
import { PaginateInterface } from "common/model/interface";
import {AgencyUser} from "_types/agency"
var request = require("request");
import { getCompanyTokenByAgent } from 'api/restful';
import { restfulAPIUtil } from 'api/restful';

import {DefaultRegion, DefaultRegionId} from "_types";
var Config = require("@jingli/config");
var subsidyRegions = [
    {name:DefaultRegion.abroad, cityIds: [DefaultRegionId.abroad], group: 2, types: [1,2,3]},
    {name:DefaultRegion.domestic, cityIds: [DefaultRegionId.domestic], group: 1, types: [1,2,3]},
    {name:"中国一类地区", cityIds: ['CT_340','CT_257','CT_289','CT_131'], group: 1, types: [2,3]},
    {name:"中国二类地区", cityIds: ['CT_194','CT_179','CT_158','CT_317','CT_233','CT_058','CT_236','CT_315','CT_218','CT_167','CT_300','CT_075','CT_332','CT_288','CT_132'], group: 1, types: [2,3]},
    {name:"港澳台", cityIds: ['CT_2912','CT_9000','CT_2911'], group: 2, types: [1,2,3]}
    ];

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

    @clientExport
    static async getStaffs(params:{travelPolicyId: string, companyId:string}):Promise<PaginateInterface<Staff>>{
        let {companyId, travelPolicyId} = params;
        let query = {where: {companyId: companyId, travelPolicyId: travelPolicyId,staffStatus: EStaffStatus.ON_JOB}}
        let pager = await Models.staff.find(query);
        return pager;
    }
    /**
     * 创建差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    static async createTravelPolicy(params: any):Promise<any>{
        if(!params.companyId || !params.name){
            throw L.ERR.BAD_REQUEST();
        }

        let isExistedParams = {
            name: params.name,
            companyId: params.companyId
        }

        let isExisted: any = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params: {
                fields: isExistedParams,
                method: "get",
            },
        });
        if(isExisted.data && isExisted.data.length) {
            throw L.ERR.TRAVEL_POLICY_NAME_REPEAT();
        }

        let staff = await Staff.getCurrent();
        let company = await Models.company.get(params.companyId);
        if(!company) company = staff.company;

        if((staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER)) {
            //(agencyUser && agencyUser["companyId"] != company["id"])
            throw L.ERR.PERMISSION_DENY();
        }

        let tp = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params: {
                fields: params,
                method: "post",
            },
        });
        if(typeof(tp) == 'string') tp = JSON.parse(tp);
        if(!tp) {
            throw L.ERR.SYSTEM_ERROR();
        }
        return tp;
    }

    /**
     * 创建地区差旅标准
     * @param data
     * @returns {*}
     */
    @clientExport
    static async createTravelPolicyRegion(params: any): Promise<any> {
        let {travelPolicyId} = params;
        if(!travelPolicyId) {
            throw L.ERR.BAD_REQUEST();
        }

        // let tpr = await API.policy.createTravelPolicyRegion(params);
        let tpr = await restfulAPIUtil.operateOnModel({
            model: "travelpolicyregion",
            params: {
                fields: params,
                method: "post"
            }
        });
        return tpr;
    }


    /**
     * 删除差旅标准
     * @param params
     * @returns {*}
     */
    @clientExport
    // @requireParams(["id"], ["companyId"])
    static async deleteTravelPolicy(params: any) : Promise<any>{
        let {id, companyId} = params;
        var staff = await Staff.getCurrent();
        if(!id || !companyId) {
            throw L.ERR.BAD_REQUEST();
        }
        // let agencyUser = await AgencyUser.getCurrent();

        let tp_delete: any = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params:{
                fields: params,
                method: "get"
            }
        });
        tp_delete = tp_delete.data;

        if((staff && tp_delete && (staff['companyId'] != tp_delete['companyId'] || (staff['roleId'] != EStaffRole.ADMIN &&
            staff['roleId'] != EStaffRole.OWNER) )) ) {  //||(agencyUser['agencyId'] != company['agencyId'])
            throw L.ERR.PERMISSION_DENY();
        }

        if(tp_delete["isDefault"]){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        let staffs = await Models.staff.find({where: {travelPolicyId: id, staffStatus: EStaffStatus.ON_JOB}});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准请先移除'};
        }

        let isDeleted: any = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params:{
                fields: params,
                method: "delete"
            }
        });
        return isDeleted;
    }
    static async deleteTravelPolicyByTest(params: any){
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
    // @requireParams(["id"])
    static async updateTravelPolicy(params: any) : Promise<any>{
        var {id, companyId} = params;

        var staff = await Staff.getCurrent();
        if(!id || !companyId) {
            throw L.ERR.BAD_REQUEST();
        }
        // let agencyUser = await AgencyUser.getCurrent();

        let isUpdated: any = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params:{
                fields: params,
                method: "get"
            }
        });
        isUpdated = isUpdated.data;

        if((staff && (staff['companyId'] != isUpdated['companyId'] || (staff['roleId'] != EStaffRole.ADMIN &&
            staff['roleId'] != EStaffRole.OWNER))) ) {  //|| (agencyUser['agencyId'] != company['agencyId'])
            throw L.ERR.PERMISSION_DENY();
        }

        let tp = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params: {
                fields: params,
                method: "put"
            }
        });
        return tp;
    }

    @clientExport
    static async updateTravelPolicyRegion(params: any) : Promise<any>{
        let tpr = await restfulAPIUtil.operateOnModel({
            model: "travelpolicyregion",
            params: {
                fields: params,
                method: "put"
            }
        });
        return tpr;
    }

    /**
     * 删除差旅标准详情
     * @param params
     * @returns {*}
     */
    @clientExport
    // @requireParams(["id"])
    static async deleteTravelPolicyRegion(params: any) : Promise<any>{
        var staff = await Staff.getCurrent();

        if(staff["roleId"] != EStaffRole.ADMIN && staff["roleId"] != EStaffRole.OWNER){
            throw {code: -2, msg: '不允许删除默认差旅标准'};
        }

        let isDeleted: any = await restfulAPIUtil.operateOnModel({
            model: "travelpolicyregion",
            params: {
                fields: params,
                method: "delete"
            }
        }) ;
        return !!isDeleted;
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
    static async getTravelPolicy(params: {id: string, companyId?: string}) : Promise<any>{
        let travelPolicy = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params: {
                fields: params,
                method: "get"
            }
        });
        if(typeof(travelPolicy) == 'string') travelPolicy = JSON.parse(travelPolicy);
        return travelPolicy;
    }


    /**
     * 根据属性查找差旅标准
     * @param params
     * @returns {*}
     */

    @clientExport
    @requireParams(["companyId"], ["companyId", "isDefault","name","p", "pz"])
    static async getTravelPolicies(params: {companyId: string, p?: number, pz?: number,isDefault?: boolean, name?:string}): Promise<any>{
        let {companyId } = params;
        var staff = await Staff.getCurrent();

        let company = await Models.company.get(companyId);
        let agencyUser = await AgencyUser.getCurrent();

        if((staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER) ||
            (agencyUser && agencyUser['agencyId'] != company['agencyId'])) {
            throw L.ERR.PERMISSION_DENY();
        }
        let travelPolicies = await restfulAPIUtil.operateOnModel({
            model: "travelpolicy",
            params: {
                fields: params,
                method: "get"
            }
        });

        return travelPolicies;
    }

    /*************************************补助模板begin***************************************/
    /**
     * 创建补助模板
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["subsidyMoney","name","travelPolicyId"])
    static async createSubsidyTemplate(params: any) : Promise<any>{
        // let {name, travelPolicyId, subsidyMondy} = params;
        // if(!name || !travelPolicyId || !subsidyMondy) {
        //     throw L.ERR.BAD_REQUEST();
        // }
        // let staff = await Staff.getCurrent();
        // if(staff["roleId"] != EStaffRole.ADMIN && staff["roleId"] != EStaffRole.OWNER){
        //     throw {code: -2, msg: '不允许删除默认差旅标准'};
        // }
        //
        // if(staff && staff['roleId'] != EStaffRole.ADMIN && staff['roleId'] != EStaffRole.OWNER) {
        //     throw L.ERR.PERMISSION_DENY();
        // }

        /*let result = await Models.subsidyTemplate.find({where: {travelPolicyId: params.travelPolicyId}});
         if(result && result.length>0){
         throw {msg: "该城市补助模板已设置"};
         }*/

        let subsidy = await restfulAPIUtil.operateOnModel({
            model: "subsidytemplate",
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
    static async deleteSubsidyTemplate(params: any) : Promise<any>{
        let isDeleted = await restfulAPIUtil.operateOnModel({
            model: "subsidytemplate",
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
    @requireParams(["id"], ["subsidyMoney","name", "travelPolicyId"])
    static async updateSubsidyTemplate(params: any): Promise<any>{
        if(!params.id){
            throw L.ERR.BAD_REQUEST();
        }

        let subsidy = await restfulAPIUtil.operateOnModel({
            model: "subsidytemplate",
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
    @requireParams(["id"], ["subsidyMoney","name", "travelPolicyId"])
    static async getSubsidyTemplate(params: any): Promise<any>{
        if(!params.id){
            throw L.ERR.BAD_REQUEST();
        }
        let subsidy = await restfulAPIUtil.operateOnModel({
            model: "subsidytemplate",
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
    @requireParams(["travelPolicyId"], ["subsidyMoney","name", "travelPolicyId"])
    static async getSubsidyTemplates(params: any): Promise<any>{
        let subsidies = await restfulAPIUtil.operateOnModel({
            model: "subsidytemplate",
            params: {
                fields: params,
                method: "get"
            }
        });
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
    @requireParams(["id"], ["travelPolicyId","hotelPrefer", "trafficPrefer", "hotelLevels", "planeLevels","trainLevels","companyRegionId"])
    static async getTravelPolicyRegion(params: any): Promise<any> {
        // return API.policy.getTravelPolicyRegion(params);
        let tpr = await restfulAPIUtil.operateOnModel({
            model: "travelpolicyregion",
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
    static async getTravelPolicyRegions(params: any): Promise<any>{
        let tprs = await restfulAPIUtil.operateOnModel({
            model: "travelpolicyregion",
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
        // return API.policy.getCompanyRegion(params);
        let cr = await restfulAPIUtil.operateOnModel({
            model: "companyregion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return cr;
    };

    @clientExport
    static async getCompanyRegions(params: any) : Promise<any>{
        let cr = await restfulAPIUtil.operateOnModel({
            model: "companyregion",
            params: {
                fields: params,
                method: "get"
            }
        });
        return cr;
    };

    @clientExport
    @requireParams(["companyId","name"])
    static async createCompanyRegion(params: any) : Promise<any>{
        let cr = await restfulAPIUtil.operateOnModel({
            model: "companyregion",
            params: {
                fields: params,
                method: "post"
            }
        });
        return cr;
    };

    @clientExport
    static async updateCompanyRegion(params: any) : Promise<any>{
        let cr = await restfulAPIUtil.operateOnModel({
            model: "companyregion",
            params: {
                fields: params,
                method: "put"
            }
        });
        return cr;
    };
    @clientExport
    @requireParams(["id"])
    static async deleteCompanyRegion(params: any) : Promise<any>{
        let cr = await restfulAPIUtil.operateOnModel({
            model: "companyregion",
            params: {
                fields: params,
                method: "delete"
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
        let pr = await restfulAPIUtil.operateOnModel({
            model: "regionplace",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pr;
    };

    @clientExport
    static async getRegionPlaces(params: any) : Promise<any>{
        let pc = await restfulAPIUtil.operateOnModel({
            model: "regionplace",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pc;
    };

    @clientExport
    @requireParams(["companyRegionId","placeId"])
    static async createRegionPlace(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "regionplace",
            params: {
                fields: params,
                method: "post"
            }
        });
        return pr;
    };

    @clientExport
    static async updateRegionPlace(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "regionplace",
            params: {
                fields: params,
                method: "put"
            }
        });
        return pr;
    };

    @clientExport
    @requireParams(["id"])
    static async deleteRegionPlace(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "regionplace",
            params: {
                fields: params,
                method: "delete"
            }
        });
        return pr;
    };

    @clientExport
    static async initSubsidyRegions(params: any) : Promise<any>{
        if(!params) params = {};
        if(!params.companyId){
            let staff = await Staff.getCurrent();
            params.companyId = staff.company.id;
        }

        let companyRegions = await Promise.all(subsidyRegions.map(async (regionGroup) => {
            let cityIds = regionGroup.cityIds;
            let name = regionGroup.name;
            let group = regionGroup.group;
            let types = regionGroup.types;
            let companyRegion = await TravelPolicyModule.getCompanyRegions({companyId: params.companyId, name: name});
            companyRegion = companyRegion.data;
            if(companyRegion && companyRegion.length){
                companyRegion = companyRegion[0];
                return companyRegion;
            }

            companyRegion = await TravelPolicyModule.createCompanyRegion({companyId: params.companyId, name: name, group: group, types: types});
            companyRegion = companyRegion.data;

            await Promise.all(cityIds.map(async (cityId) => {
                await TravelPolicyModule.createRegionPlace({
                    placeId: cityId,
                    companyRegionId: companyRegion.id,
                    companyId: params.companyId
                });
            }));

            return companyRegion;
        }))

        return companyRegions;
    };



    /*************************************地区设置(RegionPlace)end***************************************/


    /*************************************补助类型管理(SubsidyType)begin***************************************/

    @clientExport
    @requireParams(["id"])
    static async getSubsidyType(params: {id: string}) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "subsidyType",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pr;
    };

    @clientExport
    static async getSubsidyTypes(params: any) : Promise<any>{
        let pc = await restfulAPIUtil.operateOnModel({
            model: "subsidyType",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pc;
    };

    @clientExport
    static async createSubsidyType(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "subsidyType",
            params: {
                fields: params,
                method: "post"
            }
        });
        return pr;
    };

    @clientExport
    static async updateSubsidyType(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "subsidyType",
            params: {
                fields: params,
                method: "put"
            }
        });
        return pr;
    };

    @clientExport
    @requireParams(["id"])
    static async deleteSubsidyType(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "subsidyType",
            params: {
                fields: params,
                method: "delete"
            }
        });
        return pr;
    };

    /*************************************补助类型管理(SubsidyType)end***************************************/


    /*************************************地区补助金额管理(PolicyRegionSubsidy)begin***************************************/

    @clientExport
    @requireParams(["id"])
    static async getPolicyRegionSubsidy(params: {id: string, companyId?: string}) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pr;
    };

    @clientExport
    static async getPolicyRegionSubsidies(params: any) : Promise<any>{
        let pc = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "get"
            }
        });
        return pc;
    };

    @clientExport
    static async getPolicyRegionSubsidiesByCity(params: {travelPolicyId?: string, cityId: string}) : Promise<any>{
        if(!params.travelPolicyId){
            let currentStaff = await Staff.getCurrent();
            let policy = await currentStaff.getTravelPolicy();
            params.travelPolicyId = policy.id;
        }
        let pc = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "get"
            },
            addUrl: "getByCity"
        });
        return pc;
    };

    @clientExport
    static async createPolicyRegionSubsidy(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "post"
            }
        });
        return pr;
    };

    @clientExport
    static async updatePolicyRegionSubsidy(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "put"
            }
        });
        return pr;
    };

    @clientExport
    @requireParams(["id"])
    static async deletePolicyRegionSubsidy(params: any) : Promise<any>{
        let pr = await restfulAPIUtil.operateOnModel({
            model: "policyRegionSubsidy",
            params: {
                fields: params,
                method: "delete"
            }
        });
        return pr;
    };

    /*************************************地区补助金额管理(PolicyRegionSubsidy)end***************************************/


    static async operateOnPolicy(options: {
        model: string,
        params?:any,
        addUrl?: string
    }) : Promise<any>{
        let {params, model, addUrl} = options;
        let {fields, method} = params;
        let currentCompanyId = fields['companyId'];
        if(!currentCompanyId || typeof(currentCompanyId) == 'undefined') {
            let staff = await Staff.getCurrent();
            currentCompanyId = staff["companyId"];
        }

        const token = await getCompanyTokenByAgent(currentCompanyId);
        let url = Config.cloudAPI + `/${model}`;
        if(addUrl){
            url = url + `/${addUrl}`
        }
        logger.log("URL:", url);
        let qs: {
            [index: string]: string;
        } = {};
        if (fields.hasOwnProperty("id") && fields['id'] && fields['id'] != "null") {
            url = url + `/${fields['id']}`;
        }
        if(!fields.hasOwnProperty("id")){
            if(method == 'get'){
                for (let key in fields) {
                    qs[key] = fields[key];
                }
            }
        }
        return new Promise((resolve, reject) => {
            return request({
                uri: url,
                body: fields,
                json:true,
                method: method,
                qs: qs,
                headers: {
                    token
                }
            }, (err: Error, resp: any, result: any) => {
                if (err) {
                    return reject(err);
                }
                if(typeof(result) == 'string'){
                    logger.info(result);
                    result = JSON.parse(result);
                }
                return resolve(result);
            })
        })
    }
}

// function tryConvertToArray(val: any) {
//     if (val && !_.isArray(val)) {
//         return [val];
//     }
//     return val;
// }


