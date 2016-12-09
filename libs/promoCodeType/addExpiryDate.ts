'use strict';
import {Models} from 'api/_types';
var moment = require("moment");
/**
 * 延长企业有效期
 * @type {{execute: (function(any): Promise<any>)}}
 */
module.exports = {
    execute: async function (params: {addNum: number, companyId: string}): Promise<boolean>{
        let {addNum, companyId} = params;
        let company = await Models.company.get(companyId);
        company.expiryDate = moment(company.expiryDate).add(addNum, 'months').toDate();
        await company.save();
        return true;
    }
}