import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/oaStaff';
import { Company, CPropertyType } from "_types/company";
import { EGender, Models } from "_types";
import { RestApi } from "api/sso/libs/restApi";
import { StaffProperty, SPropertyType, Staff } from "_types/staff";
import { WDepartment, IWDepartment } from "api/sso/libs/wechat-department";
export enum EWechatStaffStatus {
    active = 1,  //已激活
    disable = 2,  //已禁用
    inactive = 4   //未激活
}

export class WStaff extends OaStaff {
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

    get mobile() {
        return this.target.mobile;
    }

    set mobile(val: string) {
        this.target.mobile = val;
    }

    get email() {
        return this.target.email;
    }

    set email(val: string) {
        this.target.email = val;
    }

    get userPassword() {
        return this.target.userPassword;
    }

    set userPassword(val: string) {
        this.target.userPassword = val;
    }

    get sex() {
        return this.target.sex;
    }

    set sex(val: string) {
        this.target.sex = val;
    }

    get company() {
        return this.target.company;
    }

    set company(val: Company) {
        this.target.company = val;
    }

    get isAdmin() {
        return this.target.isAdmin;
    }

    set isAdmin(val: boolean) {
        this.target.isAdmin = val;
    }

    get avatar() {
        return this.target.avatar;
    }

    set avatar(val: string) {
        this.target.avatar = val;
    }

    get corpId() {
        return this.target.corpId;
    } 
    set corpId(val: string) {
        this.target.corpId = val;
    } 

    departmentIds: any;
    restApi: RestApi;

    constructor(target: any) {
        super(target);
        this.restApi = target.restApi;
        this.departmentIds = target.departmentIds;
    }

    /**
     * @method 企业微信同一人在不同的公司，userid可能相同，存在姓名为userid的情况
     * @return {Staff}
     */
    async getStaff(): Promise<Staff | null>{
        let self = this;
        let staff: Staff | null = null;
        
        let staffPro = await Models.staffProperty.find({where : {value: self.id}});
        if(staffPro && staffPro.length > 0){
            staff = await Models.staff.get(staffPro[0].staffId);
        }
        if(!staff) return null;
        let comPro = await Models.staffProperty.find({
            where: {
                staffId: staff.id,
                type: SPropertyType.WECHAT_CORPID,
                value: self.corpId
            }
        });
        if(!comPro || comPro.length == 0) 
            return null;
        return staff;
    }
    
    /**
     * @method 获取当前staff再微信企业系统存在的部门（数组）
     */
    async getDepartments(): Promise<OaDepartment[]> {
        let self = this;
        let departments: Array<WDepartment> = [];
        if(self.departmentIds) {
            await Promise.all(self.departmentIds.map(async (deptId: number) => {
                let wdept: Array<IWDepartment> = await self.restApi.getDepartments(deptId.toString());
                if(wdept && wdept.length) {
                    for(let i = 0; i < wdept.length; i++){  
                        if(wdept[i].id && wdept[i].id == deptId) {
                            let dept= new WDepartment({id: wdept[i].id, name: wdept[i].name, corpId: self.corpId, restApi: self.restApi,
                                company: self.company, parentId: wdept[i].parentid})
                            departments.push(dept);
                        }
                    }
                }
            }));
        }

        departments = departments.filter((dept: WDepartment) => {
            if(dept) return true;
            return false;
        })
        if(!departments) return [];
        return departments;
    }

    async getSelfById() {
        let self = this;
        if(typeof self.id != 'string')
            self.id = self.id + '';
        let userInfo: IWStaff = await self.restApi.getStaff(self.id);
        let mobile = userInfo.mobile && userInfo.mobile != '' ? userInfo.mobile : null;
        let email = userInfo.email && userInfo.email != '' ? userInfo.email : null;
        let oaStaff = new WStaff({id: userInfo.userid, restApi: self.restApi, name: userInfo.name, mobile: mobile,
            email: email, departmentIds: userInfo.department, corpId: self.corpId, company: self.company,
            avatar: userInfo.avatar_mediaid});
        return oaStaff;
    }
    async getCompany() {
        let self = this;
        let company: Company | null = null;
        /*let corps = await Models.ddtalkCorp.find({where: {corpId: self.corpId}});
        if(corps && corps.length){
            let corp = corps[0];
            company = await corp.getCompany();
        }*/
        let companyPro = await Models.companyProperty.find({where : {value: self.corpId, type: CPropertyType.WECHAT_CORPID}});
        if(companyPro && companyPro.length > 0){
            company = await Models.company.get(companyPro[0].companyId);
        }
        return company;
    }
    async saveStaffProperty(params: { staffId: string; }): Promise<boolean> {
        let self = this;
        let hasStaffId = await Models.staffProperty.find({
            where: {
                staffId: params.staffId,
                type: SPropertyType.WECHAT_UID
            }
        })
        if(!hasStaffId || hasStaffId.length == 0) {
            let staffUuidProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_UID, value: self.id});
            await staffUuidProperty.save();
        }
        
        let hasCorpId = await Models.staffProperty.find({
            where: {
                staffId: params.staffId,
                type: SPropertyType.WECHAT_CORPID
            }
        })
        
        if(!hasCorpId || hasCorpId.length == 0) {
            let staffCorpProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_CORPID, value: self.corpId});
            await staffCorpProperty.save();
        }
        
        let hasUserInfo = await Models.staffProperty.find({
            where: {
                staffId: params.staffId,
                type: SPropertyType.WECHAT_USER_INFO
            }
        })
        if(!hasUserInfo || hasUserInfo.length == 0) {
            let wechatUser = await self.restApi.getStaff(self.id);
            let userInfo = JSON.stringify(wechatUser);
            let staffDdInfoProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_USER_INFO, value: userInfo});
            await staffDdInfoProperty.save();
        }

        // let staffUuidProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_UID, value: self.id});
        // await staffUuidProperty.save();
        // let staffCorpProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_CORPID, value: self.corpId});
        // await staffCorpProperty.save();
        // let wechatUser = await self.restApi.getStaff(self.id);
        // let userInfo = JSON.stringify(wechatUser);
        // let staffDdInfoProperty = StaffProperty.create({staffId: params.staffId, type: SPropertyType.WECHAT_USER_INFO, value: userInfo});
        // await staffDdInfoProperty.save();
        return true;
    }
}

export interface IWStaff {
    userid: string;
    name: string;
    mobile?: string;
    email?: string;   //mobile 和email不能同时
    english_name?: string;
    gender: EGender;
    avatar_mediaid?: string;
    isleader?: number;  //上级字段，标示是否是上级
    status?: EWechatStaffStatus;
    
    department: string[] | number[];
    order?: number[];
    position?: string;
    telephone?: string;
    extattr?: any
}

export enum EStaffStatus {
    ENABLE = 1,  //表示启用成员
    DISABLE = 0  //表示禁用成员
}