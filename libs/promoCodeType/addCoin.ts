'use strict';
import {Models} from 'api/_types';
import {CoinAccount} from "api/_types/coin";
var moment = require("moment");
/**
 * 延长企业有效期
 * @type {{execute: (function(any): Promise<any>)}}
 */
module.exports = {
    execute: async function (params: {addNum: number, companyId: string}): Promise<boolean>{
        let {addNum, companyId} = params;
        let company = await Models.company.get(companyId);
        if(!company.coinAccount){
            let ca = CoinAccount.create();
            await ca.save();
            company.coinAccount = ca;
            await company.save();
        }
        let coinAccount = company.coinAccount;
        await coinAccount.addCoin(addNum, "优惠码注册充值");
        return true;
    }
}