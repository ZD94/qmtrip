/**
 * Created by wangyali on 2017/6/28.
 */
'use strict';
//考虑同步手机号已存在问题？？？？ 即一个员工多个企业
const API = require('@jingli/dnode-api');
import {Models} from "_types/index";
import {clientExport} from "@jingli/dnode-api/dist/src/helper";
import { ACCOUNT_STATUS } from "_types/auth";
import utils = require("common/utils");
import syncData from "libs/asyncOrganization/syncData";
import shareConnection from "./shareConnection";
import L from '@jingli/language';
import { EStaffStatus, Staff, SPropertyType, EStaffRole } from "_types/staff";
import {CPropertyType} from "_types/company";
import { EAccountType } from '_types/index';
import {Department} from "../../_types/department/department";

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
            console.info(req.query, "==============================");
            let ldapDepartmentRootDn = "ou=一级部门,dc=jingli,dc=com";
            if(req.query.type){
                if(req.query.type == 1){
                    ldapDepartmentRootDn = "ou=department,dc=jingli,dc=com";
                }else{
                    ldapDepartmentRootDn = "ou="+req.query.type+",dc=jingli,dc=com";
                }
            }
            let params={
                mobile: req.query.mobile || "18100000099",
                email: req.query.email || "18100000099@qq.com",
                name: req.query.name || "测试ldap同步二",
                userName: "同步二",
                pwd: "123456",
                status: ACCOUNT_STATUS.ACTIVE,
                isValidateMobile: true,
                ldapBaseDn: req.query.ldapBaseDn || "dc=jingli,dc=com",
                ldapStaffRootDn: "ou=department,dc=jingli,dc=com",
                ldapDepartmentRootDn: ldapDepartmentRootDn,
                ldapUrl: "ldap://123.56.70.171:389/DC=jingli,DC=com",
                ldapAdminDn: "cn=Manager,dc=jingli,dc=com",
                ldapAdminPassword: "wang123456"
            }
            //注册企业
            let result = await this.registerLdapCompany(params);
            console.info(result);

            //同步组织架构
            // let company = await Models.company.get("d8496510-71fe-11e7-b0b2-a1691f820b1a")
            // let depts = await syncData.syncOrganization({company: company});
            // console.info(depts);
            // console.info("depts==============================================");
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

    @clientExport
    async loginByLdapUser(data: {account: string, pwd: string, companyId: string}){

        if(!data) {
            throw L.ERR.DATA_NOT_EXIST();
        }

        if(!data.account) {
            throw L.ERR.USERNAME_EMPTY();
        }

        if(!data.pwd) {
            throw L.ERR.PWD_EMPTY();
        }

        //ldap认证
        let company = await Models.company.get(data.companyId);
        // let company = await Models.company.get("4438e4c0-686e-11e7-89aa-a14f4c6f4292");
        if(!shareConnection.connectionMap[company.id]){
            await shareConnection.initConnection({companyId: company.id});
        }
        let ldapApi = shareConnection.connectionMap[company.id];

        let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
        if(!(ldapProperty && ldapProperty.length)){
            throw L.ERR.DATA_NOT_EXIST();
        }
        let ldapInfo = ldapProperty[0].value;
        let ldapInfoJson = JSON.parse(ldapInfo);
        await ldapApi.bindUser({entryDn: ldapInfoJson.ldapAdminDn, userPassword: ldapInfoJson.ldapAdminPassword});

        let type = EAccountType.STAFF;
        let account = data.account;

        let accounts = await Models.account.find({
            where:{
                type: type,
                $or: [
                    {email: account},
                    {mobile: account}
                ],
            },
            limit: 1,
        });
        if(accounts.total == 0) {
            throw L.ERR.ACCOUNT_NOT_EXIST()
        }
        let loginAccount = accounts[0];

        let staffs = await Models.staff.find({where: {accountId: loginAccount.id, staffStatus: EStaffStatus.ON_JOB}});
        if(staffs.total == 0) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        let loginStaff: Staff;
        for(let s in staffs){
            let item = staffs[s];
            if(item.company.id == company.id){
                loginStaff = item;
                break;
            }
        }

        let staffProperty = await Models.staffProperty.find({where: {staffId: loginStaff.id, type: SPropertyType.LDAP_DN}});
        if(staffProperty.total == 0) {
            throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
        }

        let entryDn = staffProperty[0].value;
        let bindResult = await ldapApi.bindUser({entryDn: entryDn, userPassword: data.pwd});
        if(!bindResult){
            throw L.ERR.ACCOUNT_FORBIDDEN();
        }

        let departments = await loginStaff.getDepartments();
        await Promise.all(departments.map(async (item) => {
            await syncData.syncOrganization({company: company, department: item});
        }));

        var ret = await API.auth.makeAuthenticateToken(loginAccount.id, 'ldap');
        if (loginAccount.isNeedChangePwd) {
            ret['is_need_change_pwd'] = true;
        }
        //判断是否首次登录
        if(loginAccount.isFirstLogin) {
            loginAccount.isFirstLogin = false;
            return loginAccount.save()
                .then(function() {
                    ret['is_first_login'] = true;
                    return ret;
                })
        }

        ret['is_first_login'] = false;
        return ret;
    }

    @clientExport
    async syncLdapOrganization(params?: {department: Department}): Promise<boolean>{
        let current = await Staff.getCurrent();
        if(current.roleId != EStaffRole.OWNER && current.roleId != EStaffRole.ADMIN){
            throw L.ERR.PERMISSION_DENY();
        }
        let company = current.company;
        let department: Department;
        if(params)
            department = params.department;
        let depts = await syncData.syncOrganization({company: company, department: department});
        return true;
    }
}

let ldapModule = new LdapModule();
export default ldapModule;