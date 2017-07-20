/**
 * Created by wangyali on 2017/7/19.
 */
import { OaCompany } from 'libs/asyncOrganization/OaCompany';
import { OaDepartment } from 'libs/asyncOrganization/OaDepartment';
import { OaStaff } from 'libs/asyncOrganization/OaStaff';
import { DepartmentProperty, DPropertyType} from "_types/department";
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import L from '@jingli/language';
import ISVApi from "./isvApi";
import corpApi from "./corpApi";
import DdStaff from "./ddStaff";
import DdDepartment from "./ddDepartment";

export default class DdCompany extends OaCompany {

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

    get permanentCode() {
        return this.target.permanentCode;
    }

    set permanentCode(val: string) {
        this.target.permanentCode = val;
    }

    get agentid() {
        return this.target.agentid;
    }

    set agentid(val: string) {
        this.target.agentid = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment[];
        DDdepartments.forEach((item) => {
            let ddDept = new DdDepartment({name: item.name, parentId: item.parentid, id: item.id, isvApi: self.isvApi,
                corpApi: self.corpApi});
            result.push(ddDept);
        })
        return result;
    }

    async getRootDepartment(): Promise<OaDepartment> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment;
        DDdepartments.forEach((item) => {
            if(item.parentid == 1){
                result = new DdDepartment({name: item.name, parentId: item.parentid, id: item.id, isvApi: self.isvApi,
                    corpApi: self.corpApi});
            }
        })
        return result;
    }

    async getCreateUser(): Promise<OaStaff> {
        let self = this;
        //获取企业授权的授权数据 , 拿到管理员信息
        let authInfo: any = await self.isvApi.getCorpAuthInfo();
        let authUserInfo = authInfo.auth_user_info;
        let userInfo: any = await self.corpApi.getUser(authUserInfo.userId);
        let oaStaff = new DdStaff({id: userInfo.userid, name: userInfo.name, mobile: userInfo.mobile,
            email: userInfo.email, departmentIds: userInfo.department, isvApi: self.isvApi, corpApi: self.corpApi});
        return oaStaff;
    }

    async saveCompanyProperty(params: { companyId: string }): Promise<boolean> {
        let self = this;
        let corp = Models.ddtalkCorp.create({
            id: params.companyId,
            corpId: self.id,
            permanentCode: self.permanentCode,
            companyId: params.companyId,
            isSuiteRelieve: false,
            agentid: self.agentid
        });
        corp = await corp.save();
        return true;
    }

    async getCompany(): Promise<Company>{
        let self = this;
        let com: Company = null;
        let corps = await Models.ddtalkCorp.find({where: {corpId: self.id}});
        if (corps && corps.length) {
            //有记录，曾经授权过
            let corp = corps[0];
            com = await corp.getCompany(corp['company_id']);
        }
        return com;
    }

    constructor(target: any) {
        super(target);
        this.corpApi = target.corpApi;
        this.isvApi = target.isvApi;
    }

};
