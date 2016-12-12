/**
 * Created by wlh on 2016/9/29.
 */

'use strict';
import {ICompanyChargeParam, IStaffPoint2CoinParam, IStaffCostCoinParam} from "./_types";
import {Models} from "../_types/index";
import {requireParams, clientExport} from "../../common/api/helper";
import {Staff} from "../_types/staff/staff";
import {CoinAccount} from "api/_types/coin";


class CoinModule {

    @requireParams(["companyId", "coins"], ['remark'])
    static async companyCharge(params: ICompanyChargeParam) :Promise<CoinAccount>{
        let {companyId, coins, remark} = params;
        if (!remark) {
            remark = '企业充值';
        }
        let company = await Models.company.get(companyId);
        let coinAccount = company.coinAccount;
        //如果企业资金账户不存在,先创建
        if (!coinAccount) {
            coinAccount = Models.coinAccount.create({});
            coinAccount = await coinAccount.save()
            company.coinAccount = coinAccount;
            await company.save();
        }
        return await coinAccount.addCoin(coins, remark);
    }

    @requireParams(['staffId', "points"])
    static async staffPoint2Coin(params: IStaffPoint2CoinParam) :Promise<CoinAccount> {
        let {staffId, points} = params;
        let staff = await Models.staff.get(staffId);
        let company = staff.company
        let points2coinRate = company.points2coinRate || 0.5;
        if (staff.balancePoints < points) {
            throw new Error(`积分不足`);
        }
        let coins = Math.floor(points * points2coinRate);

        if (!company.coinAccount || company.coinAccount.balance < coins) {
            throw new Error('企业账户余额不足')
        }
        let orderNo = getOrderNo()
        //减掉企业金币
        await company.coinAccount.costCoin(coins, `员工${staff.name}(${staff.mobile})积分兑换,交易编号:${orderNo}`)

        //减掉员工积分
        staff.balancePoints = staff.balancePoints - points;
        staff = await staff.save();

        //增加鲸币
        return staff.coinAccount.addCoin(coins, `${points}积分兑换${coins},交易编号:${orderNo}`);
    }

    @requireParams(["staffId", "coins"], ["remark"])
    static async staffCostCoin(params: IStaffCostCoinParam) :Promise<CoinAccount> {
        let {staffId, coins, remark} = params;
        if (!remark) {
            remark = `消费`;
        }
        let staff = await Models.staff.get(staffId);
        let coinAccount = staff.coinAccount;
        if (!coinAccount || coinAccount.balance < coins) {
            throw new Error('账户余额不足');
        }
        return await coinAccount.costCoin(coins, remark)
    }

    @clientExport
    @requireParams(["points"])
    static async clientStaffScore2Coin(params: {points: number}) :Promise<CoinAccount> {
        let {points} = params;
        let staff = await Staff.getCurrent();
        return CoinModule.staffPoint2Coin({staffId: staff.id, points: points})
    }
    
    @clientExport
    static async clientStaffCoinAccount(params: {}) :Promise<CoinAccount> {
        let staff = await Staff.getCurrent();
        let coinAccount = staff.coinAccount;
        if (!coinAccount) {
            coinAccount = Models.coinAccount.create({})
            staff.coinAccount = coinAccount;
            await staff.save()
        }
        return coinAccount;
    }
}

function getOrderNo() : string {
    var d = new Date();
    var rnd =  (Math.ceil(Math.random() * 1000));
    var str = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}-${rnd}`;
    return str;
}

export=CoinModule