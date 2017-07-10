/**
 * Created by wangyali on 2017/7/6.
 */
import {Department, DepartmentProperty} from "_types/department";
import {Company, CPropertyType} from "_types/company";
import {Models} from "_types/index";
import LdapApi from "../ldapApi";
import LdapDepartment from "../LdapDepartment";
import L from '@jingli/language';
import {Model} from "sequelize";
import {departmentOpts} from "../index"

export  abstract class OaDepartment{
    constructor(public target: any){
    }
    abstract get id();
    abstract set id(val: string);

    abstract get name();
    abstract set name(val: string);

    abstract get manager();
    abstract set manager(val: string);

    abstract get parentId();
    abstract set parentId(val: string);

    abstract async getChildrenDepartments(): Promise<OaDepartment[]>;
    abstract async getParent(): Promise<OaDepartment>;
    abstract async getStaffs();
    abstract async getSelfById(): Promise<OaDepartment>;

    /*static async create(params:{company: Company, department?: Department}): Promise<OaDepartment>{
        let company = params.company;
        let department = params.department;
        let type = await company.getOaType();

        if(type == CPropertyType.LDAP){
            let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
            if(!ldapProperty || !ldapProperty[0]){
                throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
            }
            let ldapInfo = ldapProperty[0].value;
            let ldapInfoJson = JSON.parse(ldapInfo);

            let ldapApi = new LdapApi(ldapInfoJson.ldapUrl);
            await ldapApi.bindUser({entryDn: ldapInfoJson.ldapAdminDn, userPassword: ldapInfoJson.ldapAdminPassword});

            if(department){
                let departmentProperty = await Models.departmentProperty.find({where: {type: type, departmentId: department.id}});
                let jsonValue = JSON.parse(departmentProperty[0].value);
                return new LdapDepartment({id: jsonValue.id, dn: jsonValue.dn, name: department.name, ldapApi: ldapApi});
            }else{
                let rootDn = ldapInfoJson.ldapDepartmentRootDn || ldapInfoJson.ldapBaseDn;
                let rootDepartmentInfos = await ldapApi.searchDn({rootDn: rootDn, opts: {attributes: departmentOpts.attributes}});
                let rootDepartmentInfo = rootDepartmentInfos[0];
                return new LdapDepartment({id: rootDepartmentInfo.entryUUID, dn: rootDepartmentInfo.dn, name: rootDepartmentInfo.ou, ldapApi: ldapApi});
            }
        }

        return null;
    }

    async getDepartment(): Promise<Department>{
        let self = this;
        let department: Department = null;
        let deptPro = await Models.departmentProperty.find({where : {value: self.id}});
        if(deptPro && deptPro.length > 0){
            department = await Models.department.get(deptPro[0].departmentId);
        }
        return department;
    }

    async sync(params:{companyId: string, type: string}): Promise<Department>{
        let self = this;

        let result: Department;
        let company = await Models.company.get(params.companyId);
        if(!company){
            throw L.ERR.INVALID_ACCESS_ERR();
        }
        let defaultDepartment = await company.getDefaultDepartment();

        let parentDepartment: Department;
        let oaParent = await self.getParent();

        if(!oaParent){
            parentDepartment = defaultDepartment;
        }else{
            parentDepartment = await oaParent.getDepartment();
            //此处怎么解决
            if(!parentDepartment){
                parentDepartment = defaultDepartment;
            }
        }

        if(parentDepartment){
            let alreadyDepartment = await self.getDepartment();
            if(alreadyDepartment){
                alreadyDepartment.parent = parentDepartment;
                alreadyDepartment.name = self.name;//同步已有部门信息
                result = await alreadyDepartment.save();
            }else{
                // 不存在，添加
                let dept =  Department.create({name: self.name});
                dept.company = company;
                dept.parent = parentDepartment;
                result = await dept.save();
                let departmentProperty = DepartmentProperty.create({departmentId: dept.id, type: params.type, value: self.id});
                await departmentProperty.save();
            }
        }else{
            //syncOrganization(oaParent);
        }

        return result;
    }*/

}