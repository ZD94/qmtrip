/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaStaff} from "../../../libs/asyncOrganization/oaStaff"
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment"
import {Staff, SPropertyType} from "_types/staff"
import {Company} from "_types/company"
import {Models} from "_types/index"
import WangXinApi from "./wangxApi";
import WangxDepartment from "./wangxDepartment";

export default class WangxStaff extends OaStaff {
    private wangxAPi: WangXinApi;
    constructor(target: any) {
        super(target)
        this.wangxAPi = target.wangxAPi
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

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let departments = await self.wangxAPi.getDeptByUser(self.id);
        let result: OaDepartment[] = [];
        if(departments){
            departments.forEach((d) => {
                let oaDept =  new WangxDepartment({name: d.name, parentId: self.id, id: d.id, company: self.company});
                result.push(oaDept);
            })
        }
        return result;
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
        let staffPros = await Models.staffProperty.find({where : {value: self.id, type: SPropertyType.WANGXIN_ID}});
        if(staffPros && staffPros.length > 0){
            let staff = await Models.staff.get(staffPros[0].staffId);
            return staff;
        }
        return null;
    }

}