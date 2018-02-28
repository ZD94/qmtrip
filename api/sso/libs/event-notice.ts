

import { WorkWechatResponse } from "api/sso";
import { EGender } from '_types';
import {WStaff} from "./wechat-staff";
import {WDepartment} from "./wechat-department";
import { RestApi } from 'api/sso/libs/restApi';
import { Company } from '_types/company';
import { Models } from '_types';
import { SPropertyType, StaffProperty } from '_types/staff';
import { StaffDepartment, DPropertyType, DepartmentProperty } from '_types/department';

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
            id: xml.UserId[0],         
            name: xml.Name[0],  
            mobile: xml.Mobile && xml.Mobile[0]? xml.Mobile[0]: null,
            sex: xml.Gender[0], 
            email: xml.Email && xml.Email[0]? xml.Email[0]: null, 
            departmentIds: xml.Department, 
            corpId: xml.AuthCorpId[0],  
            avatar: xml.Avatar && xml.Avatar[0]? xml.Avatar[0]: null,
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
            id: xml.UserId[0],         
            name: xml.Name[0], 
            mobile: xml.Mobile && xml.Mobile[0]? xml.Mobile[0]: null,
            sex: xml.Gender[0],
            email: xml.Email && xml.Email[0]? xml.Email[0]: null, 
            departmentIds: xml.Department, 
            corpId: xml.AuthCorpId[0], 
            avatar: xml.Avatar && xml.Avatar[0]? xml.Avatar[0]: null,
            company: self.company,
            restApi: self.restApi, 
        });
        await wStaff.sync({
            company: self.company,
            from: 'updateUser'
        });
        return true;
    }
    static async delete_user(xml: IWDeleteUser) {
        
        let comPro = await Models.staffProperty.find({ where: {
            type: SPropertyType.WECHAT_CORPID,
            value: xml.AuthCorpId[0]
        }});

        if(!comPro || !comPro.length) 
            throw new Error("该AuthCorpId不存在鲸力系统中")
        let staffId = comPro[0].staffId;

        let staffPros = await Models.staffProperty.find({ where: {
            staffId: staffId,
            value: xml.UserId[0]
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
        let staff = await Models.staff.get(staffId);
        if(staff) await staff.destroy();
        await Promise.all(staffPros.map(async (staffPro: StaffProperty) => {
            await staffPro.destroy();
        }))
        return true;    
    }
    // 部门变动事件
    async create_party(xml: IWCreateDepartment): Promise<boolean> {
        // let self = this;
        // let comPro = await Models.CompanyProperty.find({ where: {
        //     type: CPropertyType.WECHAT_CORPID,
        //     value: xml.AuthCorpId
        // }});
        // if(!comPro || !comPro.length) 
        //     throw new Error("该AuthCorpId不存在鲸力系统中")
        // if(!self.company) {
        //     let companyId = comPro[0].companyId;
        //     self.company = await Models.company.get(companyId);
        // }

        let self = this;
        let wdepartment = new WDepartment({
            name: xml.Name[0], 
            parentId: xml.ParentId[0], 
            id: xml.Id[0] + '', 
            corpId: xml.AuthCorpId[0],
            company: self.company,
            restApi: self.restApi
        });
        await wdepartment.sync({
            company: self.company,
            oaDepartment: undefined,
            from: 'createDepartment'
        }); 
        return true;
    }
    async update_party(xml: IWUpdateDepartment) {
        let self = this;
        let wdepartment = new WDepartment({
            name: xml.Name[0], 
            parentId: xml.ParentId[0], 
            id: xml.Id[0] + '', 
            corpId: xml.AuthCorpId[0],
            company: self.company,
            restApi: self.restApi
        });
        await wdepartment.sync({
            company: self.company,
            oaDepartment: undefined,
            from: 'createDepartment'
        }); 
        return true;
    }
    static async delete_party(xml: IWDeleteDepartment) {
        let comPro = await Models.departmentProperty.find({ where: {
            type: DPropertyType.WECHAT_CORPID,
            value: xml.AuthCorpId[0]
        }});

        if(!comPro || !comPro.length) 
            throw new Error("该AuthCorpId不存在鲸力系统中")
        let departmentId = comPro[0].departmentId;
        let deptPros = await Models.departmentProperty.find({ where: {
            departmentId: departmentId,
            value: xml.Id[0]
        }});
        if(!deptPros || !deptPros.length) 
            throw new Error("该部门不存在鲸力系统中")
      
        let staffDepts = await Models.staffDepartment.find({ where: {
            departmentId: departmentId
        }});
        if(staffDepts && staffDepts.length)
            throw new Error("该部门下仍有员工，无法删除")
        let dept = await Models.department.get(departmentId);
        if(dept) await dept.destroy();
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
   SuiteId?:  Array<string>,
   AuthCorpId?:  Array<string>,
   InfoType?:  Array<string>,  //此处为change_contact
   TimeStamp?:  Array<string>,
   ChangeType?:  Array<string>,   //此处为create_user
   UserId?:  Array<string>,
   Name?:  Array<string>,
   Department?: Array<number|string>,
   Mobile?:  Array<string|number>,    //仅通讯录管理应用可以获取
   Position?:  Array<string|number>,
   Gender?: EGender | Array<string|number>,     //1表示男性， 2表示女性
   Email?:  Array<string>,
   Status?:  Array<number>,  //激活状态：1=激活或关注， 2=禁用， 4=退出企业
   Avatar?:  Array<string>,  //如果要获取小图将url最后的”/0”改成”/100”即可
   EnglishName?: Array<string>,
   IsLeader?:  Array<number>,  //上级字段，标识是否为上级。0表示普通成员，1表示上级
   Telephone?: Array<number>,  //座机，仅通讯录管理应用可获取
   ExtAttr?: Array<{    //扩展属性，仅通讯录管理应用可获取
       Name?: string,
       Value?: string,
   }>
}

/**修改员工 */
export interface IWUpdateUser extends IWCreateUser {
    NewUserID?:  Array<string>,   //新的UserID，变更时推送（userid由系统生成时可更改一次）
}

/**修改员工 */
export interface IWDeleteUser {
    SuiteId?: Array<string>,
    AuthCorpId?:  Array<string>,
    InfoType?:  Array<string>,  //此处为change_contact
    TimeStamp?:  number | string |Array<number>,
    ChangeType?: Array<string>,   //此处为 delete_user
    UserId?:  Array<string>
}

/**添加部门 */
export interface IWCreateDepartment {
    SuiteId?: Array<string>,
    AuthCorpId?: Array<string>,
    InfoType?:  Array<string>,  //此处为change_contact
    TimeStamp?:  number | string | Array<string>,
    ChangeType?:  Array<string>,   //此处为 create_party
    Id?: Array<string>,
    Name?:  Array<string>,
    ParentId?: Array<string|number>,
    Order?: any  //部门排序
}

/**更新部门 */
export interface IWUpdateDepartment {
    SuiteId?: Array<string>,
    AuthCorpId?: Array<string>,
    InfoType?: Array<string>,  //此处为change_contact
    TimeStamp?: number | string | Array<number|string>,
    ChangeType?: Array<string>,   //此处为 update_party
    Id?:  Array<string>,
    Name?:  Array<string>, // 部门名称，仅当该字段发生变更时传递
    ParentId?: Array<string|number>  //父部门id，仅当该字段发生变更时传递
}

/**删除部门 */
export interface IWDeleteDepartment {
    SuiteId?:  Array<string>,
    AuthCorpId?:  Array<string>,
    InfoType?: Array<string>,  //此处为change_contact
    TimeStamp?: Array<string>,
    ChangeType?: Array<string>,   //此处为 delete_party
    Id?: Array<string>
}
