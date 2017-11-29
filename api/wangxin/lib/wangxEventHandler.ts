/**
 * Created by lei.liu on 2017/11/29
 */


"use strict"
import WangxStaff from "./wangxStaff"
import {Models} from "_types/index"
import {Company, CPropertyType} from "_types/company"
import WangxDepartment from "./wangxDepartment";
import {OaDepartment} from "../../../libs/asyncOrganization/oaDepartment";

export const eventTypeArray: Array<string> = ["user_add_org", "user_modify_org", "user_leave_org",
    "org_dept_create", "org_dept_modify", "org_dept_remove"]

/**
 * 事件处理器工厂。
 * @param {string} eventType
 * @returns {Function}
 */
export default function wangxEventHandFactory (eventType: string): Function{
    if (eventTypeArray.indexOf(eventType) == -1)
        throw new Error("事件类型不存在")
    switch (eventType) {
        case "user_add_org":
            return syncUsers
        case "user_modify_org":
            return syncUsers
        case "user_leave_org":
            return userLeave
        case "org_dept_create":
            return deptSync
        case "org_dept_modify":
            return deptSync
        case "org_dept_remove":
            return deptRemove
    }
}

/**
 * 批量同步用户，新建和修改用户都可以通过批量同步用户实现。
 * @param params
 * @returns {Promise<void>}
 */
async function syncUsers (params: any) {
    let userIds: Array<string> = params.userIds
    let companyId: string = params.companyId

    let comPro = await Models.companyProperty.find({where: {value: companyId, type: CPropertyType.WANGXIN_ID}})
    if (!comPro || !comPro.length) {
        throw new Error("该企业没有授权")
    }
    let company: Company = await Models.company.get(comPro[0].companyId)

    userIds.map(async (userId) => {
        let wangxStaff = new WangxStaff({id: userId, company: company})
        wangxStaff = await wangxStaff.getSelfById()
        await wangxStaff.sync()
    })
}

/**
 * 用户离职操作。
 * @param params
 * @returns {Promise<void>}
 */
async function userLeave (params: any) {
    let userIds: Array<string> = params.userIds

    userIds.map(async (userId) => {
        let wangxStaff = new WangxStaff({id: userId})
        await wangxStaff.leaveOrg()
    })
}

/**
 * 部门同步。
 * @param params
 * @returns {Promise<void>}
 */
async function deptSync(params: any) {
    let companyId: string = params.companyId
    let deptIds: Array<string> = params.deptIds

    let comPro = await Models.companyProperty.find({where: {value: companyId, type: CPropertyType.WANGXIN_ID}})
    if (!comPro || !comPro.length) {
        throw new Error("该企业没有授权")
    }
    let company: Company = await Models.company.get(comPro[0].companyId)

    deptIds.map(async (deptId) => {
        let wangxDept: OaDepartment = new WangxDepartment({id: deptId, company: company})
        wangxDept = await wangxDept.getSelfById()
        await wangxDept.sync()
    })
}

/**
 * 删除部门。
 * @param params
 * @returns {Promise<void>}
 */
async function deptRemove(params: any) {
    let deptIds: Array<string> = params.deptIds

    deptIds.map(async (deptId) => {
        let wangxDept = new WangxDepartment({id: deptId})
        await wangxDept.destroy()
    })
}