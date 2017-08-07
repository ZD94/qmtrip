/**
 * Created by wyl on 16-12-6.
 */
'use strict';
import {Models} from "_types/index";
import L from '@jingli/language';
import {CoinAccount, CoinAccountChange, COIN_CHANGE_TYPE} from "_types/coin";
var config = require('@jingli/config');
var API = require("@jingli/dnode-api");

module.exports = function(app) {
    app.get("/duiba/costcredit", costCredit);
    app.get("/duiba/result/notice", resultNotice);
    app.get("/duiba/addcredit", addCredit);
};

/**
 * 扣积分接口
 * @param req
 * @param res
 * @param next
 * @returns {any}
 */
async function costCredit(req, res, next) {
    console.info("扣积分接口================");
    var params = req.query;
    var { uid, credits,appKey, timestamp, description, orderNum, actualPrice,sign } = params;
    var account = await Models.account.get(uid);
    // staff.coinAccount = staff.$parents["account"]["coinAccount"];
    //资金账户不存在先创建
    if(!account.coinAccount){
        let ca = CoinAccount.create();
        await ca.save();
        // let account = await Models.account.get(staff.accountId);
        account.coinAccount = ca;
        await account.save();
        // staff.coinAccount = ca;
        // await staff.save();
    }
    var coinAccount = account.coinAccount;
    
    if(!appKey || appKey != config.duiba.appKey){
        res.json({
            'status': 'fail',
            'errorMessage': 'appKey错误',
            'credits': coinAccount.balance
        });
    }
    if(params.sign){
        delete params.sign;
    }

    var _sign = await API.duiba.getSign(params);
    if(sign != _sign){
        res.json({
            'status': 'fail',
            'errorMessage': '签名错误',
            'credits': coinAccount.balance
        });
    }

    var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum}});
    //防止订单重复处理
    if(!coinAccountChanges || coinAccountChanges.length <= 0){
        var result = await coinAccount.lockCoin(credits, description, orderNum);
        res.json({
            'status': 'ok',
            'errorMessage': '',
            'bizId': result.coinAccountChange.id,
            'credits': result.coinAccount.balance
        });
    }else {
        res.json({
            'status': 'ok',
            'errorMessage': '该订单已处理',
            'bizId': coinAccountChanges[0].id,
            'credits': coinAccount.balance
        });
    }
}

/**
 * 兑换结果通知接口
 * @param req
 * @param res
 * @param next
 * @returns {any}
 */
async function resultNotice(req, res, next) {
    console.info("接收通知接口================");
    var params = req.query;
    var { appKey, timestamp, success, errorMessage, orderNum, bizId,sign } = params;

    if(params.sign){
        delete params.sign;
    }

    if(!appKey || appKey != config.duiba.appKey){
        res.json({
            'status': 'fail',
            'errorMessage': 'appKey错误',
        });
    }

    var _sign = await API.duiba.getSign(params);
    if(sign != _sign){
        res.json({
            'status': 'fail',
            'errorMessage': '签名错误',
        });
    }
    //扣积分请求超时时兑吧也会发回失败通知 此时未携带bizId 所以查失败订单不能用bizId 要用orderNum
    var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum, type: COIN_CHANGE_TYPE.LOCK}});
    var coinAccountChange: CoinAccountChange;
    
    if(coinAccountChanges && coinAccountChanges.length > 0){
        coinAccountChange = coinAccountChanges[0];
        var coinAccount = await Models.coinAccount.get(coinAccountChange.coinAccountId);

        if(!coinAccountChange.coins){
            coinAccountChange.coins = 0;
        }
        if (typeof coinAccountChange.coins == 'string') {
            coinAccountChange.coins = Number(coinAccountChange.coins);
        }

        if(success == "false"){
            if (typeof coinAccount.locks == 'string') {
                coinAccount.locks = Number(coinAccount.locks);
            }
            coinAccount.locks = coinAccount.locks - coinAccountChange.coins;
            await coinAccount.save();
            await coinAccountChange.destroy();
            res.json({
                'status': 'fail',
                'errorMessage': errorMessage,
            });

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
            res.json({
                'status': 'success',
            });
        }
    }else{
        res.send('ok');
    }
}

/**
 * 增加积分
 * @param req
 * @param res
 * @param next
 * @returns {any}
 */
async function addCredit(req, res, next) {
    var params = req.query;
    var { uid, credits,appKey,type, timestamp, description, orderNum, sign } = params;
    var account = await Models.account.get(uid);
    // account.coinAccount = account.["coinAccount"];
    //资金账户不存在先创建
    if(!account.coinAccount){
        let ca = CoinAccount.create();
        await ca.save();
        // let account = await Models.account.get(staff.accountId);
        account.coinAccount = ca;
        await account.save();
        // staff.coinAccount = ca;
        // await staff.save();
    }
    var coinAccount = account.coinAccount;

    if(!appKey || appKey != config.duiba.appKey){
        res.json({
            'status': 'fail',
            'errorMessage': 'appKey错误',
            'credits': coinAccount.balance
        });
    }
    if(params.sign){
        delete params.sign;
    }

    var _sign = await API.duiba.getSign(params);
    if(sign != _sign){
        res.json({
            'status': 'fail',
            'errorMessage': '签名错误',
            'credits': coinAccount.balance
        });
    }

    var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum}});
    //防止订单重复处理
    if(!coinAccountChanges || coinAccountChanges.length <= 0){
        var result = await coinAccount.addCoin(credits, "每日签到奖励", orderNum);
        res.json({
            'status': 'ok',
            'errorMessage': '',
            'bizId': result.coinAccountChange.id,
            'credits': coinAccount.balance
        });
    }else {
        res.json({
            'status': 'ok',
            'errorMessage': '',
            'bizId': coinAccountChanges[0].id,
            'credits': coinAccount.balance
        });
    }
}