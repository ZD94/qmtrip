/**
 * Created by wyl on 11-01-20.
 */
'use strict';

/**
 * @module API
 */
let API = require("common/api");
let L = require("common/language");
import {Department} from "api/_types/department";
import {validateApi} from 'common/api/helper';
let sequelize = require("common/model").importModel("../../department/models");
let departmentModel = sequelize.models.Department;
let departmentCols = Object.keys(departmentModel.attributes);
/**
 * @class department 部门
 */
class ApiDepartment {
    /**
     * @method createDepartment
     *
     * 企业创建部门
     *
     * @param params
     * @returns {*|Promise}
     */
    static async createDepartment (params): Promise<Department>{
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            if(staff.code){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许添加该企业下的部门
            return API.department.createDepartment(params)

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});

            if(result){
                return API.department.createDepartment(params)
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * @method deleteDepartment
     * 企业删除部门
     * @param params
     * @returns {*|Promise}
     */
    static async deleteDepartment(params): Promise<any>{
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            return API.department.deleteDepartment(params);
        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            // delete params.companyId;
            if(result){
                return API.department.deleteDepartment(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * @method updateDepartment
     * 企业更新部门
     * @param id
     * @param params
     * @returns {*|Promise}
     */
    static async updateDepartment(params): Promise<Department>{
        let self: any = this;
        let user_id = self.accountId;
        let company_id;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            company_id = staff.companyId;
            let tp = await API.department.getDepartment({id: params.id});

            if(tp.companyId != company_id){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = company_id;
            return API.department.updateDepartment(params)

        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.updateDepartment(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }


    /**
     * @method getDepartment
     * 企业根据id查询部门
     * @param id
     * @returns {*|Promise}
     */
    static async getDepartment(params: {id?: string, companyId?: string}): Promise<Department>{
        let id = params.id;
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            let companyId = staff.companyId;

            if(!id){
                return API.department.getDefaultDepartment({companyId:companyId});
            }

            let tp = await API.department.getDepartment({id:id});
            if(!tp){
                throw {code: -1, msg: '查询结果不存在'};
            }
            if(tp.companyId != companyId){
                throw {code: -1, msg: '无权限'};
            }
            return tp;

        }else{
            let  result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getDepartment({id:id});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    };

    /**
     * 根据条件得到企业所有部门
     * @param params
     * @returns {*|Promise}
     */
    static async getDepartments(params){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            params.companyId = staff.companyId;
            return API.department.getDepartments(params);

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getDepartments({companyId: params.companyId});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    };


    /**
     * @method getFirstClassDepartments
     * 查询企业一级部门
     * @param params
     * @param params.companyId 企业Id
     * @returns {*|Promise}
     */
    static async getFirstClassDepartments(params: {companyId?: string}){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){

            let staff = await API.staff.getStaff({id: user_id});
            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return API.department.getFirstClassDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getFirstClassDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }


    /**
     * @method getChildDepartments
     * 查询部门直接子级部门
     * @param params
     * @param params.parentId 父级Id
     * @returns {*|Promise}
     */
    static async getChildDepartments(params: {companyId?: string, parentId: string}){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: user_id});

            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return API.department.getChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * @method createDepartment
     * 查询企业全部部门结构
     * @param params
     * @param params。companyId 企业id
     * @returns {*|Promise}
     */
    static async getDepartmentStructure (params){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: user_id});
            if(staff.code){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = staff.companyId;//只允许添加该企业下的部门
            return API.department.getDepartmentStructure(params);
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getDepartmentStructure(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 根据企业id得到企业所有部门
     * @param params
     * @returns {*|Promise}
     */
    static async getAllDepartment(params: {companyId?: string}){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: user_id});
            return API.department.getAllDepartment({companyId: staff.companyId});
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getAllDepartment({companyId: params.companyId});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    };


    /**
     * @method getAllChildDepartments
     * 查询部门所有子级部门
     * @param params
     * @param params.parentId 父级Id
     * @returns {*|Promise}
     */
    static async getAllChildDepartments(params: {companyId?: string, parentId: string}){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});
        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: user_id});
            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return API.department.getAllChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getAllChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }


    /**
     * @method getAllChildDepartmentsId
     * 查询部门所有子级部门id数组
     * @param params
     * @param params.parentId 父级Id
     * @returns {*|Promise}
     */
    static async getAllChildDepartmentsId(params: {companyId?: string, parentId: string}){
        let self: any = this;
        let user_id = self.accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == L.RoleType.STAFF){
            let staff = await API.staff.getStaff({id: user_id});
            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return API.department.getAllChildDepartmentsId(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return API.department.getAllChildDepartmentsId(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }
}

export = ApiDepartment;

