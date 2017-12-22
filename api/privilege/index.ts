'use strict';
import {Models} from '_types/';
import L from '@jingli/language';
import {Staff} from '_types/staff';
import {clientExport} from '@jingli/dnode-api/dist/src/helper';
import {MoneyChange, Company, CompanyScoreRatioChange} from '_types/company';
import {PaginateInterface} from 'common/model/interface';
import { TripPlan } from '_types/tripPlan';
let moment = require('moment');


export default class Privilege {

    //获取企业福利账户余额
    @clientExport
    static async getCompanyBalance(params: {id: string}): Promise<number> {
        let {id} = params;
        let companyId: string = params.id;
        let moneyChanges: MoneyChange[] = await Models.moneyChange.all({where: {companyId: companyId}});
        let companyBalance: number = 0;
        for (let i = 0; i < moneyChanges.length; i++) {
            if (moneyChanges[i].type == 1) {    //充值
                companyBalance += moneyChanges[i].money;
            } else if (moneyChanges[i].type == -1 || moneyChanges[i].type == 0) {    //消费或冻结
                companyBalance -= moneyChanges[i].money;
            } else {

            }
        }
        return companyBalance;
    }

    //获取企业福利账户余额变动记录
    @clientExport
    static async getCompanyBalanceRecords(params: {id: string, data?: object}): Promise<any> {
        let {id, data} = params;
        let companyId: string = params.id;
        let queryDateData: any = params.data;

        let moneyChanges: MoneyChange[] = await Models.moneyChange.all({where: {companyId: companyId}});
        let dataDuringTheQueryDate: MoneyChange[];
        
        let checkFromDate: string = null;
        let checkToDate: string = null;
        
        if (queryDateData) {
            checkFromDate = queryDateData.beginDate;
            checkToDate = queryDateData.endDate;
            for (let i = 0; i < moneyChanges.length; i++) {
                if (moment(moneyChanges[i].createdAt).isAfter(checkFromDate) || moment(moneyChanges[i].createdAt).isBefore(checkToDate)) {
                    dataDuringTheQueryDate.push(moneyChanges[i]);
                }
            }
            return dataDuringTheQueryDate;
        }
        return moneyChanges;
    }

    //企业节省奖励比例设置
    @clientExport
    static async getCompanyScoreRatio(params: {id: string, data: object}): Promise<any> {
        let {id, data} = params;
        let staffId: string = params.id;
        let setData: any = params.data;
        let staff: Staff = await Models.staff.get(staffId);
        
        let companyId: string = staff.company.id;
        let scoreRatio: number = setData.scoreRatio;
        let company: Company = await Models.company.get(companyId);

        company.scoreRatio = scoreRatio;
        let updated: any = await company.save();

        //更新企业节省奖励比例记录表 companyScoreRatioChange
        let companyScoreRatioChange: PaginateInterface<CompanyScoreRatioChange> = await Models.companyScoreRatioChange.find({where: {companyId: companyId}, order: [['created_at', 'DESC']]});
        let latestChange: CompanyScoreRatioChange = companyScoreRatioChange[0];
        let latestScoreRatio: number = latestChange.newScoreRatio;
        let operator: string = staff.name;
        let updateScoreRatioChange: CompanyScoreRatioChange = await Models.companyScoreRatioChange.create({
            companyId: companyId,
            staffId: staffId,
            oldScoreRatio: latestScoreRatio,
            newScoreRatio: scoreRatio,
            operator: operator
        });
        await updateScoreRatioChange.save();

        
        return updated;
    }

    //企业节省奖励比例设置记录
    @clientExport
    static async getCompanyScoreRatioChange(params: {id: string}): Promise<any> {
        let {id} = params;
        let staffId: string = params.id;
        let staff: Staff = await Models.staff.get(staffId);
        let companyId: string = staff.company.id;

        let result: CompanyScoreRatioChange[] = await Models.companyScoreRatioChange.all({companyId: companyId});
        return result;
    }

     //查询全部未结算奖励按出差人展示
     @clientExport
     static async getAllUnsettledRewardByStaff(params: {id: string}): Promise<any> {
         let {id} = params;
         let companyId: string = params.id;
         
         let staffs: Staff[] = await Models.staff.all({where: {companyId: companyId}});
         let staffsHaveUnsettledReward: Staff[];
         for (let i = 0; i < staffs.length; i++) {
             if (staffs[i].balancePoints > 0) {
                 staffsHaveUnsettledReward.push(staffs[i]);
             }
         }

         staffsHaveUnsettledReward = bubbleSort(staffsHaveUnsettledReward);
         return staffsHaveUnsettledReward;

        function bubbleSort(arr) {
            for (let i = 0; i < arr.length - 1; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    if (arr[i].balancePoints > arr[j].balancePoints) {
                        let temp = arr[i];
                        arr[i] = arr[j];
                        arr[j] = temp;
                    }
                }
            }
            return arr;
        }
     }

     //查询全部未结算奖励按tripPlan展示
     @clientExport
     static async getAllUnsettledRewardByTripplan(params: {id: string}): Promise<any> {
         let {id} = params;
         let companyId: string = params.id;

         let tripPlansHaveUnsettledReward: TripPlan[] = await Models.tripPlan.all({where: {companyId: companyId, isSettled: false, saved: {$gt: 0}}});
         return tripPlansHaveUnsettledReward;
     }


     
}