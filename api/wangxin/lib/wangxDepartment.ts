/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment"
import {OaStaff} from 'libs/asyncOrganization/OaStaff'
import {Department, DPropertyType} from "_types/department"
import {Company} from "_types/company"
import {Models} from "_types/index"
import WangXinApi from "./wangxApi";
import WangxStaff from "./wangxStaff";
import {DepartmentProperty} from "../../../_types/department/department-property";

export default class WangxDepartment extends OaDepartment {
    private wangxAPi: WangXinApi;

    constructor(target: any) {
        super(target)
        this.wangxAPi = target.wangxAPi
    }

    get id() {
        return this.target.id
    }

    set id(val: string) {
        this.target.id = val
    }

    get name() {
        return this.target.name
    }

    set name(val: string) {
        this.target.name = val
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

    async getSelfById(): Promise<OaDepartment> {
        let self = this;
        let result = await self.wangxAPi.getDepartmentById(self.id);
        if(result){
            return new WangxDepartment({name: self.name, parentId: self.parentId, id: self.id, company: self.company});
        }
        return null;
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let self = this;

        let departments = await self.wangxAPi.getDepartments(self.id);
        let result: OaDepartment[] = [];
        departments.forEach((d) => {
            let oaDept =  new WangxDepartment({name: d.name, parentId: self.id, id: d.id, company: self.company});
            result.push(oaDept);
        })
        return result;
    }

    async getParent(): Promise<OaDepartment> {
        let self = this;
        if(self.parentId){
            let result = await self.wangxAPi.getDepartmentById(self.parentId);
            if(result && result.id){
                return new WangxDepartment({id: result.id, name: result.name, parentId: result.pid, company: self.company});
            }
        }
        return null;
    }

    async getStaffs(): Promise<OaStaff[]> {
        let self = this;
        let users = await self.wangxAPi.getUsersBydept(self.id);
        let result: OaStaff[] = [];
        for(let u of users){
            let oaStaff = new WangxStaff({id: u.id, name: u.name, email: u.email, mobile: u.tel || u.phone, company: self.company});
            result.push(oaStaff);
        }
        return result;
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        let self = this;

        let departmentUuidProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.WANGXIN_ID, value: self.id+""});
        await departmentUuidProperty.save();
        return true;
    }

    async getDepartment(): Promise<Department> {
        let self = this
        let deptPro = await Models.departmentProperty.find({where : {value: self.id, type: DPropertyType.WANGXIN_ID}});
        if(deptPro && deptPro.length > 0){
            let dept = await Models.department.get(deptPro[0].departmentId);
            return dept;
            /*for(let d of deptPro){
                let dept = await Models.department.get(d.departmentId);
                if(dept){
                    let deptCorpPro = await Models.departmentProperty.find({where : {value: self.company.id, type: DPropertyType.WANGXIN_COMPANY_ID, departmentId: dept.id}});
                    if(deptCorpPro && deptCorpPro.length){
                        department = dept;
                    }
                }
            }*/
        }
        return null;
    }
}