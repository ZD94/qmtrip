'use strict';
import { Models } from '_types';
import { CoinAccount } from "_types/coin";
/**
 * 延长企业有效期
 * @type {{execute: (function(any): Promise<any>)}}
 */
export default {
    execute: async function (params: { addNum: number, companyId: string }): Promise<boolean> {
        let { addNum, companyId } = params;
        let company = await Models.company.get(companyId);
        if (!company.coinAccount) {
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
