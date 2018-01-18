


import { Sequelize, Transaction } from 'sequelize';
import { TripPlan } from '_types/tripPlan';

var sequelize = require("sequelize");

//老版的tripPlanStatus
enum EOldPlanStatus {
    CANCEL = -4,            //出差计划撤销状态
    AUDIT_NOT_PASS = -3,    //票据未审核通过
    NO_BUDGET = -1,         //没有预算
    WAIT_UPLOAD = 1,        //待上传票据
    WAIT_COMMIT = 2,        //待提交状态
    AUDITING = 3,           //已提交待审核状态
    COMPLETE = 4            //审核完，已完成状态
}

//老版的auditStatus
enum EOldAuditStatus {
    INVOICE_NOT_PASS = -2,  //票据未审核通过
    NOT_PASS = -1,          //审批未通过
    AUDITING = 0,           //审批中
    PASS = 1,               //审批通过，待审核
    INVOICE_PASS = 2,       //票据审核通过
}
export default async function update(DB: Sequelize, t: Transaction){
    let tripPlanSql = `select * from trip_plan.trip_plans where deleted_at is null;`
    let tripPlans = await DB.query(tripPlanSql, {type: sequelize.QueryTypes.SELECT});
    let updateSql: string;
    await Promise.all(tripPlans.map(async (tripPlan: TripPlan) => {
        let status = tripPlan.status;
        let auditStatus = tripPlan.auditStatus;
        switch(status) {
            case -4:  //EOldPlanStatus.CANCEL: 
            case 4:   //EOldPlanStatus.COMPLETE
               break;
            case -3:  //EOldPlanStatus.AUDIT_NOT_PASS
                updateSql = `update trip_plan.trip_plans set `;
                let backAt: string =  tripPlan.backAt.toString();
                if(Date.now() - Date.parse(backAt) > 0) {
                    
                    
                }
                updateSql = '';
                break;
            case -1:  //EOldPlanStatus.NO_BUDGET
                break;
            case 0:   //EOldPlanStatus.WAIT_UPLOAD
                break;
            case 1:   //EOldPlanStatus.WAIT_UPLOAD
                break;
            case 2:   //EOldPlanStatus.WAIT_COMMIT
                break;
            case 3:   //EOldPlanStatus.AUDITING
                break;

        }
    }));


}


