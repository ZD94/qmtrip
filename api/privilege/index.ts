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
import {Request, Response} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
var cors = require('cors');
import { AuthRequest, AuthResponse } from '_types/auth';
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout');
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
const corsOptions = { origin: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'Content-Type, auth, supplier, authstr, staffid, companyid, accountid'};
function resetTimeout(req, res, next){
    req.clearTimeout();
    next();
}

class Privilege {
    static __public: boolean = true;

    static __initHttpApp(app) {
        
        let self = this;

        app.get('/privilege/:id/getBalance', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业余额id为空`)
                throw err;
            }
            let balance: number;
            try {
                balance = await Privilege.getCompanyBalance(id);
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

        app.post('/privilege/:id/getBalanceRecords', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
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
                    balanceRecords =  await Privilege.getCompanyBalanceRecords({id, body});
                } else {
                    balanceRecords = await Privilege.getCompanyBalanceRecords(id);
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

        app.get('/privilege/:id/getCompanyScoreRatio', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例id为空`)
                throw err;
            }
            let result;
            try {
                result = await Privilege.getCompanyScoreRatio(id);
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

        app.post('/privilege/:id/setCompanyScoreRatio', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
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
            let result;
            try {
                result = await Privilege.setCompanyScoreRatio({id: id, data: body});
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

        app.get('/privilege/:id/getCompanyScoreRatioChange', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取企业奖励比例变动id为空`);
                throw err;
            }
            let result;
            try {
                result = await Privilege.getCompanyScoreRatioChange(id);
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

        app.get('/privilege/:id/getAllUnsettledRewardByStaff', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取未结算奖励按照员工排名id为空`)
                throw err;
            }
            let result;
            try {
                result = await Privilege.getAllUnsettledRewardByStaff(id);
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

        app.get('/privilege/:id/getAllUnsettledRewardByTripplan', resetTimeout, cors(corsOptions), timeout('120s'), verifyToken, async function(req, res, next) {
            let {id} = req.params;
            if (!id) {
                let err = new Error(`获取未结算奖励按照tripplan id为空`);
            }
            let result;
            try {
                result = await Privilege.getAllUnsettledRewardByTripplan(id);
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
        let dataDuringTheQueryDate: CoinAccountChange[] = [];
        
        let checkFromDate: Date = null;
        let checkToDate: Date = null;
    
        if (queryDateData['beginDate']) {
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

        let result: CompanyScoreRatioChange[] = await Models.companyScoreRatioChange.all({where: {companyId: companyId}, order: [['updated_at', 'DESC']]});
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

export = Privilege;

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