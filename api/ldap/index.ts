/**
 * Created by wangyali on 2017/6/28.
 */
'use strict';

const API = require('@jingli/dnode-api');
import fs = require("fs");
import {Models} from "_types/index";
import {clientExport} from "@jingli/dnode-api/dist/src/helper";
import { ACCOUNT_STATUS } from "_types/auth";
import LdapAPi from "./ldapApi"
import {Company, CPropertyType} from "_types/company";
import {Staff, SPropertyType} from "_types/staff";
import {Department, DepartmentProperty, DPropertyType} from "_types/department";
import utils = require("common/utils");
import L from '@jingli/language';
import {StaffProperty} from "../../_types/staff/staff-property";

export let staffOpts = {
    scope: 'sub',
    attributes: ['*', 'entryUUID', 'departmentNumber']
};
export let departmentOpts = {
    scope: 'sub',
    attributes: ['*', 'entryUUID']
};
export class LdapModule {
    static __public: boolean = true;
    __initHttpApp(app) {

        app.get("/initLdap", async (req, res, next)=>{
            let params={
                mobile: "18401208626",
                email: "66666@qq.com",
                name: "测试ldap同步",
                userName: "staff1",
                pwd: "123456",
                status: ACCOUNT_STATUS.ACTIVE,
                isValidateMobile: true,
                ldapBaseDn: "dc=jingli,dc=com",
                ldapStaffRootDn: "cn=employee,dc=jingli,dc=com",
                ldapDepartmentRootDn: "ou=groups,dc=jingli,dc=com",
                ldapUrl: "ldap://123.56.70.171:389/DC=jingli,DC=com",
                ldapAdminDn: "cn=Manager,dc=jingli,dc=com",
                ldapAdminPassword: "wang123456"
            }
            //注册企业
            // let result = await this.registerLdapCompany(params);
            // console.info(result);

            //同步部门
            // let depts = await this.initLdapDepartments({companyId: "1826e3b0-5d78-11e7-8209-39ca94a15277"});
            // console.info(depts);

            //同步员工
            let staffs = await this.initLdapStaffs({companyId: "1826e3b0-5d78-11e7-8209-39ca94a15277"});
            console.info(staffs);

            console.info("==========================================end");
            res.send("ok");
        });

    }

    /**
     * 注册ldap企业
     * @param params
     * @returns {Promise<Promise<any>|Promise<Promise<any>|Promise<any>>>}
     */
    @clientExport
    async registerLdapCompany(params){
        var result = await API.company.registerCompany(params);

        return result;
    }

    /**
     * 同步ldap部门信息
     * @param params
     * @returns {Promise<boolean>}
     */
    @clientExport
    async initLdapDepartments(params: {companyId: string}): Promise<boolean>{
        // let company = await Models.company.get(params.companyId);
        let ldapProperty = await Models.companyProperty.find({where: {companyId: params.companyId, type: CPropertyType.LDAP}});
        if(!ldapProperty || !ldapProperty[0]){
            throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
        }
        let ldapInfo = ldapProperty[0].jsonValue;
        if(typeof ldapInfo == "string") ldapInfo = JSON.parse(ldapInfo);

        let ldapApi = new LdapAPi(ldapInfo.ldapUrl);
        await ldapApi.bindUser({entryDn: ldapInfo.ldapAdminDn, userPassword: ldapInfo.ldapAdminPassword});

        let rootDn = ldapInfo.ldapDepartmentRootDn;
        let result = await ldapApi.searchDn({rootDn: rootDn, opts: departmentOpts});

        let departments = await Promise.all(result.map(async (item) => {
            if(item.dn != rootDn){
                let dept = await this.syncDepartment(item, params.companyId);
                return dept;
            }
        }));

        console.info(departments);
        console.info("departments=========================");
        return true;
    }

    /**
     * 同步单个部门信息
     * @param departInfo
     * @param companyId
     * @returns {Promise<any>}
     */
    @clientExport
    async syncDepartment (departInfo : any, companyId?: string): Promise<Department>{
        console.log("create department=====================" , departInfo);

        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let parentId;
        //获得ldap部门parentId 逻辑
        let departmentLdapProperty = await Models.departmentProperty.find({where : {type: DPropertyType.LDAP, value: departInfo.entryUUID}});
        let department; Department;
        if(departmentLdapProperty && departmentLdapProperty.length > 0){
            // 已存在，修改
            department = await Models.department.get(departmentLdapProperty[0].departmentId);
            department.name = departInfo.cn;
            await department.save();
        }else{
            // 不存在，添加
            let values = {"name": departInfo.cn, "parentId": parentId || defaultDepartment.id ,
                "isDefault" : false};
            department = Models.department.create( values );
            department.company = company;
            await department.save();

            let departmentProperty = DepartmentProperty.create({departmentId: department.id, type: DPropertyType.LDAP, value: departInfo.entryUUID});
            await departmentProperty.save();
        }

        return department;
    }

