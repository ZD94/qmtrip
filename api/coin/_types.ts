/**
 * Created by wlh on 2016/9/30.
 */

'use strict';

export interface ICompanyChargeParam {
    companyId: string;
    coins: number;
    remark?: string;
}

export interface IStaffPoint2CoinParam {
    staffId: string;
    points: number;  //兑换积分
}

export interface IStaffCostCoinParam {
    staffId: string;
    coins: number;
    remark?: string;
}