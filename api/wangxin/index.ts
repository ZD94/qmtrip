/**
 * Created by lei.liu on 2017/11/24
 */


"use strict"

const API = require("@jingli/dnode-api")
import Logger from "@jingli/logger"
import {clientExport} from "@jingli/dnode-api/dist/src/helper"
import WangxUtils from "./lib/wangxUtils"
import WangxCompany from "./lib/wangxCompany"
import WangxStaff from "./lib/wangxStaff"
import {OaStaff} from 'libs/asyncOrganization/oaStaff';
import {SPropertyType, Staff} from "_types/staff";
import {Models} from "../../_types/index";
import L from "@jingli/language"

const logger = new Logger("wangxin")

export default class WangXin {

    /**
     * 网信的自动登录。
     * @param {{token: string; companyId: string}} params
     * @returns {Promise<any>}
     */
    @clientExport
    static async loginByWangXin(params: {token: string, companyId: string}): Promise<any> {
        let {token, companyId} = params
        logger.debug(`loginByWangXin--> token: ${token}, companyId: ${companyId}`)
        let wangxCompany = new WangxCompany({id: companyId})
        let company = await wangxCompany.getCompany()
        if (company) {
            let UUID = WangxUtils.parseLRToken(token) //解析token获取UUID，根据uuId通过staffPro获取用户信息。
            let staffPro = await Models.staffProperty.find({where: {value: UUID, type: SPropertyType.WANGXIN_ID}})
            let staff: Staff
            if (staffPro && staffPro.length > 0) {
                for(let sp of staffPro) { // 针对一个UUID对应多个company的情况，钉钉会存在，网信不确定。
                    let temStaff = await Models.staff.get(sp.staffId)
                    let staffComPro = await Models.staffProperty.find({where: {value: companyId, type: SPropertyType.WANGXIN_COMPANY_ID}})
                    if (staffComPro && staffComPro.length) {
                        staff = temStaff
                        break;
                    }
                }
            }
            if (staff == null) {
                throw L.ERR.UNAUTHORIZED()
            }
            logger.info(`网信自动登录，uuid: ${UUID}, accountId: ${staff.accountId}`)
            return await API.auth.makeAuthenticateToken(staff.accountId, "wangxin")
        } else {
            throw L.ERR.COMPANY_NOT_EXIST();
        }
    }
}