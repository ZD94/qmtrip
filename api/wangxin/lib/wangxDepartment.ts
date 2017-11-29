/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment"
import {OaStaff} from 'libs/asyncOrganization/OaStaff'
import {Department, DPropertyType} from "_types/department"
import {Company} from "_types/company"
import {Models} from "_types/index"

export default class WangxDepartment extends OaDepartment {

    constructor(target: any) {
        super(target)
        this.companyId = target.companyId
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

    //网信独有属性

    get companyId() {
        return this.target.companyId
    }

    set companyId(companyId: string) {
        this.target.companyId = companyId
    }

    async getSelfById(): Promise<OaDepartment> {
        return null
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        return null
    }

    async getParent(): Promise<OaDepartment> {
        return null
    }

    async getStaffs(): Promise<OaStaff[]> {
        return null
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        return true
    }

    async getDepartment(): Promise<Department> {
        let self = this
        let department: Department = null
        let deptPro = await Models.departmentProperty.find({where : {value: self.id, type: DPropertyType.WANGXIN_ID}});
        if(deptPro && deptPro.length > 0){
            for(let d of deptPro){
                let dept = await Models.department.get(d.departmentId);
                if(dept){
                    let deptCorpPro = await Models.departmentProperty.find({where : {value: self.company.id, type: DPropertyType.WANGXIN_COMPANY_ID, departmentId: dept.id}});
                    if(deptCorpPro && deptCorpPro.length){
                        department = dept;
                    }
                }
            }
        }
        return department
    }
}