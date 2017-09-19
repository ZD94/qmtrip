/*
 * Created by Jack on 2017/9/19.
 */
'use strict';
import Sequelize = require('sequelize');
import config = require('@jingli/config');

export = async function(db, transaction) {

    let budgetUrl = null;
    if(/[lt]\.jingli365\.com.+\/times/.test(config.postgres.url)) {
        budgetUrl = 'postgres://times:time0418@l.jingli365.com:15432/jlbudget';
    } else if(/[lt]\.jingli365\.com.+\/time_test/.test(config.postgres.url)){
        budgetUrl = 'postgres://times:time0418@l.jingli365.com:15432/t_jlbudget';
    } else if(/.+j.jingli365.com.+\/qmtrip/.test(config.postgres.url)) {
        budgetUrl = 'postgres://jingli:J1n9L1.t3ch@j.jingli365.com:5432/jlbudget';
    } 
    console.log(budgetUrl)
    if(!budgetUrl) return null;
    let db2 = new Sequelize(budgetUrl);

    let companySql  = 'select * from company.companies where deleted_at is null';
    let companies = await db.query(companySql, {type: Sequelize.QueryTypes.SELECT});
    console.log("companies'length: ", companies.length)
    let count = 0;
    for(let i =0; i < companies.length; i++ ){
        if(!companies[i].id || typeof(companies[i]) == undefined) continue;
        let isEmpty = await db.query(`select count(*) as total from staff.staffs where 
                                      company_id = '${companies[i].id}' and travel_policy_id is null and 
                                      deleted_at is null;`, {type: Sequelize.QueryTypes.SELECT});
         if(!isEmpty || isEmpty.length == 0 || !isEmpty[0].total || isEmpty[0].total == 0) continue;

        let defaultTravelPolicySql = `select * from travel_policy.travel_policies where 
                                      company_id = '${companies[i].id}' and  deleted_at is null;`;

        let defaultTravelPolicy = await db2.query(defaultTravelPolicySql, {type: Sequelize.QueryTypes.SELECT});

        if(defaultTravelPolicy && defaultTravelPolicy.length) {
            let updateStaff = `update staff.staffs set travel_policy_id = '${defaultTravelPolicy[0].id}', updated_at = now() 
                               where company_id = '${companies[i].id}' and travel_policy_id is null;`;
            try{
                await db.query(updateStaff, {transaction: transaction});
            } catch(err) {
                if(err) {
                   await transaction.rollback();
                }
            }
        }
    }
}
