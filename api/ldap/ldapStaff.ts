/**
 * Created by wangyali on 2017/7/7.
 */
import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/oaStaff';
import LdapApi from "./ldapApi";
import{staffOpts, departmentOpts} from "./index";
import LdapDepartment from "./ldapDepartment";
import {StaffProperty, SPropertyType} from "_types/staff";
import {Company} from "_types/company";

export default class LdapStaff extends OaStaff {

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

    get mobile() {
        return this.target.mobile;
    }

    set mobile(val: string) {
        this.target.mobile = val;
    }

    get email() {
        return this.target.email;
    }

    set email(val: string) {
        this.target.email = val;
    }

    get userPassword() {
        return this.target.userPassword;
    }

    set userPassword(val: string) {
        this.target.userPassword = val;
    }

    get sex() {
        return this.target.sex;
    }

    set sex(val: string) {
        this.target.sex = val;
    }

    get isAdmin() {
        return this.target.isAdmin;
    }

    set isAdmin(val: boolean) {
        this.target.isAdmin = val;
    }

    get company() {
        return this.target.company;
    }

    set company(val: Company) {
        this.target.company = val;
    }

    get avatar() {
        return this.target.avatar;
    }

    set avatar(val: string) {
        this.target.avatar = val;
    }
    //Ldap特有属性
    get dn() {
        return this.target.dn;
    }

    set dn(val: string) {
        this.target.dn = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let oaDepartments: OaDepartment[] = [];
        let parentDn = await this.ldapApi.getParentDn({dn: this.dn});
        let opts = {
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: parentDn, opts: opts});
        if(result && result[0]){
            oaDepartments.push(new LdapDepartment({id: result[0].entryUUID, dn: result[0].dn,
                name: result[0].ou, ldapApi: self.ldapApi, company: self.company}));
        }
        return oaDepartments;
    }

    async getSelfById(): Promise<OaStaff> {
        let self = this;
        let opts = {
            attributes: staffOpts.attributes
        };
        let results = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        if(results && results[0]){
            let result = results[0];
            return new LdapStaff({id: result.entryUUID, dn: result.dn, name: result.cn, mobile: result.mobile,
                email: result.mail, sex: result.sex, userPassword: result.userPassword,
                ldapApi: self.ldapApi, company: self.company});
        }
        return null;
    }

    async saveStaffProperty(params: {staffId: string}): Promise<boolean> {
        let staffUuidProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.LDAP_UUID, value: this.id});
        let staffDnProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.LDAP_DN, value: this.dn});
        await staffUuidProperty.save();
        await staffDnProperty.save();
        return true;
    }

    async getCompany(): Promise<Company>{
        return this.company;
    }

    constructor(target: any) {
        super(target);
        this.ldapApi = target.ldapApi;
    }

};
