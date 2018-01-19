/*
 * Created by Jack on 2017/9/19.
 */
'use strict';
import Sequelize = require('sequelize');
const config = require('@jingli/config');
var request = require("request");
import { getCompanyTokenByAgent } from 'api/restful';

export = async function(db: any, transaction: any) {

    let companySql  = 'select * from company.companies where deleted_at is null';
    let companies = await db.query(companySql, {type: Sequelize.QueryTypes.SELECT});
    console.log("companies'length: ", companies.length)
    for(let i =0; i < companies.length; i++ ){
        if(!companies[i].id || typeof(companies[i]) == undefined) continue;

        let travelPolicy = await requestTravelPolicy(companies[i].id, true);
        if(typeof(travelPolicy) == 'string')  travelPolicy = JSON.parse(travelPolicy);
        if(!travelPolicy || travelPolicy.length == 0) {
            travelPolicy = await requestTravelPolicy(companies[i].id, false)
            if(typeof(travelPolicy) == 'string')  travelPolicy = JSON.parse(travelPolicy);
        }
        if(travelPolicy && travelPolicy.length) {
            let updateStaff = `update staff.staffs set travel_policy_id = '${travelPolicy[0].id}', updated_at = now()
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


async function requestTravelPolicy(companyId: string, isDefault: boolean){
    const token = await getCompanyTokenByAgent(companyId);
    let result = await new Promise<any>((resolve, reject) => {
        let qs: { companyId: string, isDefault: boolean} = {
            companyId: companyId,
            isDefault: isDefault
        };
        let url = config.cloudAPI + `/travelPolicy`;
        console.log("url: ", url);
        request({
            uri: url,
            qs: qs,
            method: 'get',
            headers: {
                token
            }
        }, function(err: Error, res: any){
            if(err) {
                console.log(err)
                return resolve(null)
            }
            console.log(res.body);
            let body = res.body;
            if(typeof(body) == 'string') {
                body = JSON.parse(body);
            }
            if(body && body.data && body.data.length) {
                return resolve(body.data)
            }
            return resolve(null);
        });
    })
    return result;

}