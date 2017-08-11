/**
 * Created by wangyali on 2017/7/19.
 */
import { OaCompany } from 'libs/asyncOrganization/OaCompany';
import { OaDepartment } from 'libs/asyncOrganization/OaDepartment';
import { OaStaff } from 'libs/asyncOrganization/OaStaff';
import { DepartmentProperty, DPropertyType} from "_types/department";
import {Models} from "_types/index";
import {Company, CPropertyType, CompanyProperty} from "_types/company";
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

    //钉钉特有属性
    get permanentCode() {
        return this.target.permanentCode;
    }

    set permanentCode(val: string) {
        this.target.permanentCode = val;
    }

    get agentId() {
        return this.target.agentid;
    }

    set agentId(val: string) {
        this.target.agentid = val;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment[];
        DDdepartments.forEach((item) => {
            let ddDept = new DdDepartment({name: item.name, parentId: item.parentid, id: item.id, isvApi: self.isvApi,
                corpApi: self.corpApi, corpId: self.id});
            result.push(ddDept);
        })
        return result;
    }

    async getRootDepartment(): Promise<OaDepartment> {
        let self = this;
        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment;
        DDdepartments.forEach((item) => {
            if(item.id == 1){
                result = new DdDepartment({name: item.name, parentId: null, id: item.id, isvApi: self.isvApi,
                    corpApi: self.corpApi, corpId: self.id});
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
        let oaStaff = new DdStaff({id: userInfo.userid, isAdmin: userInfo.isAdmin, name: userInfo.name, mobile: userInfo.mobile, email: userInfo.email,
            departmentIds: userInfo.department, corpId: self.id, isvApi: self.isvApi, corpApi: self.corpApi});
        return oaStaff;
    }

    async saveCompanyProperty(params: { companyId: string }): Promise<boolean> {
        let self = this;
        /*let corp = Models.ddtalkCorp.create({
            id: params.companyId,
            corpId: self.id,
            permanentCode: self.permanentCode,
            companyId: params.companyId,
            isSuiteRelieve: false,
            agentid: self.agentid
        });
        corp = await corp.save();*/

        let companyUuidProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.DD_ID, value: self.id});
        let companyCorpProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.DD_PERMANENT_CODE, value: self.permanentCode});
        let companyAgentProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.DD_AGENT_ID, value: self.agentId});
        await companyUuidProperty.save();
        await companyCorpProperty.save();
        await companyAgentProperty.save();
        return true;
    }

    async getCompany(): Promise<Company>{
        let self = this;
        let com: Company = null;

        let companyPro = await Models.companyProperty.find({where : {value: self.id, type: CPropertyType.DD_ID}});
        if(companyPro && companyPro.length > 0){
            com = await Models.company.get(companyPro[0].companyId);
            if(com){
                //可能解绑过钉钉 需要更新企业钉钉property信息
                let comPros = await Models.companyProperty.find({where: {companyId: com.id,
                    type: [CPropertyType.DD_PERMANENT_CODE, CPropertyType.DD_AGENT_ID]}});

                for(let c of comPros){
                    if(c.type == CPropertyType.DD_PERMANENT_CODE){
                        c.value = self.permanentCode;
                        await c.save();
                    }
                    if(c.type == CPropertyType.DD_AGENT_ID){
                        c.value = self.agentId;
                        await c.save();
                    }
                }
                com.isSuiteRelieve = false;
                await com.save();
            }
        }
        return com;
    }

    constructor(target: any) {
        super(target);
        this.corpApi = target.corpApi;
        this.isvApi = target.isvApi;
    }

};
