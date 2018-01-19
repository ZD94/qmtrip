
import { Sequelize, Transaction } from 'sequelize';
import { Approve, EApproveStatus } from '_types/approve';
import { ERejectApproveTypes } from '_types/tripApprove';
import { QMEApproveStatus } from '_types/tripPlan';
const config = require("@jingli/config");
var sequelize = require("sequelize");
var uuid = require("uuid");
/**
 * @method 更新qmtrip项目的approve表单和tripApprove项目的tripApprove
 *    表单的驳回状态不统一的问题： 即，
 *      1. tripApprove执行按照审批时间驳回，approve的状态为同步更新，为等待
 *      2. approve的状态为同步更新，为等待
 * @param DB 
 * @param t 
 */
export default async function update(DB: Sequelize, t: Transaction){

    let postgresUrl = config.JLApproveSystem.postgresUrl;
    if(!postgresUrl) return;
    let db2 = new sequelize(postgresUrl);

    let approves = await DB.query(`select * from approve.approves where deleted_at is null;`, {type: sequelize.QueryTypes.SELECT})
    await Promise.all(approves.map(async (approve: Approve) => {
        let tripApprove = await db2.query(`select * from trip_plan.trip_approves where id = '${approve.id}' and deleted_at is null;`, {type: sequelize.QueryTypes.SELECT})
        if(tripApprove && tripApprove.length) {
            if(approve.status == EApproveStatus.FAIL) {
                if(tripApprove[0].status != QMEApproveStatus.REJECT) {
                    await db2.query(`update trip_plan.trip_approves set status = ${QMEApproveStatus.REJECT} where id = '${approve.id}'`);
                    let tripPlanLog = await DB.query(`select * from trip_plan.trip_plan_logs where trip_plan_id = '${approve.id}';`, {type: sequelize.QueryTypes.SELECT})
                    if(!tripPlanLog || tripPlanLog.length == 0) {
                        await DB.query(`insert into trip_plan.trip_plan_logs(id, trip_plan_id, user_id, remark, created_at, updated_at, approve_status) 
                        values('${uuid.v1()}', '${approve.id}', '${approve.submitter}', '手动处理问题数据，驳回审批单', now(), now(), -1);`)
                    }                                                                                                                                                        
                }

            }
            if(tripApprove[0].status == QMEApproveStatus.REJECT ) {
                if(approve.status != EApproveStatus.FAIL) {
                    await DB.query(`update approve.approves set status = ${EApproveStatus.FAIL} where id = '${approve.id}'`);
                    await DB.query(`insert into trip_plan.trip_plan_logs(id, trip_plan_id, user_id, remark, created_at, updated_at, approve_status) 
                           values('${uuid.v1()}', '${approve.id}', '${approve.submitter}', '手动处理问题数据，驳回审批单', now(), now(), -1);`)
                }
            }

            if(tripApprove[0].status == QMEApproveStatus.PASS ) {
                if(approve.status == EApproveStatus.WAIT_APPROVE) {
                    await DB.query(`update approve.approves set status = ${EApproveStatus.FAIL} where id = '${approve.id}';`);
                    await DB.query(`update trip_plan.trip_approves set status = ${QMEApproveStatus.REJECT} where id = '${approve.id}';`);
                    await DB.query(`insert into trip_plan.trip_plan_logs(id, trip_plan_id, user_id, remark, created_at, updated_at, approve_status) 
                           values('${uuid.v1()}', '${approve.id}', '${approve.submitter}', '手动处理问题数据，驳回审批单', now(), now(), -1);`);              
                }
            }
        }
    }))
}
