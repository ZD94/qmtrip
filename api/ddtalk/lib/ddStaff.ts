/**
 * Created by wangyali on 2017/7/7.
 */
import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/oastaff';
import {StaffProperty, SPropertyType, Staff} from "_types/staff";
import {Models} from "_types/index";
import L from '@jingli/language';
import {Company, CPropertyType} from "_types/company";
import ISVApi from "./isvApi";
import corpApi from "./corpApi";
import DdDepartment from "./ddDepartment";

export default class DdStaff extends OaStaff {

    private isvApi: ISVApi;
    private corpApi: corpApi;


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

    //钉钉特有属性
    get departmentIds() {
        return this.target.departmentIds;
    }

    set departmentIds(val: any) {
        this.target.departmentIds = val;
    }

    get corpId() {
        return this.target.corpId;
    }

    set corpId(val: string) {
        this.target.corpId = val;
    }

    get avatar() {
        return this.target.avatar;
    }

    set avatar(val: string) {
        this.target.avatar = val;
    }

    get isAdmin() {
        return this.target.isAdmin;
    }

    set isAdmin(val: boolean) {
        this.target.isAdmin = val;
    }

    get unionid() {
        return this.target.unionid;
    }

    set unionid(val: boolean) {
        this.target.unionid = val;
    }

    get dingId() {
        return this.target.dingId;
    }

    set dingId(val: boolean) {
        this.target.dingId = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment[] = [];
        DDdepartments.forEach((item) => {
            if(self.departmentIds.indexOf(item.id) >= 0){
                let oaDept = new DdDepartment({name: item.name, parentId: item.parentid, id: item.id, isvApi: self.isvApi,
                    corpApi: self.corpApi});
                result.push(oaDept);
            }
        })
        return result;
    }

    async getSelfById(): Promise<OaStaff> {
        let self = this;
        let userInfo: any = await self.corpApi.getUser(self.id);
        let oaStaff = new DdStaff({id: userInfo.userid, name: userInfo.name, mobile: userInfo.mobile,
            email: userInfo.email, departmentIds: userInfo.department, corpId: self.corpId,
            isvApi: self.isvApi, corpApi: self.corpApi});
        return oaStaff;
    }

    async saveStaffProperty(params: {staffId: string}): Promise<boolean> {
        let self = this;
        /*let ddUserInfo: any = await self.corpApi.getUser(self.id);
        let dd_info = JSON.stringify( ddUserInfo );
        let ddtalkUser = Models.ddtalkUser.create({
            id: params.staffId,
            avatar: self.avatar,
            dingId: self.dingId,
            isAdmin: self.isAdmin,
            name: self.name,
            ddUserId: self.id,//为钉钉数据的userid
            corpid: self.corpId,
            ddInfo: dd_info
        });
        ddtalkUser = await ddtalkUser.save();*/

        let staffUuidProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.DD_ID, value: self.id});
        let staffCorpProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.DD_COMPANY_ID, value: self.corpId});
        let ddUser = await self.corpApi.getUser(self.id);
        let userInfo = JSON.stringify(ddUser);
        let staffDdInfoProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.DD_USER_INFO, value: userInfo});
        await staffUuidProperty.save();
        await staffCorpProperty.save();
        await staffDdInfoProperty.save();
        return true;
    }

    async getCompany(): Promise<Company>{
        let self = this;
        let company: Company;
        /*let corps = await Models.ddtalkCorp.find({where: {corpId: self.corpId}});
        if(corps && corps.length){
            let corp = corps[0];
            company = await corp.getCompany();
        }*/

        let companyPro = await Models.companyProperty.find({where : {value: self.corpId, type: CPropertyType.DD_ID}});
        if(companyPro && companyPro.length > 0){
            company = await Models.company.get(companyPro[0].companyId);
        }
        return company;
    }

    async getStaff(): Promise<Staff>{
        let self = this;
        let staff: Staff = null;
        /*let ddtalkUser = await Models.ddtalkUser.find({
            where : { ddUserId : self.id , corpid : self.corpId }
        });
        if(ddtalkUser && ddtalkUser.length) {
            staff = await Models.staff.get(ddtalkUser[0].id);
        }*/

        let staffPro = await Models.staffProperty.find({where : {value: self.id, type: SPropertyType.DD_ID}});
        console.info(staffPro.length);
        if(staffPro && staffPro.length > 0){
            staff = await Models.staff.get(staffPro[0].staffId);
        }
        return staff;
    }

    constructor(target: any) {
        super(target);
        this.corpApi = target.corpApi;
        this.isvApi = target.isvApi;
    }

};
