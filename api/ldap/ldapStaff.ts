/**
 * Created by wangyali on 2017/7/7.
 */
import { OaDepartment } from './lib/oaDepartment';
import { OaStaff } from './lib/oastaff';
import LdapAPi from "./ldapApi";
import{staffOpts} from "./index"
export default class LdapStaff extends OaStaff {

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

    //Ldap特有属性
    get dn() {
        return this.target.dn;
    }

    set dn(val: string) {
        this.target.dn = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        return null;
    }

    async getSelfById(): Promise<OaStaff> {
        return null;
    }

    constructor(target: any) {
        super(target);
        this.ldapApi = target.ldapApi;
    }

};
