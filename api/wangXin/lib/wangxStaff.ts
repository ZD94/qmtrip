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
import {StaffProperty} from "../../../_types/staff/staff-property";

export default class WangxStaff extends OaStaff {
    private wangXinApi: WangXinApi;
    constructor(target: any) {
        super(target)
        this.wangXinApi = target.wangXinApi
    }

    get id() {
        return this.target.id as string;
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

    //网信特有属性
    get userCode() {
        return this.target.userCode;
    }

    set userCode(val: string) {
        this.target.userCode = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let departments = await self.wangXinApi.getDeptByUser(self.id);
        let result: OaDepartment[] = [];
        if(departments){
            departments.forEach((d) => {
                let oaDept =  new WangxDepartment({name: d.name, parentId: self.id, id: d.id, company: self.company, wangXinApi: self.wangXinApi});
                result.push(oaDept);
            })
        }
        return result;
    }

    async getSelfById(): Promise<OaStaff | null> {
        let self = this;
        let user = await self.wangXinApi.getUserById(self.id);
        if(user){
            let mobile = (user.tel || user.phone) ? (user.tel || user.phone) : null;
            return new WangxStaff({id: user.id, name: user.name, email: user.email, mobile: mobile,
                company: self.company, wangXinApi: self.wangXinApi, userCode: user.usercode}) as OaStaff;
        }
        return null
    }

    async saveStaffProperty(params: {staffId: string}): Promise<boolean> {
        let self = this;
        let staffUuidProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WANGXIN_ID, value: self.id+""});
        let wxUser = await self.wangXinApi.getUserById(self.id);
        let userInfo = JSON.stringify(wxUser);
        let staffWxInfoProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WANGXIN_USER_INFO, value: userInfo});
        let userCodeProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WANGXIN_USER_CODE, value: self.userCode});
        await staffUuidProperty.save();
        await staffWxInfoProperty.save();
        await userCodeProperty.save();
        return true;
    }

    async getCompany(): Promise<Company | undefined>{
        return undefined
    }

    async getStaff(): Promise<Staff | null>{
        let self = this;
        let staffPros = await Models.staffProperty.find({where : {value: self.id+"", type: SPropertyType.WANGXIN_ID}});
        if(staffPros && staffPros.length > 0){
            let staff = await Models.staff.get(staffPros[0].staffId);
            return staff;
        }
        return null;
    }

}