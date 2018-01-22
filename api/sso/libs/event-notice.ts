

import { WorkWechatResponse } from "api/sso";
import { EGender } from '_types';
import {WStaff} from "./wechat-staff";
import {WDepartment} from "./wechat-department";
import { RestApi } from 'api/sso/libs/restApi';
import { Company, CPropertyType } from '_types/company';
import { Models } from '_types';
import { Account, ACCOUNT_STATUS } from '_types/auth';
import { Staff, EStaffStatus, EAddWay, SPropertyType, StaffProperty } from '_types/staff';
import { StaffDepartment, DPropertyType, Department, DepartmentProperty } from '_types/department';



// 员工变动事件
export class EventNotice {

    restApi: RestApi;
    company: Company;

    constructor(target: any) {
        this.restApi = target.restApi;
        this.company = target.company;
    }

    async create_user(xml: IWCreateUser) {
        let self = this;
        let wStaff = new WStaff({
            id: xml.UserId,         
            name: xml.Name, 
            mobile: xml.Mobile,
            sex: xml.Gender,
            email: xml.Email, 
            departmentIds: xml.Department, 
            corpId: xml.AuthCorpId, 
            avatar: xml.Avatar,
            company: self.company,
            restApi: self.restApi, 
        });
        await wStaff.sync({
            company: self.company,
            from: 'createUser'
        });  
        return true;   
    }
    async update_user(xml: IWUpdateUser) {
        let self = this;
        let wStaff = new WStaff({
            id: xml.UserId,         
            name: xml.Name, 
            mobile: xml.Mobile,
            sex: xml.Gender,
            email: xml.Email, 
            departmentIds: xml.Department, 
            corpId: xml.AuthCorpId, 
            avatar: xml.Avatar,
            company: self.company,
            restApi: self.restApi, 
        });
        await wStaff.sync();
        return true;
    }
    static async delete_user(xml: IWDeleteUser) {
        
        let comPro = await Models.staffProperty.find({ where: {
            type: SPropertyType.WECHAT_CORPID,
            value: xml.AuthCorpId
        }});

        if(!comPro || !comPro.length) 
            throw new Error("该AuthCorpId不存在鲸力系统中")
        let {staffId} = comPro[0];
        let staff = await Models.staff.get(staffId);

        let staffPros = await Models.staffProperty.find({ where: {
            staffId: staffId,
            value: xml.UserId
        }});
        if(!staffPros || !staffPros.length) 
            throw new Error("该staff不存在鲸力系统中")
        let staffDepts = await Models.staffDepartment.find({ where: {
            staffId: staffId
        }});
        await Promise.all(staffDepts.map(async (staffDept: StaffDepartment) => {
            let department = await Models.department.get(staffDept.departmentId);
            await department.destroy();
            await staffDept.destroy();
            return true;
        }));
        await staff.destroy();
        await Promise.all(staffPros.map(async (staffPro: StaffProperty) => {
            await staffPro.destroy();
        }))
        return true;    
    }
    // 部门变动事件
    async create_party(xml: IWCreateDepartment) {
        let self = this;
        let comPro = await Models.CompanyProperty.find({ where: {
            type: CPropertyType.WECHAT_CORPID,
            value: xml.AuthCorpId
        }});
        if(!comPro || !comPro.length) 
            throw new Error("该AuthCorpId不存在鲸力系统中")
        let companyId = comPro[0];
        let company = await Models.company.get(companyId);

        let wdepartment = new WDepartment({
            name: xml.Name, 
            parentId: xml.ParentId, 
            id: xml.Id + '', 
            corpId: xml.AuthCorpId,
            company: self.company,
            restApi: self.restApi
        });
        await wdepartment.sync({
            company: self.company,
            oaDepartment: null,
            from: 'createDepartment'
        }); 
        return null;
    }
    async update_party(xml: IWUpdateDepartment) {
        let self = this;
        let wdepartment = new WDepartment({
            name: xml.Name, 
            parentId: xml.ParentId, 
            id: xml.Id + '', 
            corpId: xml.AuthCorpId,
            company: self.company,
            restApi: self.restApi
        });
        await wdepartment.sync({
            company: self.company,
            oaDepartment: null,
            from: 'createDepartment'
        }); 
        return true;
    }
    async delete_party(xml: IWDeleteDepartment) {
        let comPro = await Models.departmentProperty.find({ where: {
            type: DPropertyType.WECHAT_CORPID,
            value: xml.AuthCorpId
        }});

        if(!comPro || !comPro.length) 
            throw new Error("该AuthCorpId不存在鲸力系统中")
        let {departmentId} = comPro[0];
        let deptPros = await Models.departmentProperty.find({ where: {
            departmentId: departmentId,
            value: xml.Id
        }});
        if(!deptPros || !deptPros.length) 
            throw new Error("该部门不存在鲸力系统中")
      
        let staffDepts = await Models.staffDepartment.find({ where: {
            departmentId: departmentId
        }});
        if(staffDepts && staffDepts.length)
            throw new Error("该部门下仍有员工，无法删除")
        let dept = await Models.department.get(departmentId);
        if(!dept) 
            throw new Error("该部门不存在鲸力系统中")
        await dept.destroy();
        await Promise.all(deptPros.map(async (deptPro: DepartmentProperty) => {
            await deptPro.destroy();
        }))
        return true;    
    
    }
    // 标签成员变更事件
    async update_tag(xml: WorkWechatResponse) {
    
    }

}


