/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaStaff} from "../../../libs/asyncOrganization/oaStaff"
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment"
import {Staff, SPropertyType} from "_types/staff"
import {Company} from "_types/company"
import {Models} from "_types/index"

export default class WangxStaff extends OaStaff {

    constructor(target: any) {
        super(target)
    }

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

    get company() {
        return this.target.company;
    }

    set company(val: Company) {
        this.target.company = val;
    }

    get isAdmin() {
        return this.target.isAdmin;
    }

    set isAdmin(val: boolean) {
        this.target.isAdmin = val;
    }

    get avatar() {
        return this.target.avatar;
    }

    set avatar(val: string) {
        this.target.avatar = val;
    }

    //wangxinStaff的特殊属性
    get companyId() {
        return this.target.companyId
    }

    set companyId(companyId: string) {
        this.target.companyId = companyId
    }

    async getDepartments(): Promise<OaDepartment[]> {
        return null
    }

    async getSelfById(): Promise<OaStaff> {
        return null
    }

    async saveStaffProperty(params: {staffId: string}): Promise<boolean> {
        return null
    }

    async getCompany(): Promise<Company>{
        return null
    }

    async getStaff(): Promise<Staff>{
        let self = this;
        let staff: Staff = null;
        let staffPros = await Models.staffProperty.find({where : {value: self.id, type: SPropertyType.WANGXIN_ID}});
        if(staffPros && staffPros.length > 0){
            for(let staffPro of staffPros){
                let tempStaff = await Models.staff.get(staffPro.staffId);
                if(tempStaff){
                    let stCorpPro = await Models.staffProperty.find({where : {value: self.companyId, type: SPropertyType.WANGXIN_COMPANY_ID, staffId: tempStaff.id}});
                    if(stCorpPro && stCorpPro.length){
                        staff = tempStaff
                    }
                }
            }
        }
        return staff;
    }

}