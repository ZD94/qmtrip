import { Sequelize, Transaction } from 'sequelize';
import {EAccountType} from '_types';
var sequelize = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction) {
    let accounts = await DB.query(`select * from auth.accounts where type = ${EAccountType.STAFF} and deleted_at is null`, {type: sequelize.QueryTypes.SELECT});
    
    await Promise.all(accounts.map(async (account) => {
        let isExist = await DB.query(`select id from staff.staffs where account_id = '${account.id}' and deleted_at is null`, {type: sequelize.QueryTypes.SELECT});
        if (isExist) {} 
        else {
            await DB.query(`delete from auth.accounts where id = '${account.id}'`);
        }
    }));


    let companies = await DB.query(`select * from company.companies where deleted_at is null`, 
        {type: sequelize.QueryTypes.SELECT});

    await Promise.all(companies.map(async (company) => {
        if (company.referrer_ID) {
            let referrerId = company.referrer_ID;
            let account = await DB.query(`select * from auth.accounts where id = '${referrerId}'`, 
                {type: sequelize.QueryTypes.SELECT});
            if (account) {} 
            else {
                await DB.query(`update company.companies set referrer_id = null where referrer_id = '${referrerId}'`);
            }
        } 
        else {} 
    }));


}