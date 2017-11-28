/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaCompany} from "libs/asyncOrganization/oaCompany"
import {OaDepartment} from "libs/asyncOrganization/oaDepartment"
import {OaStaff} from "libs/asyncOrganization/oaStaff"
import {Company, CPropertyType, CompanyProperty} from "_types/company";

export default class WangxCompany extends OaCompany{

    private wangxinApi: any

    constructor(target: any) {
        super(target)
        this.wangxinApi = target.wangxinApi
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

    async getDepartments(): Promise<OaDepartment[]> {
        return null
    }

    async getRootDepartment(): Promise<OaDepartment> {
        return null
    }

    async getCreateUser(): Promise<OaStaff> {
        return null
    }

    async getCompany(): Promise<Company> {
        return null
    }

    async saveCompanyProperty(params: {companyId: string}): Promise<boolean> {
        return true
    }
}