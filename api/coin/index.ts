/**
 * Created by wlh on 2016/9/29.
 */

'use strict';
import {ICompanyChargeParam, IStaffPoint2CoinParam, IStaffCostCoinParam} from "./_types";
import {Models} from "../_types/index";
import {requireParams, clientExport} from "../../common/api/helper";
import {Staff, PointChange} from "../_types/staff";
import {CoinAccount, CoinAccountChange} from "api/_types/coin";
import {FindResult} from "common/model/interface";
import L from 'common/language';


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

    @clientExport
    @requireParams(['staffId', "points"])
    static async staffPoint2Coin(params: IStaffPoint2CoinParam) :Promise<CoinAccount> {
        let {staffId, points} = params;
        let staff = await Models.staff.get(staffId);
        let company = staff.company
        let points2coinRate = company.points2coinRate || 50;
        if (staff.balancePoints < points) {
            throw L.ERR.SHORT_OF_POINT();
        }
        // let coins = Math.floor(points * points2coinRate);
        let coins = points * points2coinRate;

        if (!company.coinAccount || company.coinAccount.balance < coins) {
            throw L.ERR.COMPANY_SHORT_OF_MONEY_FUND();
        }
        // let orderNo = getOrderNo()
        //减掉企业金币
        let result = await company.coinAccount.costCoin(coins, `员工${staff.name}(${staff.mobile})积分兑换`)

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
        return staff.$parents["account"]["coinAccount"].addCoin(coins, `${points}积分兑换${coins}`);
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

    static async createCoinAccount (params) : Promise<CoinAccount>{
        var ca = CoinAccount.create(params);
        return ca.save();
    }

    @clientExport
    @requireParams(["id"])
    static async getCoinAccount(params) :Promise<CoinAccount> {
        return Models.coinAccount.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getCoinAccountChange(params) :Promise<CoinAccountChange> {
        return Models.coinAccountChange.get(params.id);
    }

    /**
     * 查找积分变动记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getCoinAccountChanges(params): Promise<FindResult>{
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