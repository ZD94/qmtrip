let uid = require("uuid");

module.exports =async function(DB, t) {
    let sql = `select * from auth.accounts where coin_account_id in (select coin_account_id from company.companies) order by created_at desc`;
    let accounts = await DB.query(sql);
    if(accounts){
        accounts = accounts[0];
    }

    await Promise.all(accounts.map(async (item) => {
        let sql1 = `select * from coin.coin_accounts where id = '${item.coin_account_id}'`;
        let old_obj = await DB.query(sql1);
        if(old_obj){
            old_obj = old_obj[0][0]
        }
        let id = uid.v1();
        let sql2 = `INSERT INTO coin.coin_accounts(
            id, income, consume, locks, is_allow_over_cost, created_at, updated_at)
            VALUES ('${id}', ${old_obj.income}, ${old_obj.consume}, ${old_obj.locks}, ${old_obj.is_allow_over_cost}, now(), now());
            update auth.accounts set coin_account_id = '${id}' where id = '${item.id}';`;
        await DB.query(sql2);

        let sql3 = `select * from coin.coin_account_changes where coin_account_id = '${item.coin_account_id}'`;
        let old_changes = await DB.query(sql3);

        if(old_changes){
            old_changes = old_changes[0];
        }

        if(old_changes && old_changes.length){
            await Promise.all(old_changes.map(async (ch) => {
                let sql4 = `select * from coin.coin_account_changes where id = '${ch.id}'`;
                let old_ch = await DB.query(sql4);

                if(old_ch){
                    old_ch = old_ch[0][0];
                }

                let dui_ba_order_num = old_ch.dui_ba_order_num || null;
                let sql5 = `INSERT INTO coin.coin_account_changes(
                    id, coin_account_id, type, coins, remark, created_at, updated_at, 
                    dui_ba_order_num, order_num)
                    VALUES ('${uid.v1()}', '${id}', ${old_ch.type}, ${old_ch.coins}, '${old_ch.remark}', now(), now(), 
                    '${dui_ba_order_num}', '${old_ch.order_num}');`;

                await DB.query(sql5);

            }))
        }

    }))
}