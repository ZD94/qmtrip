/**
 * Created by wlh on 2016/9/29.
 */

'use strict';
import {ICompanyChargeParam, IStaffPoint2CoinParam, IStaffCostCoinParam} from "./_types";
import {Models} from "_types/index";
import {requireParams, clientExport} from "@jingli/dnode-api/dist/src/helper";
import {PointChange} from "_types/staff";
import {CoinAccount, CoinAccountChange, COIN_CHANGE_TYPE} from "_types/coin";
import {FindResult} from "common/model/interface";
import L from '@jingli/language';
import {DB} from '@jingli/database';
import { Company } from '_types/company';
let crypto = require('crypto');
// 增加鲸币接口用户名 密码 key用于md5校验
const username: string = 'jingli2016';
const pwd: string = 'jinglizhixiang';
const key: string = 'JLZX';


class CoinModule {

    /**
     * 企业增加鲸币接口
     * @author lizeilin
     * @param authData: {authStr, timestamp}, companyId: string, coins: number
     * @description username,pwd,key,timestamp 通过md5加密校验
     * @return
     */
    @clientExport
    static async addCompanyJLCoin(params: {authData: any, companyId: string, coins: number}): Promise<CoinAccount> {
        let {authData, companyId, coins} = params;
        if (authData && typeof authData == 'string') {
            authData = JSON.parse(authData);
        }

        // 校验authStr  md5
        let authStr: string = authData.authStr;
        let timestamp: string = authData.timestamp;
        
        let plainText: string = username + pwd + key + timestamp;
        let md5 = crypto.createHash("md5");
        let cipherText: string = md5.update(plainText).digest('hex');
        if (authStr != cipherText) {
            throw Error('校验失败！请求失败！');
        }

        let company: Company | undefined;
        let companyCoinAccount: CoinAccount | undefined;
        let companyCoinAccountChange: CoinAccountChange | undefined;

        try {
            await DB.transaction(async function(t) {
                company = await Models.company.get(companyId);
                //增加鲸币
                companyCoinAccount = await Models.coinAccount.get(company.coinAccountId);
                companyCoinAccount.income += coins;
                companyCoinAccount.save();

                //增加记录
                companyCoinAccountChange = await Models.coinAccountChange.create({
                    coinAccountId: company.coinAccountId,
                    remark: `企业充值鲸币${coins}`,
                    type: COIN_CHANGE_TYPE.INCOME,
                    coins: coins
                });
                companyCoinAccountChange.save();
            })
        } catch (err) {
            companyCoinAccount && companyCoinAccount.reload();
            companyCoinAccountChange && companyCoinAccountChange.reload();
            throw err;
        }
        return await Models.coinAccount.get(company.coinAccountId);;

    }

    @requireParams(["companyId", "coins"], ['remark'])
    static async companyCharge(params: ICompanyChargeParam) :Promise<CoinAccount>{
        let {companyId, coins, remark} = params;
        if (!remark) {
            remark = '企业充值';
        }
        let company = await Models.company.get(companyId);
        if (!company) throw new Error('company is null')
        let coinAccount = company.coinAccount;
        //如果企业资金账户不存在,先创建
        if (!coinAccount) {
            coinAccount = Models.coinAccount.create({});
            coinAccount = await coinAccount.save()
            company.coinAccount = coinAccount;
            await company.save();
        }

        let result = await coinAccount.addCoin(coins, remark);
        return result.coinAccount;
    }

    @clientExport
    @requireParams(['staffId', "points"])
    static async staffPoint2Coin(params: IStaffPoint2CoinParam) :Promise<CoinAccount> {
        let {staffId, points} = params;
        let staff = await Models.staff.get(staffId);
        if (!staff) throw new Error('staff is null')
        let company = staff.company
        let points2coinRate = company.points2coinRate || 50;
        if (staff.balancePoints < points) {
            throw L.ERR.SHORT_OF_POINT();
        }
        // let coins = Math.floor(points * points2coinRate);
        let coins = Math.ceil(points * points2coinRate);

        let originalConsume = company.coinAccount.consume;
        let originalBalancePoints = staff.balancePoints;
        let originalIncome = staff.$parents["account"]["coinAccount"].income;

        if (!company.coinAccount || company.coinAccount.balance < coins) {
            throw L.ERR.COMPANY_SHORT_OF_MONEY_FUND();
        }
        // let orderNo = getOrderNo()
        return DB.transaction(async function (t) {
            if (!staff) throw new Error('staff is null')
            //减掉企业金币
            let result:any;
            result= await company.coinAccount.costCoin(coins, `员工${staff.name}(${staff.mobile})积分兑换`)
            //减掉员工积分
            staff.balancePoints = staff.balancePoints - points;
            staff = await staff.save();
            let pc = PointChange.create({
                currentPoints: staff.balancePoints, status: 1,
                staff: staff, company: staff.company,
                points: 0-points, remark: `${points}积分兑换鲸币`,
                orderId: result.coinAccountChange.id});
            await pc.save();

            //增加员工鲸币
            // return staff.coinAccount.addCoin(coins, `${points}积分兑换${coins}`);
            return staff.$parents["account"]["coinAccount"].addCoin(coins, `使用${points}元节省金额兑换${coins}鲸币`);
        }).catch(async function(err){
            if (!staff) throw new Error('staff is null')
            company.coinAccount.consume = originalConsume;
            staff.balancePoints = originalBalancePoints;
            staff.$parents["account"]["coinAccount"].income = originalIncome;
            await Promise.all([company.save(), staff.save(), staff.$parents["account"]["coinAccount"].save()]);
            throw new Error("兑换失败");
        })
    }

    @requireParams(["staffId", "coins"], ["remark"])
    static async staffCostCoin(params: IStaffCostCoinParam) :Promise<CoinAccount> {
        let {staffId, coins, remark} = params;
        if (!remark) {
            remark = `消费`;
        }
        let staff = await Models.staff.get(staffId);
        if (!staff) throw new Error('staff is null')
        let coinAccount = staff.coinAccount;
        if (!coinAccount || coinAccount.balance < coins) {
            throw new Error('账户余额不足');
        }
        return await coinAccount.costCoin(coins, remark)
    }

    static async createCoinAccount (params: {[key: string]: any}) : Promise<CoinAccount>{
        var ca = CoinAccount.create(params);
        return ca.save();
    }

    @clientExport
    @requireParams(["id"])
    static async getCoinAccount(params: {id: string}) {
        return Models.coinAccount.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getCoinAccountChange(params: {id: string}): Promise<CoinAccountChange | null> {
        return Models.coinAccountChange.get(params.id);
    }

    /**
     * 查找积分变动记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getCoinAccountChanges(params: {
        order: any
    }): Promise<FindResult>{
        params.order = params.order || [['createdAt', 'desc']];
        let paginate = await Models.coinAccountChange.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }
}

/*function getOrderNo() : string {
    var d = new Date();
    var rnd =  (Math.ceil(Math.random() * 1000));
    var str = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}-${rnd}`;
    return str;
}*/

export = CoinModule