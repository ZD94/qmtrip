/**
 * Created by wyl on 16-12-6.
 */

'use strict';
import {Models} from "../_types/index";
import {requireParams, clientExport} from "../../common/api/helper";
import {Staff} from "../_types/staff/staff";
import {CoinAccount} from "api/_types/coin";
var config = require('config');

var URL = require('url');
var utils = require("common/utils");

var baseUrl = "https://www.duiba.com.cn/autoLogin/autologin"

class DuiBa {
    @requireParams([], ['redirect'])
    static async getLoginUrl(params) :Promise<string>{
        var staff = await Staff.getCurrent();
        params.uid = staff.id;
        params.credits = staff.coinAccount.balance;
        params.appKey = config.duiba.appKey;
        params.appSecret = config.duiba.appSecret;
        if(!params.timestamp) params.timestamp = new Date().getTime();

        let sign = DuiBa.getSign(params);
        params.sign = sign;

        if(params.hasOwnProperty("appSecret")){
            delete params.appSecret;
        }
        let u = URL.parse(baseUrl);
        u.query = params;
        let url = URL.format(u);
        console.info("url:", url)
        return url;
    }

    static getSign(params) :string{
        console.info("getSign:", params)
        if(!params.hasOwnProperty("sign")){
            delete params.sign;
        }
        let keys = Object.keys(params).sort();
        var keyValue = "";
        for(let key of keys){
            keyValue += params[key]
        }

        console.info("keyValue:", keyValue)
        var sign = utils.md5(keyValue);
        console.info("sign:",sign);
        return sign;
    }

    static __initHttpApp = require('./duiba');
}


export = DuiBa