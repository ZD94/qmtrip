/*
 * @Author: Mr.He 
 * @Date: 2018-01-26 16:02:29 
 * @Last Modified by: Mr.He
 * @Last Modified time: 2018-01-27 16:55:50
 * @content what is the content of this file. */

import { Sequelize, Transaction } from 'sequelize';
var SEQUELIZE = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction) {

    await dealData(DB, t);
}


let page = -1, num = 0;
async function dealData(DB: Sequelize, t: Transaction) {
    page++;
    let tripPlanSql = `select * from trip_plan.trip_plans where deleted_at is null order by created_at desc limit 20 offset ${page * 20};`;
    let tripPlans = await DB.query(tripPlanSql, { type: SEQUELIZE.QueryTypes.SELECT });
    for (let item of tripPlans) {
        let tripDetailsSql = `select * from trip_plan.trip_details where trip_plan_id = '${item.id}'`;
        let tripDetails = await DB.query(tripDetailsSql, { type: SEQUELIZE.QueryTypes.SELECT });
        let traffics = [], hotels = [], subsidys = [];
        for (let tripDetail of tripDetails) {
            if (!tripDetail.budget_info) {
                continue;
            }

            if (typeof tripDetail.budget_info == "string") {
                tripDetail.budget_info = JSON.parse(tripDetail.budget_info);
            }
            if (tripDetail.budget_info.index) {
                console.log("break");
                break;
            }
            switch (tripDetail.budget_info.type) {
                case 0:
                case 1:
                    traffics.push(tripDetail);
                    break;
                case 2:
                    hotels.push(tripDetail);
                    break;
                case 3:
                    subsidys.push(tripDetail);
            }
        }

        sortFn(traffics, "arrivalTime");
        sortFn(hotels, "checkInDate");
        sortFn(subsidys, "fromDate");

        let mostLen = traffics.length > hotels.length ? traffics : hotels;
        if (!mostLen.length) {
            continue;
        }
        for (let i = 0; i < mostLen.length; i++) {
            if (traffics[i]) {
                traffics[i].budget_info.index = i;
                await updateTripDetail(traffics[i], DB);
            }
            if (hotels[i]) {
                hotels[i].budget_info.index = i;
                await updateTripDetail(hotels[i], DB);
            }
            if (subsidys[i]) {
                subsidys[i].budget_info.index = i;
                await updateTripDetail(subsidys[i], DB);
            }
        }
    }

    if (tripPlans.length < 20) {
        return false;
    } else {
        await dealData(DB, t);
    }
}


async function updateTripDetail(tripDetail, DB) {
    let sql = `update trip_plan.trip_details set budget_info = '${JSON.stringify(tripDetail.budget_info)}' where id = '${tripDetail.id}'`;
    await DB.query(sql, { type: SEQUELIZE.QueryTypes.SELECT });
    console.log(`**********= ${num++} ==== update tripDetail ===>`, tripDetail.id);
}

function sortFn(arr, attribute) {
    return arr.sort((a, b) => {
        if (a[attribute] == b[attribute]) {
            return 0;
        }
        return a[attribute] < b[attribute] ? -1 : 1
    });
}