/**
 * Created by wangyali on 2017/7/6.
 */
import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/OaStaff';
import { DepartmentProperty, DPropertyType, Department} from "_types/department";
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import L from '@jingli/language';
import ISVApi from "./isvApi";
import corpApi from "./corpApi";
import DdStaff from "./ddStaff";
import {DDTalkDepartment} from "_types/ddtalk";

export default class DdDepartment extends OaDepartment {

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

    //钉钉特有属性
    get corpId() {
        return this.target.corpId;
    }

    set corpId(val: string) {
        this.target.corpId = val;
    }

    async getSelfById(): Promise<OaDepartment> {
        let self = this;
        let result = await self.corpApi.getDepartmentInfo(self.id);
        if(result){
            return new DdDepartment({id: result.id, name: result.name, isvApi: self.isvApi, corpApi: self.corpApi,
                company: self.company, parentId: result.parentid});
        }
        return null;
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments(self.id);
        let result: OaDepartment[];
        for(let d of DDdepartments){
            let oaDept = new DdDepartment({id: d.id, name: d.name, isvApi: self.isvApi, corpApi: self.corpApi,
                company: self.company, parentId: d.parentid});
            result.push(oaDept)
        }
        return result;
    }

    async getParent(): Promise<OaDepartment> {
        let self = this;
        let result = await self.corpApi.getDepartmentInfo(self.parentId);
        if(result){
            return new DdDepartment({id: result.id, name: result.name, isvApi: self.isvApi, corpApi: self.corpApi,
                company: self.company, parentId: result.parentid});
        }
        return null;
    }

    async getStaffs(): Promise<OaStaff[]> {
        let self = this;
        let dingUsers = await self.corpApi.getUserListByDepartment(self.id);
        let result: OaStaff[];
        for(let u of dingUsers){
            let oaStaff = new DdStaff({name: u.name, email: u.email, mobile: u.mobile, isvApi: self.isvApi, corpApi: self.corpApi});
            result.push(oaStaff);
        }
        return result;
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        let self = this;
        let ddDepart = Models.ddtalkDepartment.create({
            corpId : self.corpId ,
            DdDepartmentId : self.id,
            localDepartmentId : params.departmentId ,
            ddName : self.name
        });
        await ddDepart.save();
        return true;
    }

    async getDepartmentProperty(params: {departmentId: string}): Promise<DDTalkDepartment> {
        let self = this;
        let ddDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : this.corpId , DdDepartmentId : self.id }
        });
        if(ddDeparts && ddDeparts.length){
            return ddDeparts[0];
        }
        return null;
    }

    async getDepartment(): Promise<Department>{
        let self = this;
        let department: Department = null;
        let ddDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : self.corpId , DdDepartmentId : self.id }
        });
        if(ddDeparts && ddDeparts.length) {
            department = await Models.department.get(ddDeparts[0].localDepartmentId);
        }
        return department;
    }
    constructor(target: any) {
        super(target);
        this.corpApi = target.corpApi;
        this.isvApi = target.isvApi;
    }

};
