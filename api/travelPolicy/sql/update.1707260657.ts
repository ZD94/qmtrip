"use strict";
import { Sequelize,Transaction } from 'sequelize';
var _=require("lodash");
var uuid=require("uuid");
var moment=require("moment");
var moment=require("moment");


export default async function update(DB: Sequelize, t: Transaction){

    var querySql='select * from travel_policy.travel_policy_regions order by created_at desc';
    let [children] = await DB.query(querySql) as any[];
    console.log("totle length: ", children.length);
    for(var i=0; i < children.length; i++){
        console.log(i, " times");
        let getTp  = `select * from travel_policy.travel_policies where id = '${children[i].travel_policy_id}';`;
        let [travelPolicy] = await DB.query(getTp) as any[];
        let companyid:any;
        if(travelPolicy && travelPolicy.length == 1){
            if(travelPolicy[0].company_id && typeof(travelPolicy[0].company_id) !='undefined'){
                companyid = `'${travelPolicy[0].company_id}'`;
            }else {
                companyid = null;
            }
        } else if(travelPolicy && travelPolicy.length == 0){
            companyid = null;
        } else {
            companyid = null;
        }

        let createRegionSql:string;
        let regionid = uuid.v1();

        let updateTpr:string;
        if(children[i].region_id == 'CTW_5'){
            let [isExists] = await DB.query(`select * from travel_policy.company_regions where company_id = ${companyid} and name ='国内';`);
            if(isExists && isExists.length > 0){
                updateTpr = `update travel_policy.travel_policy_regions set company_region_id = '${isExists[0].id}' where id = '${children[i].id}';`;
                console.log("updateTpr: ", updateTpr, "times: ", i);
                await DB.query(updateTpr);
                continue;
            }
            createRegionSql = `insert into travel_policy.company_regions(id, name, company_id,created_at, updated_at) values('${regionid}','国内', ${companyid},now(),now());`
        } else {
            let [isExists] = await DB.query(`select * from travel_policy.company_regions where company_id = ${companyid} and name ='国际';`);
            if(isExists && isExists.length > 0){
                updateTpr = `update travel_policy.travel_policy_regions set company_region_id = '${isExists[0].id}' where id = '${children[i].id}';`;
                console.log("updateTpr: ", updateTpr, "times: ", i);
                await DB.query(updateTpr);
                continue;
            }
            createRegionSql = `insert into travel_policy.company_regions(id, name, company_id,created_at, updated_at) values('${regionid}','国际', ${companyid},now(),now());`

        }
        await DB.query(createRegionSql);


        let regionPlaceId = uuid.v1();
        let createRegionPlaceSql = `insert into travel_policy.region_places(id, place_id, company_region_id,created_at, updated_at) values('${regionPlaceId}','${children[i].region_id}','${regionid}',now(),now());`

        console.log("createRegionPlaceSql:", createRegionPlaceSql, "times: ", i);
        await DB.query(createRegionPlaceSql);

        updateTpr = `update travel_policy.travel_policy_regions set company_region_id = '${regionid}' where id = '${children[i].id}';`;
        console.log("updateTpr: ", updateTpr, "times: ", i);
        await DB.query(updateTpr);

    }
}



