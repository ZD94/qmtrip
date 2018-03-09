"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful"
import {Models} from "_types";
import {CoinAccount, CoinAccountChange, COIN_CHANGE_TYPE} from "_types/coin";
import { Request, Response, NextFunction } from 'express-serve-static-core'

@Restful()
export class CreditController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router("/costcredit","POST")
    async costCredit(req: Request, res: Response, next: NextFunction) {
        console.info("jl商城扣积分接口================");
        var params = req.body;
        console.info("costcredit==>", params);
        var { uid, credits, orderNum, description } = params;
        var account = await Models.account.get(uid);
        if(!account){
            return res.json(this.reply(502,{}));
        }
        //资金账户不存在先创建
        if(!account.coinAccount){
            let ca = CoinAccount.create();
            await ca.save();
            account.coinAccount = ca;
            await account.save();
        }
        var coinAccount = account.coinAccount;

        var coinAccountChanges = await Models.coinAccountChange.find({where: {relateOrderNum: orderNum}});
        //防止订单重复处理
        if(!coinAccountChanges || coinAccountChanges.length <= 0){
            var result;
            try{
                if(description && typeof description == 'string')
                    description = JSON.parse(description);
                let remark = `使用${description.price}换购${description.goodsName}`;

                result = await coinAccount.lockCoin(credits, remark, orderNum);
            }catch(e){
                return res.json(this.reply(503,{message: e.message}));
            }

            return res.json(this.reply(0,{'credits': result.coinAccount.balance}));
        }else {
            return res.json(this.reply(0,{'credits': coinAccount.balance}));
        }
    }

    @Router("/resultnotice","POST")
    async resultNotice(req: Request, res: Response, next: NextFunction) {
        console.info("接收jl商城通知接口================");
        var params = req.body;
        console.info("resultNotice==>", params)
        var { success, errorMessage, orderNum } = params;

        var coinAccountChanges = await Models.coinAccountChange.find({where: {relateOrderNum: orderNum, type: COIN_CHANGE_TYPE.LOCK}});
        var coinAccountChange: CoinAccountChange;

        if(coinAccountChanges && coinAccountChanges.length > 0){
            coinAccountChange = coinAccountChanges[0];
            var coinAccount = await Models.coinAccount.get(coinAccountChange.coinAccountId);
            if (!coinAccount) return res.sendStatus(404)

            if(!coinAccountChange.coins){
                coinAccountChange.coins = 0;
            }
            if (typeof coinAccountChange.coins == 'string') {
                coinAccountChange.coins = Number(coinAccountChange.coins);
            }

            if(!success || success == "false"){
                if (typeof coinAccount.locks == 'string') {
                    coinAccount.locks = Number(coinAccount.locks);
                }
                coinAccount.locks = coinAccount.locks - coinAccountChange.coins;
                await coinAccount.save();
                await coinAccountChange.destroy();
                /*res.json({
                    'status': 'fail',
                    'errorMessage': errorMessage,
                });*/

                return res.json(this.reply(0,{errorMessage: errorMessage}));

            }else{
                if (typeof coinAccount.locks == 'string') {
                    coinAccount.locks = Number(coinAccount.locks);
                }
                if(!coinAccount.consume){
                    coinAccount.consume = 0;
                }
                if (typeof coinAccount.consume == 'string') {
                    coinAccount.consume = Number(coinAccount.consume);
                }
                coinAccount.locks = coinAccount.locks - coinAccountChange.coins;
                coinAccount.consume = coinAccount.consume + coinAccountChange.coins;
                await coinAccount.save();
                coinAccountChange.type = COIN_CHANGE_TYPE.CONSUME;
                await coinAccountChange.save();
                return res.json(this.reply(0,{}));
            }
        }else{
            return res.json(this.reply(502,{}));
        }
    }

}

