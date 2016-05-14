/**
 * Created by wyl on 15-12-12.
 */
'use strict';

/**
 * @module API
 */
let API = require("common/api");
let _ = require('lodash');
let L = require("common/language");
import types = require("api/_types/travelPolicy");
import {requireParams} from "common/api/helper";
import {requirePermit} from 'api/_decorator';
import { TravelPolicy } from 'api/_types/travelPolicy';



/**
 * @class travelPolicy 出差标准
 */

class ApiTravelPolicy {
    /**
     * @method createTravelPolicy
     *
     * 企业创建差旅标准
     *
     * @param params
     * @returns {*|Promise}
     */
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
            return API.travelPolicy.createTravelPolicy(params)

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});

            if(result){
                return API.travelPolicy.createTravelPolicy(params)
            }else{
                throw {code: -1, msg: '无权限'};
            }

        }
    }


    /**
     * 企业删除差旅标准
     * @param params
     * @returns {*|Promise}
     */
    static async deleteTravelPolicy(params: {id : string, companyId?: string}) : Promise<any>{
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});

            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            return API.travelPolicy.deleteTravelPolicy({companyId: staff.companyId, id: params.id});

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});

            if(result){
                return API.travelPolicy.deleteTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }



    /**
     * 企业更新差旅标准
     * @param id
     * @param params
     * @returns {*|Promise}
     */
    static async updateTravelPolicy(params) : Promise<TravelPolicy>{
        let self: any = this;
        let user_id = self.accountId;
        let company_id;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            company_id = staff.companyId;

            let tp = await API.travelPolicy.getTravelPolicy({id: params.id});
            if(tp.companyId != company_id){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = company_id;//只允许删除该企业下的差旅标准
            return API.travelPolicy.updateTravelPolicy(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.travelPolicy.updateTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }


    /**
     * 企业根据id查询差旅标准
     * @param id
     * @returns {*|Promise}
     */
    static async getTravelPolicy(params: {id: string, companyId?: string}) : Promise<TravelPolicy>{
        let id = params.id;
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            if(!id){
                return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'});
            }else{
                let staff = await API.staff.getStaff({id: user_id});
                let tp = await API.travelPolicy.getTravelPolicy({id:id});

                if(!tp){
                    throw {code: -1, msg: '查询结果不存在'};
                }

                if(tp.companyId && tp.companyId != staff.companyId){
                    throw {code: -1, msg: '无权限'};
                }

                return tp;
            }
        }else{
            if(!id){
                return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'});
            }else{
                let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
                if(result){
                    return API.travelPolicy.getTravelPolicy({id:id});
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            }
        }
    };


    /**
     * 员工获取自身差旅标准
     * @returns {*|Promise}
     */
    static async getCurrentStaffTp(){
        let self: any = this;
        let user_id = self.accountId;
        let staff = await API.staff.getStaff({id: user_id});
        let travelPolicy = await staff.getTravelPolicy();

        if(travelPolicy){
            return  travelPolicy;
        }else{
            return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
        }
    };


    /**
     * 企业分页查询差旅标准
     * @param params
     * @param params.options
     * @param callback
     * @returns {*|Promise}
     */
    static async listAndPaginateTravelPolicy(params){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});
        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});

            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            return API.travelPolicy.listAndPaginateTravelPolicy(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});

            if(result){
                return API.travelPolicy.listAndPaginateTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }

        }

    }


    /**
     * 查询企业最新差旅标准
     * @param params
     * @param params.options
     * @param callback
     * @returns {*|Promise}
     */
    static async getLatestTravelPolicy(params){
        let self: any = this;
        let user_id = self.accountId;

        let staff = await API.staff.getStaff({id: user_id});
        if(staff){
            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            let result = await API.travelPolicy.listAndPaginateTravelPolicy(params);

            if(result && result.items && result.items.length>0){
                return new types.TravelPolicy(result.items[0]);
            }else{
                return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
            }

        }else{
            throw {code: -1, msg: '无权限'};
        }
    }

    /**
     * 企业得到所有差旅标准
     * @param params
     * @returns {*|Promise}
     */
    static async getAllTravelPolicy(params){
        let self: any = this;
        let user_id = self.accountId;
        let companyId = params.companyId;

        let role = await API.auth.judgeRoleById({id:user_id});
        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id:user_id});
            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            return API.travelPolicy.getAllTravelPolicy(params);
            
        }else{
            let result = await API.company.checkAgencyCompany({companyId: companyId, userId: self.accountId});
            if(result){
                return API.travelPolicy.getAllTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 企业得到所有差旅标准
     * @param params
     * @returns {*|Promise}
     */
    static async getTravelPolicies(params){
        let self: any = this;
        let user_id = self.accountId;
        let companyId = params.companyId;
        let role = await API.auth.judgeRoleById({id:user_id});
        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id:user_id});
            if(!staff){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许查询该企业下的差旅标准
            return API.travelPolicy.getTravelPolicies(params);

        }else{
            let result = await API.company.checkAgencyCompany({companyId: companyId, userId: self.accountId});
            if(result){
                return API.travelPolicy.getTravelPolicies(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }
}

export = ApiTravelPolicy;

