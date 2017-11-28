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
import {where} from "sequelize";
import {Models} from "../../JLTypes/_types/index";

const logger = new Logger("wangxin")

export default class WangXin {

    @clientExport
    static async loginByWangXin(params: {token: string, companyId: string}): Promise<any> {
        let {token, companyId} = params
        if (token) {
            let UUID = WangxUtils.parseLRToken(token)
            let staffPro = await Models.staffProperty.find({where: {value: UUID, type: SPropertyType.WANGXIN_ID}})
            let staff: Staff
        } else {

        }
    }
}