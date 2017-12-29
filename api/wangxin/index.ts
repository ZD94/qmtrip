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
import WangXinApi from "./lib/wangxApi";
import C = require("@jingli/config");
import WangxDepartment from "./lib/wangxDepartment";
import {Company} from "../../_types/company/company";
import {CompanyProperty, CPropertyType} from "../../_types/company/company-property";

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
            let userCode = WangxUtils.parseLtpaToken(token, C.wxSharedSecret) //解析token获取用户信息。
            let staffPro = await Models.staffProperty.find({where: {value: userCode, type: SPropertyType.WANGXIN_USER_CODE}})
            let staff: Staff
            if (staffPro && staffPro.length > 0) {
                staff = await Models.staff.get(staffPro[0].staffId)
            }
            if (!staff) {
                throw L.ERR.UNAUTHORIZED()
            }
            logger.info(`网信自动登录，uuid: ${userCode}, accountId: ${staff.accountId}`)
            return await API.auth.makeAuthenticateToken(staff.accountId, "wangxin")
        } else {
            throw L.ERR.COMPANY_NOT_EXIST();
        }
    }

    /*
    *  同步组织架构
    */
    @clientExport
    static async syncOrganization(){
        console.info("同步网信通讯录begin================================");
        let sysCode = C.wxSysCode;
        let name = "网信演示企业";
        if(sysCode){
            let company: Company;
            let wangXinApi = new WangXinApi(sysCode);
            let wxDepartment = await wangXinApi.getDepartments("0");

            let com = await Models.company.find({where: {name: name}});
            if(com && com.length){
                if(wxDepartment && wxDepartment.length){
                    company = com[0];
                }

            }else{
                let wxSuperAdmin = await wangXinApi.getUserById("91484");
                if(wxDepartment && wxDepartment.length && wxSuperAdmin){
                    let mobile = wxSuperAdmin.tel || wxSuperAdmin.phone;
                    let userName = wxSuperAdmin.name;
                    let pwd = "000000";
                    let result = await API.company.registerCompany({mobile, name, pwd, userName});
                    company = result.company;
                    let companyProperty = CompanyProperty.create({ companyId: company.id, type: CPropertyType.WANGXIN_ID, value: `WX_${company.id}` });
                    await companyProperty.save();
                }
            }
            for(let item of wxDepartment){
                let pid = item.pid;
                let wxDept = new WangxDepartment({name: item.name, parentId: item.pid, id: item.id, company: company, wangXinApi: wangXinApi});
                await wxDept.sync({company: company});
            }
            console.info("同步网信通讯录end================================");
            return true;
        }
        console.info("同步网信通讯录end2222222================================");
        return false;
    }

}