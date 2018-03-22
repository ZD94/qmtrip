/**
 * Created by wlh on 15/12/12.
 */
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models, EGender, EModifyStatus } from '_types'
import {
    ETripType, ICreateBudgetAndApproveParamsNew, QMEApproveStatus, EApproveResult, EBackOrGo,
    ISegment
} from "_types/tripPlan";
import {Approve, EApproveStatus, EApproveChannel} from '_types/approve';
import { Staff } from "_types/staff";
const API = require("@jingli/dnode-api");
import L from '@jingli/language';

require("moment-timezone");
const cache = require("common/cache");
const utils = require("common/utils");

let systemNoticeEmails = require('@jingli/config').system_notice_emails;
let config = require('@jingli/config');
export var NoCityPriceLimit = 0;
const DefaultCurrencyUnit = 'CNY';
import {restfulAPIUtil} from "api/restful";
import {
    getJLAgents,
    getMeiyaFlightData,
    getMeiyaTrainData,
    getMeiyaHotelData,
    handleTrainData,
    handleFlightData,
    handelHotelsData,
    IMeiyaAuthData,
    combineData
} from "./meiya";
import {Application, Request, Response, NextFunction} from 'express';
var moment = require('moment');
let RestfulAPIUtil = restfulAPIUtil;

import { DB } from "@jingli/database";
import { EApproveType, STEP } from '_types/approve';
import { Transaction } from 'sequelize';
import {ECostCenterType} from "_types/costCenter/costCenter";
import {IStaffSnapshot} from "../../_types/staff/staff";
import _ = require('lodash');

export interface ICity {
    name: string;
    id: string;
    isAbroad: boolean;
    letter: string;
    timezone: string;
    longitude: number;
    latitude: number;
    code?: string;  //三字码
}

export enum EBudgetType {
    TRAFFIC = 1,
    HOTEL = 2,
    SUBSIDY = 3
}

export enum TMCStatus {
    NOT_CONNECT = 1,       //未开通，没有尝试过
    TEST = 2,              //测试中
    TEST_FAIL = 3,         //测试失败
    WAIT_USE = 4,          //等待启用， 测试通过，人工配置结束
    OK_USE = 5,            //正常使用
    STOP_USE = 6           //停用
}

export enum TmcServiceType {
    FLIGHT = 1,
    TRAIN = 2,
    HOTEL = 3,
    FLIGHT_ABROAD = 4,
    TRAIN_ABROAD = 5,
    HOTEL_ABROAD = 6
}
export interface ITMCSupplier {
    id: string,
    name: string, 
    status: number,
    identify: {
        username: string,
        password: string
    },
    startWay: string,
    type: number,
    service: any,
    tmcType: string,
    companyId?: string
}

export interface IQueryBudgetParams {
    fromCity?: ICity | string;       //出发城市
    backCity?: ICity | string;       //返回城市
    segments: any;      //每段查询条件
    ret: boolean;       //是否往返
    staffs: any;  //出差员工
    travelPolicyId?: string;
    companyId?: string;
    expiredBudget?: boolean;  //过期是否可以生成预算
    combineRoom?: boolean;   //同性是否合并
    isRetMarkedData?: boolean;
    preferedCurrency?: string;
}


// interface SegmentsBudgetResult {
//     id: string;
//     cities: string[];
//     /**
//      * 数组每一项为多人每段预算信息,分为交通与住宿
//      */
//     budgets: Array<{
//         hotel: any[],   //数组每项为每个人的住宿预算
//         traffic: any[]  //数组每项为每个人的交通预算
//         subsidy: any  //每个人的补助
//     }>
// }

export interface ISearchHotelParams {
    checkInDate: string;
    checkOutDate: string;
    cityId: string;
    travelPolicyId: string;
    lat?:string;
    lon?:string;
    location?: {
        latitude: number,
        longitude: number,
    }
}

export interface ISearchTicketParams {
    leaveDate: string;
    originPlaceId: string;
    destinationId: string;
    travelPolicyId: string;
}


export default class ApiTravelBudget {
    @clientExport
    static async getBudgetInfo(params: { id: string, accountId?: string }) {
        let {id, accountId} = params;
        if (!accountId || accountId == 'undefined') {
            let staff = await Staff.getCurrent();
            accountId = staff.id;
        }

        let key = `budgets:${accountId}:${id}`;
        return cache.read(key);
    }

    @clientExport
    static getDefaultPrefer() {
        // return {};
    }

