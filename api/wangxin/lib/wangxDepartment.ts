/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment";
import { OaStaff } from 'libs/asyncOrganization/OaStaff';
import { DepartmentProperty, DPropertyType, Department} from "_types/department";
import {Company, CPropertyType} from "_types/company";

export default class WangxDepartment extends OaDepartment {

    constructor(target: any) {
        super(target)
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

    async getDepartment(): Promise<Department> {
        return null
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        return true
    }

}