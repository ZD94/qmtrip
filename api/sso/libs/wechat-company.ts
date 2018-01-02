

import { OaCompany } from "libs/asyncOrganization/oaCompany";
import { OaDepartment } from "libs/asyncOrganization/oaDepartment";
import { OaStaff } from "libs/asyncOrganization/oaStaff";
import { RestApi } from "api/sso/libs/restApi";
import { Company, CPropertyType, CompanyProperty } from "_types/company";
import { WDepartment, IWDepartment } from "api/sso/libs/wechat-department";
import { Staff } from "_types/staff";
import { Models } from "_types";

const RootDepartment = 1;
export class WCompany extends OaCompany {
    id: string;
    name: string;
    restApi: RestApi;
    company: Company;
    get agentId() {
        return this.target.agentId;
    }
    set agentId(val: string) {
        this.target.agentId = val;
    }

    get permanentCode() {
        return this.target.permanentCode;
    }
    set permanentCode(val: string) {
        this.target.permanentCode = val;
    }

    constructor(target: any) {
        super(target);
        this.name = target.name;
        this.id = target.id
        this.restApi = target.restApi;
        this.company = target.company;
    }
    
    get secret() {
        return this.target.secret;
    }
    set secret(val: string) {
        this.target.secret = val;
    }

    async getCompany(): Promise<Company>{
        let self = this;
        let com: Company = null;
        if(typeof self.id != 'string') 
            self.id = self.id + '';
        let comPro = await Models.companyProperty.find({where : {value: self.id}});
        if(comPro && comPro.length > 0){
            com = await Models.company.get(comPro[0].companyId);
        }
        return com;
    }

    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let staff = await Staff.getCurrent();
        let company: Company;
        if(staff) 
            company = staff.company;

        let wDepartments: Array<IWDepartment> = await self.restApi.getDepartments();
        let result: OaDepartment[];

        wDepartments.forEach((item: IWDepartment) => {
            let wDept = new WDepartment({
                name: item.name, 
                parentId: item.parentid + '', 
                id: item.id + '',
                corpId: self.id,
                company: staff.company, 
                restApi: self.restApi
            });
            result.push(wDept);
        });
        if(!result) return null;
        return result;
    }

    /**
     * @method 获取微信企业的根部门
     *     注意，微信企业部门可设置可见性，
     * @return {WDepartment}
     */
    async getRootDepartment(): Promise<OaDepartment> {
        let self = this;
        let staff = await Staff.getCurrent();
        let company: Company;
        if(staff) 
            company = staff.company;
        // if(!staff) staff = await Models.staff.get("2eaf0b60-ec72-11e7-a61b-6dc8f39f777e");   //测试
        let wDepartments: Array<IWDepartment> = await self.restApi.getDepartments();
        let result: OaDepartment;
        for(let i = 0; i < wDepartments.length; i++) {
            if(wDepartments[i].id == RootDepartment){
                result = new WDepartment({
                    name: wDepartments[i].name, 
                    parentId: null, 
                    id: wDepartments[i].id + '', 
                    corpId: self.id,
                    company: company, 
                    restApi: self.restApi,
                });
                return result;
            }
        }
        if(!result) return null;
        return result;
    }
    /**
     * @method 获取管理员(创建者), 微信企业无管理员
     */
    async getCreateUser(): Promise<OaStaff> {
        return null;
    }

    /**
     * @method 保存微信企业的认证属性
     */
    async saveCompanyProperty(params: { companyId: string, permanentCode?: string}): Promise<boolean> {
        let self = this;
        let comProperty = await Models.companyProperty.find({
            where: {
                companyId: params.companyId
            }
        })
        if(!comProperty && comProperty.length) return true;
        let companyUuidProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_CORPID, value: self.id}); 
        await companyUuidProperty.save();
        let permanentCode = self.permanentCode ? self.permanentCode: params.permanentCode;

        if(permanentCode) {
            let permanentCodeProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_PERMAENTCODE, value: permanentCode});
            await permanentCodeProperty.save()
        }

        if(self.agentId) {
            let companyAgentProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_AGENTID, value: self.agentId});
            await companyAgentProperty.save();
        }
        return true;
    }

}
