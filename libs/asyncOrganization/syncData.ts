/**
 * Created by wangyali on 2017/7/7.
 */
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import {Staff, StaffProperty, SPropertyType} from "_types/staff";
import {Department, DepartmentProperty, StaffDepartment, DPropertyType} from "_types/department";
import { OaDepartment } from './oaDepartment';
import { OaStaff } from './OaStaff';
import LdapDepartment from "api/ldap/ldapDepartment";
import LdapStaff from "api/ldap/ldapStaff";
import shareConnection from "api/ldap/ShareConnection";
import {departmentOpts} from "api/ldap";
import L from '@jingli/language';

export class SyncData {
    async createOaDepartment(params:{company: Company, department?: Department}): Promise<OaDepartment>{
        let company = params.company;
        let department = params.department;
        let type = await company.getOaType();

        if(type == CPropertyType.LDAP){
            // console.info(shareConnection.connectionMap);
            // console.info("22222222222222222222222222222222222222");
            if(!shareConnection.connectionMap || !shareConnection.connectionMap[company.id]){
                await shareConnection.initConnection({companyId: company.id});
            }
            let ldapApi = shareConnection.connectionMap[company.id];

            let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
            let ldapInfo = ldapProperty[0].value;
            let ldapInfoJson = JSON.parse(ldapInfo);
            await ldapApi.bindUser({entryDn: ldapInfoJson.ldapAdminDn, userPassword: ldapInfoJson.ldapAdminPassword});

            if(department){
                let ldapUuidProperty = await Models.departmentProperty.find({where: {type: DPropertyType.LDAP_UUID, departmentId: department.id}});
                let ldapDndProperty = await Models.departmentProperty.find({where: {type: DPropertyType.LDAP_DN, departmentId: department.id}});
                let id = "";
                let dn = "";
                if(ldapUuidProperty && ldapUuidProperty.length > 0){
                    id = ldapUuidProperty[0].value;
                }
                if(ldapDndProperty && ldapDndProperty.length > 0){
                    dn = ldapDndProperty[0].value;
                }
                let ldapDept =  new LdapDepartment({id: id, dn: dn, name: department.name, ldapApi: ldapApi, company: company});
                let result = await ldapDept.getSelfById();
                return result;
            }else{
                // let rootDn = ldapInfoJson.ldapDepartmentRootDn || ldapInfoJson.ldapBaseDn;
                let rootDn = "ou=department,dc=jingli,dc=com";
                let rootDepartmentInfos = await ldapApi.searchDn({rootDn: rootDn, opts: {attributes: departmentOpts.attributes}});
                let rootDepartmentInfo = rootDepartmentInfos[0];
                return new LdapDepartment({id: rootDepartmentInfo.entryUUID, dn: rootDepartmentInfo.dn, name: rootDepartmentInfo.ou,
                    ldapApi: ldapApi, company: company});
            }
        }

        return null;
    }

    static async createOaStaff(params:{staff: Staff}): Promise<OaStaff>{
        let staff = params.staff;
        let company = staff.company;
        let type = await company.getOaType();

        if(type == CPropertyType.LDAP){
            if(!shareConnection.connectionMap[company.id]){
                await shareConnection.initConnection({companyId: company.id});
            }
            let ldapApi = shareConnection.connectionMap[company.id];

            let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
            let ldapInfo = ldapProperty[0].value;
            let ldapInfoJson = JSON.parse(ldapInfo);
            await ldapApi.bindUser({entryDn: ldapInfoJson.ldapAdminDn, userPassword: ldapInfoJson.ldapAdminPassword});

            if(staff){
                let ldapUuidProperty = await Models.staffProperty.find({where: {type: SPropertyType.LDAP_UUID, staffId: staff.id}});
                let ldapDndProperty = await Models.staffProperty.find({where: {type: SPropertyType.LDAP_DN, staffId: staff.id}});
                let id = "";
                let dn = "";
                if(ldapUuidProperty && ldapUuidProperty.length > 0){
                    id = ldapUuidProperty[0].value;
                }
                if(ldapDndProperty && ldapDndProperty.length > 0){
                    dn = ldapDndProperty[0].value;
                }
                let ldapStaff =  new LdapStaff({id: id, dn: dn, ldapApi: ldapApi});
                let result = await ldapStaff.getSelfById();
                return result;
            }else{
                throw L.ERR.INVALID_ARGUMENT("params.staff不能为空");
            }
        }

        return null;
    }

    async syncOrganization(params: {company: Company, department?: Department}): Promise<boolean> {
        let oaDepartment = await this.createOaDepartment({company: params.company, department: params.department});
        // let oaDepartment = new LdapDepartment(result);
        await oaDepartment.sync();
        return true;

    }

}

let syncData = new SyncData();
export default syncData;