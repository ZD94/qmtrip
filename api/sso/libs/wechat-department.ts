import { OaDepartment } from "libs/asyncOrganization/oaDepartment";
import { Company } from "_types/company";
import { WStaff, IWStaff, EStaffStatus } from "api/sso/libs/wechat-staff";
import { OaStaff } from "libs/asyncOrganization/oaStaff";
import { RestApi } from "api/sso/libs/restApi";
import { DepartmentProperty, DPropertyType } from "_types/department";

export interface IWDepartment {
    id: number;
    name: string;
    parentid: number;
    order: number
}

export class WDepartment extends OaDepartment {
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

    restApi: RestApi;

    get corpId(){
        return this.target.corpId;
    }

    constructor(target: any) {
        super(target);
        this.restApi = target.id;
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let childDepartments: Array<WDepartment> = [];
        let result: Array<IWDepartment> = await self.restApi.getDepartments(self.id);

        if(result && result.length){
            for(let i = 0; i < result.length; i++) {
                if(result[i].id && result[i].id.toString() != self.parentId) {
                    childDepartments.push(new WDepartment({id: result[i].id, name: result[i].name, corpId: self.corpId, restApi: self.restApi, 
                           company: self.company, parentId: result[i].parentid}));
                }
            }
        }
        return childDepartments;
    }

    /**
     * @method 获取第三方系统中的父级部门对象
     */
    async getParent(): Promise<OaDepartment> {
        let self = this;
        if(self.parentId){
            let result: Array<IWDepartment> = await self.restApi.getDepartments(self.parentId);
            if(result && result.length){
                for(let i = 0; i < result.length; i++) {
                    if(result[i].id && result[i].id.toString() == self.parentId) {
                        return new WDepartment({id: result[i].id, name: result[i].name, corpId: self.corpId, restApi: self.restApi,
                            company: self.company, parentId: result[i].parentid});
                    }  
                }
            }
        }
        return null;
    }

    /**
     * @method 获取第三方系统中的父级部门下的所有员工
     */
    async getStaffs(): Promise<OaStaff[]> {
        let self = this;
        let wStaffs: Array<IWStaff> = await self.restApi.getDetailedStaffsByDepartment(self.id);
        let result: OaStaff[] = [];
        for(let u of wStaffs){
            if(u.enable == EStaffStatus.ENABLE) {
                let wstaff = new WStaff({id: u.userid, name: u.name, email: u.email, mobile: u.mobile, departmentIds: u.department, corpId: self.corpId,
                    restApi: self.restApi, company: self.company, avatar: u. avatar_mediaid});
             // let oaStaff = new WStaff({id: u.userid, isAdmin: u.isAdmin, name: u.name, email: u.email, mobile: u.mobile, departmentIds: u.department,
             //     corpId: self.corpId, isvApi: self.isvApi, corpApi: self.corpApi, company: self.company, avatar: u.avatar});
                 result.push(wstaff);
            }
        }
        return result;
    }

    async getSelfById(): Promise<OaDepartment> {
        let self = this;
        let departments: Array<IWDepartment> = await this.restApi.getDepartments(self.id);
        for(let i = 0; i < departments.length; i++) {
            if(departments[i].id && departments[i].id.toString() == self.id) {
                return new WDepartment({id: departments[i].id, name: departments[i].name, corpId: self.corpId, restApi: self.restApi,
                    company: self.company, parentId: departments[i].parentid})
            }
        }
        return null;
    }

    async saveDepartmentProperty(params: { departmentId: string; }): Promise<boolean> {
        let self = this;  
        let departmentUuidProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.WECHAT_DEPARTMENTID, value: self.id+""});
        let departmentDnProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.DD_COMPANY_ID, value: self.corpId});
        await departmentUuidProperty.save();
        await departmentDnProperty.save();
        return true;
    }

}
