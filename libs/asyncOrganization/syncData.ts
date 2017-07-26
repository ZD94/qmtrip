/**
 * Created by wangyali on 2017/7/7.
 */
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import {Staff, StaffProperty, SPropertyType} from "_types/staff";
import {Department, DepartmentProperty, StaffDepartment, DPropertyType} from "_types/department";
import { OaDepartment } from './oaDepartment';
import { OaStaff } from './oaStaff';
import { OaCompany } from './oaCompany';
import LdapDepartment from "api/ldap/ldapDepartment";
import DdDepartment from "api/ddtalk/lib/ddDepartment";
import LdapStaff from "api/ldap/ldapStaff";
import DdStaff from "api/ddtalk/lib/ddStaff";
import shareConnection from "api/ldap/ShareConnection";
import {departmentOpts} from "api/ldap";
import L from '@jingli/language';
import {getISVandCorp} from "api/ddtalk/lib/dealEvent"
import DdCompany from "../../api/ddtalk/lib/ddCompany";

export class SyncData {
    async createOaCompany(params:{type: string}): Promise<OaCompany>{
        let type = params.type;
        if(type == "dd"){

        }

        return null;
    }
    async createOaDepartment(params:{company: Company, department?: Department, type?: string}): Promise<OaDepartment>{
        let company = params.company;
        let department = params.department;
        let type = await company.getOaType();
        if(params.type) type = params.type;

        if(type == CPropertyType.LDAP){
            if(!shareConnection.connectionMap || !shareConnection.connectionMap[company.id]){
                await shareConnection.initConnection({companyId: company.id});
            }
            let ldapApi = shareConnection.connectionMap[company.id];

            let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
            let ldapInfo = ldapProperty[0].value;
            let ldapInfoJson = JSON.parse(ldapInfo);
            await ldapApi.bindUser({entryDn: ldapInfoJson.ldapAdminDn, userPassword: ldapInfoJson.ldapAdminPassword});

            if(department){
                let ldapDeptProperties = await Models.departmentProperty.find({where: {type: [DPropertyType.LDAP_UUID, DPropertyType.LDAP_DN], departmentId: department.id}});
                let id = "";
                let dn = "";
                if(ldapDeptProperties && ldapDeptProperties.length){
                    for(let d of ldapDeptProperties){
                        if(d.type == SPropertyType.LDAP_UUID) id = d.value;
                        if(d.type == SPropertyType.LDAP_DN) dn = d.value;
                    }
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
        }else if(type == "dd"){

            // let corps = await Models.ddtalkCorp.find({where: {companyId: company.id}});
            let comPros = await Models.companyProperty.find({where: {companyId: company.id, type:
                [CPropertyType.DD_ID, CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});
            if (!comPros || !comPros.length) {
                throw new Error("您的钉钉账户没有授权");
            }

            let corpId = "";
            let permanentCode = "";
            let agentId = "";
            for(let c of comPros){
                if(c.type == CPropertyType.DD_ID) corpId = c.value;
                if(c.type == CPropertyType.DD_PERMANENT_CODE) permanentCode = c.value;
                if(c.type == CPropertyType.DD_AGENT_ID) agentId = c.value;
            }

            let {isvApi, corpApi} = await getISVandCorp({corpId: corpId, permanentCode: permanentCode});

            if(department){
                /*let ddDeparts = await Models.ddtalkDepartment.find({
                    where : { localDepartmentId : department.id }
                });*/

                let ddDeptIdProperty = await Models.departmentProperty.find({where: {type: DPropertyType.DD_ID, departmentId: department.id}});
                let id = "";
                if(ddDeptIdProperty && ddDeptIdProperty.length){
                    id = ddDeptIdProperty[0].value;
                }
                let ddDept = new DdDepartment({ id: id, corpId: corpId, isvApi: isvApi, corpApi: corpApi, company: company });
                let result = await ddDept.getSelfById();
                return result;
            }else{
                let ddCompany = new DdCompany({id: corpId, permanentCode: permanentCode, agentid: agentId,
                    isvApi: isvApi, corpApi: corpApi});

                let rootDept = await ddCompany.getRootDepartment();
                return rootDept;
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
                let ldapStaffProperties = await Models.staffProperty.find({where: {type: [SPropertyType.LDAP_UUID, SPropertyType.LDAP_DN], staffId: staff.id}});
                let id = "";
                let dn = "";
                if(ldapStaffProperties && ldapStaffProperties.length){
                    for(let s of ldapStaffProperties){
                        if(s.type == SPropertyType.LDAP_UUID) id = s.value;
                        if(s.type == SPropertyType.LDAP_DN) dn = s.value;
                    }
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
        console.info(oaDepartment);
        console.info("oaDepartment======================");
        await oaDepartment.sync();
        return true;

    }

}

let syncData = new SyncData();
export default syncData;