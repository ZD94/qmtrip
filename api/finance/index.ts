/**
 * Created by wlh on 2016/10/11.
 */

'use strict';
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import {Models} from "_types/index";
import {TripDetail, TripPlan} from "_types/tripPlan";
const L = require("@jingli/language");

class FinanceModule {

    static __public: boolean = true;

    @clientExport
    @requireParams(["tripPlanId", "code"])
    static async getTripPlan(params: {tripPlanId: string, code: string}): Promise<TripPlan | null> {
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        return await Models.tripPlan.get(tripPlanId);
    }

    @clientExport
    @requireParams(['tripPlanId', 'code'])
    static async getTripDetails(params: {tripPlanId: string, code: string }) :Promise<TripDetail[]>{
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        if (!tripPlan) return []
        let tripDetails = await Models.tripDetail.find({
            where: {tripPlanId: tripPlan.id},
            order: [["created_at", "asc"]]
        });
        return Array.from(tripDetails);
    }

    @clientExport
    @requireParams(['tripPlanId', 'code'])
    static async getTripPlanStaff(params: {tripPlanId: string, code: string}) :Promise<any> {
        let {tripPlanId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        if (!tripPlan) throw new Error('tripPlan is null')
        let staff = await Models.staff.get(tripPlan.account.id);
        if (!staff) throw new Error('staff is null')
        return {id: staff.id, name: staff.name, mobile: staff.mobile, email: staff.email};
    }

    @clientExport
    @requireParams(['tripPlanId', 'code', 'tripDetailId'])
    static async getTripDetail(params: {tripPlanId: string, tripDetailId: string, code: string}) {
        let {tripPlanId, tripDetailId, code} = params;
        if (!isValidCode(tripPlanId, code)) {
            throw L.ERR.PERMISSION_DENY();
        }
        let tripDetail = await Models.tripDetail.get(tripDetailId, {notRetChild: true});
        if (tripDetail && tripDetail.tripPlanId != tripPlanId) {
            throw L.ERR.PERMISSION_DENY();
        }
        return tripDetail;
    }

}

async function isValidCode(tripPlanId: string, code: string) {
    let rows = await Models.financeCheckCode.find({where: { tripPlanId: tripPlanId, code: code, isValid: true}});
    if (rows && rows.length) return true;
    return false;
}

export= FinanceModule;