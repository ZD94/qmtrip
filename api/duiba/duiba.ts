/**
 * Created by wyl on 16-12-6.
 */
'use strict';
import {Models} from "../_types/index";
import L from 'common/language';
import {CoinAccount, CoinAccountChange} from "api/_types/coin";
var config = require('config');
var API = require("common/api");

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
    var params = req.params;
    var { uid, credits,appKey, timestamp, description, orderNum, actualPrice,sign } = params;
    var staff = await Models.staff.get(uid);
    var coinAccount = staff.coinAccount;
    
    if(!appKey || appKey != config.duiba.appKey){
        return {
            'status': 'fail',
            'errorMessage': 'appKey错误',
            'credits': coinAccount.balance
        };
    }
    if(params.sign){
        delete params.sign;
    }
    
    var _sign = API.duiba.getSign(params);
    if(sign != _sign){
        return {
            'status': 'fail',
            'errorMessage': '签名错误',
            'credits': coinAccount.balance
        };
    }

    var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum}});
    //防止订单重复处理
    if(!coinAccountChanges || coinAccountChanges.length <= 0){
        var result = await coinAccount.costCoin(credits, description, orderNum);
        return {
            'status': 'ok',
            'errorMessage': '',
            'bizId': result.coinAccountChange.id,
            'credits': coinAccount.balance
        };
    }else {
        return {
            'status': 'ok',
            'errorMessage': '',
            'bizId': coinAccountChanges[0].id,
            'credits': coinAccount.balance
        };
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
    var params = req.params;
    var { appKey, timestamp, success, errorMessage, orderNum, bizId,sign } = params;

    if(params.sign){
        delete params.sign;
    }

    var _sign = API.duiba.getSign(params);
    if(sign != _sign){
        throw L.ERR.SIGN_ERROR();
    }

    if(!success){
        //扣积分请求超时时兑吧也会发回失败通知 此时未携带bizId 所以查失败订单不能用bizId 要用orderNum
        var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum}});
        var coinAccountChange: CoinAccountChange;
        if(coinAccountChanges && coinAccountChanges.length > 0){
            coinAccountChange = coinAccountChanges[0];
            var coinAccount = await Models.coinAccount.get(coinAccountChange.coinAccountId);
            coinAccount.consume = coinAccount.consume - coinAccountChange.coins;
            await coinAccount.save();
            await coinAccountChange.destroy();
        }else{
            return true;
        }
    }

    return true;

}

/**
 * 增加积分
 * @param req
 * @param res
 * @param next
 * @returns {any}
 */
async function addCredit(req, res, next) {
    var params = req.params;
    var { uid, credits,appKey,type, timestamp, description, orderNum, sign } = params;
    var staff = await Models.staff.get(uid);
    var coinAccount = staff.coinAccount;

    if(!appKey || appKey != config.duiba.appKey){
        return {
            'status': 'fail',
            'errorMessage': 'appKey错误',
            'credits': coinAccount.balance
        };
    }
    if(params.sign){
        delete params.sign;
    }

    var _sign = API.duiba.getSign(params);
    if(sign != _sign){
        return {
            'status': 'fail',
            'errorMessage': '签名错误',
            'credits': coinAccount.balance
        };
    }

    var coinAccountChanges = await Models.coinAccountChange.find({where: {duiBaOrderNum: orderNum}});
    //防止订单重复处理
    if(!coinAccountChanges || coinAccountChanges.length <= 0){
        var result = await coinAccount.addCoin(credits, description, orderNum);
        return {
            'status': 'ok',
            'errorMessage': '',
            'bizId': result.coinAccountChange.id,
            'credits': coinAccount.balance
        };
    }else {
        return {
            'status': 'ok',
            'errorMessage': '',
            'bizId': coinAccountChanges[0].id,
            'credits': coinAccount.balance
        };
    }
}