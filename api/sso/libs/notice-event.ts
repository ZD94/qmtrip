import { WorkWechatResponse } from "api/sso";
import { EGender } from '_types';




async function create_user(xml: WorkWechatResponse) {

}

async function update_user(xml: WorkWechatResponse) {

}
async function delete_user(xml: WorkWechatResponse) {

}
// 部门变动事件
async function create_party(xml: WorkWechatResponse) {

}
async function update_party(xml: WorkWechatResponse) {

}
async function delete_party(xml: WorkWechatResponse) {

}
// 标签成员变更事件
async function update_tag(xml: WorkWechatResponse) {

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
export interface IWUpdateUser {
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









