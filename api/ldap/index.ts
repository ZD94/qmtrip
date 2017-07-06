/**
 * Created by wangyali on 2017/6/28.
 */
'use strict';
//考虑同步手机号已存在问题？？？？ 即一个员工多个企业
const API = require('@jingli/dnode-api');
import fs = require("fs");
import {Models} from "_types/index";
import {clientExport} from "@jingli/dnode-api/dist/src/helper";
import { ACCOUNT_STATUS } from "_types/auth";
import LdapAPi from "./ldapApi"
import {Company, CPropertyType} from "_types/company";
import {Staff, SPropertyType, StaffProperty} from "_types/staff";
import {Department, DepartmentProperty, DPropertyType} from "_types/department";
import utils = require("common/utils");
import L from '@jingli/language';
import LdapDepartment from "./ldapDepartment";
import { OaDepartment } from './lib/department';

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
            // let staffs = await this.initLdapStaffs({companyId: "1826e3b0-5d78-11e7-8209-39ca94a15277"});
            // console.info(staffs);
            /*let ldapApi = new LdapAPi(params.ldapUrl);
            let ldapp = new LdapDepartment({id: "1111", name: "test",dapApi: ldapApi, dn: "cn=employee,dc=jingli,dc=com"});
            console.info(ldapp);
            console.info(ldapp.id);
            console.info(ldapp.name);
            console.info(ldapp.manager);
            console.info(ldapp.dn);
            console.info(ldapp.parentId);
            console.info(ldapp.getChildrenDepartments());
            console.info("==========================================end");*/

            // await API.company.resetTripPlanNum();
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
    async initLdapDepartments(params: {companyId: string}): Promise<Department[]>{
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
        let result = await ldapApi.searchDn({rootDn: rootDn, opts: {attributes: departmentOpts.attributes}});

        let mapDepartments = {};
        let departments = await Promise.all(result.map(async (item) => {
            let dn = item.dn;
            let departmentEntry = await this.itemToDepartment(item);
            let parentDn = await ldapApi.getParentDn({dn: dn});
            mapDepartments[dn] = {department: departmentEntry, parent: parentDn, relateId: item.entryUUID};
            /*if(item.dn != rootDn){
             let dept = await this.syncDepartment(item, params.companyId);
             return dept;
             }*/
        }));

        let returnResult = await this.syncDepartments({departments: mapDepartments, companyId: params.companyId, type: DPropertyType.LDAP})

        console.info(returnResult);
        console.info("departments=========================");
        return returnResult;
    }

    async syncOrganization(rootDepartment: OaDepartment, companyId: string, type: string){
        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let deptPro = await Models.departmentProperty.find({where : {type: type, value: rootDepartment.id}});

        if(deptPro && deptPro.length > 0){
            // 已存在，修改
            let alreadyDepartment = await Models.department.get(deptPro[0].departmentId);
            alreadyDepartment.name = rootDepartment.name;//同步已有部门信息
            await alreadyDepartment.save();
            return alreadyDepartment;
        }else{
            // 不存在，添加
            let dept =  Department.create({name: rootDepartment.name});
            dept.company = company;
            if(!rootDepartment.parentId){
                dept.parent = defaultDepartment;
            }else{
                let deptProperty = await Models.departmentProperty.find({where : {type: type, value: rootDepartment.parentId}});
                if(deptProperty && deptProperty.length > 0){
                    let parentDept = await Models.department.get(deptProperty[0].departmentId);
                    dept.parent = parentDept;
                }else{
                    dept.parent = defaultDepartment;
                }
            }
            await dept.save();
            let departmentProperty = DepartmentProperty.create({departmentId: dept.id, type: type, value: rootDepartment.id});
            await departmentProperty.save();

            return dept;
        }

        let children = await rootDepartment.getChildrenDepartments();
    }

    async itemToDepartment(params): Promise<Department>{
        let departmentEntry = Department.create({name: params.cn, "isDefault" : false});
        return departmentEntry;
    }

    /**
     * 同步部门信息
     * @param params{departments: any, companyId: string, type: string}
     * @param params.departments {key: value:{department: Department, parent: parentKey, relateId?: relatedDepartmentId}}
     * @param params.key 部门在三方数据唯一标识
     * @param params.value {department: Department, parent: parentKey, relateId?: 第三方部门信息与同步后信息关联的id有时候可能是 params.key}
     * @returns {Promise<Department[]>}
     */
    @clientExport
    async syncDepartments(params: {departments: any, companyId: string, type: string}): Promise<Department[]>{
        let {departments, companyId, type} = params;

        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();

        let departmentsToSave = [];
        for(let key in departments){
            let department = departments[key].department;
            let parent = departments[departments[key].parent];

            let deptPro = await Models.departmentProperty.find({where : {type: type, value: parent.relateId || key}});
            if(deptPro && deptPro.length > 0){
                // 已存在父级部门
                let alreadyParentDept = await Models.department.get(deptPro[0].departmentId);
                department.parent = alreadyParentDept;
            }else{
                if(parent.department){
                    department.parent = parent.department;
                }else{
                    department.parent = defaultDepartment;
                }
            }

            department.company = company;
            let item = {department: department, relateId: departments[key].relateId || key}
            departmentsToSave.push(item);
        }

        let result = await Promise.all(departmentsToSave.map(async (item) => {
            let departmentLdapProperty = await Models.departmentProperty.find({where : {type: type, value: item.relateId}});
            let department = item.department;
            if(departmentLdapProperty && departmentLdapProperty.length > 0){
                // 已存在，修改
                let alreadyDepartment = await Models.department.get(departmentLdapProperty[0].departmentId);
                for(let k in department){
                    if(department[k]){
                        if(k != "id" && k != "parentId"){
                            alreadyDepartment[k] = department[k];
                        }
                        //防止部门被设置为一个不存在的部门的子部门，程序报错
                        if(k == "parentId" && alreadyDepartment["parentId"] != department["parentId"]){
                            let parentDept = await Models.department.get(department[k]);
                            if(parentDept){
                                alreadyDepartment.parent = parentDept;
                            }
                        }
                    }
                }
                await alreadyDepartment.save();
                return alreadyDepartment;
            }else{
                // 不存在，添加
                let dept =  await item.save();
                let departmentProperty = DepartmentProperty.create({departmentId: department.id, type: type, value: item.relateId});
                await departmentProperty.save();

                return dept;
            }
        }));

        return result;
    }

    /**
     * 同步单个部门信息
     * @param departInfo
     * @param companyId
     * @returns {Promise<any>}
     */
    /*@clientExport
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
     }*/

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

        let staffList = [];
        let staffs = await Promise.all(result.map(async (item) => {
            let dn = item.dn;
            let staffEntry = await this.itemToStaff(item);
            let departmentRelatedId = await this.getLdapStaffDepartments({staffEntry: staffEntry, type: "sub", ldapApi: ldapApi});

            staffList.push({staff: staffEntry, departmentRelatedId: departmentRelatedId, relateId: item.entryUUID});
            /*if(item.dn != rootDn){
             let st = await this.syncStaff(item, params.companyId);
             return st;
             }*/
        }));

        console.info(staffs);
        console.info("staffs=========================");
        return true;
    }

    async itemToStaff(params): Promise<Staff>{
        let staffEntry = Staff.create({"name": params.cn, "mobile": params.mobile, "email": params.email,
            pwd: utils.md5(params.userPassword), isValidateMobile: true, isValidateEmail: true});
        return staffEntry;
    }

    async getLdapStaffDepartments(params:{staffEntry: any, type: string, ldapApi: any}): Promise<String[]>{
        let {staffEntry, type, ldapApi} = params;
        let result = [];
        if(type == 'sub'){
            let parentDn = await ldapApi.getParentDn({dn: staffEntry.dn});
            let deptEntry = await ldapApi.searchDn({rootDn: parentDn, opts: departmentOpts.attributes});
            if(deptEntry[0]){
                result.push(deptEntry[0].entryUUID);
            }
        }else{
            result = staffEntry.departmentNumber;
        }
        return result;
    }

    /**
     * 同步员工集合
     * @param params
     * @param params{staffList: any, companyId: string, type: string}
     * @param params.staffList {staff: staffEntry, departmentRelatedId: departmentRelatedId, relateId: item.entryUUID}
     * @returns {Promise<Staff[]>}
     */
    @clientExport
    async syncStaffs(params: {staffList: any, companyId: string, type: string}): Promise<Staff[]>{
        let {staffList, companyId, type} = params;

        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();

        let staffsToSave = [];
        staffList.map((st) => {
            let staff = st.staff;
            staff.company = company;
            let item = {staff: staff, departmentRelatedId: st.departmentRelatedId, relateId: st.relateId};
            staffsToSave.push(item);
        })

        let result = await Promise.all(staffsToSave.map(async (item) => {
            item.type = type;
            let s = await this.syncStaff(item);
            return s;
        }));

        return result;
    }


    /**
     * 同步单个员工
     * @param params
     * @returns {Promise<Staff>}
     */
    async syncStaff (params: {staff: Staff, departmentRelatedId?: String[], relateId: String, type: string}): Promise<Staff>{
        let staff = params.staff;
        let relateId = params.relateId;
        let type = params.type;
        let departmentRelatedId = params.departmentRelatedId;
        let company = staff.company;

        let defaultDepartment = await company.getDefaultDepartment();
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();

        let staffLdapProperty = await Models.staffProperty.find({where : {type: type, value: params.relateId}});
        let companyCreateUser = await Models.staff.get(company.createUser);
        let alreadyStaff: Staff;
        if(type == SPropertyType.LDAP && companyCreateUser.mobile == staff.mobile){
            alreadyStaff = companyCreateUser;
            let staffProperty = StaffProperty.create({staffId: alreadyStaff.id, type: type, value: relateId});
            await staffProperty.save();
        }

        if(staffLdapProperty && staffLdapProperty.length > 0){
            // 已存在，修改
            alreadyStaff = await Models.staff.get(staffLdapProperty[0].staffId);

        }else{
            // 不存在，添加
            staff.setTravelPolicy(defaultTravelPolicy);
            staff.company = company;
            staff = await staff.save();
            let staffProperty = StaffProperty.create({staffId: staff.id, type: SPropertyType.LDAP, value: relateId});
            await staffProperty.save();

            // 处理部门
            if(!departmentRelatedId){
                await staff.addDepartment(defaultDepartment);
            }else{
                let departmentProperty = await Models.departmentProperty.find({where: {value: departmentRelatedId, type: type}});
                let departmentIds = departmentProperty.map(function(item){
                    return item.departmentId;
                })
                let departments = await Models.department.find({where: {companyId: company.id, id: departmentIds}});
                await staff.addDepartment(departments);
            }
        }

        if(alreadyStaff && alreadyStaff.id){
            for(let k in staff){
                if(staff[k]){
                    if(k != "id"){
                        alreadyStaff[k] = staff[k];
                    }
                }
            }
            await alreadyStaff.save();

            // 处理部门
            if(!departmentRelatedId){
                await alreadyStaff.updateStaffDepartment(defaultDepartment);
            }else{
                let departmentProperty = await Models.departmentProperty.find({where: {value: departmentRelatedId, type: type}});
                let departmentIds = departmentProperty.map(function(item){
                    return item.departmentId;
                })
                let departments = await Models.department.find({where: {companyId: company.id, id: departmentIds}});
                await alreadyStaff.updateStaffDepartment(departments);
            }
        }

        return staff;
    }


    /**
     * 同步单个ldap用户信息
     * @param staffInfo
     * @param companyId
     * @returns {Promise<Staff>}
     */
    /*@clientExport
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
     }*/
}

let ldapModule = new LdapModule();
export default ldapModule;