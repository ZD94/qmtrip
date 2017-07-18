/**
 * Created by wyl on 16-12-6.
 */

'use strict';
import {requireParams, clientExport} from "@jingli/dnode-api/dist/src/helper";
import {Staff} from "_types/staff/staff";
import {CoinAccount} from "_types/coin";
var config = require('@jingli/config');

var URL = require('url');
var utils = require("common/utils");

var baseUrl = "https://www.duiba.com.cn/autoLogin/autologin"

class DuiBa {
    /**
     * 获取免登陆url
     * @param params
     * @param params.redirect 重定向地址
     * @returns {string}
     */
    @clientExport
    static async getLoginUrl(params) :Promise<string>{
        var staff = await Staff.getCurrent();
        if(!params) params = {};
        params.uid = staff.accountId;
        var credits = 0;
        let account = await Models.account.get(staff.accountId);
        if(account.coinAccount && account.coinAccount.balance){
            credits = account.coinAccount.balance;
        }

        credits = Math.floor(credits);

        params.credits = credits;
        params.appKey = config.duiba.appKey;
        params.appSecret = config.duiba.appSecret;
        if(!params.timestamp) params.timestamp = new Date().getTime();

        let sign = await DuiBa.getSign(params);
        params.sign = sign;

        if(params.hasOwnProperty("appSecret")){
            delete params.appSecret;
        }
        let u = URL.parse(baseUrl);
        u.query = params;
        let url = URL.format(u);
        return url;
    }

    static async getSign(params) :Promise<string>{
        if(params.hasOwnProperty("sign")){
            delete params.sign;
        }
        if(!params.hasOwnProperty("appSecret")){
            params.appSecret = config.duiba.appSecret;
        }
        let keys = Object.keys(params).sort();
        var keyValue = "";
        for(let key of keys){
            keyValue += params[key]
        }

        var sign = utils.md5(keyValue);
        return sign;
    }

    static __initHttpApp = require('./duiba');
}


export = DuiBa