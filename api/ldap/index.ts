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
                ldapDepartmentRootDn: "cn=Manager,dc=jingli,dc=com",
                ldapUrl: "ldap://123.56.70.171:389/DC=jingli,DC=com",
                ldapAdminDn: "cn=Manager,dc=jingli,dc=com",
                ldapAdminPassword: "wang123456"
            }
            //注册企业
            // let result = await this.registerLdapCompany(params);
            // console.info(result);

            //同步组织架构
            let company = await Models.company.get("4438e4c0-686e-11e7-89aa-a14f4c6f4292")
            let depts = await syncData.syncOrganization({company: company});
            console.info(depts);
            console.info("depts==============================================");
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
}

let ldapModule = new LdapModule();
export default ldapModule;