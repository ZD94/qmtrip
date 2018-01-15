

import { WorkWechatResponse } from "api/sso";
import { EGender } from '_types';
import {WStaff} from "./wechat-staff";
import {WDepartment} from "./wechat-department";
import { RestApi } from 'api/sso/libs/restApi';
import { Company } from '_types/company';
import { Models } from '_types';
import { Account, ACCOUNT_STATUS } from '_types/auth';
import { Staff, EStaffStatus, EAddWay } from '_types/staff';



// 员工变动事件
class EventNotice {

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
        await wStaff.sync();
        // let accounts: Account[];
        // let account: Account;
        // let staff: Staff;

        // if(wStaff.mobile || wStaff.email) {
        //     accounts = await Models.account.find({
        //         where: {
        //             $or: {
        //                 email: wStaff.email,
        //                 mobile: wStaff.mobile
        //             }
        //         }
        //     });
        //     if(accounts && accounts.length)
        //         account = accounts[0];
        // }
        // //name: self.name, sex: self.sex, mobile: self.mobile, email: self.email, roleId: roleId, pwd: utils.md5(pwd), avatar: self.avatar
        // if(account) {
        //     staff = Staff.create({
        //         name: wStaff.name,
        //         sex: wStaff.sex,
        //         company: self.company,
        //         staffStatus: EStaffStatus.ON_JOB,
        //         addWay: EAddWay.OA_SYNC,
        //         status: ACCOUNT_STATUS.ACTIVE,

        //     })
        // }
        
    
    }
    async update_user(xml: IWUpdateUser) {
    
    }
    async delete_user(xml: IWDeleteUser) {
    
    }
    // 部门变动事件
    async create_party(xml: IWCreateDepartment) {
    
    }
    async update_party(xml: IWUpdateDepartment) {
    
    }
    async delete_party(xml: IWDeleteDepartment) {
    
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
