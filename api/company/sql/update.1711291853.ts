import { Sequelize, Transaction } from 'sequelize';
import uuid = require("node-uuid");
var C = require("@jingli/config");

export default async function update(DB: Sequelize, t: Transaction){

    let approveServerUrl = C.approveServerUrl;
    approveServerUrl = approveServerUrl + `/tripApprove/receive`;
    let allCorpSql = `select * from company.companies where deleted_at is null;`;
    await DB.query(allCorpSql).then(async (allCorp)=> {
        let corps = allCorp[0];
        if(corps && corps.length){
            await Promise.all(corps.map(async (corp)=>{
                let insertSql = ` INSERT INTO "event"."event_listeners" ("id","url","events","method","company_id","created_at","updated_at")
         VALUES ('${uuid.v1()}','${approveServerUrl}',
         '["NEW_TRIP_APPROVE","TRIP_APPROVE_UPDATE","TRIP_APPROVE_CHANGE","TRIP_APPROVE_CANCLE"]','post','${corp.id}',now(),now())`;
                await DB.query(insertSql);
            }));
        }
    });
}