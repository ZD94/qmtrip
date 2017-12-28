'use strict';
import {Models} from '_types/';
import L from '@jingli/language';
import {Staff} from '_types/staff';
import {clientExport} from '@jingli/dnode-api/dist/src/helper';
import {Company, CompanyScoreRatioChange} from '_types/company';
import {PaginateInterface} from 'common/model/interface';
import { TripPlan } from '_types/tripPlan';
import { CoinAccount, CoinAccountChange } from '_types/coin';
let moment = require('moment');


class Privilege {
    static __public: boolean = true;

    static __initHttpApp(app) {
        

        app.get('/privilege/:id/getBalance', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业余额id为空`)
                throw err;
            }
            let balance = await Privilege.getCompanyBalance(id);
             res.json(balance);
        });

        app.post('/privilege/:id/getBalanceRecords', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业资金变动记录id为空`)
                throw err;

            }
            let body = req.body;
            let balanceRecords = [];
            if (body) {
                if (typeof body == 'string') {
                    body = JSON.parse(body);
                }
                balanceRecords =  await Privilege.getCompanyBalanceRecords({id, body});
            } else {
                balanceRecords = await Privilege.getCompanyBalanceRecords(id);
            }
            res.json(balanceRecords);
        });

        app.get('/privilege/:id/getCompanyScoreRatio', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例id为空`)
                throw err;
            }
            let result = await Privilege.getCompanyScoreRatio(id);
            res.json(result);
        });

        app.post('/privilege/:id/setCompanyScoreRatio', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`设置企业奖励比例id为空`);
                throw err;
            }
            let body = req.body;
            let scoreRatio: number = 0.50; //默认为50%
            if (typeof body == 'string') {
                body = JSON.parse(body);
            }
            let result = await Privilege.setCompanyScoreRatio({id: id, data: body});
            res.json(result);
        });

        app.get('/privilege/:id/getCompanyScoreRatioChange', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例变动id为空`);
                throw err;
            }
            let result = await Privilege.getCompanyScoreRatioChange(id);
            res.json(result);
        });

        app.get('/privilege/:id/getAllUnsettledRewardByStaff', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取未结算奖励按照员工排名id为空`)
                throw err;
            }
            let result = await Privilege.getAllUnsettledRewardByStaff(id);
            res.json(result);
        });

        app.get('/privilege/:id/getAllUnsettledRewardByTripplan', async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取未结算奖励按照tripplan id为空`);
            }
            let result = await Privilege.getAllUnsettledRewardByTripplan(id);
            res.json(result);
        });
    }


    //获取企业福利账户余额
    @clientExport
    static async getCompanyBalance(companyId: string): Promise<number> {
        let company: Company = await Models.company.get(companyId);
        let coinAccount: CoinAccount = await Models.coinAccount.get(company.coinAccountId);
        let points2coinRate: number = company.points2coinRate;
        let companyBalance: number = Math.floor((coinAccount.income - coinAccount.consume - coinAccount.locks) / points2coinRate);
        return companyBalance;
    }

    //获取企业福利账户余额变动记录
    @clientExport
    static async getCompanyBalanceRecords(params: {id: string, body?: any}): Promise<any> {
        let {id, body} = params;
        let companyId: string = id;
        let queryDateData: any = body;

        let company: Company = await Models.company.get(companyId);
        let coinAccountId: string = company.coinAccountId;
        let coinAccountChanges:  CoinAccountChange[] = await Models.coinAccountChange.all({where: {coinAccountId: coinAccountId}});
        let dataDuringTheQueryDate: CoinAccountChange[];
        
        let checkFromDate: string = null;
        let checkToDate: string = null;
        
        if (queryDateData) {
            checkFromDate = queryDateData.beginDate;
            checkToDate = queryDateData.endDate;
            for (let i = 0; i < coinAccountChanges.length; i++) {
                if (moment(coinAccountChanges[i].createdAt).isAfter(checkFromDate) || moment(coinAccountChanges[i].createdAt).isBefore(checkToDate)) {
                    dataDuringTheQueryDate.push(coinAccountChanges[i]);
                }
            }
            return dataDuringTheQueryDate;
        }
        return coinAccountChanges;
    }

     //获得企业节省奖励比例
     @clientExport
     static async getCompanyScoreRatio(companyId: string): Promise<any> {
         let company: Company = await Models.company.get(companyId);
         let scoreRatio: number = company.scoreRatio;
         return scoreRatio;
     }

     //企业节省奖励比例设置
    @clientExport
    static async setCompanyScoreRatio(params: {id: string, data: object}): Promise<any> {
        let {id, data} = params;
        let setData: any = data;
        let staffId: string = setData.staffId;
        let staff: Staff = await Models.staff.get(staffId);
        
        let companyId: string = staff.company.id;
        let scoreRatio: number = setData.scoreRatio;
        let company: Company = await Models.company.get(companyId);

        //更新企业节省奖励比例记录表 companyScoreRatioChange
        let latestScoreRatio: number = company.scoreRatio;
        let operator: string = staff.name;
        let updateScoreRatioChange: CompanyScoreRatioChange = Models.companyScoreRatioChange.create({
            companyId: companyId,
            staffId: staffId,
            oldScoreRatio: latestScoreRatio,
            newScoreRatio: scoreRatio,
            operator: operator
        });
        await updateScoreRatioChange.save();
        company.scoreRatio = scoreRatio;
        let updated: any = await company.save();
        return updated;
    }

    //企业节省奖励比例设置记录
    @clientExport
    static async getCompanyScoreRatioChange(staffId: string): Promise<any> {
        let staff: Staff = await Models.staff.get(staffId);
        let companyId: string = staff.company.id;

        let result: CompanyScoreRatioChange[] = await Models.companyScoreRatioChange.all({companyId: companyId});
        return result;
    }

     //查询全部未结算奖励按出差人展示
     @clientExport
     static async getAllUnsettledRewardByStaff(companyId: string): Promise<any> {
         let staffs: Staff[] = await Models.staff.all({where: {companyId: companyId, balancePoints: {$gt: 0}}});
         let staffsHaveUnsettledReward: Staff[] = [];
         for (let i = 0; i < staffs.length; i++) {
             if (staffs[i].balancePoints > 0) {
                 staffsHaveUnsettledReward.push(staffs[i]);
             }
         }
         return staffsHaveUnsettledReward;
     }

     //查询全部未结算奖励按tripPlan展示
     @clientExport
     static async getAllUnsettledRewardByTripplan(companyId: string): Promise<any> {
         let tripPlansHaveUnsettledReward: TripPlan[] = await Models.tripPlan.all({
             where: {
                 companyId: companyId, 
                 isSettled: false, 
                 saved: {$gt: 0}}
                });
         return tripPlansHaveUnsettledReward;
     }
}