    @clientExport
    static async sendSaleSteam(params: any) {
        try {
            await API.notify.submitNotify({
                key: 'qm_tmc',
                email: config.email_address.tmcsale,
                values: {orderTyp: params.orderType, passenger: params.passenger || []}
            });
            console.log("qm_tmc is ok");
        } catch (err) {
            console.error(err);
        }
    }

    
    @clientExport
    static async getHotelsData(params: ISearchHotelParams): Promise<any> {
        let commonData;
        // let result;
        // try {
        //     result = await RestfulAPIUtil.operateOnModel({
        //         params: {
        //             method: 'post',
        //             fields: params
        //         },
        //         addUrl: 'getHotelsData',
        //         model: "budget"
        //     })
        // } catch (err) {
        //     console.log(err);
        // }
        let companyInfo = await ApiTravelBudget.getCompanyInfo(null, null, null, TMCStatus.OK_USE);
        let data = companyInfo ? companyInfo : await getJLAgents();
        // console.log('hoteldata ----->    ', data);

        let authData: IMeiyaAuthData[] = [];
        data.map((item: {identify: any, sname: string, type: string, agentType: string}) => {
            let identify = item.identify ? item.identify : null;
            let sname = item.sname;
            let type = item.type;
            let agentType = item.agentType;
            authData.push({identify, sname, type, agentType});
            return authData
        })

        // if (result.code == 0) {
        //     commonData = result.data.data;
        // }

        // if (!commonData || typeof commonData == 'undefined')
        //     return [];
        // 检查是否需要美亚数据，返回美亚数据
        // let needMeiya = await meiyaJudge();
        // if (!needMeiya) {
        //     return commonData;
        // }
        if (config.tmcFake == 1) {
            console.log("getHotelsData ===> fake data.");
            return require("meiyaFake/finallyUsingHotel");
        } else {
            let meiyaHotel = await getMeiyaHotelData(params, authData);
            console.log("meiyaHotel ===> meiyaHotel data.", meiyaHotel.length);
            if (meiyaHotel && meiyaHotel.length){
                commonData = handelHotelsData(meiyaHotel, params);
                commonData = combineData(commonData, 'name', 'agents');
                return commonData;
            }else { 
                return []
            }            
        }
    }

    @clientExport
    static async getTrafficsData(params: ISearchTicketParams): Promise<any> {
        let commonData: any[] = [];
        let commonData2: any[] = [];
        // let result;
        // try {
        //     result = await RestfulAPIUtil.operateOnModel({
        //         params: {
        //             method: 'post',
        //             fields: params
        //         },
        //         addUrl: 'getTrafficsData',
        //         model: "budget"
        //     })
        //
        // } catch (err) {
        //     console.log(err);
        // }





        let companyInfo = await ApiTravelBudget.getCompanyInfo(null, null, null, TMCStatus.OK_USE); 
        let data = companyInfo ? companyInfo : await getJLAgents();
        // console.log('trafficdata ----->   ', data);

        let authData: IMeiyaAuthData[] = [];
        data.map((item: {identify: any, sname: string, type: string, agentType: string}) => {
            let identify = item.identify ? item.identify : null;
            let sname = item.sname;
            let type = item.type;
            let agentType = item.agentType;
            authData.push({identify, sname, type, agentType});
            return authData
        });
        // if (result.code == 0) {
        //     commonData = result.data.data;
        // }
        //
        // if (!commonData || typeof commonData == 'undefined')
        //     return [];
        //检查是否需要美亚数据，返回美亚数据
        // let needMeiya = await meiyaJudge();
        // if (!needMeiya) {
        //     return commonData;
        // }
        // console.log("commonData ===> commonData data.", commonData.length)

        
        if (config.tmcFake == 1) {
            console.log("getTrafficsData ===> fake data.")
            return require("meiyaFake/finallyUsingTraffic");
        } else {
            let arr = await Promise.all([
                await getMeiyaTrainData(params, authData),
                await getMeiyaFlightData(params, authData)
            ]);
            let meiyaTrain = arr[0];
            let meiyaFlight = arr[1];
            console.log("meiyaFlight ===> meiyaFlight data.", meiyaFlight.length);
            console.log("meiyaTrain ===> meiyaTrain data.", meiyaTrain.length);

            if (meiyaFlight && meiyaFlight.length) {
                commonData = await handleFlightData(meiyaFlight,params);
                commonData = combineData(commonData, 'No', 'agents')
            }    
            if (meiyaTrain && meiyaTrain.length){      
                commonData2 = handleTrainData(meiyaTrain, params)
                commonData2 = combineData(commonData2, 'No', 'agents')
            }   
            return [...commonData, ...commonData2];
        }
    }

