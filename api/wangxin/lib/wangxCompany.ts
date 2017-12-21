/**
 * Created by lei.liu on 2017/11/27
 */


"use strict"
import {OaCompany} from "libs/asyncOrganization/oaCompany"
import {OaDepartment} from "libs/asyncOrganization/oaDepartment"
import {OaStaff} from "libs/asyncOrganization/oaStaff"
import {Company, CPropertyType, CompanyProperty} from "_types/company";
import {Models} from "../../../_types/index";
import WangXinApi from "./wangxApi";
import WangxDepartment from "./wangxDepartment";
import WangxStaff from "./wangxStaff";

export default class WangxCompany extends OaCompany{

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

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let departments = await self.wangxAPi.getDepartments();
        let result: OaDepartment[];
        departments.forEach((item) => {
            let ddDept = new WangxDepartment({name: item.name, parentId: item.pid, id: item.id});
            result.push(ddDept);
        })
        return result;
    }

    async getRootDepartment(): Promise<OaDepartment> {
        let self = this;
        let departments = await self.wangxAPi.getDepartments();
        let result: OaDepartment;
        departments.forEach((item) => {
            if(item.id == 1){
                result = new WangxDepartment({name: item.name, parentId: item.pid, id: item.id});
            }
        })
        return result;
    }

    async getCreateUser(): Promise<OaStaff> {
        let self = this;
        let users = await self.wangxAPi.getUsers();
        let result: OaStaff;
        users.forEach((item) => {
            if(item.id == 1){
                result = new WangxStaff({name: item.name, id: item.id, mobile: item.tel || item.phone, email: item.email, sex: item.sex, isAdmin: true});
            }
        })
        return result;
    }

    async saveCompanyProperty(params: {companyId: string}): Promise<boolean> {
        let companyUuidProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WANGXIN_ID, value: this.id});
        await companyUuidProperty.save();
        return true;
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