/**添加新员工*/
export interface IWCreateUser {
   SuiteId?: string,
   AuthCorpId?: string,
   InfoType?: string,  //此处为change_contact
   TimeStamp?: number,
   ChangeType?: string,   //此处为create_user
   UserId?: string,
   Name?: string,
   Department?: Array<number|string>,
   Mobile?: string|number,    //仅通讯录管理应用可以获取
   Position?: string|number,
   Gender?: EGender,     //1表示男性， 2表示女性
   Email?: string,
   Status?: number,  //激活状态：1=激活或关注， 2=禁用， 4=退出企业
   Avatar?: string,  //如果要获取小图将url最后的”/0”改成”/100”即可
   EnglishName?: string,
   IsLeader?: number,  //上级字段，标识是否为上级。0表示普通成员，1表示上级
   Telephone?: number,  //座机，仅通讯录管理应用可获取
   ExtAttr?: Array<{    //扩展属性，仅通讯录管理应用可获取
       Name?: string,
       Value?: string,
   }>
}

/**修改员工 */
export interface IWUpdateUser extends IWCreateUser {
    NewUserID?: string,   //新的UserID，变更时推送（userid由系统生成时可更改一次）
    ChangeType?: string,   //此处为update_user
}

/**修改员工 */
export interface IWDeleteUser {
    SuiteId?: string,
    AuthCorpId?: string,
    InfoType?: string,  //此处为change_contact
    TimeStamp?: number,
    ChangeType?: string,   //此处为 delete_user
    UserId?: string
}

/**添加部门 */
export interface IWCreateDepartment {
    SuiteId?: string,
    AuthCorpId?: string,
    InfoType?: string,  //此处为change_contact
    TimeStamp?: number,
    ChangeType?: string,   //此处为 create_party
    Id?: string,
    Name?: string,
    ParentId?: number|string,
    Order?: any  //部门排序
}

/**更新部门 */
export interface IWUpdateDepartment {
    SuiteId?: string,
    AuthCorpId?: string,
    InfoType?: string,  //此处为change_contact
    TimeStamp?: number,
    ChangeType?: string,   //此处为 update_party
    Id?: string,
    Name?: string, // 部门名称，仅当该字段发生变更时传递
    ParentId?: number|string  //父部门id，仅当该字段发生变更时传递
}

/**删除部门 */
export interface IWDeleteDepartment {
    SuiteId?: string,
    AuthCorpId?: string,
    InfoType?: string,  //此处为change_contact
    TimeStamp?: number,
    ChangeType?: string,   //此处为 delete_party
    Id?: string
}