    @clientExport
    static async getTripTravelPolicy(travelPolicyId: string, destinationId: string) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: {
                        travelPolicyId: travelPolicyId,
                        destinationId: destinationId
                    }
                },
                addUrl: 'getTravelPolicy',
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        if (result && result.code == 0) {
            return result.data;
        } else {
            return null;
        }
    }

  

    //用于接收更新预算，并更新approve表和tripapprove上次
    @clientExport
    static async updateBudget(params: { approveId: string, budgetResult: any, isFinalFirstResponse?: boolean, alreadyMerged?: boolean }) {
        let approve = await Models.approve.get(params.approveId);

        let oldId = approve.oldId;
        if(!approve || !approve.id)
            return;
        // check tripApprove status; if passed, rejected or locked, the budget will not be updated
        let checkTripApproveStatus = await API.tripApprove.getTripApprove({id: approve.id});
        let lockBudget: boolean = checkTripApproveStatus ? checkTripApproveStatus['lockBudget'] : null;
        let tripApproveStatus = checkTripApproveStatus ? checkTripApproveStatus['status'] : null;

        if (approve.status == EApproveStatus.CANCEL ||(tripApproveStatus && (tripApproveStatus == QMEApproveStatus.PASS ||
             tripApproveStatus == QMEApproveStatus.REJECT)) || lockBudget) {
            console.log('tripApproveStatus----->  ', tripApproveStatus);
            console.log('lockBudget------------->   ', lockBudget);
            console.log('NO UPDATE BUDGET ANY MORE');
        } else {  // else update as usual
            let isFinalInApprove: boolean = false;
            let approveStep = approve.step;  //approve表中现有的是否为最终结果 budgetStep
            if (approveStep == STEP.FINAL) {
                isFinalInApprove = true;
            }

            let queryParams = approve.data;
            if (typeof approve.data == 'string') {
                queryParams = JSON.parse(approve.data);
            }

            let staffId = queryParams.query['staffId'];
            if (!staffId || staffId == 'undefined') {
                staffId = approve.submitter;
            }

            let staff = await Models.staff.get(staffId);
            if (!staff) {
                throw L.ERR.ERROR_CODE_C(500, '用户不存在或者已被删除')
            }
            let companyId = staff.company.id;

            let _budgets = params.budgetResult.budgets;
            
            //预算服务回调更新预算是也需要做新老预算合并
            let oldBudgets = [];
            if(!params.alreadyMerged){
                if(oldId){
                    let data = approve.data;
                    if(typeof data == 'string') data = JSON.parse(data);
                    let params = data.query;
                    if(typeof params == 'string') params = JSON.parse(params);
                    let modifyParams = await ApiTravelBudget.dealModifyParams(params);
                    oldBudgets = modifyParams.oldBudgets;
                    // oldBudgets = data.oldBudgets;
                }
    
                if(oldId && oldBudgets && oldBudgets.length){
                    _budgets = await ApiTravelBudget.mergeBudget(oldBudgets, _budgets);
                }
            }
            
            let ps: Promise<any>[] = _budgets.map(async (item: ICreateBudgetAndApproveParamsNew) => {
                return await ApiTravelBudget.transformBudgetData(item, companyId);
            });
            let budgets = await Promise.all(ps);
            let totalBudget = 0;
            if (budgets && budgets.length > 0) {
                budgets.forEach(function (item) {
                    totalBudget += item.price;
                })
            }
            const company = await Models.company.get(companyId)
            if (!isFinalInApprove || params.isFinalFirstResponse) {  //看表中的budget是否是最终结果，最终结果还没返回过，则更新approve表，表示还不可以进行审批，或者是第一次请求时候返回为最终结果
                approve.budget = totalBudget;
                approve.step = params.budgetResult.step;
                if (typeof approve.data == 'string') {
                    approve.data = JSON.parse(approve.data);
                }
                approve.data = {budgets: budgets, query: approve.data.query, oldBudgets: oldBudgets};
                approve = await approve.save();
                if (approve.step === STEP.FINAL && company.oa != EApproveChannel.AUTO) {
                    let params = {approveNo: approve.id};
                    let tripApprove = await API.tripApprove.retrieveDetailFromApprove(params);

                    let returnApprove = await API.eventListener.sendEventNotice({ eventName: "NEW_TRIP_APPROVE", data: tripApprove, companyId: approve.companyId });
                    if(returnApprove){
                        if(oldId){
                            let modifiedTripPlan = await Models.tripPlan.get(oldId);
                            if(modifiedTripPlan){
                                modifiedTripPlan.modifyStatus = EModifyStatus.MODIFYING;
                                await modifiedTripPlan.save();
                            }
                        }
                        let tripPlanLog = Models.tripPlanLog.create({
                            tripPlanId: approve.id,
                            userId: approve.submitter,
                            remark: '提交审批单，等待审批',
                            approveStatus: EApproveResult.WAIT_APPROVE
                        });
                        await tripPlanLog.save();
                        await API.tripApprove.sendTripApproveNotice({approveId: tripApprove.id, nextApprove: false});
                        await ApiTravelBudget.sendTripApproveNoticeToSystem({approveId: tripApprove.id, staffId: staffId});
                    }

                }
            } else {  //最终结果已经返回过
                if (params.budgetResult.step == STEP.FINAL) {
                    approve.budget = totalBudget;
                    await approve.save();
                    if (company.oa != EApproveChannel.AUTO) {
                        await API.tripApprove.updateTripApprove({
                            id: approve.id,
                            budget: totalBudget,
                            companyId: companyId,
                            budgetInfo: budgets
                        });
                    }
                    console.log(`'tripApproveBudgetUpdate:'${approve.id}`);
                    API.broadcast('tripApproveBudgetUpdate:' + approve.id, 'FIN', 'UPDATED');
                }
            }
        }
    }

    /**
     * 修改行程处理参数和原预算结果
     * @param {ICreateBudgetAndApproveParamsNew} params
     * @param {string} approveId
     * @returns {Promise<{params: any; oldBudgets: any; _index: number}>}
     */
    static async dealModifyParams(_params: ICreateBudgetAndApproveParamsNew): Promise<{params: any, oldBudgets: any, _index: number}>{
        let params = _.cloneDeep(_params);
        let approveId = params.modifiedId;
        let destinationPlacesInfo = params.destinationPlacesInfo;
        let resultDestinationPlacesInfo: ISegment[] = [];
        let oldBudgets: any = [];
        let approve = await Models.approve.get(approveId);
        let data = approve.data;
        if(typeof data == 'string'){
            data = JSON.parse(data);
        }
        let _index = -1;//You用重新拉回来的预算index从_index -1 开始判断
        destinationPlacesInfo.forEach((item, index) => {
            if(!(item.leaveDate instanceof Date)) item.leaveDate = moment(item.leaveDate).toDate();
            if(!(item.goBackDate instanceof Date)) item.goBackDate = moment(item.goBackDate).toDate();
            if(item.leaveDate && (item.leaveDate.getTime() - new Date().getTime()) > 0){
                //该段行程未开始 用新参数拉取新预算
                _index = index;
                resultDestinationPlacesInfo.push(item);
            }else{
                if(item.goBackDate && (item.goBackDate.getTime() - new Date().getTime()) > 0){
                    //该段行程已部分结束 保留部分原有预算结果 部分重新拉取预算
                    let days = moment(new Date()).startOf('day').diff(moment(item.leaveDate).startOf('day'), "days");
                    data.budgets.forEach((b => {
                        if(b.index == index){
                            //保留部分原有预算结果
                            if(b.tripType == ETripType.OUT_TRIP){
                                b.budgetSource = "oldBudgetComplete";
                                oldBudgets.push(b);
                            }

                            if(b.type == ETripType.HOTEL || b.type == ETripType.SUBSIDY){
                                b.budgetSource = "oldBudgetIncomplete";
                                let singlePrice = b.price/b.duringDays;
                                b.price = singlePrice * days;
                                if( b.type == ETripType.SUBSIDY){
                                    let templates = b.templates;
                                    if(templates && templates.length){
                                        templates.forEach((t: any) => {
                                            t.price = t.money * days;
                                        })
                                    }

                                }
                                b.duringDays = days;
                                oldBudgets.push(b);
                            }
                        }
                    }))
                    //部分重新拉取预算
                    item.leaveDate = moment().add(1, 'h').toDate();//不能直接用now()拉取预算时时间可能已经过了会报错
                    item.isNeedTraffic = false;
                    resultDestinationPlacesInfo.push(item);

                }else{
                    //该段行程已完全结束 保留原有预算结果 不需重新拉取预算
                    data.budgets.forEach((b => {
                        if(b.index == index){
                            b.budgetSource = "oldBudgetComplete";
                            oldBudgets.push(b);
                        }
                    }))
                }
            }


        })

        params.destinationPlacesInfo = resultDestinationPlacesInfo;
        return {params: params, oldBudgets: oldBudgets, _index: _index};

    }

    /**
     * 修改行程后整合老预算与新预算
     * @param {any[]} oldbudget
     * @param {any[]} newBudget
     * @returns {any[]}
     */
    static async mergeBudget(oldbudget: any[], newBudget: any[]){
        let resultBudget: any[] =  _.cloneDeep(oldbudget);
        let oldIndex = oldbudget[oldbudget.length -1].index + 1;
        let mergeItem = false;
        for(let budget of oldbudget){
            if(budget.index == (oldIndex-1) && budget.budgetSource == 'oldBudgetIncomplete'){
                oldIndex = oldIndex - 1;
                mergeItem = true;
                break;
            }
        }

        let mergeIndex: number[] = [];
        newBudget.forEach((b) => {
            if (b.index == 0) {
                mergeIndex.push(b.type)
            }
        })
        newBudget.forEach((item) => {
            if(item.index == 0 && mergeItem){
                //拼接budgetItem
                item.index = item.index + oldIndex;
                oldbudget.forEach((oldItem, index) => {
                    if(oldItem.index == oldIndex && oldItem.type == item.type && oldItem.budgetSource == 'oldBudgetIncomplete'){
                        item.price = item.price + oldItem.price;
                        item.duringDays = item.duringDays + oldItem.duringDays;
                        if(item.type == ETripType.HOTEL) item.checkInDate = oldItem.checkInDate;
                        if(item.type == ETripType.SUBSIDY) item.fromDate = oldItem.fromDate;
                        resultBudget.splice(index, 1, item);
                    }
                    if(oldItem.index == oldIndex && oldItem.budgetSource == 'oldBudgetIncomplete' && mergeIndex.indexOf(oldItem.type) < 0){
                        if(oldItem.type == ETripType.HOTEL) oldItem.checkOutDate = new Date();
                        if(oldItem.type == ETripType.SUBSIDY) oldItem.endDate = new Date();
                        resultBudget.splice(index, 1, oldItem);
                    }
                })

            }else{
                item.index = item.index + oldIndex;
                resultBudget.push(item);
            }

        })

        return resultBudget;
    }


    /**
     * @method getTravelPolicyBudgetNew
     *
     * 获取合适差旅预算
     *
     * @param {Object} params 参数
     * @param {String} params.originPlace 出发地
     * @param {String} params.destinationPlace 目的地
     * @param {String} params.leaveDate 出发时间 YYYY-MM-DD
     * @param {String} [params.latestArriveTime] 最晚到达时间
     * @param {String} [params.leaveTime] 出发最晚到达时间 HH:mm
     * @param {String} [params.goBackDate] 返回时间(可选) YYYY-MM-DD
     * @param {String} [params.goBackTime] 返程最晚时间
     * @param {String} [params.checkInDate] 如果不传=leaveDate 入住时间
     * @param {String} [params.checkOutDate] 如果不传=goBackDate 离开时间
     * @param {String} [params.businessDistrict] 商圈ID
     * @param {Boolean} [params.isNeedHotel] 是否需要酒店
     * @param {Boolean} [params.isRoundTrip] 是否往返 [如果为true,goBackDate必须存在]
     * @param {Boolean} [params.isNeedTraffic] 是否需要交通
     * @param {Striing} [params.reason] 出差事由
     * @param {String} [params.hotelName] 住宿地标名称
     * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
     */
    @clientExport
    static async getTravelPolicyBudgetNew(params: ICreateBudgetAndApproveParamsNew, isIntoApprove: boolean, approveId?: string): Promise<any> {
        //测试
        /*params.modifiedId = '4b8aec10-2b4a-11e8-a6d1-5f5b59e775c0';
        params.destinationPlacesInfo.forEach((d, index) => {
            d.leaveDate = moment(d.leaveDate).subtract(6, 'days').toDate();
            d.goBackDate = moment(d.goBackDate).subtract(6, 'days').toDate();
            params.destinationPlacesInfo[index] = d;
        })*/

        let modifiedId = params.modifiedId;
        let getBudgetParams = params;
        let oldBudgets = [];

        let staffId = params['staffId'];
        let preferedCurrency = params["preferedCurrency"];
        preferedCurrency = preferedCurrency && typeof (preferedCurrency) != 'undefined' ? preferedCurrency : DefaultCurrencyUnit;

        let tripNumCost = 0;  //企业行程点数花费

        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        let submitterSnapshot = await staff.getStaffSnapshot();
        if (!staff) {
            throw L.ERR.ERROR_CODE_C(500, '用户不存在或者已被删除')
        }
        let companyId = staff.companyId;
        let company = await Models.company.get(companyId);
        let travelPolicy = await staff.getTravelPolicy();
        if (!travelPolicy) {
            throw new L.ERROR_CODE_C(500, `差旅标准还未设置`);
        }
        params.travelPolicyId = travelPolicy.id;

        if(params.feeCollected){
            let cc = await Models.costCenter.get(params.feeCollected);
            if(cc && cc.type == ECostCenterType.PROJECT){
                let pts = await Models.projectStaffTravelPolicy.all({where: {staffId: staffId, projectId: params.feeCollected}, order: [['createdAt', 'desc']]});
                if(pts && pts.length){
                    params.travelPolicyId = pts[0].travelPolicyId;
                }
                let project = await Models.project.get(params.feeCollected);
                params.feeCollectedInfo = {id: project ? project.id : '', name: project ? project.name : ''};
            }else if(cc && cc.type == ECostCenterType.DEPARTMENT){
                let dept = await Models.department.get(params.feeCollected);
                params.feeCollectedInfo = {id: dept ? dept.id : '', name: dept ? dept.name : ''};
            }

        }

        if (!params.staffList) {
            params.staffList = [];
        }
        if (params.staffList.indexOf(staffId) < 0) {
            params.staffList.push(staffId);
        }
        let count = params.staffList.length;
        let staffListSnapshot: IStaffSnapshot[] = [];
        let staffs: {gender: number, policy: string}[] = [];
        for (let i = 0; i < count; i++) {
            let staff = params.staffList[i];
            let _staff = await Models.staff.get(staff);
            let __staff: {gender: number, policy: string} = {
                gender: _staff && _staff.sex || EGender.MALE,
                policy: 'domestic',
            };
            staffs.push(__staff);
            let _staffSnapshot = await _staff.getStaffSnapshot();
            staffListSnapshot.push(_staffSnapshot);
        }
        

        let feeCollectedType = params['feeCollectedType'];
        let feeCollected = params['feeCollected'];
        let departmentId: string = '';
        let projectId: string = '';
        let feeCollectedName = '';
        if (feeCollectedType == 0) {
            departmentId = feeCollected || '';
            let department = await Models.department.get(departmentId);
            feeCollectedName = department && department.name || '';

        } else if (feeCollectedType == 1) {
            projectId = feeCollected || '';
            let project = await Models.project.get(projectId);
            feeCollectedName = project && project.name || '';
        }
        let approveUser: Staff | undefined = params['approveUser'];
        let approveUserSnapshot: any = {}
        if(approveUser && approveUser.id){
            let s = await Models.staff.get(approveUser.id);
            approveUserSnapshot = await s.getStaffSnapshot();
        }

        if (approveId) {
            let checkApprove = await Models.approve.get(approveId);
            let approveStatus = checkApprove && checkApprove['tripApproveStatus'];
            if (approveStatus == QMEApproveStatus.PASS || approveStatus == QMEApproveStatus.REJECT ||
                approveStatus == QMEApproveStatus.CANCEL) {  //若审批已通过、驳回或已撤销，锁定budget不再更新
                await API.tripApprove.updateTripApprove({id: approveId, lockBudget: true, companyId});
            } else {   // 否则将lockBudget标示置回初始值，接受budget更新
                await API.tripApprove.updateTripApprove({id: approveId, lockBudget: false, companyId});
            }
        }

        let approve;
        if (!isIntoApprove) {  //判断是否是审批人查看审批单时进行的第二次拉取数据 
            //创建approve，获得approveId用于URL和更新
            approve = Approve.Create({
                approveUser: params.approveUser ? params.approveUser.id : '',
                approveUserSnapshot: approveUserSnapshot,
                type: EApproveType.TRAVEL_BUDGET,
                companyId: companyId,
                staffList: params.staffList,
                staffListSnapshot: staffListSnapshot,
                submitter: staffId,
                submitterSnapshot: submitterSnapshot,
                tripApproveStatus: QMEApproveStatus.WAIT_APPROVE,
                title: feeCollectedName
            });
            approveId = approve.id;
            if(modifiedId) approve.oldId = modifiedId;

        }

        if(modifiedId){
            let modifyParams = await ApiTravelBudget.dealModifyParams(params);
            getBudgetParams = modifyParams.params;
            oldBudgets = modifyParams.oldBudgets;
        }

        let budgetResult: any = await ApiTravelBudget.createNewBudget({
            callbackUrl: `${config.host}/api/v1/budget/${approveId}/updateBudget`,
            preferedCurrency: preferedCurrency,
            travelPolicyId: travelPolicy['id'],
            companyId,
            staffs,
            destinationPlacesInfo: getBudgetParams.destinationPlacesInfo,
            originPlace: getBudgetParams.originPlace,
            isRoundTrip: getBudgetParams.isRoundTrip,        //是否为往返
            goBackPlace: getBudgetParams.goBackPlace         //返回地
        });

        

        let segmentsBudget = budgetResult.budgets;


        let ps: Promise<any>[] = segmentsBudget.map(async (item: any) => {
            return await ApiTravelBudget.transformBudgetData(item, companyId);
        });
        let budgets = await Promise.all(ps);

        if(modifiedId && oldBudgets && oldBudgets.length){
            budgets = await ApiTravelBudget.mergeBudget(oldBudgets, budgets);
        }


        //计算总预算用于更新approve
        let eachBudgetSegIsOk: boolean = true;
        let totalBudget = 0;
        budgets.forEach(function (item) {
            if (item.tripType != ETripType.SUBSIDY && !item.budgetSource) {
                tripNumCost = tripNumCost + 1;
            }
            if (item.price < 0) {
                eachBudgetSegIsOk = false;
            }
            totalBudget += item.price;
        })
        if (params && params.staffList) {
            tripNumCost *= params.staffList.length;
        }
        if (eachBudgetSegIsOk && !isIntoApprove) {
            approve && await approve.save();
            if(modifiedId){
                let modifiedApprove = await Models.approve.get(modifiedId);
                modifiedApprove.modifyStatus = EModifyStatus.MODIFYING;
                await modifiedApprove.save();
            }
        }
        if (!eachBudgetSegIsOk) {
            throw L.ERR.ERROR_CODE_C(500, '获取预算失败，请稍后重试');
        }
        
        let obj: any = {};
        obj.budgets = budgets;
        obj.oldBudgets = oldBudgets;
        obj.query = params;
        obj.createAt = Date.now();

        await DB.transaction(async function (t: Transaction) {
            if (!company || !staff) {
                throw L.ERR.ERROR_CODE_C(500, '企业信息或员工信息有误');
            }
            let result = await API.company.verifyCompanyTripNum({
                tripNum: tripNumCost,
                companyId: company.id,
                accountId: staff.id,
                query: params,
                isCheckTripNumStillLeft: (isIntoApprove && eachBudgetSegIsOk) //领导查看审批单时，要检查企业剩余流量包数是否足够
            });
            // console.log('isCheckTripNumStillLeft', isIntoApprove && eachBudgetSegIsOk);
            obj.query['frozenNum'] = result.frozenNum;
            await company.frozenTripPlanNum(result.frozenNum); //企业冻结行程点数

            //拿到预算后更新approve表
            if (!isIntoApprove && eachBudgetSegIsOk) {//判断是否是审批人查看审批单时进行的第二次拉取数据
                let updateBudget = await Models.approve.get(approveId || '');
                // let submitter = await Staff.getCurrent();
                let submitter = await Models.staff.get(staff.id);
                if (!submitter || !updateBudget) throw new Error('submitter or updateBudget is null')
                updateBudget.submitter = submitter.id;
                updateBudget.data = obj;
                updateBudget.channel = submitter.company.oa;
                updateBudget.type = EApproveType.TRAVEL_BUDGET;
                updateBudget.approveUser = approveUser ? approveUser.id : '';
                updateBudget.staffList = obj.query.staffList;
                updateBudget.budget = totalBudget;
                updateBudget.step = budgetResult.step;
                updateBudget.startAt = obj.query.destinationPlacesInfo[0].leaveDate;
                await updateBudget.save();
            }
            if (budgetResult.step == 'FIN' && eachBudgetSegIsOk) {
                await ApiTravelBudget.updateBudget({
                    approveId: approveId || '',
                    budgetResult: budgetResult,
                    isFinalFirstResponse: (isIntoApprove ? false : true),
                    alreadyMerged: true
                });
            }
        }).catch(async function (err: Error) {
            // company.extraTripPlanFrozenNum = extraTripPlanFrozenNum;
            // company.tripPlanFrozenNum = originTripPlanFrozenNum;
            company && await company.reload();
            console.info(err);
            throw L.ERR.ERROR_CODE_C(500, '提交审批失败,请稍后重试');
        });

        let _id = Date.now() + utils.getRndStr(6);
        let key = `budgets:${staffId}:${_id}`;
        await cache.write(key, JSON.stringify(obj));
        // await ApiTravelBudget.sendTripApproveNoticeToSystem({cacheId: _id, staffId: staffId});
        return {approveId: approveId, budgetId: _id};
    }

    //获取公司信息
    @clientExport
    static async getCompanyInfo(sname?:string, staffId?: string, type?: number, status?: number): Promise<any> {
        let staff: Staff;
        if(staffId) staff = await Models.staff.get(staffId);
        if(!staffId) {
            staff = await Staff.getCurrent(); 
        }    
        let companyId = staff && (staff.company ? staff.company.id: staff.companyId);
        // let companyId = "4a1f37e0-0a54-11e7-ad22-b1cccc4cc277";
        if(!companyId) throw L.ERR.HAS_NOT_BIND();
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'put',
                    fields: {
                        companyId: companyId,
                        sname,
                        type: type,
                        status: status
                    }
                },
                addUrl: `${companyId}/data`,
                model: "TmcSupplier"
            })
            if(result.code != 0) throw L.ERR.HAS_NOT_BIND();
            return result.data
        } catch (err) {
            console.log(err);
            throw L.ERR.NOT_ACCEPTABLE();
        }

    }

    static async transformBudgetData(budget: any, companyId: string) {
        budget.index = budget.index;
        delete budget.markedScoreData;
        delete budget.prefers;
        switch (budget.type) {
            case EBudgetType.HOTEL:
                let cityObj = await API.place.getCityInfo({cityCode: budget.city, companyId: companyId});
                let isAccordHotel = await Models.accordHotel.find({where: {cityCode: cityObj.id, companyId}});
                if (isAccordHotel && isAccordHotel.length) {
                    budget.price = isAccordHotel[0].accordPrice;
               }

                budget.hotelName = budget.name;
                budget.cityName = cityObj.name;
                budget.tripType = ETripType.HOTEL;
                budget.price = budget.price;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                return budget;

            case EBudgetType.TRAFFIC:
                budget.cabinClass = budget.cabin;
                budget.originPlace = budget.fromCity;
                budget.destination = budget.toCity;

                budget.price = budget.price;
                budget.unit = budget.unit;
                budget.rate = budget.rate;
                budget.type = budget.trafficType;
                budget.tripType = ETripType.OUT_TRIP;
                if(budget.backOrGo == EBackOrGo.BACK_TRIP){
                    budget.tripType = ETripType.BACK_TRIP;
                }
                return budget;

            case EBudgetType.SUBSIDY:
                budget.price = budget.price;
                budget.tripType = ETripType.SUBSIDY;
                if (budget.templates) {
                    budget.templates.forEach((t: any) => {
                        t.price = t.price;
                    })
                }
                return budget;
            default:
                return budget;
        }
    }


    static async sendTripApproveNoticeToSystem(params: { staffId: string, cacheId?: string,  approveId?: string}) {
        let {cacheId, staffId, approveId} = params;
        if (!staffId || staffId == 'undefined') {
            let currentStaff = await Staff.getCurrent();
            staffId = currentStaff.id;
        }
        let staff = await Models.staff.get(staffId);
        if (!staff) throw new Error('staff is null')
        let company = staff.company;

        if (company.name != "鲸力智享") {

            try {
                await Promise.all(systemNoticeEmails.map(async function (s: {
                    email: string, name: string
                }) {
                    try {
                        await API.notify.submitNotify({
                            key: 'qm_notify_system_new_travelbudget',
                            email: s.email,
                            values: {cacheId: cacheId, name: s.name, staffId: staffId, approveId: approveId}
                        })

                    } catch (err) {
                        console.error(err);
                    }
                }));
            } catch (err) {
                console.error('发送系统通知失败', err)
            }
        }
        return true;
    }

    // 获取鲸力供应商信息
    @clientExport 
    static async getJLAgentSupplier() {
        let agents = await getJLAgents();
        return agents;
    }

    @clientExport
    static async reportBudgetError(params: { budgetId: string }) {
        let staff = await Staff.getCurrent();
        let {budgetId} = params;
        let content = await ApiTravelBudget.getBudgetInfo({id: budgetId, accountId: staff.id});
        let budgets = content.budgets;
        let ps = budgets.map(async (budget: any): Promise<any> => {
            if (!budget.id) {
                return true;
            }
            let log = await Models.travelBudgetLog.get(budget.id);
            if (!log) return null
            log.status = -1;
            return log.save();
        });
        await Promise.all(ps);
        return true;
    }

    // params: IQueryBudgetParams
    static async createNewBudget(params: any) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'post',
                    fields: params
                },
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        console.info("result============",result);
        if(!result || !result.data) {
            throw new Error("拉取预算失败");
        }
        return result.data;
    }

    static async getBudgetById(params: { id: string }) {
        let result;
        try {
            result = await RestfulAPIUtil.operateOnModel({
                params: {
                    method: 'GET',
                    fields: params
                },
                model: "budget"
            })
        } catch (err) {
            console.log(err);
        }
        return result.data;
    }

    static __initHttpApp(app: Application) {

        function _auth_middleware(req: Request, res: Response, next?: NextFunction) {
            let key = req.query.key;
            if (!key || key != 'jingli2016') {
                return res.send(403)
            }
            next && next();
        }

        app.get("/api/budgets", _auth_middleware, function (req, res, next) {
            let {p, pz, type} = req.query;
            if (!p || !/^\d+$/.test(p) || p < 1) {
                p = 1;
            }
            if (!pz || !/^\d+$/.test(pz) || pz < 1) {
                pz = 5;
            }

            API.budget.getBudgetItems({page: p, pageSize: pz, type: type,})
                .then((data: any) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(data);
                })
                .catch(next);
        })

        app.post('/api/budgets', _auth_middleware, function (req, res, next) {
            let {query, prefers, originData, type} = req.body;
            originData = JSON.parse(originData);
            query = JSON.parse(query);
            prefers = JSON.parse(prefers);

            return API.budget.debugBudgetItem({query, originData, type, prefers})
                .then((result: any) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.json(result);
                })
                .catch(next);
        })
    }
}

/* as ICreateBudgetAndApproveParamsNew; */
// let param = {
//     checkInDate: "2018-02-21",
//     checkOutDate: "2018-02-22",
//     cityId: "1814905",
//     lat:"29.560997000",
//     lon:"106.583194000",
//     travelPolicyId: "asdasdlkaldaklslkdka",

//     // leaveDate: "2018-04-21",
//     // originPlaceId: "CT_131",
//     // destinationId: "CT_289",
// }
// setTimeout(async ()=>{
//     console.log("test go go");
//     let result = await ApiTravelBudget.getHotelsData(param);
//         console.log(result,"<=============")
// }, 8000);