    /**
     * 同步ldap员工信息
     * @param params
     * @returns {Promise<boolean>}
     */
    @clientExport
    async initLdapStaffs(params: {companyId: string}): Promise<boolean>{
        // let company = await Models.company.get(params.companyId);

        let ldapProperty = await Models.companyProperty.find({where: {companyId: params.companyId, type: CPropertyType.LDAP}});
        if(!ldapProperty || !ldapProperty[0]){
            throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
        }
        let ldapInfo = ldapProperty[0].jsonValue;
        if(typeof ldapInfo == "string") ldapInfo = JSON.parse(ldapInfo);

        let ldapApi = new LdapAPi(ldapInfo.ldapUrl);
        await ldapApi.bindUser({entryDn: ldapInfo.ldapAdminDn, userPassword: ldapInfo.ldapAdminPassword});

        let rootDn = ldapInfo.ldapStaffRootDn;
        let result = await ldapApi.searchDn({rootDn: rootDn, opts: staffOpts});

        let staffs = await Promise.all(result.map(async (item) => {
            if(item.dn != rootDn){
                let st = await this.syncStaff(item, params.companyId);
                return st;
            }
        }));

        console.info(staffs);
        console.info("staffs=========================");
        return true;
    }


    /**
     * 同步单个ldap用户信息
     * @param staffInfo
     * @param companyId
     * @returns {Promise<Staff>}
     */
    @clientExport
    async syncStaff (staffInfo : any, companyId?: string): Promise<Staff>{
        console.log("create staff=====================" , staffInfo);

        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();
        let staffLdapProperty = await Models.staffProperty.find({where : {type: SPropertyType.LDAP, value: staffInfo.entryUUID}});
        let staff: Staff;
        let companyCreateUser = await Models.staff.get(company.createUser);
        if(companyCreateUser.mobile == staffInfo.mobile || (staffLdapProperty && staffLdapProperty.length > 0)){
            // 已存在，修改
            if(staffLdapProperty && staffLdapProperty.length > 0){
                staff = await Models.staff.get(staffLdapProperty[0].staffId);
            }else{
                staff = companyCreateUser;
                let staffProperty = StaffProperty.create({staffId: staff.id, type: SPropertyType.LDAP, value: staffInfo.entryUUID});
                await staffProperty.save();
            }
            staff.name = staffInfo.cn;
            staff.mobile = staffInfo.mobile;
            await staff.save();

            // 处理部门
            if(!staffInfo.departmentNumber){
                await staff.updateStaffDepartment(defaultDepartment);
            }else{
                let departmentProperty = await Models.departmentProperty.find({where: {value: staffInfo.departmentNumber, type: DPropertyType.LDAP}});
                let departmentIds = departmentProperty.map(function(item){
                    return item.departmentId;
                })
                let departments = await Models.department.find({where: {companyId: companyId, id: departmentIds}});
                await staff.updateStaffDepartment(departments);
            }
        }else{
            // 不存在，添加
            let values = {"name": staffInfo.cn, "mobile": staffInfo.mobile, "email": staffInfo.email,
                pwd: utils.md5(staffInfo.userPassword), isValidateMobile: true, isValidateEmail: true};
            staff = Models.staff.create( values );
            staff.setTravelPolicy(defaultTravelPolicy);
            staff.company = company;
            staff = await staff.save();
            let staffProperty = StaffProperty.create({staffId: staff.id, type: SPropertyType.LDAP, value: staffInfo.entryUUID});
            await staffProperty.save();

            // 处理部门
            if(!staffInfo.departmentNumber){
                await staff.addDepartment(defaultDepartment);
            }else{
                let departmentProperty = await Models.departmentProperty.find({where: {value: staffInfo.departmentNumber, type: DPropertyType.LDAP}});
                let departmentIds = departmentProperty.map(function(item){
                    return item.departmentId;
                })
                let departments = await Models.department.find({where: {companyId: companyId, id: departmentIds}});
                await staff.addDepartment(departments);
            }
        }

        return staff;
    }
}

let ldapModule = new LdapModule();
export default ldapModule;
