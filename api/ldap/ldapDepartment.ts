/**
 * Created by wangyali on 2017/7/6.
 */
import { OaDepartment } from './lib/department';
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

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let selfEntry = await this.getSelfEntry();
        let opts = {
            filter: `(objectClass=${selfEntry.objectClass})`,
            scope: 'one',
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        let returnResult = result.map((item) => {
            return new LdapDepartment({});
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

    async getParent(): Promise<any> {
        let parentDn = await this.ldapApi.getParentDn({dn: this.dn});
        return parentDn;
    }

    async getStaffs(): Promise<any> {
        let selfEntry = await this.getSelfEntry();
        let opts = {
            filter: `!(objectClass=${selfEntry.objectClass})`,
            scope: 'one',
            attributes: departmentOpts.attributes
        };
        let result = await this.ldapApi.searchDn({rootDn: this.dn, opts: opts});
        return result;
    }
    constructor(target: any) {
        super(target);
        this.ldapApi = target.ldapApi;
        console.info(this.id);
        // this.id = aaa.id;
        // this.manager = aaa.manager;
        // this.dn = aaa.dn;
        // this.manager = aaa.manager;
        // this.parentId = aaa.parentId;
        // console.info(this.ldapApi);
        // console.info("this.ldapApi=========================");
    }

};
