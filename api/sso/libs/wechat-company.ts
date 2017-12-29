

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

        // if(!staff) staff = await Models.staff.get("2eaf0b60-ec72-11e7-a61b-6dc8f39f777e");   //测试
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
                    company: staff.company, 
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
    async saveCompanyProperty(params: { companyId: string; }): Promise<boolean> {
        let self = this;
        let companyUuidProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_CORPID, value: self.id});
        let secretProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_SECRET, value: self.secret}); 
        await companyUuidProperty.save();
        await secretProperty.save();

        // let companyAgentProperty = CompanyProperty.create({companyId: params.companyId, type: CPropertyType.WECHAT_AGENTID, value: self.agentId});
        // await companyAgentProperty.save();
        return true;
    }

}
