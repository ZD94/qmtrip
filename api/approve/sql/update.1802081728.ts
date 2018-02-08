import {Sequelize, Transaction} from 'sequelize';
var SEQUELIZE = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction) {
    await dealData(DB, t);
}

async function dealData(DB: Sequelize, t: Transaction) {
    let approveSql = `select * from approve.approves where deleted_at is null`;
    let approves = await DB.query(approveSql, {type: SEQUELIZE.QueryTypes.SELECT});
    for (let i = 0; i < approves.length; i++) {
        let data = approves[i].data;
        if (data && data.query && data.query.destinationPlacesInfo) {
            let leaveDate = data.query.destinationPlacesInfo[0].leaveDate;
            let approveId = approves[i].id;
            let updateSql = `update approve.approves set start_at = '${leaveDate}' where id = '${approveId}'`
            try {
                await DB.query(updateSql);
            } catch(err) {
                console.log("update error startAt====>", approveId);
                throw err;
            }
        }
    }
}

