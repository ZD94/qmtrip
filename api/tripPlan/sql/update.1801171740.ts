


import { Sequelize, Transaction } from 'sequelize';
import { TripPlan, TripDetail } from '_types/tripPlan';

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
        let tripDetailSql = `select * from trip_plan.trip_details where trip_plan_id = '${tripPlan.id}'`;
        let tripDetails = await DB.query(tripDetailSql, {type: sequelize.QueryTypes.SELECT});
        let reservedExists = false;
        let hasReservedSucessfully = false;
        let waitBookedTripDetails = 0;
        await Promise.all(tripDetails.map(async (tripDetail: TripDetail) => {
            if(tripDetail.reserveStatus != null && tripDetail.reserveStatus > -1) { //存在有预定行为的订单
                reservedExists = true;
            }
            if(tripDetail.reserveStatus != null && tripDetail.reserveStatus >= 2) { //存在成功预定的订单
                hasReservedSucessfully = true;
            }
            if(tripDetail.reserveStatus == null || tripDetail.reserveStatus == -3) {
                waitBookedTripDetails ++;
            }
        }));
         
        switch(status) {
            case -4:  //EOldPlanStatus.CANCEL: 
                updateSql = `update trip_plan.trip_plans set status = -4 where id = '${tripPlan.id}';` ;//行程单为撤销， 报销单保持不变
                await DB.query(updateSql);
                await Promise.all(tripDetails.map(async (tdetail: TripDetail) => {
                    updateSql = `update trip_plan.trip_details set status = -4, reserve_status = -3  where id = '${tdetail.id}';` ;//取消， 待预定
                    await DB.query(updateSql);
                }))
                updateSql = `` ;//行程单为失效， 报销单为待提交状态
                break;
            case -3:  //EOldPlanStatus.AUDIT_NOT_PASS
                updateSql = `update trip_plan.trip_plans set status = 7, "audit_status" = -2 where id = '${tripPlan.id}' `; // 行程设置为失效，报销设置为不通过
                await DB.query(updateSql);
                updateSql = `update trip_plan.trip_details set "reserve_status" = -3  where trip_plan_id = '${tripPlan.id}'`;
                await DB.query(updateSql);
                updateSql = '';
                break;
            case -1:  //EOldPlanStatus.NO_BUDGET
                break;
            case 0:   //EOldPlanStatus.WAIT_APPROVE
                break;
            case 1:   //EOldPlanStatus.WAIT_UPLOAD
                if(!reservedExists) {  //未预定，
                    if(tripPlan.backAt < new Date()) {   //未预定，且超时，设置为报销单
                        updateSql = `update trip_plan.trip_plans set status = 7, "audit_status" = 3 where id = '${tripPlan.id}';`; //更新失效，待上传, 
                        await DB.query(updateSql);
                        updateSql = `update trip_plan.trip_details set reserve_status = -3 where trip_plan_id = '${tripPlan.id}'`; //未预定，tripDetail的reserveStatus设置未待预定，status维持报销单状态不变，
                        await DB.query(updateSql);
                        updateSql = '';
                    } else { ////未预定，未超时，设置为待预定
                        updateSql = `update trip_plan.trip_plans set status = 5, "audit_status" = -4 where id = '${tripPlan.id}';`;
                        await DB.query(updateSql);
                        updateSql = `update trip_plan.trip_details set status = 6, reserve_status = -3 where trip_plan_id = '${tripPlan.id}'`; //未预定，tripDetail的reserveStatus设置未待预定，status为待预定，
                        await DB.query(updateSql);
                        updateSql = '';
                    }

                }
                if(reservedExists) { //存在预定
                    if(hasReservedSucessfully){ //存在预定成功
                        // if(tripPlan.backAt > new Date()) {   //未预定，未超时，设置为待预定
                        updateSql = `update trip_plan.trip_plans set status = 6, "audit_status" = -4 where id = '${tripPlan.id}';`; //更新为已预定，无需审核
                        await DB.query(updateSql);
                        await Promise.all(tripDetails.for(async (tdetail: TripDetail) => {
                            let updateDetailSql: string;
                            if(tdetail.reserveStatus == 2 || tdetail.reserveStatus == 8 || tdetail.reserveStatus == 9) {
                                updateDetailSql = `update trip_plan.trip_details set status = 4  where id = '${tdetail.id}';`; //设置为完成，出票成功
                                await DB.query(updateDetailSql);
                            } else if(tdetail.reserveStatus >= 0) {
                                updateDetailSql = `update trip_plan.trip_details set status = 6  where id = '${tdetail.id}';`; //设置待预定 
                                await DB.query(updateDetailSql);     
                            } else if(tdetail.reserveStatus == -3 || tdetail.reserveStatus == -1) {
                                updateDetailSql = `update trip_plan.trip_details set status = 6  where id = '${tdetail.id}';`; //设置待预定 
                                await DB.query(updateDetailSql);     
                            }        
                        }));

                        if(waitBookedTripDetails < tripDetails.length) { //全为待预定， 设置为待上传
                            updateSql = `update trip_plan.trip_plans set "audit_status" = 3  where id = '${tripPlan.id}';`; //更新为已预定，带上传票据
                            await DB.query(updateSql);
                        }
                        updateSql = '';

                    }
                    if(!hasReservedSucessfully) { //不存在预定成功
                        if(tripPlan.backAt > new Date()) {   //未预定，未超时，设置为待预定
                            updateSql = `update trip_plan.trip_plans set status = 6, "audit_status" = -4 where id = '${tripPlan.id}';`; //更新为已预定，无需审核
                            await DB.query(updateSql);
                        } else { //未预定，已超时，设置为待传票
                            updateSql = `update trip_plan.trip_plans set status = 7, "audit_status" = 3 where id = '${tripPlan.id}';`; //更新为已预定，无需审核
                            await DB.query(updateSql);
                            await Promise.all(tripDetails.for(async (tdetail: TripDetail) => {
                                let updateDetailSql: string;
                                if(tdetail.reserveStatus == null) {
                                    updateDetailSql = `update trip_plan.trip_details set reserve_status = -3 where id = '${tdetail.id}';`; //设置为完成，待预定
                                    await DB.query(updateDetailSql);
                                } else if(tdetail.reserveStatus == 2 || tdetail.reserveStatus == 8 || tdetail.reserveStatus == 9) {
                                    updateDetailSql = `update trip_plan.trip_details set status = 4  where id = '${tdetail.id}';`; //设置为完成，出票成功
                                    await DB.query(updateDetailSql);
                                } else if(tdetail.reserveStatus >= 0) {
                                    updateDetailSql = `update trip_plan.trip_details set status = 6  where id = '${tdetail.id}';`; //设置待预定 
                                    await DB.query(updateDetailSql);     
                                } else if(tdetail.reserveStatus == -3 || tdetail.reserveStatus == -1) {
                                    updateDetailSql = `update trip_plan.trip_details set status = 6  where id = '${tdetail.id}';`; //设置待预定 
                                    await DB.query(updateDetailSql);     
                                }     
                            }));     
                        }
                    }
                }
                break;
            case 2:   //EOldPlanStatus.WAIT_COMMIT
                updateSql = `update trip_plan.trip_plans set status = 7, audit_status = 4  where id = '${tripPlan.id}';` ;//行程单为失效， 报销单为待提交状态
                await DB.query(updateSql);
                await Promise.all(tripDetails.map(async (tdetail: TripDetail) => {
                    updateSql = `update trip_plan.trip_details set reserve_status = -3  where id = '${tdetail.id}';` ;//待预定
                    await DB.query(updateSql);
                }))
                updateSql = `` ;//行程单为失效， 报销单为待提交状态
                break;
            case 3:   //EOldPlanStatus.AUDITING
                updateSql = `update trip_plan.trip_plans set status = 7, audit_status = 0  where id = '${tripPlan.id}';` ;//行程单为失效， 报销单为待审核状态
                await DB.query(updateSql);
                await Promise.all(tripDetails.map(async (tdetail: TripDetail) => {
                    updateSql = `update trip_plan.trip_details set reserve_status = -3  where id = '${tdetail.id}';` ;//待预定
                    await DB.query(updateSql);
                }))
                updateSql = `` ;//行程单为失效， 报销单为待提交状态
                break;
            case 4: 
                updateSql = `update trip_plan.trip_plans set status = 7, audit_status = -2  where id = '${tripPlan.id}';` ;//行程单为失效， 报销单为完成状态
                await DB.query(updateSql);
                await Promise.all(tripDetails.map(async (tdetail: TripDetail) => {
                    updateSql = `update trip_plan.trip_details set reserve_status = -3  where id = '${tdetail.id}';` ;//待预定
                    await DB.query(updateSql);
                }))
                updateSql = `` ;//行程单为失效， 报销单为待提交状态
                break;
        }
    }));


}


