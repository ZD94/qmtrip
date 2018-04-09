'use strict';
import {Models} from '_types/';
import {Staff} from '_types/staff';
import {clientExport} from '@jingli/dnode-api/dist/src/helper';
import {Company, CompanyScoreRatioChange} from '_types/company';
import { TripPlan } from '_types/tripPlan';
import { CoinAccount, CoinAccountChange } from '_types/coin';
let moment = require('moment');
import {Request, Response, NextFunction, Application} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
var cors = require('cors');
import { AuthResponse } from '_types/auth';
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout');
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
const corsOptions = { origin: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'Content-Type, auth, supplier, authstr, staffid, companyid, accountid'};
function resetTimeout(req: Request, res: Response, next?: NextFunction){
    req['clearTimeout']();
    next && next();
}

export class Privilege {
    __public: boolean = true;

    __initHttpApp(app: Application) {
        let self = this;
        app.get('/privilege/:id/getBalance', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业余额id为空`)
                throw err;
            }
            let balance: number;
            try {
                balance = await self.getCompanyBalance(id);
            } catch(err) {
                return res.json({
                    msg: err, 
                    code: 502,
                    data: null
                });
            }
            
            return res.json({
                data: balance,
                code: 0,
                msg: 'OK'
            });
        });

        app.post('/privilege/:id/getBalanceRecords', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业资金变动记录id为空`)
                throw err;
            }
            let body = req.body;
            let balanceRecords = [];
            try {
                if (body) {
                    if (typeof body == 'string') {
                        body = JSON.parse(body);
                    }
                    balanceRecords =  await self.getCompanyBalanceRecords({id, body});
                } else {
                    balanceRecords = await self.getCompanyBalanceRecords(id);
                }
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502,
                    msg: err
                });
            }
            
            return res.json({
                data: balanceRecords,
                code: 0,
                msg: 'OK'
            });
        });

        app.get('/privilege/:id/getCompanyScoreRatio', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例id为空`)
                throw err;
            }
            let result;
            try {
                result = await self.getCompanyScoreRatio(id);
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502,
                    msg: err
                });
            }
            return res.json({
                data: result,
                code: 0,
                msg: 'OK'
            });
        });

        app.post('/privilege/:id/setCompanyScoreRatio', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`设置企业奖励比例id为空`);
                throw err;
            }
            let body = req.body;
            if (typeof body == 'string') {
                body = JSON.parse(body);
            }
            let result;
            try {
                result = await self.setCompanyScoreRatio({id: id, data: body});
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502, 
                    msg: err
                });
            }
            return res.json({
                data: result,
                code: 0,
                msg: 'OK'
            });
        });

        app.get('/privilege/:id/getCompanyScoreRatioChange', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例变动id为空`);
                throw err;
            }
            let result;
            try {
                result = await self.getCompanyScoreRatioChange(id);
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502,
                    msg: err
                });
            }
            return res.json({
                data: result,
                code: 0,
                msg: 'OK'
            });
        });

        app.get('/privilege/:id/getAllUnsettledRewardByStaff', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取未结算奖励按照员工排名id为空`)
                throw err;
            }
            let result;
            try {
                result = await self.getAllUnsettledRewardByStaff(id);
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502,
                    msg: err
                });
            }
            return res.json({
                data: result,
                code: 0,
                msg: 'OK'
            });
        });

        app.get('/privilege/:id/getAllUnsettledRewardByTripplan', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req: Request, res: Response, next?: NextFunction) {
            let {id} = req.params;
            let result;
            try {
                result = await self.getAllUnsettledRewardByTripplan(id);
            } catch(err) {
                return res.json({
                    data: null,
                    code: 502, 
                    msg: err
                });
            }
            return res.json({
                data: result,
                code: 0,
                msg: 'OK'
            });
        });
    }


    //获取企业福利账户余额
    @clientExport
    async getCompanyBalance(companyId: string): Promise<number> {
        let company: Company | null = await Models.company.get(companyId);
        let coinAccount: CoinAccount | null = await Models.coinAccount.get(company && company.coinAccountId);
        let companyBalance: number = coinAccount && coinAccount.income - coinAccount.consume - coinAccount.locks || 0;
        return companyBalance;
    }

    //获取企业福利账户余额变动记录
    @clientExport
    async getCompanyBalanceRecords(params: {id: string, body?: any}): Promise<any> {
        let {id, body} = params;
        let companyId: string = id;
        let queryDateData: any = body;

        let company: Company | null = await Models.company.get(companyId);
        let coinAccountId: string = company && company.coinAccountId;
        let coinAccountChanges:  CoinAccountChange[] = await Models.coinAccountChange.all({where: {coinAccountId: coinAccountId}});
        let dataDuringTheQueryDate: CoinAccountChange[] = [];
        
        let checkFromDate: Date | null = null;
        let checkToDate: Date | null = null;
    
        if (queryDateData['beginDate']) {
            checkFromDate = queryDateData.beginDate;
            checkToDate = queryDateData.endDate;
            for (let i = 0; i < coinAccountChanges.length; i++) {
                if (moment(coinAccountChanges[i].createdAt).isSameOrAfter(checkFromDate, 'month') && moment(coinAccountChanges[i].createdAt).isSameOrBefore(checkToDate, 'month')) {
                    dataDuringTheQueryDate.push(coinAccountChanges[i]);
                }
            }
            return dataDuringTheQueryDate;
        }
        return coinAccountChanges;
    }

     //获得企业节省奖励比例
     @clientExport
     async getCompanyScoreRatio(companyId: string): Promise<any> {
         let company: Company | null = await Models.company.get(companyId);
         let scoreRatio: number = company && company.scoreRatio || 0;
         return scoreRatio;
     }

     //企业节省奖励比例设置
    @clientExport
    async setCompanyScoreRatio(params: {id: string, data: object}) {
        let {data} = params;
        let setData: any = data;
        let staffId: string = setData.staffId;
        let staff: Staff | null = await Models.staff.get(staffId);
        
        let companyId: string = staff && staff.company.id || '';
        let scoreRatio: number = setData.scoreRatio;
        let company: Company | null = await Models.company.get(companyId);
        if (!company) return null
        //更新企业节省奖励比例记录表 companyScoreRatioChange
        let latestScoreRatio: number = company && company.scoreRatio || 0;
        let operator: string = staff && staff.name || '';
        let updateScoreRatioChange: CompanyScoreRatioChange = Models.companyScoreRatioChange.create({
            companyId: companyId,
            staffId: staffId,
            oldScoreRatio: latestScoreRatio,
            newScoreRatio: scoreRatio,
            operator: operator
        });
        await updateScoreRatioChange.save();
        company.scoreRatio = scoreRatio;
        let updated = await company.save();
        return updated;
    }

    //企业节省奖励比例设置记录
    @clientExport
    async getCompanyScoreRatioChange(staffId: string) {
        let staff: Staff | null = await Models.staff.get(staffId);
        if (!staff) return []
        let companyId: string = staff.company.id;

        let result: CompanyScoreRatioChange[] = await Models.companyScoreRatioChange.all({where: {companyId: companyId}, order: [['updated_at', 'DESC']]});
        return result;
    }

     //查询全部未结算奖励按出差人展示
     @clientExport
     async getAllUnsettledRewardByStaff(companyId: string): Promise<any> {
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
     async getAllUnsettledRewardByTripplan(companyId: string): Promise<any> {
         let tripPlansHaveUnsettledReward: TripPlan[] = await Models.tripPlan.all({
             where: {
                 companyId: companyId, 
                 isSettled: false, 
                 saved: {$gt: 0}}
                });
         return tripPlansHaveUnsettledReward;
     }
}

export default new Privilege();


async function verify(req: Request, res: Response, next: Function) {
    if(req.method == 'OPTIONS') {
        return next();
    }
    let {authstr, staffid} = req.headers;
    console.log("======> authstr ", authstr, staffid)
    let token = parseAuthString(authstr);
    let verification: AuthResponse = await API.auth.authentication(token);
    if(!verification) {
        console.log("auth failed", JSON.stringify(req.cookies))
        return res.sendStatus(401);
    }
    try{
        await API.auth.setCurrentStaffId({
            accountId : verification.accountId,
            staffId   : staffid
        })
    } catch(err) {
        if(err)
            return res.sendStatus(401);
    }
    next();
}
var verifyToken = CLSNS.bind(verify, CLSNS.createContext())