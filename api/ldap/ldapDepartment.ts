/**
 * Created by wangyali on 2017/7/6.
 */
import { OaDepartment } from './lib/oaDepartment';
import { OaStaff } from './lib/OaStaff';
import LdapStaff from './ldapStaff';
import LdapAPi from "./ldapApi";
import{departmentOpts} from "./index"
export default class LdapDepartment extends OaDepartment {
    private ldapApi: LdapAPi;

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

    //Ldap特有属性
    get dn() {
        return this.target.dn;
    }

    set dn(val: string) {
        this.target.dn = val;
    }

    async getSelfById(): Promise<OaDepartment> {
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
            return new LdapDepartment({id: item.entryUUID, dn: item.dn, name: item.ou, parentId: self.id, ldapApi: self.ldapApi});
        })
        return returnResult;
    }

    async getParent(): Promise<OaDepartment> {
        let self = this;
        let parentDn = await this.ldapApi.getParentDn({dn: this.dn});
        let opts = {
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: parentDn, opts: opts});
        if(result && result[0]){
            return new LdapDepartment({id: result[0].entryUUID, dn: result[0].dn, name: result[0].ou, ldapApi: self.ldapApi});
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
                email: item.email, sex: item.sex, userPassword: item.userPassword, ldapApi: self.ldapApi});
        })
        return returnResult;
    }

    async getSelfEntry(): Promise<any> {
        let opts = {
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        return result[0];
    }

    constructor(target: any) {
        super(target);
        this.ldapApi = target.ldapApi;
    }

};
