/*
 * @Author: Mr.He 
 * @Date: 2018-01-26 16:02:29 
 * @Last Modified by: Mr.He
 * @Last Modified time: 2018-01-26 17:48:15
 * @content what is the content of this file. */

import { Sequelize, Transaction } from 'sequelize';
var SEQUELIZE = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction) {

    await dealData(DB, t);
}


let page = -1, num = 0;
async function dealData(DB: Sequelize, t: Transaction) {
    page++;
    let allCorpSql = `select * from approve.approves where deleted_at is null order by created_at desc limit 20 offset ${page * 20};`;
    let allCorps = await DB.query(allCorpSql, { type: SEQUELIZE.QueryTypes.SELECT });
    for (let item of allCorps) {
        if (typeof item.data == "string") {
            item.data = JSON.parse(item.data);
        }

        if (!item.data || !item.data.budgets || !item.data.budgets.length) {
            continue;
        }

        let theIndex = -1;
        for (let budget of item.data.budgets) {
            delete budget.markedScoreData;
            delete budget.prefers;
            if (budget.index) {
                continue;
            }

            if (budget.type == 1 || budget.type == 0) {
                theIndex++;
            }
            budget.index = theIndex;
        }
        console.log(`********= approve.approves ${num++} =====>`, item.id);
        let sql = `update approve.approves set data = '${JSON.stringify(item.data)}' where id = '${item.id}'`;
        try {
            await DB.query(sql, { type: SEQUELIZE.QueryTypes.SELECT });
        } catch (e) {
            console.log("update error !!! ====>", item.id);
        }

    }

    if (allCorps.length < 20) {
        return false;
    } else {
        await dealData(DB, t);
    }
}