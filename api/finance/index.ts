/**
 * Created by wlh on 2016/10/11.
 */

'use strict';
import {clientExport, requireParams} from "common/api/helper";
import {Models} from "../_types/index";
import {TripDetail, TripPlan} from "../_types/tripPlan";
import {PaginateInterface} from "common/model/interface";
const L = require("common/language");

class FinanceModule {

    static __public: boolean = true;

    @clientExport
    @requireParams(["tripPlanId", "code"])
    static async getTripPlan(params: {tripPlanId: string, code: string}) :Promise<TripPlan> {
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        return await Models.tripPlan.get(tripPlanId);
    }

    @clientExport
    @requireParams(['tripPlanId', 'code'])
    static async getTripDetails(params: {tripPlanId: string, code: string }) :Promise<PaginateInterface<TripDetail>>{
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        return tripPlan.getTripDetails({order: [["created_at", "asc"]]});
    }

    @clientExport
    @requireParams(['tripPlanId', 'code'])
    static async getTripPlanStaff(params: {tripPlanId: string, code: string}) :Promise<any> {
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        let staff = await Models.staff.get(tripPlan.account.id);
        return {id: staff.id, name: staff.name, mobile: staff.mobile, email: staff.email};
    }

}

async function isValidCode(tripPlanId, code) {
    let rows = await Models.financeCheckCode.find({where: { tripPlanId: tripPlanId, code: code, isValid: true}});
    if (rows && rows.length) return true;
    return false;
}

export= FinanceModule;