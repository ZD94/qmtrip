


import { Sequelize, Transaction } from 'sequelize';
var sequelize = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction){
    let tripPlanSql = `select * from trip_plan.trip_plans where deleted_at is null;`
    // await DB.query(sql, {transaction: t});

    
}
