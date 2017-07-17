/**
 * Created by wangyali on 2017/7/6.
 */
import { OaDepartment } from './lib/oaDepartment';
import { OaStaff } from './lib/OaStaff';
import LdapStaff from './ldapStaff';
import LdapApi from "./ldapApi";
import{departmentOpts} from "./index";
import { DepartmentProperty, DPropertyType} from "_types/department";
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import L from '@jingli/language';

export default class LdapDepartment extends OaDepartment {

    private ldapApi: LdapApi;

    get id() {
        return this.target.id;
    }

    set id(val: string) {
        this.target.id = val;
    }

    get name() {
        return this.target.name;
    }

    set name(val: string) {
        this.target.name = val;
    }

    get manager() {
        return this.target.manager;
    }

    set manager(val: string) {
        this.target.manager = val;
    }

    get parentId() {
        return this.target.parentId;
    }

    set parentId(val: string) {
        this.target.parentId = val;
    }

    get company() {
        return this.target.company;
    }

    set company(val: Company) {
        this.target.company = val;
    }

    //Ldap特有属性
    get dn() {
        return this.target.dn;
    }

    set dn(val: string) {
        this.target.dn = val;
    }

    async getSelfById(): Promise<OaDepartment> {
        let self = this;
        let result = await this.getSelfEntry();
        if(result){
            return new LdapDepartment({id: result.entryUUID, dn: result.dn, name: result.ou, ldapApi: this.ldapApi,
            company: self.company});
        }
        return null;
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let selfEntry = await this.getSelfEntry();
        let opts = {
            filter: `(objectClass=${selfEntry.objectClass})`,
            scope: 'one',
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        let returnResult = result.map((item) => {
            return new LdapDepartment({id: item.entryUUID, dn: item.dn, name: item.ou, parentId: self.id,
                ldapApi: self.ldapApi, company: self.company});
        })
        return returnResult;
    }

    async getParent(): Promise<OaDepartment> {
        let self = this;
        let parentDn = await this.ldapApi.getParentDn({dn: this.dn});
        let opts = {
            attributes: departmentOpts.attributes
        };
        try{
            let result = await this.ldapApi.searchDn({rootDn: parentDn, opts: opts});
            if(result && result[0]){
                let ldapProperty = await Models.companyProperty.find({where: {companyId: self.company.id, type: CPropertyType.LDAP}});
                if(!ldapProperty || !ldapProperty[0]){
                    throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
                }
                let ldapInfo = ldapProperty[0].value;
                let ldapInfoJson = JSON.parse(ldapInfo);

                if(result[0].dn.indexOf(ldapInfoJson.rootDepartment) >= 0){
                    return new LdapDepartment({id: result[0].entryUUID, dn: result[0].dn, name: result[0].ou,
                        ldapApi: self.ldapApi, company: self.company});
                }
            }
        }catch(e){

        }
        return null;
    }

    async getStaffs(): Promise<OaStaff[]> {
        let self = this;
        let selfEntry = await this.getSelfEntry();
        let opts = {
            filter: `!(objectClass=${selfEntry.objectClass})`,
            scope: 'one',
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        let returnResult = result.map((item) => {
            return new LdapStaff({id: item.entryUUID, dn: item.dn, name: item.cn, mobile: item.mobile,
                email: item.mail, sex: item.sex, userPassword: item.userPassword,
                ldapApi: self.ldapApi, company: self.company});
        })
        return returnResult;
    }

    async getSelfEntry(): Promise<any> {
        let opts = {
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        if(result && result.length > 0){
            return result[0];
        }
        return null;
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        let departmentUuidProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.LDAP_UUID, value: this.id});
        let departmentDnProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.LDAP_DN, value: this.dn});
        await departmentUuidProperty.save();
        await departmentDnProperty.save();
        return true;
    }

    async getDepartmentProperty(params: {departmentId: string}): Promise<DepartmentProperty> {
        let departmentUuidProperty = await Models.departmentProperty.find({where: {departmentId: params.departmentId, type: DPropertyType.LDAP_UUID}});
        if(departmentUuidProperty && departmentUuidProperty.length > 0){
            return departmentUuidProperty[0];
        }
        return null;
    }

    constructor(target: any) {
        super(target);
        this.ldapApi = target.ldapApi;
    }

};
