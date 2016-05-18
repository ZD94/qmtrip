/**
 * Created by wyl on 15-12-10.
 */
'use strict';

/**
 * @module API
 */

let Q = require("q");
let API = require("common/api");
let auth = require("../auth");
let L = require("common/language");
import {Staff, Credential, PointChange} from "api/_types/staff";

/**
 * @class staff 员工信息
 */
class ApiStaff {

    /**
     * @method getCurrentStaff
     *
     * 得到当前登录员工信息
     * @returns {*}
     */
    static async getCurrentStaff(){
        let self: any = this;
        return API.staff.getStaff({id: self.accountId});
    }


    /**
     * @method increaseStaffPoint
     *
     * 增加员工积分
     * @type {*|Function}
     */
    static async increaseStaffPoint(params){
        params.accountId = this["accountId"];//当前登录代理商id
        let user_id = this["accountId"];
        let staffId = params.id;//加积分的员工id

        let staff = await API.staff.getStaff({id: staffId});
        let agencyUser = await API.agency.getAgencyUser({id: this["accountId"]});

        if(!staff.companyId){
            throw {msg:"该员工不存在或员工所在企业不存在"};
        }
        params.companyId = staff.companyId;
        let company = await API.company.getCompany({companyId: staff.companyId});
        let agency = API.agency.getAgency({agencyId: agencyUser.agencyId});
        // return API.staff.increaseStaffPoint(params);
        if(!company.agencyId){
            throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
         }
         if(company.gencyId == agency.id){
            return API.staff.increaseStaffPoint(params);
         }else{
            throw {msg:"无权限"};
         }

    };

    /**
     * @method decreaseStaffPoint
     *
     * 减少员工积分
     * @type {*|Function}
     */
    static async decreaseStaffPoint(params){
        params.accountId = this["accountId"];//当前登录代理商id
        let user_id = this["accountId"];
        let staffId = params.id;//加积分的员工id
        let staff = await API.staff.getStaff({id: staffId});
        let agencyUser = await API.agency.getAgencyUser({id: this["accountId"]});
        if(!staff.companyId){
            throw {msg:"该员工不存在或员工所在企业不存在"};
        }
        params.companyId = staff.companyId;
        let company = await API.company.getCompany({companyId: staff.companyId});
        let agency = await API.agency.getAgency({agencyId: agencyUser.agencyId});
        // return API.staff.decreaseStaffPoint(params);
        if(!company.agencyId){
            throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
         }
         if(company.agencyId == agency.id){
            return API.staff.decreaseStaffPoint(params);
         }else{
            throw {msg:"无权限"};
         }
    };





    /*************************证件信息API begin*************************/

    /**
     * @method getCurrentUserPapers
     *
     * 根据ownerId得到证件信息
     *
     * @returns {*|Promise}
     */
    static async getCurrentUserPapers(): Promise<Credential[]>{
        let user_id = this["accountId"];
        return API.staff.getPapersByOwner({ownerId: user_id});
    };

}

export= ApiStaff;


