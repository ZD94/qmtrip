import { Sequelize, Transaction } from 'sequelize';
var SEQUELIZE = require("sequelize");
var transliteration = require('transliteration');

export default async function update(DB: Sequelize, t: Transaction) {

    await dealData(DB, t);
}


let page = -1, num = 0;
async function dealData(DB: Sequelize, t: Transaction) {
    page++;
    let allCorpSql = `select * from staff.staffs where deleted_at is null order by created_at desc limit 20 offset ${page * 20};`;
    let allCorps = await DB.query(allCorpSql, { type: SEQUELIZE.QueryTypes.SELECT });
    for (let item of allCorps) {
        let name = item.name;
        let pinyin = '';
        let letter = '';
        if(name){
            let _pinyin = transliteration.transliterate(name);
            if(_pinyin){
                pinyin = _pinyin.toLowerCase().replace(/\s/g, "");
                let _letter = _pinyin.match(/[A-Z]/g);
                if(_letter){
                    _letter = _letter.join('');
                    letter = _letter.toLowerCase();
                }
            }
        }
        console.log(`********= staff.staffs ${num++} =====>`, item.id);
        let sql = `update staff.staffs set pinyin = '${pinyin}', letter = '${letter}' where id = '${item.id}'`;
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