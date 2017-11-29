/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaCompany} from "libs/asyncOrganization/oaCompany"
import {OaDepartment} from "libs/asyncOrganization/oaDepartment"
import {OaStaff} from "libs/asyncOrganization/oaStaff"
import {Company, CPropertyType, CompanyProperty} from "_types/company";
import {Models} from "../../../_types/index";

export default class WangxCompany extends OaCompany{

    private customPro: any //网信所需的自定义的属性，用于接口认证等操作

    constructor(target: any) {
        super(target)
        this.customPro = target.customPro
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

    async saveCompanyProperty(params: {companyId: string}): Promise<boolean> {
        return true
    }

    /**
     * 根据网信绑定的companyId获取本地公司信息。
     * @returns {Promise<Company>}
     */
    async getCompany(): Promise<Company> {
        let company: Company = null
        let self = this

        let companyPros = await Models.companyProperty.find({where: {value: self.id, type: CPropertyType.WANGXIN_ID}})
        if(companyPros && companyPros.length > 0) {
            let companyPro = companyPros[0]
            company = await Models.company.get(companyPro.companyId)
        }

        return company
    }
}