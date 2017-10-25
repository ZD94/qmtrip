import { Sequelize, Transaction } from 'sequelize';
var SEQUELIZE = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction){

    let allCorpSql = `select * from company.companies where deleted_at is null;`;
    let allCorps = await DB.query(allCorpSql, {type: SEQUELIZE.QueryTypes.SELECT});
    for(let i =0; i < allCorps.length; i++) {
        let creatorsSql = `select * from staff.staffs where deleted_at is null and role_id = 0 and company_id = '${allCorps[i].id}'`;
        let creators = await DB.query(creatorsSql, {type: SEQUELIZE.QueryTypes.SELECT});
        let allCreatorIds = [];
        for(let j = 0; creators && j < creators.length; j++){
            allCreatorIds.push(creators[j].id);
        }

        if(allCreatorIds.indexOf(allCorps[i]['create_user']) < 0){
            let updateSql = `update company.companies set create_user = '${allCreatorIds[0]}' where id = '${allCorps[i].id}';`;
            await DB.query(updateSql, {transaction: t});
        }
    }
}