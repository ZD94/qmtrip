/**
 * Created by yumiao on 15-12-10.
 */


"use strict";
import { DB } from '@jingli/database';
let uuid = require("node-uuid");
import L from '@jingli/language';
let API = require('@jingli/dnode-api');
import Logger from '@jingli/logger';
let logger = new Logger("tripPlan");
const config = require("@jingli/config");

let scheduler = require('common/scheduler');
let moment = require("moment");
require("moment-timezone");
import _ = require('lodash');
const R = require('lodash/fp')
import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import {
    Project, TripPlan, TripDetail, EPlanStatus, TripPlanLog, ETripType, EAuditStatus, EInvoiceType,
    EPayType, ESourceType, EInvoiceStatus, TrafficEInvoiceFeeTypes, ProjectStaff, EProjectStatus, ETripDetailStatus, EOrderStatus
} from "_types/tripPlan";
import {Models} from "_types";
import {FindResult} from "common/model/interface";
import {Staff, PointChange} from "_types/staff";
import {conditionDecorator, condition, modelNotNull} from "api/_decorator";
import { getSession } from "@jingli/dnode-api";
import { AgencyUser, Agency } from "_types/agency";
import { makeSpendReport } from './spendReport';
import { TripDetailTraffic, TripDetailHotel, TripDetailSubsidy, TripDetailSpecial, TripDetailInvoice } from "_types/tripPlan";
import { ENoticeType } from "_types/notice/notice";
import { MPlaneLevel, MTrainLevel, EModifyStatus } from "_types";
import { ISegment, ExpendItem } from '_types/tripPlan'
const projectCols = Project['$fieldnames'];
import { restfulAPIUtil } from "api/restful"
import { FindOptions } from 'sequelize';
import { Department } from '_types/department';
import { ITravelBudgetInfo } from 'http/controller/budget';
let RestfulAPIUtil = restfulAPIUtil;
import { Company } from '_types/company';
import { CoinAccount, CoinAccountChange, COIN_CHANGE_TYPE } from '_types/coin';
import { BUDGET_CHANGE_TYPE, ECostCenterType, CostCenter } from '_types/costCenter';
import { ICity } from 'api/travelBudget';
import SavingEvent from '../eventListener/savingEvent';

interface ReportInvoice {
    type: string;
    date: Date;
    invoiceInfo: string;
    quantity: number;
    money: number;
    departCity?: string;
    arrivalCity?: string;
    remark?: string;
    trafficType?: string;
    trafficInfo?: string;
    duration?: string;
}

class TripPlanModule {

    /**
     * 获取出差计划中发送邮件的模板数据详情
     * @param tripPlan
     * @returns {{go: string, back: string, hotel: string}}
     */
    static async getPlanEmailDetails(tripPlan: TripPlan): Promise<{ go: string, back: string, hotel: string, subsidy: string, special?: string }> {
        let go = '', back = '', hotelStr = '', subsidyStr = '', specialStr = '';
        let sumSubsidy = 0;

        let tripDetails = await Models.tripDetail.find({
            where: { tripPlanId: tripPlan.id },
            order: [['created_at', 'asc']]
        });
        let ps = tripDetails.map(async (tripDetail) => {
            switch (tripDetail.type) {
                case ETripType.OUT_TRIP:
                    let g = <TripDetailTraffic>tripDetail;
                    var deptCity = await API.place.getCityInfo({ cityCode: g.deptCity })
                    var arrivalCity = await API.place.getCityInfo({ cityCode: g.arrivalCity });
                    go += moment(g.deptDateTime).format('YYYY-MM-DD') + ', ' + deptCity.name + ' 到 ' + arrivalCity.name;
                    // if (g.latestArriveTime)
                    //     go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
                    go += ', 动态预算￥' + g.budget + '<br>';
                    break;
                case ETripType.BACK_TRIP:
                    let b = <TripDetailTraffic>tripDetail;
                    var deptCity = await API.place.getCityInfo({ cityCode: b.deptCity })
                    var arrivalCity = await API.place.getCityInfo({ cityCode: b.arrivalCity });
                    back += moment(b.deptDateTime).format('YYYY-MM-DD') + ', ' + deptCity.name + ' 到 ' + arrivalCity.name;
                    // if (b.latestArriveTime)
                    //     back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
                    back += ', 动态预算￥' + b.budget + '<br>';
                    break;
                case ETripType.HOTEL:
                    let h = <TripDetailHotel>tripDetail;
                    var city = await API.place.getCityInfo({ cityCode: h.city });
                    hotelStr += moment(h.checkInDate).format('YYYY-MM-DD') + ' 至 ' + moment(h.checkOutDate).format('YYYY-MM-DD') +
                        ', ' + city.name + ',';
                    if (h.placeName) {
                        hotelStr += h.placeName + ',';
                    }
                    hotelStr += '动态预算￥' + h.budget + '<br>';
                    break;
                case ETripType.SUBSIDY:
                    let s = <TripDetailHotel>tripDetail;
                    sumSubsidy += s.budget;
                    break;
                case ETripType.SPECIAL_APPROVE:
                    let specialBudget = <TripDetailSpecial>tripDetail;
                    specialStr += '￥' + specialBudget.budget;
                    break;
                default:
                    throw new Error('not support tripdetail Type')
            }
        })
        await (Promise.all(ps));
        subsidyStr = `￥${sumSubsidy}`;
        return { go: go, back: back, hotel: hotelStr, subsidy: subsidyStr, special: specialStr };
    }

    static async getEmailInfoFromDetails(details: TripDetail[]): Promise<{ go: string, back: string, hotel: string, subsidy: string, special?: string }> {
        let goStr = '', backStr = '', hotelStr = '', subsidyStr = '', specialStr = '';
        let sumSubsidy = 0;
        let ps = details.map(async (d) => {
            switch (d.type) {
                case ETripType.OUT_TRIP:
                    let d1: TripDetailTraffic = <TripDetailTraffic>d;
                    var deptCity = await API.place.getCityInfo({ cityCode: d1.deptCity });
                    var arrivalCity = await API.place.getCityInfo({ cityCode: d1.arrivalCity })
                    goStr += `${moment(d1.deptDateTime).format('YYYY-MM-DD')}, ${deptCity.name} 到 ${arrivalCity.name}`;
                    // if (d.latestArriveTime)
                    //     goStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    goStr += `, 动态预算￥${d1.budget}<br>`;
                    break;
                case ETripType.BACK_TRIP:
                    let d2: TripDetailTraffic = <TripDetailTraffic>d;
                    var deptCity = await API.place.getCityInfo({ cityCode: d2.deptCity });
                    var arrivalCity = await API.place.getCityInfo({ cityCode: d2.arrivalCity })
                    backStr += `${moment(d2.deptDateTime).format('YYYY-MM-DD')}, ${deptCity.name} 到 ${arrivalCity.name}`;
                    // if (d.latestArriveTime)
                    //     backStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    backStr += `, 动态预算￥${d2.budget}<br>`;
                    break;
                case ETripType.HOTEL:
                    let d3: TripDetailHotel = <TripDetailHotel>d;
                    var city = await API.place.getCityInfo({ cityCode: d3.city });
                    hotelStr += `${moment(d3.checkInDate).format('YYYY-MM-DD')} 至 ${moment(d3.checkOutDate).format('YYYY-MM-DD')}, ${city.name}`;
                    if (d3.placeName) {
                        hotelStr += `, ${d3.placeName}`;
                    }
                    hotelStr += `, 动态预算￥${d3.budget}<br>`;
                    break;
                case ETripType.SUBSIDY:
                    let d4 = <TripDetailSubsidy>d;
                    sumSubsidy += d4.budget;
                    break;
                case ETripType.SPECIAL_APPROVE:
                    let d5 = <TripDetailSpecial>d;
                    specialStr += `￥${d5.budget}`;
                    break;
                default:
                    throw new Error('not support tripdetail Type')
            }
        });
        await Promise.all(ps);
        subsidyStr = `￥${sumSubsidy}`;
        return { go: goStr, back: backStr, hotel: hotelStr, subsidy: subsidyStr, special: specialStr };
    }

    /**
     * 获取计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{ if: condition.canGetTripPlan('0.id') }])
    static getTripPlan(params: { id: string }): Promise<TripPlan> {
        return Models.tripPlan.get(params.id);
    }

    /**
     * 更新计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['isNeedTraffic', 'isNeedHotel', 'title', 'description', 'status', 'deptCity',
        'deptCityCode', 'arrivalCity', 'arrivalCityCode', 'startAt', 'backAt', 'remark', 'readNumber'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{ if: condition.isMyTripPlan('0.id') }])
    static async updateTripPlan(params: TripPlan): Promise<TripPlan> {
        let tripPlan = await Models.tripPlan.get(params.id);
        for (let key in params) {
            tripPlan[key] = params[key];
        }
        return tripPlan.save();
    }

    /**
     * 企业福利账户余额(鲸币)自动兑换员工未结算的出差奖励
     * @param params
     * @param params.id tripPlan id
     */
    @clientExport
    static async autoSettleReward(params: {id: string,}): Promise<boolean> {
        if (typeof params == 'string') {
            params = JSON.parse(params);
        }
        let company: Company;
        let companyCoinAccount: CoinAccount | undefined;
        let staff: Staff | undefined;
        let coinAccount: CoinAccount | undefined;
        let coinAccountChange: CoinAccountChange | undefined;
        let companyCoinAccountChange: CoinAccountChange | undefined;
        let pointChange: PointChange | undefined;
        let unSettledRewardTripPlan: TripPlan | undefined;

        try {
            await DB.transaction(async function (t) {
            unSettledRewardTripPlan = await Models.tripPlan.get(params.id);  //该次行程

            company = await Models.company.get(unSettledRewardTripPlan.companyId);
            let points2coinRate: number = company.points2coinRate;  //企业余额可转为鲸币的比例
            companyCoinAccount = await Models.coinAccount.get(company.coinAccountId);
            let companyBalanceCoins: number = companyCoinAccount.income - companyCoinAccount.consume - companyCoinAccount.locks;  //企业账户余额(鲸币)

            if (companyBalanceCoins > 0) {   
                if (companyBalanceCoins > (unSettledRewardTripPlan.reward * points2coinRate)){  //企业余额足够兑换该员工的节省奖励
                    let rewardMoney: number = unSettledRewardTripPlan.reward;  //企业对该员工的该次行程的奖励金额
                    
                    unSettledRewardTripPlan.isSettled = true;  //结算flag更改
                    companyCoinAccount.consume = Math.floor(Number(companyCoinAccount.consume) + rewardMoney * points2coinRate);  //企业余额扣除相应的奖励金额鲸币
                    await companyCoinAccount.save();

                    staff = await Models.staff.get(unSettledRewardTripPlan.accountId);
                    staff.balancePoints = Math.floor(Number(staff.balancePoints) - rewardMoney);  //员工将由该次行程节省的奖励积分兑换
                    await staff.save();

                    unSettledRewardTripPlan.isSettled = true;
                    await unSettledRewardTripPlan.save();  //将该tripPlan的是否结算奖励标志设为true

                    let account = await Models.account.get(staff.accountId);
                    if(!account.coinAccountId) {
                        let coinAccount: CoinAccount = CoinAccount.create({
                            income: 0,
                            consume: 0,
                            locks: 0,
                            isAllowOverCost: false
                        });
                        coinAccount = await coinAccount.save();
                        account.coinAccount = coinAccount;
                        account = await account.save();
                    }
                    coinAccount = await Models.coinAccount.get(account.coinAccountId);
                    coinAccount.income = Math.floor(Number(coinAccount.income) + rewardMoney * points2coinRate);  //员工account增加鲸币
                    await coinAccount.save();

                    let coins: number = Math.floor(rewardMoney * points2coinRate);
                    let tripPlanRemark: string = unSettledRewardTripPlan.remark;
                    companyCoinAccountChange = Models.coinAccountChange.create({  //company coin_account增加鲸币变动记录
                        coinAccountId: companyCoinAccount.id,
                        remark: `${tripPlanRemark}, 奖励鲸币${coins}`,
                        type: COIN_CHANGE_TYPE.CONSUME,
                        coins: -coins,
                        orderNum: getOrderNo()
                    });
                    await companyCoinAccountChange.save();
                    coinAccountChange = Models.coinAccountChange.create({  //员工 coin_account增加鲸币变动记录
                        coinAccountId: coinAccount.id,
                        remark: `${tripPlanRemark}, 奖励鲸币${coins}`,
                        type: COIN_CHANGE_TYPE.AWARD,
                        coins: coins,
                        orderNum: getOrderNo()
                    });
                    await coinAccountChange.save();

                    pointChange = Models.pointChange.create({
                        staffId: unSettledRewardTripPlan.accountId,
                        orderId: unSettledRewardTripPlan.id,
                        companyId: unSettledRewardTripPlan.companyId,
                        points: -rewardMoney,
                        remark: `员工${staff.name}兑换奖励积分${rewardMoney}`
                    });
                    await pointChange.save();
                } else {
                    //企业余额不足继续兑换，提示充值
                    console.error('企业余额不足');
                    return false;
                }
            } else {
                //企业余额不足继续兑换，提示充值 
                console.error('企业余额不足');
                return false;
                }
            })
            return true;
        } catch(err) {
            companyCoinAccount && await companyCoinAccount.reload();
            staff && await staff.reload();
            coinAccount && await coinAccount.reload();
            coinAccountChange && await coinAccountChange.reload();
            pointChange && await pointChange.reload();
            unSettledRewardTripPlan && await unSettledRewardTripPlan.reload();
                throw err;
        };
    }

    /**
     * 获取差旅计划单/预算单列表
     * @param params
     * @returns {*}
     */
    @clientExport
    static async listTripPlans(options: FindOptions<TripPlan>): Promise<FindResult> {
        options.order = options.order || [['start_at', 'desc'], ['created_at', 'desc']];
        let paginate = await Models.tripPlan.find(options);
        return { ids: paginate.map((plan) => { return plan.id; }), count: paginate["total"] }
    }

    /**
     * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{ if: condition.isMyTripPlan('0.id') }])
    static async deleteTripPlan(params: { id: string }): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        let tripDetails = await tripPlan.getTripDetails({ where: {} });
        await tripPlan.destroy();
        await Promise.all(tripDetails.map((detail) => detail.destroy()));
        return true;
    }

    /**
     * 保存消费记录详情
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['tripPlanId', 'type', 'startTime', 'invoiceType', 'budget'])
    static saveTripDetail(params: {
        tripPlanId: string, type: number, startTime: string, invoiceType: number, budget: number
    }): Promise<TripDetail> {
        return Models.tripDetail.create(params).save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static async getTripDetail(params: { id: string, notRetChild: boolean }): Promise<TripDetail> {

        let tripDetail = await  Models.tripDetail.get(params.id, { notRetChild: true });
        return tripDetail;
        // return Models.tripDetail.get(params.id, { notRetChild: true });
    }

    @clientExport
    @requireParams(['id'])
    static async getOddBudget(params: { id: string }) {
        var tripPlan = await Models.tripPlan.get(params.id);
        var oddBudget = tripPlan.budget;
        var details = await Models.tripDetail.find({
            where: { tripPlanId: tripPlan.id },
            order: [['created_at', 'asc']]
        });
        details.forEach(function (item, i) {
            oddBudget = oddBudget - item.expenditure;
        })
        return oddBudget;
    }

    @clientExport
    @requireParams(['id'])
    static async getTripDetailTraffic(params: { id: string }): Promise<TripDetailTraffic> {
        return Models.tripDetailTraffic.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailHotel(params: { id: string }): Promise<TripDetailHotel> {
        return Models.tripDetailHotel.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailSubsidy(params: { id: string }): Promise<TripDetailSubsidy> {
        return Models.tripDetailSubsidy.get(params.id)
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailSpecial(params: { id: string }): Promise<TripDetailSpecial> {
        return Models.tripDetailSpecial.get(params.id);
    }


    @clientExport
    @requireParams(['id'], TripDetail['$fieldnames'])
    @modelNotNull('tripDetail')
    static async updateTripDetail(params: TripDetail): Promise<TripDetail> {
        let tripDetail =  await Models.tripDetail.get(params.id);
        if(!tripDetail) 
            throw new Error(`指定tripDetail不存在, id: ${params.id}`)
        // throw new error.ParamsNotValidError("指定tripDetail不存在, id: ", params.id);
        for (let key in params) {
            tripDetail[key] = params[key];
        }
        return tripDetail.save();
    }

    /**
     * @method 更新tripDetail详情
     *    1. app进行tripDetail的修改
     *    2. 预定回调更新tripDetail的reserveStatus状态
     * 
     *  1. 待预定 ---> 待提交 ---> 待出票 ---> 出票成功
     * @param params.reserveStatus {number} 订单状态
     * @param params.expenditure {number} 订单费用
     * @param params.orderNo {string} 订单号
     * @return {Promise<boolan>}
     */
    @clientExport
    static async updateTripDetailReserveStatus(params: TripDetail): Promise<boolean> {
        let tripDetail =  await Models.tripDetail.get(params.id); 
        if(!tripDetail) 
            throw new Error(`指定tripDetail不存在, id: ${params.id}`)
            
        if([EOrderStatus.SUCCESS, EOrderStatus.ENDORSEMENT_SUCCESS, EOrderStatus.REFUND_SUCCESS, EOrderStatus.DEAL_DONE].indexOf(params.reserveStatus) < 0){
            if(params.expenditure) delete params.expenditure;
        }
        for(let key in params) {
            tripDetail[key] = params[key];
        }

        //酒店类型个人支付，只修改reserveStatus(预定状态)，status(状态)无需再根据预定状态进行修改
        if(tripDetail.payType == EPayType.PERSONAL_PAY) {
            await tripDetail.save();
        }

        let tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
        let reserveStatus = params.reserveStatus;
        if(typeof reserveStatus == 'string')
            reserveStatus = Number(reserveStatus);
        let tripDetails: TripDetail[];
        let log = Models.tripPlanLog.create({tripPlanId: tripDetail.tripPlanId, userId: tripPlan.auditUser});
        switch(reserveStatus) {
            case EOrderStatus.WAIT_SUBMIT: //等待创建订单
            case EOrderStatus.AUDITING:  //等待确认，提交订单
                tripDetail.status = ETripDetailStatus.WAIT_RESERVE;
                break;
            case EOrderStatus.WAIT_TICKET:
                tripDetail.status = ETripDetailStatus.WAIT_TICKET;
                break;

            case EOrderStatus.REFUND_SUCCESS: 
                tripDetail.status = ETripDetailStatus.WAIT_RESERVE;
           
                if(tripPlan.status == EPlanStatus.COMPLETE || tripPlan.status == EPlanStatus.RESERVED) {
                    if(new Date(tripPlan.backAt) < new Date()){
                        throw new Error("该行程时间已过，无法受理退款操作");
                    } else {
                        tripPlan.status = EPlanStatus.WAIT_RESERVE;
                    }
                }
                break; 

            case EOrderStatus.SUCCESS:  //全部已出票，设置该tripPlan为已预定
                tripDetail.status = ETripDetailStatus.COMPLETE;
                tripDetails = await Models.tripDetail.all({where: {id: {$ne: tripDetail.id}, tripPlanId: tripDetail.tripPlanId, 
                    status: [ETripDetailStatus.WAIT_RESERVE, ETripDetailStatus.WAIT_TICKET]}});
                if(!tripDetails || !tripDetails.length) {
                    tripPlan.status = EPlanStatus.RESERVED;
                    log.remark = `已预订`;
                    await log.save();
                }
                await calculateBudget({ expenditure: tripDetail.expenditure, id: tripDetail.id, orderNo: tripDetail.orderNo })
                tripDetails = [];
                break;
            case EOrderStatus.ENDORSEMENT_SUCCESS: 
                tripDetail.status = ETripDetailStatus.COMPLETE;
                tripDetails = await Models.tripDetail.all({where: {id: {$ne: tripDetail.id}, tripPlanId: tripDetail.tripPlanId, 
                    status: [ETripDetailStatus.WAIT_RESERVE, ETripDetailStatus.WAIT_TICKET]}});
                if(!tripDetails || !tripDetails.length) {
                    tripPlan.status = EPlanStatus.RESERVED;
                }
                tripDetails = [];
                break;
            case EOrderStatus.FAILED: 
                tripDetail.status = ETripDetailStatus.WAIT_RESERVE;
                break;
            case EOrderStatus.ENDORSEMENT_CREATED:  //改签单创建，为等待预定
                tripDetail.status = ETripDetailStatus.WAIT_TICKET;
                if(tripPlan.status == EPlanStatus.RESERVED || tripPlan.status == EPlanStatus.COMPLETE) {
                    tripPlan.status = EPlanStatus.WAIT_RESERVE;
                }
                break;     
            case EOrderStatus.WAIT_REFUND: 
                break;
            case EOrderStatus.WAIT_PAYMENT:  //订单未支付，默认设置为等待预定
                tripDetail.status = ETripDetailStatus.WAIT_RESERVE; 
                if(tripPlan.status == EPlanStatus.COMPLETE || tripPlan.status == EPlanStatus.RESERVED) {
                    if(new Date(tripPlan.backAt) < new Date()){
                        throw new Error("该行程时间已过，无法退款");
                    } else {
                        tripPlan.status = EPlanStatus.WAIT_RESERVE;
                    }
                }
                break;
            case EOrderStatus.NO_SUFFICIENT_MONEY:  //酒店订单余额不足，默认设置为等待预定
                tripDetail.status = ETripDetailStatus.WAIT_RESERVE;
                if(tripPlan.status == EPlanStatus.COMPLETE || tripPlan.status == EPlanStatus.RESERVED) {
                    if(new Date(tripPlan.backAt) < new Date()){
                        throw new Error("该行程时间已过，无法退款");
                    } else {
                        tripPlan.status = EPlanStatus.WAIT_RESERVE;
                    }
                }
                break;
            default: 
                break;     
        }  
        await tripDetail.save();
        await tripPlan.save();
        return true;
    }

    /**
     * 根据出差记录id获取出差详情(包括已删除的)
     * @param params
     * @returns {Promise<string[]>}
     */
    @requireParams([], ['where.tripPlanId', 'where.type', 'where.status', 'where.id', 'where.accountId', 
    'where.orderNo', 'where.reserveStatus', 'where.orderType', 'where.expenditure'])
    @clientExport
    static async getTripDetails(options: {where: any, offset?: number, limit?: number}): Promise<FindResult> {
        if(!options || !options.where)
            throw L.ERR.INVALID_ARGUMENT("参数错误, 参数不能为空")
        if(!options.where.tripPlanId && !options.where.accountId)
            throw L.ERR.INVALID_ARGUMENT("参数错误, 参数accountId或者tripPlanId不能同时为空")
        let details = await Models.tripDetail.find(options);
        let ids = details.map(function (d) {
            return d.id;
        });
        return { ids: ids, count: details['total'] };
    }

    /**
     * 删除差旅消费明细
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static async deleteTripDetail(params: { id: string }): Promise<boolean> {
        let tripDetail = await Models.tripDetail.get(params.id);
        await tripDetail.destroy();
        return true;
    }

    /**
     * @method 提交计划单
     *  前提: 当所有的tripPlan的状态为 EAuditStatus.WAIT_COMMIT, 允许提交票据审核
     *      1. 更新所有的tripDetail的状态为审核中， tripPlan状态同步更新到审核中
     *      2. 补助类型： 无票据，状态为完成， 有票据，状态为审核中
     *      3. 发送通知
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{ if: condition.isMyTripPlan('0.id') }])
    static async commitTripPlan(params: { id: string, staffId: string, version?: number }): Promise<boolean> {
        let { id, staffId } = params;

        let currentStaff = await Staff.getCurrent();
        staffId = currentStaff.id;

        let tripPlan = await Models.tripPlan.get(id);

        if(tripPlan.auditStatus != EAuditStatus.WAIT_COMMIT) {
            throw {code: -2, msg: "该出差计划不能提交，请检查状态"};
        }

        let tripDetails = await tripPlan.getTripDetails({ where: {} });
        if (tripDetails && tripDetails.length > 0) {
            let tripDetailPromise = tripDetails.map(async function (detail) {
                if (detail.type == ETripType.SUBSIDY) {
                    let invoices = await detail.getInvoices();
                    if(invoices && invoices.length > 0){
                        return tryUpdateTripDetailStatus(detail, ETripDetailStatus.AUDITING);
                    }else{
                        return tryUpdateTripDetailStatus(detail, ETripDetailStatus.COMPLETE);
                    }
                }else{
                    return tryUpdateTripDetailStatus(detail, ETripDetailStatus.AUDITING);
                }
            });
            await (Promise.all(tripDetailPromise));
        }
        //记录日志
        let log = Models.tripPlanLog.create({ tripPlanId: tripPlan.id, userId: staffId, remark: `提交票据` });
        await log.save();
        //更改状态
        tripPlan.isCommit = true;
        tripPlan = await tryUpdateTripPlanStatus(tripPlan, EAuditStatus.AUDITING);

        let notifyUrl: string = ""
        if (params.version == 2) {
            //#@template
            notifyUrl = `${config.v2_host}/agency.html#/travelRecord/TravelDetail/${tripPlan.id}`
        } else {
            notifyUrl = `${config.host}/agency.html#/travelRecord/TravelDetail?orderId=${tripPlan.id}`;
        }
        await TripPlanModule.notifyDesignatedAcount({ notifyUrl: notifyUrl, staffId: staffId });

        let default_agency = config.default_agency;
        if (default_agency && default_agency.manager_email) {
            let auditEmail = default_agency.manager_email;
            let accounts = await Models.account.find({ where: { email: auditEmail } });

            if (!accounts || accounts.length <= 0) {
                return true;
            }

            let user: AgencyUser | Staff = await Models.agencyUser.get(accounts[0].id);
            if (!user) {
                user = await Models.staff.get(accounts[0].id);
            }
            let staff = await Models.staff.get(staffId);
            let company = await tripPlan.getCompany();

            let auditUrl: string = ""
            if (params.version && params.version == 2) {
                //#@template 支持v2
                auditUrl = `${config.v2_host}/agency.html#/travelRecord/TravelDetail/${tripPlan.id}`
            } else {
                auditUrl = `${config.host}/agency.html#/travelRecord/TravelDetail?orderId=${tripPlan.id}`;
            }
            try {
                await API.notify.submitNotify({
                    email: auditEmail,
                    key: 'qm_notify_agency_budget',
                    values: {
                        company: company,
                        staff: staff,
                        userId: user.id,
                        detailUrl: auditUrl
                    }
                })
            } catch (err) {
                logger.info(err);
            }

        }
        return true;
    }

    /**
     * 审核出差票据
     * modified 票据审核改为仅对单张票据的审核
     * 新版预定系统和报销系统：
     *  1. 所有的tripDetail都走报销流程，此时需要将tripPlan的status同步更新到完成状态
     *  2. 部分tripDetail走报销流程， 此时tripPlan的status保持不变
     *
     * @param params
     */
    @clientExport
    @requireParams(['id', 'auditResult', "invoiceId"], ["reason", "expenditure"])
    @modelNotNull('tripDetail')
    static async auditPlanInvoice(params: { id: string, auditResult: EAuditStatus, expenditure?: number, reason?: string, invoiceId?: string, version?: number }): Promise<boolean> {

        let tripDetail = await Models.tripDetail.get(params.id);
        let tripPlanId = tripDetail.tripPlanId;
        let tripPlan = await Models.tripPlan.get(tripPlanId);

        
        let companyId = tripPlan.companyId;
        let company = await Models.company.get(companyId);
        let SAVED2SCORE = company.scoreRatio;
 
        // if((tripDetail.status != EPlanStatus.AUDITING) && (tripDetail.status != EPlanStatus.AUDIT_NOT_PASS)) {
        //     throw L.ERR.TRIP_PLAN_STATUS_ERR();
        // }
        if((tripDetail.status != ETripDetailStatus.AUDITING) && (tripDetail.status != ETripDetailStatus.AUDIT_NOT_PASS)) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }

        let audit = params.auditResult;
        let templateValue: any = {};
        let logResult = '通过';

        if (audit != EAuditStatus.INVOICE_PASS && audit != EAuditStatus.INVOICE_NOT_PASS) {
            throw L.ERR.PERMISSION_DENY(); //代理商只能审核票据权限
        }
        let invoice = await Models.tripDetailInvoice.get(params.invoiceId || '');
        //处理这张票据
        console.info("params.invoiceId==>>", params.invoiceId);
        invoice.status = audit == EAuditStatus.INVOICE_PASS ? EInvoiceStatus.AUDIT_PASS : EInvoiceStatus.AUDIT_FAIL;
        invoice.auditRemark = params.reason || '';

        return DB.transaction(async function (t) {
            invoice = await invoice.save();
            let allInvoicePass = true,
                isNeedMsg = true;
        
            let invoices = await tripPlan.getTripInvoices();
            let tripDetailInvoices: TripDetailInvoice[] = [];
            invoices.map(async (item: TripDetailInvoice) => {
                switch (item.status) {
                    case EInvoiceStatus.WAIT_AUDIT:
                        allInvoicePass = false;
                        isNeedMsg = false;
                        break;
                    case EInvoiceStatus.AUDIT_PASS:
                        break;
                    case EInvoiceStatus.AUDIT_FAIL:
                        allInvoicePass = false;

                        //一张票据不过，对应的 tripPlan 不过
                        // tripPlan.status = EPlanStatus.AUDIT_NOT_PASS;
                        tripPlan.auditStatus = EAuditStatus.INVOICE_NOT_PASS;
                        break;
                }

                if (item["trip_detail_id"] == tripDetail.id) {
                    tripDetailInvoices.push(item);
                }
            });

            if (params.expenditure) {
                //重新计算 tripDetail 的实际金额
                tripDetail.expenditure = tripDetail.expenditure - invoice.totalMoney + Number(params.expenditure);
                //重新计算 tripPlan 的实际金额
                tripPlan.expenditure = tripPlan.expenditure - invoice.totalMoney + Number(params.expenditure);
                invoice.totalMoney = params.expenditure;
            }

            /*================  处理tripPlan, tripDetail 状态  ============*/
            let templateName: string;
            if (allInvoicePass) {
                //所有票据都审核通过
                // let tripDetails = await tripPlan.getTripDetails({
                //     where: {
                //         type: [ETripType.BACK_TRIP, ETripType.HOTEL, ETripType.OUT_TRIP],
                //         reserveStatus: {$notIn: [EOrderStatus.WAIT_SUBMIT]},
                //         status: ETripDetailStatus.COMPLETE
                //     }
                // });
                //只有当所有的tripDetail都需要上传票据时，该tripPlan的状态置为完成
                // if(!tripDetails || tripDetails.length == 0)
                //     tripPlan.status = EPlanStatus.COMPLETE;

                // Log tripPlan changes  票据审核都通过
                let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: tripPlan.auditUser});
                log.remark = `已完成`;
                await log.save();
                
                tripPlan.auditStatus = EAuditStatus.INVOICE_PASS;
                tripPlan.allInvoicesPassTime = new Date();
                let savedMoney = tripPlan.budget - tripPlan.expenditure;
                savedMoney = savedMoney > 0 ? savedMoney : 0;
                tripPlan.score = parseInt((savedMoney * SAVED2SCORE).toString());
                tripPlan.reward = Number(parseFloat((savedMoney * SAVED2SCORE).toString()).toFixed(2));
                let staffId = tripPlan.accountId;
                let staff = await Models.staff.get(staffId);
                let staffName = staff.name;
                let query = tripPlan.query;
                if (typeof query == 'string') {
                    query = JSON.parse(query);
                }
                let destinationPlacesInfo = query.destinationPlacesInfo;
                if (typeof destinationPlacesInfo == 'string') {
                    destinationPlacesInfo = JSON.parse(destinationPlacesInfo);
                }
                let destinationArray: string[] = [];
                for (let i = 0; i < destinationPlacesInfo.length; i++) {
                    destinationArray.push(destinationPlacesInfo[i].destinationPlace);
                }
                if (query.isRoundTrip) {
                    destinationArray.push(query.originPlace);
                }
                for (let j = 0; j < destinationArray.length; j++) {
                    let cityCode = destinationArray.shift();
                    let destinationName: ICity = await API.place.getCityInfo({cityCode: cityCode, companyId: staff.companyId});
                    destinationArray.push(destinationName.name);
                }
                if (!tripPlan.deptCity) {  // 仅住宿
                    tripPlan.remark = `员工${staffName}节省, 行程 ${tripPlan.arrivalCity} (仅住宿)`;
                } else {  //非仅住宿
                    let tripFlow = `${tripPlan.deptCity}`;
                    for (let n = 0; n < destinationArray.length; n++) {
                        let cityName = destinationArray[n];
                        tripFlow += ` - ${cityName}`
                    }
                    tripPlan.remark = `员工${staffName}节省, 行程 ${tripFlow}`;
                }
                if (tripPlan.isSpecialApprove) {
                    tripPlan.saved = 0;
                } else {
                    tripPlan.saved = savedMoney;
                }
                templateName = 'qm_notify_invoice_all_pass';

            } else {
                templateName = 'qm_notify_invoice_not_pass';
                /**
                 * *tripPlan为待传票据时已将票据设为已读,票据驳回时设为未读
                 * **/
                tripPlan.readNumber = 0;
            }

            //处理对应的tripDetail 的状态
            let tripDetailAllPass = true;

            tripDetailInvoices.map((oneInvoice: any)=>{
                switch (oneInvoice.status) {
                    case EInvoiceStatus.AUDIT_FAIL:
                        logResult = '未通过';
                        tripDetailAllPass = false;
                        tripDetail.status = ETripDetailStatus.AUDIT_NOT_PASS;
                        break;
                    case EInvoiceStatus.AUDIT_PASS:
                        break;
                    case EInvoiceStatus.WAIT_AUDIT:
                        tripDetailAllPass = false;
                        break;
                }
            });

            if(tripDetailAllPass){
                tripDetail.status = ETripDetailStatus.COMPLETE;
            }

            /* =================== END =================== */

            await Promise.all([invoice.save(), tripPlan.save(), tripDetail.save()]);

            if (tripPlan.auditStatus == EAuditStatus.INVOICE_PASS) {
                //扣除成本中心预算
                let costCenter = await Models.costCenter.get(tripPlan.costCenterId);
                if (costCenter) {
                    let begin = costCenter.type == ECostCenterType.DEPARTMENT
                        ? tripPlan.startAt.getFullYear() 
                        : undefined
                    await costCenter.addExpendBudget({ tripPlanId: tripPlan.id, begin})
                }
            }
            /*******************************************发送通知消息**********************************************/
            let staff = await Models.staff.get(tripPlan['accountId']);
            if (isNeedMsg) {
                //所有票据都处理了,发送通知

                let self_url: string = ""
                let appMessageUrl: string = ""

                let version = params.version || config.link_version || 2 //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
                if (version == 2) {
                    appMessageUrl = `#/trip/trip-list-detail/${tripPlan.id}/2`
                    self_url = `${config.v2_host}${appMessageUrl}`
                } else {
                    self_url = `${config.host}/index.html#/trip/list-detail?tripid=${tripPlan.id}`;
                    let finalUrl = `#/trip/list-detail?tripid=${tripPlan.id}`;
                    finalUrl = encodeURIComponent(finalUrl);
                    appMessageUrl = `#/judge-permission/index?id=${tripPlan.id}&modelName=tripPlan&finalUrl=${finalUrl}`;
                }

                try {
                    await API.notify.submitNotify({
                        key: templateName,
                        userId: staff.id,
                        values: {
                            tripPlan: tripPlan, detailUrl: self_url, appMessageUrl: appMessageUrl,
                            noticeType: ENoticeType.TRIP_APPROVE_NOTICE, reason: "图片不清楚"
                        }
                    });

                } catch (err) {
                    console.error(`发送通知失败:`, err);
                }
                /*try {
                    await API.ddtalk.sendLinkMsg({ accountId: staff.id, text: '票据已审批结束', url: self_url })
                } catch (err) {
                    console.error(`发送钉钉通知失败`, err);
                }*/
            }


            /* ======================= 处理planlog ================= */
            switch (tripDetail.type) {
                case ETripType.OUT_TRIP:
                    templateValue.tripType = '去程';
                    break;
                case ETripType.BACK_TRIP:
                    templateValue.tripType = '回程';
                    break;
                case ETripType.HOTEL:
                    templateValue.tripType = '酒店';
                    break;
                case ETripType.SUBSIDY:
                    templateValue.tripType = '补助';
                    break;
                case ETripType.SPECIAL_APPROVE:
                    templateValue.tripType = '特殊审批'
                    break;
                default:
                    templateValue.tripType = ''; break;
            }

            let user = await AgencyUser.getCurrent();
            if (!user) {
                let defaultAgency: Agency[] = await Models.agency.find({
                    where: {
                        email: config.default_agency.email
                    }
                })
                if (defaultAgency && defaultAgency.length) {
                    let users: AgencyUser[] = await Models.agencyUser.find({
                        where: {
                            agencyId: defaultAgency[0].id
                        }
                    });
                    if (users && users.length) user = users[0];
                }
            }
            let log = Models.tripPlanLog.create({ tripPlanId: tripPlan.id, tripDetailId: tripDetail.id, userId: user.id, remark: `${templateValue.tripType}票据审核${logResult}` });
            log.save();

            /* ========================== END ===================== */


            //如果出差已经完成,并且有节省反积分,并且非特别审批，增加员工积分
            if (tripPlan.auditStatus == EAuditStatus.INVOICE_PASS && tripPlan.score > 0 && !tripPlan.isSpecialApprove) {
                let pc = Models.pointChange.create({
                    currentPoints: staff.balancePoints, status: 1,
                    staff: staff, company: staff.company,
                    points: tripPlan.score, remark: `节省反积分${tripPlan.score}`,
                    orderId: tripPlan.id
                });
                await pc.save();
                if (!staff.totalPoints) {
                    staff.totalPoints = 0;
                }
                if (!tripPlan.score) {
                    tripPlan.score = 0;
                }
                if (!staff.balancePoints) {
                    staff.balancePoints = 0;
                }
                if (typeof staff.totalPoints == 'string') {
                    staff.totalPoints = Number(staff.totalPoints);
                }
                if (typeof tripPlan.score == 'string') {
                    tripPlan.score = Number(tripPlan.score);
                }
                if (typeof staff.balancePoints == 'string') {
                    staff.balancePoints = Number(staff.balancePoints);
                }
                staff.totalPoints = staff.totalPoints + tripPlan.reward;
                staff.balancePoints = staff.balancePoints + tripPlan.reward;
                let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: user.id, remark: `增加员工${tripPlan.score}积分`});
                await Promise.all([staff.save(), log.save()]);
                await TripPlanModule.autoSettleReward({ id: tripPlan.id });  //出差完成自动结算奖励 
            }
            return true;
        }).catch(async function (err: Error) {
            console.log("审核票据失败", err)
            await tripPlan.reload();
            await tripDetail.reload();
            await invoice.reload();

            tripDetail.status = ETripDetailStatus.AUDITING;
            await tripDetail.save();
            invoice.status = EInvoiceStatus.WAIT_AUDIT;
            await invoice.save();
            throw new Error("审核失败");
        })


    }

    /**
     * 支持restful审核完成接口。
     * @param params
     * @returns {Promise<Project>}
     * @author lei.liu
     */
    @clientExport
    @requireParams(["id", "expenditure"], ["version"])
    static async finishTripPlan(params: { id: string, expendArray: Array<ExpendItem>, version?: number }) {

        let expendArray = params.expendArray;
        let tripPlan = await Models.tripPlan.get(params.id);
        let company: Company = await Models.company.get(tripPlan.companyId);
        let scoreRatio: number = company.scoreRatio;

        let SAVED2SCORE = scoreRatio;

        if (tripPlan == null) {
            logger.error(`tripPlan:${params.id} 不存在`)
            throw L.ERR.TRIP_PLAN_NOT_EXIST()
        }

        if (tripPlan.status == EPlanStatus.COMPLETE) {
            logger.error(`tripPlan:${params.id} 已经处于完成状态`)
            throw L.ERR.TRIP_PLAN_STATUS_ERR()
        }

        return DB.transaction(async function (t) {

            let user = { id: "00000000-0000-0000-0000-000000000000" } //第三方审核使用的agencyUserId默认置为 00000000-0000-0000-0000-000000000000

            for (let expend of expendArray) {

                let tripDetail = await Models.tripDetail.get(expend.id)

                if (tripDetail == null) {
                    logger.error(`tripDetail:${expend.id} 不存在`)
                    throw L.ERR.TRIP_DETAIL_FOUND()
                }

                if (tripDetail.status == ETripDetailStatus.COMPLETE) { //如果detail的状态是完成，不能再做处理。
                    logger.error(`tripDetail:${expend.id} 已经处于完成状态`)
                    throw L.ERR.TRIP_PLAN_STATUS_ERR()
                }

                tripDetail.expenditure = expend.expenditure
                tripDetail.personalExpenditure = expend.personalExpenditure
                tripDetail.status = ETripDetailStatus.COMPLETE //从oa系统中传递过来意味着报销完成。

                await tripDetail.save()

                let companyExpenditure = expend.expenditure - expend.personalExpenditure > 0 ? expend.expenditure - expend.personalExpenditure : 0//公司花费
                if (companyExpenditure != 0) { //生成公司支付的票据
                    let invoiceParams = {
                        tripDetailId: tripDetail.id,
                        totalMoney: companyExpenditure,
                        payType: EPayType.COMPANY_PAY,
                        invoiceDateTime: new Date(),
                        type: TrafficEInvoiceFeeTypes.OTHER,
                        remark: ""
                    }
                    let tripDetailInvoice = Models.tripDetailInvoice.create(invoiceParams)
                    await tripDetailInvoice.save()
                }

                if (expend.personalExpenditure != 0 || companyExpenditure == 0) {
                    let invoiceParams = { //生成个人支付的票据
                        tripDetailId: tripDetail.id,
                        totalMoney: expend.personalExpenditure,
                        payType: EPayType.PERSONAL_PAY,
                        invoiceDateTime: new Date(),
                        type: TrafficEInvoiceFeeTypes.OTHER,
                        remark: ""
                    }
                    let tripDetailInvoice = Models.tripDetailInvoice.create(invoiceParams)
                    await tripDetailInvoice.save()
                }

                let templateValue: { tripType: string } = { tripType: '' }
                switch (tripDetail.type) {  //根据tripType生成相应的log
                    case ETripType.OUT_TRIP:
                        templateValue.tripType = '去程'
                        break;
                    case ETripType.BACK_TRIP:
                        templateValue.tripType = '回程'
                        break;
                    case ETripType.HOTEL:
                        templateValue.tripType = '酒店'
                        break;
                    case ETripType.SUBSIDY:
                        templateValue.tripType = '补助'
                        break;
                    case ETripType.SPECIAL_APPROVE:
                        templateValue.tripType = '特殊审批'
                        break;
                    default:
                        templateValue.tripType = ''
                        break;
                }

                let log = Models.tripPlanLog.create({ tripPlanId: tripPlan.id, tripDetailId: tripDetail.id, userId: user.id, remark: `${templateValue.tripType}票据审核通过` });
                await log.save();
            }

            await updateTripPlanExpenditure(tripPlan) //跟新tripPlan的消费信息。

            let allDetailsPass = true
            let isNeedMsg = true
            let tripDetails = await tripPlan.getTripDetails({})

            tripDetails.map(async (item) => { //判断是否tripPlan的所有的detail都审核完成。
                if (item.status != ETripDetailStatus.COMPLETE) {
                    allDetailsPass = false
                    isNeedMsg = false
                }
            })

            let templateName: string;

            if (allDetailsPass) {
                //所有的detail都审核完成。
                tripPlan.status = EPlanStatus.COMPLETE
                tripPlan.auditStatus = EAuditStatus.INVOICE_PASS
                tripPlan.allInvoicesPassTime = new Date()
                let savedMoney = tripPlan.budget - tripPlan.expenditure
                savedMoney = savedMoney > 0 ? savedMoney : 0
                tripPlan.score = parseInt((savedMoney * SAVED2SCORE).toString())
                if (tripPlan.isSpecialApprove) {
                    tripPlan.saved = 0
                } else {
                    tripPlan.saved = savedMoney
                }
                templateName = "qm_notify_invoice_all_pass"
            } else {
                templateName = "qm_notify_invoice_not_pass"
                tripPlan.readNumber = 0
            }

            await tripPlan.save()

            //发送通知消息。
            let staff = await Models.staff.get(tripPlan["accountId"])
            if (isNeedMsg) {

                console.log("发送通知。")

                let self_url: string = ""
                let appMessageUrl: string = ""

                if (params.version == 2) { //@#template v2的外链url。
                    appMessageUrl = `#/trip/trip-list-detail/${tripPlan.id}/2`
                    self_url = `${config.v2_host}${appMessageUrl}`
                } else {
                    self_url = `${config.host}/index.html#/trip/list-detail?tripid=${tripPlan.id}`;
                    let finalUrl = `#/trip/list-detail?tripid=${tripPlan.id}`;
                    finalUrl = encodeURIComponent(finalUrl);
                    appMessageUrl = `#/judge-permission/index?id=${tripPlan.id}&modelName=tripPlan&finalUrl=${finalUrl}`;
                }

                try {
                    await API.notify.submitNotify({
                        key: templateName,
                        userId: staff.id,
                        values: {
                            tripPlan: tripPlan, detailUrl: self_url, appMessageUrl: appMessageUrl,
                            noticeType: ENoticeType.TRIP_APPROVE_NOTICE, reason: "图片不清楚"
                        }
                    });

                } catch (err) {
                    console.error(`发送通知失败:`, err);
                }
                /*try {
                    await API.ddtalk.sendLinkMsg({ accountId: staff.id, text: '票据已审批结束', url: self_url })
                } catch (err) {
                    console.error(`发送钉钉通知失败`, err);
                }*/
            }

            //如果出差已经完成，并且节省反积分，并且非特别审批，增加员工积分；若企业账户有余额，直接兑换员工积分为鲸币
            if (tripPlan.status == EPlanStatus.COMPLETE && tripPlan.score > 0 && !tripPlan.isSpecialApprove) {
                let pc = Models.pointChange.create({
                    currentPoints: staff.balancePoints, status: 1,
                    staff: staff,
                    company: staff.company,
                    points: tripPlan.score,
                    remark: `节省反积分${tripPlan.score}`,
                    orderId: tripPlan.id
                });
                await pc.save();
                if (!staff.totalPoints) {
                    staff.totalPoints = 0;
                }
                if (!tripPlan.score) {
                    tripPlan.score = 0;
                }
                if (!staff.balancePoints) {
                    staff.balancePoints = 0;
                }
                if (typeof staff.totalPoints == 'string') {
                    staff.totalPoints = Number(staff.totalPoints);
                }
                if (typeof tripPlan.score == 'string') {
                    tripPlan.score = Number(tripPlan.score);
                }
                if (typeof staff.balancePoints == 'string') {
                    staff.balancePoints = Number(staff.balancePoints);
                }
                staff.totalPoints = staff.totalPoints + tripPlan.score;
                staff.balancePoints = staff.balancePoints + tripPlan.score;
                let log = Models.tripPlanLog.create({ tripPlanId: tripPlan.id, userId: user.id, remark: `增加员工${tripPlan.score}积分` });
                await Promise.all([staff.save(), log.save()]);
            }

        }).catch(err => {
            logger.error("finish trip fail: " + err)
            throw err
        })
    }

    @clientExport
    @requireParams(['emails', 'projectId'])
    static async sendProjectReport(params: { emails: string[], projectId: string }): Promise<boolean> {
        let data: any = { project: {}, costCenter: {}, projectStaffs: [] };
        let project = await Models.project.get(params.projectId);
        data.project = project;
        if (project) {
            let costCenter = await Models.costCenter.get(project.id);
            if (costCenter) {
                let costCenterDeploies = await Models.costCenterDeploy.find({ where: { costCenterId: costCenter.id } });
                if (costCenterDeploies && costCenterDeploies.length) {
                    let costCenterDeploy = costCenterDeploies[0];
                    data.costCenter = costCenterDeploy;
                    let budgetCollectInfo = await costCenterDeploy.getCollectedBudget();
                    data.budgetCollectInfo = budgetCollectInfo;
                }
            }
            let staffs = await project.getStaffs();
            if (staffs && staffs.length) {
                let projectStaffs = await Promise.all(staffs.map(async (s) => {
                    let travelPolicy = await s.getProjectTravelPolicy({ projectId: project.id });
                    s.tp = travelPolicy;
                    return s;
                }))
                data.projectStaffs = projectStaffs;
            }
        }
        let buf = await makeSpendReport(data, "project");
        try {
            for (let item of params.emails) {
                await API.notify.submitNotify({
                    key: 'qm_spend_project_report',
                    email: item,
                    values: {
                        project: project,
                        attachments: [{
                            filename: project.name + '.pdf',
                            content: buf.toString("base64"),
                            encoding: 'base64'
                        }]
                    },
                });
            }

        } catch (err) {
            console.error(err.stack);
        }
        return true;
    }

    @clientExport
    @requireParams(['name', 'companyId'], projectCols)
    static async createProject(params: {name: string, companyId: string, code?: string}): Promise<Project | null> {
        let _projects = await Models.project.find({ where: { code: params.code, companyId: params.companyId } });
        if (_projects && _projects.length) {
            return null;
        }
        return Project.create(params).save();
    }

    @clientExport
    @requireParams(["id"], projectCols)
    static async updateProject(params: Project): Promise<Project> {
        let project = await Models.project.get(params.id);

        if (project.status == EProjectStatus.START) {
            throw new Error(`{code: -1, msg: "修改项目信息 需停用项目"}`);
        }
        for (let key in params) {
            project[key] = params[key];
        }
        return project.save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('project')
    static getProjectById(params: { id: string }): Promise<Project> {
        return Models.project.get(params.id);
    }

    @clientExport
    @requireParams(['where.companyId'], ['where.name'])
    static async getProjectList(options: FindOptions<Project>): Promise<FindResult> {
        options.order = options.order || [['weight', 'desc'], ['created_at', 'desc']];
        let projects = await Models.project.find(options);
        return { ids: projects.map((p) => { return p.id }), count: projects['total'] };
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('project')
    static async deleteProject(params: { id: string }): Promise<boolean> {
        let project = await Models.project.get(params.id);
        let trips = await Models.tripPlan.find({ where: { projectId: project.id } });
        if (trips && trips.length > 0) {
            throw { code: -1, msg: '该项目下有行程，不能删除' };
        }

        await project.destroy();
        return true;
    }


    /****************************************ProjectStaff begin************************************************/

    /**
     * 创建项目员工记录
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["projectId", "staffId"])
    static async createProjectStaff(params: {projectId: string, staffId: string}): Promise<ProjectStaff> {
        var projectStaff = ProjectStaff.create(params);
        var already = await Models.projectStaff.find({ where: { projectId: params.projectId, staffId: params.staffId } });
        if (already && already.length > 0) {
            return already[0];
        }
        var result = await projectStaff.save();
        return result;
    }


    /**
     * 删除项目员工记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteProjectStaff(params: {id: string}): Promise<any> {
        var id = params.id;
        var ah_delete = await Models.projectStaff.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新项目员工记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], ["projectId", "staffId"])
    static async updateProjectStaff(params: {id: string}): Promise<ProjectStaff> {
        var id = params.id;

        var ah = await Models.projectStaff.get(id);
        for (var key in params) {
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询项目员工记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getProjectStaff(params: { id: string }): Promise<ProjectStaff> {
        let id = params.id;
        var ah = await Models.projectStaff.get(id);

        return ah;
    };


    /**
     * 根据属性查找项目员工记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getProjectStaffs(params: FindOptions<ProjectStaff>): Promise<FindResult> {
        let paginate = await Models.projectStaff.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    /****************************************ProjectStaff end************************************************/


    /**
     * @method saveTripPlanLog
     * 保存出差计划改动日志
     * @type {saveTripPlanLog}
     */
    @requireParams(['tripPlanId', 'remark'], ['tripDetailId'])
    static async saveTripPlanLog(params: {
        tripPlanId: string, remark: string, userId?: string, tripDetailId?: string
    }): Promise<TripPlanLog> {
        let staff = await Staff.getCurrent();
        params.userId = staff.id;
        return TripPlanLog.create(params).save();
    }

    /**
     * @method getTripPlanLog
     * @param params
     * @returns {any}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlanLog')
    static getTripPlanLog(params: { id: string }): Promise<TripPlanLog> {
        return Models.tripPlanLog.get(params.id);
    }

    /**
     * @method updateTripPlanLog
     * @param param
     */
    static updateTripPlanLog(): Promise<TripPlanLog> {
        throw { code: -1, msg: '不能更新日志' };
    }

    @clientExport
    @requireParams(['where.tripPlanId'], ['where.tripDetailId'])
    static async getTripPlanLogs(options: FindOptions<TripPlanLog>): Promise<FindResult> {
        options.order = options.order || [['created_at', 'desc']];
        let paginate = await Models.tripPlanLog.find(options);
        return { ids: paginate.map((plan) => { return plan.id; }), count: paginate["total"] }
    }

    /**
     * @method 撤销tripPlan
     *      仅无预算或者等待预定的行程可以取消
     * @param params
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['id'], ['remark'])
    static async cancelTripPlan(params: { id: string, remark?: string }): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);

        if( tripPlan.status != EPlanStatus.NO_BUDGET && tripPlan.status != EPlanStatus.WAIT_RESERVE) {
            throw {code: -2, msg: "出差记录状态不正确！"};
        }
        

        let tripDetails = await tripPlan.getTripDetails({});
        if (tripDetails && tripDetails.length > 0) {
            await Promise.all(tripDetails.map(async (d: TripDetail) => {
                if(d.type == ETripType.SUBSIDY && d.status == ETripDetailStatus.COMPLETE && tripPlan.auditStatus == EAuditStatus.WAIT_UPLOAD) { //若补助需要上传票据且票据审核通过，此时不能撤销
                    throw {code: -2, msg: "出差记录状态不正确！"};
                }
                d.status = ETripDetailStatus.CANCEL;
                return d.save();
            }));
        }
        tripPlan.status = EPlanStatus.CANCEL;
        tripPlan.cancelRemark = params.remark || "";
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({ tripPlanId: tripPlan.id, userId: staff.id, remark: `撤销行程` });
        await Promise.all([tripPlan.save(), log.save()]);
        await tripPlan.save();
        return true;
    }

    //
    /********************************************统计相关API***********************************************/

    /**
     * @method 按月统计行程单
     *      1. 某段时间内取消和无预算的行程单
     *      2. 某段时间内完成的行程
     * 
     * @return {
     *      momth: Date, 
     *      staffNum: number, 
     *      projectNum: number,
     *      dynamicBudget: number,
     *      savedMoney: number,
     *      expenditure: number
     * }
     */
    @clientExport
    @requireParams(['companyId', 'month'])
    static async statisticTripPlanOfMonth(params: { companyId: string, month: string }) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let month = params.month;
        let startTime = month + '-01';
        let endTime = moment(startTime).add(1, 'months').format('YYYY-MM-DD');

        let where_sql = 'from trip_plan.trip_plans where company_id=\''
            + companyId + '\' and status!=(' + EPlanStatus.CANCEL + ')  and status!=(' + EPlanStatus.NO_BUDGET + ') and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let complete_sql = 'from trip_plan.trip_plans where company_id=\''
            + companyId + '\' and status=' + EPlanStatus.COMPLETE + ' and start_at>=\''
            + startTime + '\' and start_at<\'' + endTime + '\'';

        let staff_num_sql = 'select count(1) as \"staffNum\" from (select account_id ' + where_sql + ') as Project;';
        let project_num_sql = 'select count(1) as \"projectNum\" from (select distinct project_id ' + where_sql + ') as Project;';
        let budget_sql = 'select sum(budget) as \"dynamicBudget\" ' + complete_sql;
        let saved_sql = 'select sum(budget-expenditure) as \"savedMoney\" ' + complete_sql;
        let expenditure_sql = 'select sum(expenditure) as expenditure ' + complete_sql;

        let staff_num_sql_ret = await DB.query(staff_num_sql);
        let project_num_sql_ret = await DB.query(project_num_sql);
        let budget_sql_ret = await DB.query(budget_sql);
        let saved_sql_ret = await DB.query(saved_sql);
        let expenditure_sql_ret = await DB.query(expenditure_sql);

        return {
            month: month,
            staffNum: Number(staff_num_sql_ret[0][0].staffNum || 0),
            projectNum: Number(project_num_sql_ret[0][0].projectNum || 0),
            dynamicBudget: budget_sql_ret[0][0].dynamicBudget || 0,
            savedMoney: saved_sql_ret[0][0].savedMoney || 0,
            expenditure: expenditure_sql_ret[0][0].expenditure || 0
        };
    }

    @clientExport
    @requireParams([], ['startTime', 'endTime'])
    static async statisticProjectTripBudget(params: { startTime?: Date, endTime?: Date }) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let formatStr = 'YYYY-MM-DD HH:mm:ss';

        let selectSql = `select count(id) as "tripNum", sum(expenditure) as expenditure, project_id as "projectId" from`;
        let completeSql = `trip_plan.trip_plans where deleted_at is null and company_id='${companyId}' and status=${EPlanStatus.COMPLETE}`;

        if (params.startTime) {
            let startTime = moment(params.startTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time>='${startTime}'`;
        }
        if (params.endTime) {
            let endTime = moment(params.endTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time<='${endTime}'`;
        }

        let groupProjectSql = `${completeSql} group by project_id`;

        let groupProject = `${selectSql} ${groupProjectSql};`;

        let groupProjectInfo = await DB.query(groupProject);

        if (groupProjectInfo && groupProjectInfo.length > 0 && groupProjectInfo[0].length > 0) {
            let projectInfo = groupProjectInfo[0];
            projectInfo = await Promise.all(projectInfo.map(async (p: any) => {
                p["project"] = await Models.project.get(p.projectId);
                let peopleDays = 0;
                let selectPeopleDaySql = `select back_at as "backAt", start_at as "startAt" from`;
                let wherePeopleDaySql = `${completeSql} and project_id = '${p.projectId}'`;
                let peopleDaySql = `${selectPeopleDaySql} ${wherePeopleDaySql};`;
                let peopleDayInfo = await DB.query(peopleDaySql);
                if (peopleDayInfo && peopleDayInfo.length > 0 && peopleDayInfo[0].length > 0) {
                    peopleDayInfo[0].map((t: { backAt: string, startAt: string }) => {
                        let peopleDay = moment(t.backAt).startOf('day').diff(moment(t.startAt).startOf('day'), 'days');
                        peopleDays += peopleDay;
                    })
                }
                p["peopleDays"] = peopleDays;
                return p;
            }));

            return projectInfo;
        }

        return [];
    }

    /**
     * @method 统计审核通过时间在一定范围内的行程单信息：
     *  包括: 总行程数、 行程完成总数、计划支出、累计支出、动态预算总金额、实际总支出，节省总额
     */
    @clientExport
    @requireParams([], ['startTime', 'endTime', 'isStaff'])
    static async statisticTripBudget(params: { startTime?: Date, endTime?: Date, isStaff?: boolean }) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let formatStr = 'YYYY-MM-DD HH:mm:ss';

        let selectSql = `select count(id) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure, sum(budget-expenditure) as "savedMoney" from`;
        let completeSql = `trip_plan.trip_plans where deleted_at is null and company_id='${companyId}'`;

        if (params.startTime) {
            let startTime = moment(params.startTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time>='${startTime}'`;
        }
        if (params.endTime) {
            let endTime = moment(params.endTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time<='${endTime}'`;
        }
        if (params.isStaff) {
            completeSql += ` and account_id='${staff.id}'`;
        }


        // let planSql = `${completeSql}  and status in (${EPlanStatus.WAIT_UPLOAD}, ${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDITING}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.COMPLETE})`;
        let planSql = `${completeSql}  and (status not in (${EPlanStatus.CANCEL}, ${EPlanStatus.NO_BUDGET}));`
        completeSql += ` and status=${EPlanStatus.COMPLETE}`;

        let savedMoneyCompleteSql = completeSql + ' and is_special_approve = false';

        let savedMoneyComplete = `${selectSql} ${savedMoneyCompleteSql};`;
        let complete = `${selectSql} ${completeSql};`;
        let plan = `${selectSql} ${planSql};`;

        let savedMoneyCompleteInfo = await DB.query(savedMoneyComplete);
        let completeInfo = await DB.query(complete);
        let planInfo = await DB.query(plan);

        let ret = {
            planTripNum: 0,//计划出差人数(次)
            completeTripNum: 0,//已完成出差人数(次)
            planBudget: 0,//计划支出(元)
            completeBudget: 0,//动态预算(元)
            expenditure: 0,//累计支出(元)
            actualExpenditure: 0,//动态预算实际支出(元)
            savedMoney: 0//节省
        };

        if (completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            let c = completeInfo[0][0];
            ret.completeTripNum = Number(c.tripNum);
            ret.expenditure = Number(c.expenditure);
        }
        if (savedMoneyCompleteInfo && savedMoneyCompleteInfo.length > 0 && savedMoneyCompleteInfo[0].length > 0) {
            let c = savedMoneyCompleteInfo[0][0];
            ret.completeBudget = Number(c.budget);
            ret.savedMoney = Number(c.savedMoney);
            ret.actualExpenditure = Number(c.expenditure);
        }

        if (planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            let p = planInfo[0][0];
            ret.planTripNum = Number(p.tripNum);
            ret.planBudget = Number(p.budget);
        }
        return ret;
    }

    @clientExport
    @requireParams([], ['startTime', 'endTime'])
    static async statisticSaveAndWaste(params: { startTime?: Date, endTime?: Date }) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let formatStr = 'YYYY-MM-DD HH:mm:ss';

        let selectSql = `select count(id) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure, 
        sum(budget-expenditure) as "savedMoney", sum(expenditure-budget) as "wastedMoney" from`;
        let completeSql = `trip_plan.trip_plans where deleted_at is null and company_id='${companyId}'`;

        if (params.startTime) {
            let startTime = moment(params.startTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time>='${startTime}'`;
        }
        if (params.endTime) {
            let endTime = moment(params.endTime).format(formatStr);
            completeSql += ` and all_invoices_pass_time<='${endTime}'`;
        }

        completeSql += ` and status=${EPlanStatus.COMPLETE}`;

        let savedMoneyCompleteSql = completeSql + ' and is_special_approve = false';

        let wastedMoneyCompleteSql = completeSql + ' and is_special_approve = false and expenditure > budget ';

        let savedMoneyComplete = `${selectSql} ${savedMoneyCompleteSql};`;
        let wastedMoneyComplete = `${selectSql} ${wastedMoneyCompleteSql};`;
        let complete = `${selectSql} ${completeSql};`;

        let completeInfo = await DB.query(complete);
        let savedMoneyCompleteInfo = await DB.query(savedMoneyComplete);
        let wastedMoneyCompleteInfo = await DB.query(wastedMoneyComplete);

        let ret = {
            completeBudget: 0,//动态预算(元)
            actualExpenditure: 0,//动态预算实际支出(元)
            savedMoney: 0,//节省,
            completeTripNum: 0,//出差人数,
            wastedMoney: 0,//浪费,
            wastedTripPlanNum: 0//超支行程数,
        };

        if (completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            let c = completeInfo[0][0];
            ret.completeTripNum = Number(c.tripNum);
        }

        if (savedMoneyCompleteInfo && savedMoneyCompleteInfo.length > 0 && savedMoneyCompleteInfo[0].length > 0) {
            let c = savedMoneyCompleteInfo[0][0];
            ret.completeBudget = Number(c.budget);
            ret.savedMoney = Number(c.savedMoney);
            ret.actualExpenditure = Number(c.expenditure);
        }

        if (wastedMoneyCompleteInfo && wastedMoneyCompleteInfo.length > 0 && wastedMoneyCompleteInfo[0].length > 0) {
            let w = wastedMoneyCompleteInfo[0][0];
            ret.wastedMoney = Number(w.wastedMoney);
            ret.wastedTripPlanNum = Number(w.tripNum);
        }

        return ret;
    }

    /**
     * 按员工、项目、部门分类统计预算信息
     * @param params
     * @returns {{}}
     */
    @clientExport
    @requireParams(['startTime', 'endTime', 'type'], ['keyWord'])
    static async statisticBudgetsInfo(params: { startTime: string, endTime: string, type: string, keyWord?: string, unComplete?: boolean }) {
        let staff = await Staff.getCurrent();
        let company = staff.company;
        let completeSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status=${EPlanStatus.COMPLETE} and all_invoices_pass_time>'${params.startTime}' and all_invoices_pass_time<'${params.endTime}'`;
        let savedMoneyCompleteSql = '';

        
        let planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status not in (${EPlanStatus.CANCEL}, ${EPlanStatus.NO_BUDGET}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
        // let planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}, ${EPlanStatus.COMPLETE}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
        
        if(params.unComplete){
            planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status not in (${EPlanStatus.CANCEL}, ${EPlanStatus.NO_BUDGET}, ${EPlanStatus.COMPLETE}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
            // planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
        }

        let type = params.type;
        let selectKey = '', modelName = '';
        if (type == 'S' || type == 'P') { //按员工统计
            selectKey = type == 'S' ? 'account_id' : 'project_id';
            modelName = type == 'S' ? 'staff' : 'project';
            if (params.keyWord) {
                let pagers = await Models[modelName].find({ where: { name: { $like: `%${params.keyWord}%` }, companyId: company.id }, order: [['created_at', 'desc']] });

                let objs: any = [];
                objs.push.apply(objs, pagers);
                while (pagers.hasNextPage()) {
                    let nextPager = await pagers.nextPage();
                    objs.push.apply(objs, nextPager);
                    // pagers = nextPager;
                }

                let selectStr = '';
                objs.map((s: { id: string }) => {
                    if (s && s.id) {
                        selectStr += selectStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if (!selectStr || selectStr == '') { selectStr = `'${uuid.v1()}'`; }
                completeSql += ` and ${selectKey} in (${selectStr})`;
                planSql += ` and ${selectKey} in (${selectStr})`;
            }
            savedMoneyCompleteSql = completeSql + ' and is_special_approve = false';
            completeSql += ` group by ${selectKey};`;
            savedMoneyCompleteSql += ` group by ${selectKey};`;
            planSql += ` group by ${selectKey};`;
        }

        let selectSql = `select ${selectKey}, count(1) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure`;
        let savedMoneySelectSql = `select ${selectKey}, sum(budget-expenditure) as "savedMoney"`;
        let complete = `${selectSql} ${completeSql}`;
        let savedMoneyComplete = `${savedMoneySelectSql} ${savedMoneyCompleteSql}`;
        let plan = `${selectSql} ${planSql}`;

        if (type == 'D') {
            selectKey = 'departmentId';
            completeSql = `from trip_plan.trip_plans as p, department.staff_departments as s, department.departments as d where d.deleted_at is null and s.deleted_at is null and p.deleted_at is null and p.company_id ='${company.id}'  and s.staff_id=p.account_id and d.id=s.department_id and p.all_invoices_pass_time>'${params.startTime}' and p.all_invoices_pass_time<'${params.endTime}'`;
            savedMoneyCompleteSql = '';
            // planSql = `${completeSql} and p.status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}, ${EPlanStatus.COMPLETE})`;
            planSql = `${completeSql} and p.status not in (${EPlanStatus.CANCEL},${EPlanStatus.NO_BUDGET})`;
            completeSql += ` and p.status=${EPlanStatus.COMPLETE}`;
            if (params.keyWord) {
                let pagers = await Models.department.find({ where: { name: { $like: `%${params.keyWord}%` }, companyId: company.id }, order: [['created_at', 'desc']] });

                let depts: Department[] = [];
                depts.push.apply(depts, pagers);
                while (pagers.hasNextPage()) {
                    let nextPager = await pagers.nextPage();
                    depts.push.apply(depts, nextPager);
                    // pagers = nextPager;
                }

                let deptStr = '';
                depts.map((s) => {
                    if (s && s.id) {
                        deptStr += deptStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if (!deptStr || deptStr == '') { deptStr = `'${uuid.v1()}'`; }
                completeSql += ` and d.id in (${deptStr})`;
                planSql += ` and d.id in (${deptStr})`;
            }
            savedMoneyCompleteSql = completeSql + ' and is_special_approve = false';
            selectSql = `select d.id as "departmentId", count(p.id) as "tripNum",sum(p.budget) as budget, sum(p.expenditure) as expenditure, sum(p.budget-p.expenditure) as "savedMoney"`;
            savedMoneySelectSql = `select d.id as "departmentId", sum(p.budget-p.expenditure) as "savedMoney"`;
            complete = `${selectSql} ${completeSql} group by d.id;`;
            savedMoneyComplete = `${savedMoneySelectSql} ${savedMoneyCompleteSql} group by d.id;`;
            plan = `${selectSql} ${planSql} group by d.id;`;
        }
        // console.log(complete);
        let completeInfo = await DB.query(complete);
        // console.log("completeInfo:",completeInfo);
        let savedMoneyCompleteInfo = await DB.query(savedMoneyComplete);
        let planInfo = await DB.query(plan);

        let result = {};
        if (completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            completeInfo[0].map((ret: any) => {
                result[ret[selectKey]] = {
                    typeKey: ret[selectKey],
                    completeTripNum: Number(ret.tripNum),
                    completeBudget: Number(ret.budget),
                    expenditure: Number(ret.expenditure),
                    // savedMoney: Number(ret.savedMoney)
                };
            });
        }
        if (savedMoneyCompleteInfo && savedMoneyCompleteInfo.length > 0 && savedMoneyCompleteInfo[0].length > 0) {
            savedMoneyCompleteInfo[0].map((ret: any) => {
                let key = ret[selectKey];
                if (!result[key]) {
                    result[key] = {};
                }
                result[key].savedMoney = Number(ret.savedMoney);
            });
        }

        if (planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            planInfo[0].map((ret: any) => {
                let key = ret[selectKey];
                if (!result[key]) {
                    result[key] = {};
                }
                result[key].typeKey = ret[selectKey];
                result[key].planTripNum = Number(ret.tripNum);
                result[key].planBudget = Number(ret.budget);
                if (!result[key].expenditure) {
                    result[key].expenditure = 0;
                }
            });
        }

        result = _.orderBy(_.values(result), ['expenditure'], ['desc']);
        return result;
    }

    /**
     * @method saveTripPlan
     * 生成出差计划单:
     *   注意，补助无需上传票据，此时直接status设置成完成wait_commit
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['tripApproveId'], ["version"])
    static async saveTripPlanByApprove(params: { tripApproveId: string, version?: number }): Promise<TripPlan> {
        let approve = await Models.approve.get(params.tripApproveId);
        let account = await Models.staff.get(approve.submitter);
        let approveUser = await Models.staff.get(approve.approveUser);
        let company = approve.submitter ? account.company : approveUser.company;

        if (typeof approve.data == 'string')
            approve.data = JSON.parse(approve.data);

        let query: any = approve.data.query;   //查询条件
        if (typeof query == 'string')
            query = JSON.parse(query);
        
        let budget: any = approve.data.budgets;
        if (typeof budget == 'string') {
            budget = JSON.parse(budget);
        }
        let companyTotalSaved: number = 0;
        for (let i = 0; i < budget.length; i++) {
            companyTotalSaved += (budget[i].highestPrice - budget[i].price);
        }

        if (typeof query.destinationPlacesInfo == 'string')
            query.destinationPlacesInfo = JSON.parse(query.destinationPlacesInfo);

        let destinationPlacesInfo = query.destinationPlacesInfo;
        let budgets = approve.data.budgets;
        if (typeof budgets == 'string')
            budgets = JSON.parse(budgets);

        let tripPlan = TripPlan.create({ id: approve.id });
        let arrivalCityCodes: any[] = [];//目的地代码
        let project: Project | undefined;
        let goBackPlace = query.goBackPlace;
        if (query.projectName) {
            project = await API.tripPlan.getProjectByName({
                companyId: company.id, name: query.projectName,
                userId: account.id, isCreate: true
            });
        }

        if (query.originPlace) {
            let deptInfo = await API.place.getCityInfo({ cityCode: query.originPlace.id || query.originPlace, companyId: company.id }) || { name: null };
            tripPlan.deptCityCode = deptInfo.id;
            tripPlan.deptCity = deptInfo.name;
        }
        tripPlan.isRoundTrip = query.isRoundTrip;
        if (destinationPlacesInfo && _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0) {
            for (let i = 0; i < destinationPlacesInfo.length; i++) {
                let segment: ISegment = destinationPlacesInfo[i];

                //处理目的地 放入arrivalCityCodes 原目的地信息存放第一程目的地信息
                if (segment.destinationPlace) {
                    let place = segment.destinationPlace;
                    if (typeof place != 'string') {
                        place = place['id']
                    }
                    let arrivalInfo = await API.place.getCityInfo({ cityCode: place, companyId: company.id }) || { name: null };
                    arrivalCityCodes.push(arrivalInfo.id);
                    if (i == destinationPlacesInfo.length - 1 && goBackPlace) {
                        arrivalCityCodes.push(goBackPlace);
                    }
                    if (i == (destinationPlacesInfo.length - 1)) {
                        tripPlan.arrivalCityCode = arrivalInfo.id;
                        tripPlan.arrivalCity = arrivalInfo.name;
                    }
                }

                //处理其他数据
                if (i == 0) {
                    tripPlan.startAt = segment.leaveDate || new Date();
                    //处理原始数据 用第一程数据
                    tripPlan.isNeedTraffic = segment.isNeedTraffic || false;
                    tripPlan.isNeedHotel = segment.isNeedHotel || false;
                }
                if (i == (destinationPlacesInfo.length - 1)) {
                    tripPlan.backAt = segment.goBackDate || new Date();
                }
            }
        }
        tripPlan.arrivalCityCodes = JSON.stringify(arrivalCityCodes);

        if (query.feeCollected) {
            tripPlan.costCenterId = query.feeCollected;
        }
        tripPlan.setCompany(account.company);
        tripPlan.auditUser = tryObjId(approveUser);
        tripPlan.project = project as Project;
        tripPlan.title = approve.title;//project名称
        tripPlan.accountId = account.id;
        tripPlan.status = EPlanStatus.WAIT_RESERVE;    
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号
        tripPlan.query = query;
        tripPlan.isSpecialApprove = approve.isSpecialApprove;
        tripPlan.specialApproveRemark = approve.specialApproveRemark;
        tripPlan.staffList = query.staffList || [];
        tripPlan.submitterSnapshot = approve.submitterSnapshot;
        tripPlan.auditUserSnapshot = approve.approveUserSnapshot;
        tripPlan.staffListSnapshot = approve.staffListSnapshot;
        tripPlan.companySaved = companyTotalSaved;

        tripPlan.readNumber = 0;

        //计算总预算
        let totalBudget: number = budgets
            .map((item) => {
                return Number(item.price) || 0;
            })
            .reduce((total: number, cur: number) => {
                return total + cur;
            }, 0);

        tripPlan.budget = totalBudget;

        if(approve.oldId){
            tripPlan.oldId = approve.oldId;
            tripPlan.modifyReason = query.modifyReason;
            let modifiedTripPlan = await Models.tripPlan.get(approve.oldId);
            if(modifiedTripPlan){
                modifiedTripPlan.modifyStatus = EModifyStatus.MODIFIED;
                await modifiedTripPlan.save();
            }
        }
        let log = TripPlanLog.create({ tripPlanId: tripPlan.id, userId: tryObjId(approveUser), remark: `出差审批通过，生成出差记录` });
        await Promise.all([tripPlan.save(), log.save()]);

        let tripDetails: any[] = [];
        let ps: any[] = [];
        await Promise.all(budgets.map(async function (b: any) {
            if (b.originPlace) {
                if (typeof b.originPlace == 'string') {
                    b.originPlace = await API.place.getCityInfo({ cityCode: b.originPlace, companyId: company.id });
                }
            }
            if (b.destination) {
                if (typeof b.destination == 'string') {
                    b.destination = await API.place.getCityInfo({ cityCode: b.destination, companyId: company.id });
                }
            }
            if (b.city) {
                if (typeof b.city == 'string') {
                    b.city = await API.place.getCityInfo({ cityCode: b.city, companyId: company.id });
                }
            }
        }));
        let destCount = 0;
        await Promise.all(budgets.map(async function (budget: any) {
            let tripType = budget.tripType;
            let reason = budget.reason;
            let price = Number(budget.price);
            let detail;
            let data: any = {};

            data.reason = reason;
            data.type = tripType;
            data.budget = price;
            data.accountId= account.id;
            data.status = ETripDetailStatus.WAIT_RESERVE;
            data.reserveStatus = EOrderStatus.WAIT_SUBMIT;
            data.tripPlanId = tripPlan.id;
            data.budgetInfo = budget;
            switch (tripType) {
                case ETripType.OUT_TRIP:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity = budget.destination.id;
                    data.deptDateTime = budget.departDateTime || budget.departTime;
                    data.arrivalDateTime = budget.arrivalDateTime || budget.arrivalTime;
                    data.leaveDate = budget.leaveDate || budget.departTime;
                    data.cabin = budget.cabinClass;
                    data.invoiceType = budget.type;
                    detail = Models.tripDetailTraffic.create(data);
                    ps.push(detail);
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.BACK_TRIP:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity = budget.destination.id;
                    data.deptDateTime = budget.departDateTime || budget.departTime;
                    data.arrivalDateTime = budget.arrivalDateTime || budget.arrivalTime;
                    data.leaveDate = budget.leaveDate || budget.departTime;
                    data.cabin = budget.cabinClass;
                    data.invoiceType = budget.type;
                    detail = Models.tripDetailTraffic.create(data);
                    ps.push(detail);
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.HOTEL:
                    data.city = budget.cityName;
                    data.placeName = budget.hotelName;
                    data.name = budget.name;
                    data.position = budget.hotelName;
                    data.checkInDate = budget.checkInDate;
                    data.checkOutDate = budget.checkOutDate;
                    let dest = query.destinationPlacesInfo[destCount]
                    if (dest && dest.businessDistrict) {
                        let [latitude, longitude] = dest.businessDistrict.split(',').map(parseFloat);
                        data.landmark = { latitude, longitude };
                    } else {
                        data.landmark = { latitude: budget.city.latitude, longitude: budget.city.longitude };
                    }
                    detail = Models.tripDetailHotel.create(data);
                    ps.push(detail);
                    tripPlan.isNeedHotel = true;
                    destCount++;
                    break;
                case ETripType.SUBSIDY:
                    let templateId = null;

                    data.hasFirstDaySubsidy = budget.hasFirstDaySubsidy;
                    data.hasLastDaySubsidy = budget.hasLastDaySubsidy;
                    data.template = templateId;
                    data.subsidyMoney = budget.price;
                    data.subsidyTemplateId = templateId;
                    data.startDateTime = budget.fromDate;
                    data.endDateTime = budget.endDate;

                    //补助类型
                    let templates = budget.templates;
                    if (templates && templates.length) {
                        templates.forEach((t: any) => {
                            if (data.id) {
                                delete data.id;
                            }
                            data.template = t.id;
                            data.subsidyMoney = t.price;
                            data.budget = t.price;
                            data.subsidyTemplateId = t.id;
                            if(t.subsidyType && !t.subsidyType.isUploadInvoice){
                                data.status = ETripDetailStatus.WAIT_COMMIT;  //补助无需上传票据，此时原版设置为WAIT_COMMIT, 新版设置为WAIT_COMMIT
                            } else {
                                data.status = ETripDetailStatus.WAIT_UPLOAD;
                                tripPlan.auditStatus = EAuditStatus.NO_NEED_AUDIT; //产品需求，行程未到期，不能进入待传票据按钮
                            }
                            detail = Models.tripDetailSubsidy.create(data);
                            ps.push(detail);
                        })
                    } else {
                        detail = Models.tripDetailSubsidy.create(data);
                        // detail.expenditure = price;
                        // detail.status = EPlanStatus.COMPLETE;
                        ps.push(detail);
                    }

                    break;
                case ETripType.SPECIAL_APPROVE:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity = budget.destination.id;
                    data.deptDateTime = budget.startAt;
                    data.arrivalDateTime = budget.backAt;
                    detail = Models.tripDetailSpecial.create(data);
                    ps.push(detail);
                    break;
                default:
                    throw new Error("not support tripDetail type!");
            }
            return detail;
        }));

        tripDetails = await Promise.all(ps);

        let nums = tripPlan.staffList.length || 1;
        for (let tripDetail of tripDetails) {
            tripDetail = await tripDetail.save();
            //保存
            for (let staffId of tripPlan.staffList) {
                let tripDetailStaff = Models.tripDetailStaff.create({
                    staffId: staffId,
                    tripDetailId: tripDetail.id,
                    budget: tripDetail.budget / nums,
                    expenditure: (tripDetail.expenditure || 0) / nums
                });
                await tripDetailStaff.save();
            }
        }

        let self_url: string = ""
        let appMessageUrl: string = ""
        let version = params.version || config.link_version || 2  //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
        if (version == 2) {
            appMessageUrl = `#/trip/trip-list-detail/${tripPlan.id}/1`;
            self_url = `${config.v2_host}${appMessageUrl}`//'trip/trip-list-detail/:tripId'
        } else {
            self_url = config.host + '/index.html#/trip/list-detail?tripid=' + approve.id;
            let finalUrl = `#/trip/list-detail?tripid=${approve.id}`;
            finalUrl = encodeURIComponent(finalUrl);
            appMessageUrl = `#/judge-permission/index?id=${approve.id}&modelName=tripPlan&finalUrl=${finalUrl}`;
        }

        try {
            self_url = await API.wechat.shorturl({ longurl: self_url });
        } catch (err) {
            logger.error(err);
        }

        API.tripApprove.sendApprovePassNoticeToCompany({ approveId: approve.id })
        .catch((err: Error) => { 
            logger.error('发送审批通过通知给企业时发生错误:', err);
        })

        let tplName = 'qm_notify_approve_pass';
        API.notify.submitNotify({
            userId: account.id, key: tplName,
            values: { tripPlan: tripPlan, detailUrl: self_url, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPROVE_NOTICE }
        }).catch((err: Error) => {
            logger.error('发送审批通过通知给用户时发生错误:', err);
        })

        /*try {
            await API.ddtalk.sendLinkMsg({ accountId: account.id, text: '您的预算已审批完成', url: self_url });
        } catch (err) {
            console.error(err);
        }*/

        try {
            if (tripPlan.costCenterId) {
                let costCenter = await Models.costCenter.get(tripPlan.costCenterId);
                if (costCenter) {
                    await costCenter.checkoutBudgetNotice();
                }
            }
        } catch (err) {
            console.error(err);
        }

        return tripPlan;
    }

    @clientExport
    @requireParams([], ['limit', 'staffId', 'startTime', 'endTime'])
    static async tripPlanSaveRank(params: { limit?: number | string, staffId?: string, startTime?: string, endTime?: string }) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let limit = params.limit || 10;
        if (!limit || !/^\d+$/.test(limit as string) || limit > 100) {
            limit = 10;
        }
        let sql = `select account_id, sum(budget) - sum(expenditure) as save from trip_plan.trip_plans 
        where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}' and is_special_approve = false `;
        if (params.staffId)
            sql += ` and account_id = '${params.staffId}'`;
        if (params.startTime)
            sql += ` and start_at > '${params.startTime}'`;
        if (params.endTime)
            sql += ` and start_at < '${params.endTime}'`;
        sql += ` group by account_id order by save desc limit ${limit};`;

        let ranks = await DB.query(sql)
            .then(function (result) {
                return result[0];
            });

        ranks = await Promise.all(ranks.map((v: { account_id: string, save: number }) => {
            return Models.staff.get(v.account_id)
                .then(function (staff) {
                    return { staff: staff, save: v.save };
                })
        }));

        return ranks;
    }

    @clientExport
    static async getTripPlanSave(params: { accountId: string }) {
        let staff = await Models.staff.get(params.accountId);
        let accountId = params.accountId;
        let companyId = staff.company.id;
        let sql = `select sum(budget) - sum(expenditure) as save from trip_plan.trip_plans where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}' AND account_id =  '${accountId}' `;

        let ranks = await DB.query(sql)
            .then(function (result) {
                return result[0];
            });

        return ranks[0].save;
    }

    /**
     * 更改首页tripPlan展示状态 
     */
    @clientExport
    static async changeTripPlanDisplayStatus(params: {tripPlanId: string, status: number}) {
        let {tripPlanId, status} = params
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        tripPlan.displayStatus = status;
        await tripPlan.save();
    }

    @clientExport
    @requireParams(["tripPlanId"])
    static async makeFinalBudget(params: { tripPlanId: string }) {
        let accountId = getSession()["accountId"];
        let tripPlanId = params.tripPlanId;
        if (!accountId) {
            throw L.ERR.PERMISSION_DENY();
        }

        if (!tripPlanId) {
            throw L.ERR.PERMISSION_DENY();
        }

        let tripPlan = await Models.tripPlan.get(tripPlanId);
        if (tripPlan.auditUser != accountId) {
            throw L.ERR.PERMISSION_DENY();
        }

        //取出查询参数,重新计算预算
        let isRoundTrip = true;
        let query = tripPlan.query;
        if (!query) {
            let { deptCityCode, arrivalCityCode, startAt, backAt, isNeedTraffic, isNeedHotel } = tripPlan;
            query = {
                originPlace: deptCityCode,
                destinationPlace: arrivalCityCode,
                leaveDate: moment(startAt['value']).format("YYYY-MM-DD"),
                goBackDate: moment(backAt['value']).format("YYYY-MM-DD"),
                isNeedTraffic: isNeedTraffic,
                isNeedHotel: isNeedHotel,
                isRoundTrip: isRoundTrip
            }
        }

        if (typeof query == 'string') {
            query = JSON.parse(query);
        }
        let budgetId = await API.client.travelBudget.getTravelPolicyBudget(query);
        let budgetResult = await API.client.travelBudget.getBudgetInfo({ id: budgetId });
        let budgets: ITravelBudgetInfo[] = budgetResult.budgets;

        //计算总预算
        let totalBudget: number = 0;
        budgets.forEach((item) => {
            if (Number(item.price) <= 0) {
                totalBudget = -1;
                return;
            }
            totalBudget += Number(item.price);
        });
        tripPlan.originalBudget = tripPlan.budget;
        tripPlan.budget = totalBudget;
        tripPlan.isFinalBudget = true;
        tripPlan.finalBudgetCreateAt = budgetResult.createAt;
        await tripPlan.save();
        return true;
    }

    @clientExport
    @requireParams(["tripPlanId"], ["version"])
    static async makeSpendReport(params: { tripPlanId: string, version?: number }) {
        var money2hanzi = require("money2hanzi");
        let staff = await Staff.getCurrent()
        let { tripPlanId } = params;
        let tripPlan = await Models.tripPlan.get(tripPlanId);

        if (tripPlan.accountId != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }
        if (!tripPlan || tripPlan.backAt.getTime() > Date.now() || tripPlan.auditStatus != EAuditStatus.INVOICE_PASS) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }
        if (!staff.email) {
            throw L.ERR.EMAIL_EMPTY();
        }
        let cities = tripPlan.arrivalCityCodes;
        if (typeof cities == 'string') {
            cities = JSON.parse(cities);
        }

        let firstDept = cities[0];
        let lastDept = cities[cities.length - 1];
        firstDept = await API.place.getCityInfo({ cityCode: firstDept });
        lastDept = await API.place.getCityInfo({ cityCode: lastDept });
        let firstDeptTz = firstDept.timezone ? firstDept.timezone : "Asia/shanghai";
        let lastDeptTz = lastDept.timezone ? lastDept.timezone : "Asia/shanghai";

        let title = moment(tripPlan.startAt).format('MM.DD') + '-' + moment(tripPlan.backAt).format("MM.DD") + tripPlan.deptCity + "到" + tripPlan.arrivalCity + '报销单'
        let tripDetails = await Models.tripDetail.find({
            where: { tripPlanId: tripPlanId },
            order: [["created_at", "asc"]]
        })
        // let tripDetails = await tripPlan.getTripDetails({where: {}, order: [["created_at", "asc"]]});
        let tripApprove = await API.tripApprove.getTripApprove({ id: tripPlanId });
        let approveUsers: string[] = (tripApprove && tripApprove.approvedUsers ? tripApprove.approvedUsers : '').split(/,/g)
            .filter((v: string) => {
                return !!v;
            }).map(async (userId: string) => {
                if (userId) {
                    let staff = await Models.staff.get(userId)
                    return staff.name;
                }
                return '';
            })
        approveUsers = await Promise.all(approveUsers)
        let _tripDetails = await Promise.all(tripDetails.map(async (v): Promise<ReportInvoice[]> => {
            let tripDetailInvoices = await Models.tripDetailInvoice.find({ where: { tripDetailId: v.id, payType: { $ne: EPayType.COMPANY_PAY } } });

            if (v.type == ETripType.OUT_TRIP || v.type == ETripType.BACK_TRIP) {
                let v1 = <TripDetailTraffic>v;
                let trafficType: any;
                let trafficInfo: any;
                trafficType = v1.type == ETripType.OUT_TRIP ? 'GO' : 'BACK';
                trafficInfo = v1.invoiceType == EInvoiceType.TRAIN ? '火车' : '飞机';
                trafficInfo += v1.invoiceType == EInvoiceType.PLANE ? MPlaneLevel[v1.cabin] : MTrainLevel[v1.cabin];
                let deptCity = await API.place.getCityInfo({ cityCode: v1.deptCity });
                let arrivalCity = await API.place.getCityInfo({ cityCode: v1.arrivalCity });

                return tripDetailInvoices.map((invoice) => {
                    let data: ReportInvoice = {
                        type: '交通',
                        date: moment(invoice.invoiceDateTime).format('YYYY.MM.DD'),
                        invoiceInfo: `交通费`,
                        quantity: 1,
                        money: invoice.totalMoney,
                        departCity: deptCity.name,
                        arrivalCity: arrivalCity.name,
                        remark: `${deptCity.name}-${arrivalCity.name}`,
                        trafficType: `${trafficType}`,
                        trafficInfo: `${trafficInfo}`
                    }

                    return data;
                });
            }
            if (v.type == ETripType.HOTEL) {
                let v1 = <TripDetailHotel>v;
                let city = await API.place.getCityInfo({ cityCode: v1.city })

                return tripDetailInvoices.map((invoice) => {
                    let data: ReportInvoice = {
                        type: '住宿',
                        date: moment(invoice.invoiceDateTime).format('YYYY.MM.DD'),
                        invoiceInfo: `住宿费`,
                        quantity: 1,
                        money: invoice.totalMoney,
                        "remark": `${moment(v1.checkInDate).format('YYYY.MM.DD')}-${moment(v1.checkOutDate).format('YYYY.MM.DD')} ${city.name} 共${moment(v1.checkOutDate).diff(v1.checkInDate, 'days')}日`,
                        "duration": `${moment(v1.checkOutDate).diff(v1.checkInDate, 'days')}`
                    }

                    return data;
                });
            }
            if (v.type == ETripType.SUBSIDY) {
                return tripDetailInvoices.map((invoice) => {
                    let data: ReportInvoice = {
                        type: '补助',
                        date: moment(invoice.invoiceDateTime).format('YYYY.MM.DD'),
                        invoiceInfo: `补助费`,
                        quantity: 1,
                        money: invoice.totalMoney,
                        remark: `补助费`,
                    }

                    return data;
                });
            }
            if (v.type == ETripType.SPECIAL_APPROVE) {
                return tripDetailInvoices.map((invoice) => {
                    let data: ReportInvoice = {
                        type: '特殊审批',
                        date: moment(invoice.invoiceDateTime).format('YYYY.MM.DD'),
                        invoiceInfo: `特殊审批费`,
                        quantity: 1,
                        money: invoice.totalMoney,
                        remark: `特别审批出差费用`,
                    }

                    return data;
                });
            }
            return []
        }))
        let financeCheckCode = Models.financeCheckCode.create({ tripPlanId: tripPlanId, isValid: true });
        financeCheckCode = await financeCheckCode.save();
        // let roundLine = `${tripPlan.deptCity}-${tripPlan.arrivalCity}${tripPlan.isRoundTrip ? '-' + tripPlan.deptCity: ''}`;
        let roundLine = tripPlan.deptCity;
        if (typeof tripPlan.arrivalCityCodes == 'string') {
            tripPlan.arrivalCityCodes = JSON.parse(tripPlan.arrivalCityCodes);
        }
        await Promise.all(tripPlan.arrivalCityCodes.map(async function (item: string) {
            let arrCity = await API.place.getCityInfo({ cityCode: item });
            if (arrCity) {
                roundLine = roundLine && roundLine != '' && typeof (roundLine) != "undefined" ? roundLine + "-" : '';
                roundLine += arrCity.name;
            }
        }))
        roundLine += tripPlan.isRoundTrip ? '-' + tripPlan.deptCity : '';
        console.info(roundLine);

        let invoiceDetail: any = [];
        _tripDetails.map((item) => {
            invoiceDetail.push(...item);
        });

        _tripDetails = invoiceDetail;

        _tripDetails = _tripDetails.filter((v) => {
            return v['money'] > 0;
        });
        if (_tripDetails.length <= 0) {
            throw L.ERROR_CODE(500, '本次出差中无需要报销费用');
        }
        var invoiceQuantity = _tripDetails
            .map((v: any) => {
                return v['quantity'] || 0;
            })
            .reduce(function (previousValue, currentValue) {
                return previousValue + currentValue;
            });

        //计算用户总花费
        let _personalExpenditure = _tripDetails
            .map((v: any) => {
                return v['money'];
            })
            .reduce((prev, cur) => {
                return Number(prev) + Number(cur)
            });

        let detailUrl: string
        let version = params.version || config.link_version || 2 //#@template 外链版本的优先级：参数的版本 > 配置的外链版本 > 默认配置2
        if (version == 2) {
            detailUrl = `${config.v2_host}#/trip/make-expense/${tripPlan.id}/${financeCheckCode.code}`;
        } else {
            detailUrl = `${config.host}#/finance/trip-detail?id=${tripPlan.id}&code=${financeCheckCode.code}`;
        }

        let content: any = [
            `出差人:${staff.name}`,
            `出差日期:${moment(tripPlan.startAt).format('YYYY.MM.DD')}-${moment(tripPlan.backAt).format('YYYY.MM.DD')}`,
            `出差路线: ${roundLine}`,
            `出差预算:${tripPlan.budget}`,
            `实际支出:${_personalExpenditure}个人支付, ${(Number(tripPlan.expenditure) - _personalExpenditure).toFixed(2)}公司支付`,
            `出差记录编号:${tripPlan.planNo}`,
            `校验地址: ${detailUrl}`
        ]

        let qrcodeCxt = await API.qrcode.makeQrcode({ content: content.join('\n\r') });
        let departmentsStr = await staff.getDepartmentsStr();

        let staffNames = await Promise.all(tripPlan.staffList.map(async (id) => {
            let staff = await Models.staff.get(id);
            return staff.name;
        }));

        var data = {
            "submitter": staff.name,  //提交人
            "staffList": staffNames.join(","),
            "department": departmentsStr,  //部门
            "budgetMoney": tripPlan.budget || 0, //预算总金额
            "totalMoney": _personalExpenditure || 0,  //实际花费
            "totalMoneyHZ": money2hanzi.toHanzi(_personalExpenditure),  //汉字大写金额
            "invoiceQuantity": invoiceQuantity, //票据数量
            "createAt": moment().format('YYYY年MM月DD日HH:mm'), //生成时间
            "departDate": moment(tripPlan.startAt).tz(firstDeptTz).format('YYYY.MM.DD'), //出差起始时间
            "backDate": moment(tripPlan.backAt).tz(lastDeptTz).format('YYYY.MM.DD'), //出差返回时间
            "reason": tripPlan.project ? tripPlan.project.name : '', //出差事由
            "approveUsers": approveUsers, //本次出差审批人
            "qrcode": `data:image/png;base64,${qrcodeCxt}`,
            "invoices": _tripDetails,
            "roundLine": roundLine,
        }

        let buf = await makeSpendReport(data);
        try {
            await API.notify.submitNotify({
                key: 'qm_spend_report',
                userId: staff.id,
                values: {
                    detailUrl: detailUrl,
                    attachments: [{
                        filename: title + '.pdf',
                        content: buf.toString("base64"),
                        encoding: 'base64'
                    }]
                },
            });

        } catch (err) {
            console.error(err.stack);
        }
        return true;
    }

    @clientExport
    static async getTripDetailInvoices(options: { where: any, limit?: any, order?: any }): Promise<FindResult> {
        if (!options || !options.where) throw new Error('查询条件不能为空');
        let where = options.where;
        if (!where.tripDetailId) throw new Error('查询条件错误');
        let qs: any = {
            where: { tripDetailId: options.where.tripDetailId },
        }
        if (options.limit) qs.limit = options.limit;
        if (options.order) {
            qs.order = options.order;
        } else {
            qs.order = [['created_at', 'asc']];
        }
        let invoices = await Models.tripDetailInvoice.find(qs);
        let ids = invoices.map((v) => {
            return v.id;
        });
        return { ids: ids, count: invoices.length };
    }

    @clientExport
    @requireParams(['id'])
    static async getTripDetailInvoice(params: { id: string }): Promise<TripDetailInvoice> {
        return Models.tripDetailInvoice.get(params.id);
    }

    @clientExport
    @requireParams(['tripDetailId', 'totalMoney', 'payType', 'invoiceDateTime', 'type', 'remark'], ['id', 'pictureFileId', 'accountId', 'orderId', 'sourceType', 'status', 'supplierId'])
    static async saveTripDetailInvoice(params: TripDetailInvoice): Promise<TripDetailInvoice> {
        let tripDetailInvoice = Models.tripDetailInvoice.create(params);
        tripDetailInvoice = await tripDetailInvoice.save();


        let tripDetail = await Models.tripDetail.get(tripDetailInvoice.tripDetailId);
        if (!tripDetail.expenditure) {
            tripDetail.expenditure = 0;
        }
        await updateTripDetailExpenditure(tripDetail);
        await tryUpdateTripDetailStatus(tripDetail, ETripDetailStatus.WAIT_COMMIT);
        return tripDetailInvoice;
    }

    static async notifyDesignatedAcount(params: { notifyUrl?: string, staffId: string }): Promise<any> {
        let staffId = params.staffId;
        if (!staffId || staffId == 'undefined') {
            throw L.ERR.USER_NOT_EXIST();
        }
        let staff = await Models.staff.get(staffId);

        try {
            await API.notify.submitNotify({
                mobile: '13810529805',
                email: 'notice@jingli365.com',
                key: 'qm_notify_agency_budget',
                values: {
                    company: staff.company,
                    staff: staff,
                    detailUrl: params.notifyUrl
                }
            })
        } catch (err) {
            logger.info(err);
        }
    }

    @clientExport
    @requireParams(['detailId', 'orderIds', 'supplierId'])
    static async relateOrders(params: {
        detailId: string, orderIds: string[], supplierId: string
    }): Promise<any> {
        let result: { success: any[], failed: any[] } = { success: [], failed: [] };
        let currentStaff = await Staff.getCurrent();
        let orders = await currentStaff.getOrders({ supplierId: params.supplierId });
        let Morders: any = {};
        orders.forEach(async function (o) {
            Morders[o.id] = o;
        })
        let orderIds = params.orderIds;
        let ps = orderIds.map(async function (id: any) {
            let o = Morders[id];
            let detailInvoice = await Models.tripDetailInvoice.find({ where: { orderId: id, accountId: currentStaff.id, sourceType: ESourceType.RELATE_ORDER } });
            if (detailInvoice && detailInvoice.length > 0) {
                result.failed.push({ desc: o.desc, remark: '该订单已被关联过' });
                return o.id;
                // throw L.ERR.ORDER_HAS_RELATED();
            }

            if (o.persons.indexOf(currentStaff.name) < 0) {
                result.failed.push({ desc: o.desc, remark: '只能关联自己的订单' });
                return o.id;
                // throw L.ERR.ORDER_NOT_YOURS();
            }
            let invoice: any = {};
            invoice.accountId = currentStaff.id;
            invoice.orderId = o.id;
            invoice.sourceType = ESourceType.RELATE_ORDER;
            invoice.tripDetailId = params.detailId;
            invoice.invoiceDateTime = o.date;
            invoice.totalMoney = o.price;
            invoice.payType = o.parType;
            invoice.remark = o.desc;
            invoice.type = o.orderType;
            invoice.status = EInvoiceStatus.AUDIT_PASS;
            invoice.supplierId = params.supplierId;
            await TripPlanModule.saveTripDetailInvoice(invoice);
            result.success.push({ desc: o.desc, remark: '关联成功' });
            return o.id;
        })
        await Promise.all(ps);
        return result;
    }

    @clientExport
    @requireParams(["id"], ['totalMoney', 'payType', 'invoiceDateTime', 'type', 'remark', 'pictureFileId'])
    static async updateTripDetailInvoice(params: any): Promise<TripDetailInvoice> {
        let { id, totalMoney } = params;
        let oldMoney = 0;
        let newMoney = 0;
        if (totalMoney) {
            newMoney = Number(totalMoney);
        }
        if (newMoney < 0) {
            throw L.ERR.MONEY_FORMAT_ERROR();
        }
        let tripDetailInvoice = await Models.tripDetailInvoice.get(id);
        if (tripDetailInvoice.totalMoney) {
            oldMoney = tripDetailInvoice.totalMoney;
        }

        if (params.totalMoney != oldMoney || params.pictureFileId != tripDetailInvoice.pictureFileId) {
            tripDetailInvoice.status = EInvoiceStatus.WAIT_AUDIT;
            tripDetailInvoice.auditRemark = "";
        }

        for (let key in params) {
            tripDetailInvoice[key] = params[key];
        }

        tripDetailInvoice = await tripDetailInvoice.save()
        let tripDetail = await Models.tripDetail.get(tripDetailInvoice.tripDetailId);
        await updateTripDetailExpenditure(tripDetail);
        await tryUpdateTripDetailStatus(tripDetail, ETripDetailStatus.WAIT_COMMIT);
        return tripDetailInvoice;
    }

    @clientExport
    @requireParams(['id'])
    static async deleteTripDetailInvoice(params: { id: string }): Promise<boolean> {
        let { id } = params;
        let tripDetailInvoice = await Models.tripDetailInvoice.get(id);
        let tripDetailId = tripDetailInvoice.tripDetailId;
        await tripDetailInvoice.destroy();
        let tripDetail = await Models.tripDetail.get(tripDetailId);
        await updateTripDetailExpenditure(tripDetail);
        let invoices = await tripDetail.getInvoices();
        if (invoices && invoices.length) {
            await tryUpdateTripDetailStatus(tripDetail, ETripDetailStatus.WAIT_COMMIT);
        } else {
            await tryUpdateTripDetailStatus(tripDetail, ETripDetailStatus.WAIT_UPLOAD);
        }
        return true;
    }


    //预订跳转
    @clientExport
    static async getBookLink(params: { reserveType: string, data: object }): Promise<any> {
        let transfer = {
            ctrip: {
                supplierKey: 'ctrip_com',
                trafficBookLink: 'http://m.ctrip.com/html5/flight/matrix.html',
                hotelBookLink: 'http://m.ctrip.com/webapp/hotel/'
            },
            qunar: {
                supplierKey: 'qunar_com_m',
                trafficBookLink: 'https://touch.qunar.com/h5/flight',
                hotelBookLink: 'https://touch.qunar.com/hotel'
            },
            flypig: {
                supplierKey: 'taobao_com',
                trafficBookLink: 'https://h5.m.taobao.com/trip/flight/search/index.html',
                hotelBookLink: 'https://h5.m.taobao.com/trip/hotel/search/index.html'
            },
            jingzhong: {
                supplierKey: 'jingzhong_com',
                trafficBookLink: 'http://m.ctrip.com/html5/flight/matrix.html',
                hotelBookLink: 'http://m.ctrip.com/webapp/hotel/'
            },
            kiwi: {
                supplierKey: 'kiwi_com',
                trafficBookLink: 'https://www.kiwi.com/cn/',
                hotelBookLink: 'https://www.kiwi.com/cn/'
            }
        };
        let reqData = {
            supplier: transfer[params.data['agent']] || transfer['ctrip'],
            data: params.data,
            reserveType: params.reserveType,
            fromCity: params.data['fromCity'] || '',
            toCity: params.data['toCity'] || '',
            leaveDate: params.data['leaveDate'] || '',
            city: params.data['city'] || '',
            checkInDate: params.data['checkInDate'] || '',
            checkOutDate: params.data['checkOutDate'] || ''
        };

        // let resGet = await RestfulAPIUtil.proxyHttp({
        //     url: `/company/${companyId}/supplier/getBookLink`,
        //     body: reqData,
        //     method: 'POST'
        // });
        let resGet = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: reqData,
                method: 'POST'
            },
            addUrl: 'getBookLink'
        })
        console.log('res[data]', resGet['data']);
        return resGet['data'];
    }



    static __initHttpApp = require('./invoice');

    /**
     * @method 定时器处理过期的行程单及其详情
     *   支持行程未到期，无审核入口和显示审核入口
     *   注意：补助是否传票据，在tripPlan创建时已经确定tripPlan的auditStatus是否需要传票据
     *        酒店到店付需要上传票据，
     *        若全部在鲸力系统预定，且补助需要上传票据，且在行程结束前票据已完全提交，此时需要将tripPlan置为wait_commit
     *        若全部在鲸力系统预定，且酒店是到店支付，且在行程结束前票据已完全提交，此时需要将tripPlan置为wait_commit
     */
    static _scheduleTask() {
        let taskId = "autoCheckTripPlanIsOverDate";
        logger.info('run task  ' + taskId);
        scheduler('0 0 0 * * *', taskId, function() {
            (async() => {
                let tripPlans: TripPlan[] = await Models.tripPlan.all({where: {status: EPlanStatus.WAIT_RESERVE, backAt: { $lte : new Date() } }});
                for (let i = 0; i < tripPlans.length; i++) {
                    let tripEndTime = tripPlans[i].backAt;
                    if (new Date() > new Date(tripEndTime))  {  //this tripPlan just reach or overdue, change the tripDetails' and tripPlan its status, set tripPlan as expired, tripDetail as wait_upload
                        //change the tripPlan's status                        
                        let tripPlanId = tripPlans[i].id;
                        //get tripDetails and find the unreserved ones then change their status
                        let tripDetails: TripDetail[] = await Models.tripDetail.all({where: {tripPlanId: tripPlanId}});

                        let hasReserved = 0;
                        let needInvoiceUploaded = 0;
                        let invoiceUploaded = 0;
                        let log = Models.tripPlanLog.create({tripPlanId: tripPlanId, userId: tripPlans[i].auditUser});
                        await Promise.all(tripDetails.map(async (tdetail: TripDetail) => {
                            if(tdetail.type != ETripType.SUBSIDY && tdetail.status == ETripDetailStatus.COMPLETE){   //already reserved tripDetail exists
                                hasReserved ++;
                            }
                            if(tdetail.type == ETripType.SUBSIDY) {  //将补助全视为需要上传票据，无需上传票据的补助，
                                needInvoiceUploaded ++;
                                if(tdetail.status == ETripDetailStatus.WAIT_COMMIT) invoiceUploaded++;
                            }
                            if(tdetail.type == ETripType.HOTEL && tdetail.payType == EPayType.PAY_ON_ARRIVAL){//酒店到店付，此处不需要修改tripdetail的状态
                                needInvoiceUploaded++;
                                if(tdetail.status == ETripDetailStatus.COMPLETE) invoiceUploaded++;
                                return tdetail;  
                            } 
                            if( (tdetail.status == ETripDetailStatus.WAIT_RESERVE || tdetail.status == ETripDetailStatus.WAIT_TICKET)) {  //对非到店支付、未成功预定的修改其状态      
                                tdetail.status = ETripDetailStatus.WAIT_UPLOAD;
                                needInvoiceUploaded++;
                                await tdetail.save();
                            }
                            return tdetail;
                        }));
          
                        for (let j = 0; j < tripDetails.length; j++) {
                            tripDetails[j].status = ETripDetailStatus.WAIT_UPLOAD;
                            await tripDetails[j].save();
                        }
                        if(hasReserved) {
                            tripPlans[i].status = EPlanStatus.RESERVED;
                            log.remark = `已预订`;
                            await log.save();
                        }
                        if(!hasReserved) {
                            tripPlans[i].status = EPlanStatus.EXPIRED;
                            log.remark = `已失效`;
                            await log.save();
                        }
                        if(invoiceUploaded == needInvoiceUploaded) { //支持行程未结束，上传票据，此时若票据上传完成，tripPlan的状态为待提交审核
                            tripPlans[i].auditStatus = EAuditStatus.WAIT_COMMIT;      
                        } else {
                            tripPlans[i].auditStatus = EAuditStatus.WAIT_UPLOAD;
                        }
                        await tripPlans[i].save();
                    }
                }
            })()
                .catch((err) => {
                    logger.error(`run stark ${taskId} error:`, err.stack);
                });
        });
    }

    /*static _scheduleTask () {
        let taskId = "authApproveTrainPlan";
        logger.info('run task ' + taskId);
        scheduler('0 *!/5 * * * *', taskId, async function() {
            let tripApproves = await Models.tripApprove.find({where: {autoApproveTime: {$lte: new Date()}, status: QMEApproveStatus.WAIT_APPROVE}, limit: 10, order: [['auto_approve_time', 'desc']]});
            tripApproves.map(async (approve) => {

                let approveCompany = await approve.getCompany();
                let query = approve.query;
                if(typeof query == "string"){
                    query = JSON.parse(query);
                }
                let content = "";
                let destinationPlacesInfo = query.destinationPlacesInfo;

                if(query && query.originPlace){
                    let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
                    content = content + originCity.name + "-";
                }
                if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
                    for(let i = 0; i < destinationPlacesInfo.length; i++){
                        let segment: ISegment = destinationPlacesInfo[i]
                        let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                        if(i<destinationPlacesInfo.length-1){
                            content = content + destinationCity.name+"-";
                        }else{
                            content = content + destinationCity.name;
                        }
                    }
                }
                let frozenNum = query.frozenNum;

                let version = config.link_version || 2 //外链使用的版本。

                try{

                    if(typeof approve.query == 'string'){
                        approve.query = JSON.parse(approve.query);
                    }
                    let query={
                        originPlace:approve.query.originPlace,
                        isRoundTrip:approve.query.isRoundTrip,
                        goBackPlace:approve.query.goBackPlace,
                        staffId:approve['accountId'],
                        destinationPlacesInfo:approve.query.destinationPlacesInfo
                    };

                    let budgetsId = await API.travelBudget.getTravelPolicyBudget(query);

                    let budgetsInfo = await API.travelBudget.getBudgetInfo({id: budgetsId,accountId: approve['accountId']});
                    let totalBudget = 0;
                    let budgets = budgetsInfo.budgets;

                    for(let i=0; i < budgets.length; i++){
                        if (budgets[i].price <= 0) {
                            totalBudget = -1;
                            break;
                        }
                        totalBudget += Number(budgets[i].price);
                    }
                    if (totalBudget > approve.budget) {
                        approve.budget = totalBudget;
                        approve.budgetInfo = budgets;
                    }

                    await approveCompany.beforeApproveTrip({number: frozenNum});

                    if(approve.approveUser && approve.approveUser.id && /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(approve.approveUser.id)) {
                        let log = Models.tripPlanLog.create({tripPlanId: approve.id, userId: approve.approveUser.id, approveStatus: EApproveResult.AUTO_APPROVE, remark: '自动通过'});
                        await log.save();

                    }
                    // await TripPlanModule.saveTripPlanByApprove({tripApproveId: approve.id});


                    approve.status = QMEApproveStatus.PASS;
                    approve = await approve.save();

                    if(!approve.isSpecialApprove && approve.status == QMEApproveStatus.PASS){
                        if(approve.createdAt.getMonth() == new Date().getMonth()){
                            await approveCompany.approvePassReduceTripPlanNum({accountId: approve.account.id, tripPlanId: approve.id,
                                remark: "自动审批通过消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                        }else{
                            await approveCompany.approvePassReduceBeforeNum({accountId: approve.account.id, tripPlanId: approve.id,
                                remark: "自动审批通过上月申请消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                        }
                    }

                    await plugins.qm.tripApproveUpdateNotify(null, {
                        approveNo: approve.id,
                        status: EApproveStatus.SUCCESS,
                        approveUser: approve.approveUser.id,
                        outerId: approve.id,
                        // data: approve.budgetInfo,
                        oa: 'qm',
                        version: version
                    });

                    // let _approve = await Models.approve.get(approve.id);
                    // _approve.status = EApproveStatus.SUCCESS;
                    // await _approve.save();

                }catch(e){
                    logger.error(e.stack);
                    if(!approve.autoApproveNum){
                        approve.autoApproveNum = 0;
                    }
                    approve.autoApproveNum++;

                    if(approve.autoApproveNum >= 3){
                        //已经自动审批三次了，仍然获取预算失败，直接驳回
                        approve.status = QMEApproveStatus.REJECT;
                        approve.approveRemark = "自动审批失败";
                        await approve.save();

                        if(!approve.isSpecialApprove && approve.status == QMEApproveStatus.REJECT){
                            if(approve.createdAt.getMonth() == new Date().getMonth()){
                                await approveCompany.approveRejectFreeTripPlanNum({accountId: approve.account.id, tripPlanId: approve.id,
                                    remark: "审批驳回释放冻结行程点数", content: content, frozenNum: frozenNum});

                            }else{
                                await approveCompany.approveRejectFreeBeforeNum({accountId: approve.account.id, tripPlanId: approve.id,
                                    remark: "审批驳回上月申请释放冻结行程点数", content: content, frozenNum: frozenNum});
                            }
                        }

                        //发送审核结果邮件
                        let self_url: string = ""
                        let appMessageUrl: string = ""
                        if (version == 2) {
                            appMessageUrl = `#/trip-approval/approve-detail/${approve.id}/1`
                            self_url = `${config.v2_host}/${appMessageUrl}`
                        } else {
                            self_url = config.host +'/index.html#/trip-approval/detail?approveId=' + approve.id;
                            let finalUrl = '#/trip-approval/detail?approveId=' + approve.id;
                            finalUrl = encodeURIComponent(finalUrl);
                            appMessageUrl = `#/judge-permission/index?id=${approve.id}&modelName=tripApprove&finalUrl=${finalUrl}`;
                        }
                        let user = approve.account;
                        if(!user) user = await Models.staff.get(approve['accountId']);
                        try {
                            self_url = await API.wechat.shorturl({longurl: self_url});
                        } catch(err) {
                            console.error(err);
                        }
                        try {
                            await API.notify.submitNotify({userId: user.id, key: 'qm_notify_approve_not_pass',
                                values: { tripApprove: approve, detailUrl: self_url, appMessageUrl: appMessageUrl, noticeType: ENoticeType.TRIP_APPROVE_NOTICE}});
                        } catch(err) { console.error(err);}

                    }else{
                        await approve.save();
                    }
                }
            });
        });
    }*/

    /**
     * 获取企业节省金额
     * @author lizeilin
     * @param {companyId: string, beginDate, endDate}
     * @return {companySaved: number}
     */
    static async getCompanySaved(params: {companyId: string, beginDate?: Date, endDate?: Date}) {
        let {companyId, beginDate, endDate} = params;
        let tripPlans: TripPlan[] = [];
        let _tripPlans: TripPlan[] = [];
        if (!beginDate && !endDate) {
            tripPlans = await Models.tripPlan.all({where: {companyId: companyId, 
                status: {$in: [EPlanStatus.COMPLETE, EPlanStatus.RESERVED, EPlanStatus.EXPIRED]},
                auditStatus: {$in: [EAuditStatus.INVOICE_PASS, EAuditStatus.NO_NEED_AUDIT]}, 
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
        } else {
            _tripPlans = await Models.tripPlan.all({where: {companyId: companyId,
                status: {$in: [EPlanStatus.COMPLETE, EPlanStatus.RESERVED, EPlanStatus.EXPIRED]},
                auditStatus: {$in: [EAuditStatus.INVOICE_PASS, EAuditStatus.NO_NEED_AUDIT]}}});
            for (let i = 0; i < _tripPlans.length; i++) {
                if (moment(_tripPlans[i].createdAt).isSameOrAfter(beginDate) && moment(_tripPlans[i].createdAt).isSameOrBefore(endDate)) {
                    tripPlans.push(_tripPlans[i]);
                }
            }
        }
        let companySaved: number = 0;
        for (let i = 0; i < tripPlans.length; i++) {
            companySaved += tripPlans[i].companySaved;
        }
        return companySaved;
    }

    /**
     * 获取企业节省 12月分布数据
     * @author lizeilin
     * 
     */
    static async getCompanySavedChart(params: {companyId: string}) {
        let {companyId} = params;
        let beginDate: Date = moment().startOf('M').subtract(11, 'M');
        let tripPlans: TripPlan[] = await Models.tripPlan.all({where: {companyId: companyId, 
                status: {$in: [EPlanStatus.COMPLETE, EPlanStatus.RESERVED, EPlanStatus.EXPIRED]},
                auditStatus: {$in: [EAuditStatus.INVOICE_PASS, EAuditStatus.NO_NEED_AUDIT]}, 
                createdAt: {$gte: beginDate.toString()}}, order: [["created_at", "asc"]]});
        let budgets: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //for 12 months
        for (let i = 0; i < tripPlans.length; i++) {
            let month: number = moment(tripPlans[i].createdAt).month();
            budgets[month] += tripPlans[i].companySaved;
        }
        let monthNow = moment().month() + 1;
        budgets = budgets.slice(monthNow - 12).concat(budgets.slice(0, monthNow)); 

        return budgets;
    }

    /**
     * 获取企业/部门/项目 已确认支出或节省
     * @author lizeilin
     * @param {companyId: string}
     * @return {isSaved ? saved : expenditure}
     */
    static async getConfirmedExpenditureAndSaved(params:{companyId: string, beginDate?: Date, endDate?: Date}) {
        let {companyId, beginDate, endDate} = params;
        let tripPlans: TripPlan[] = [];
        let _tripPlans: TripPlan[] = [];
        if (!beginDate && !endDate) {
            tripPlans = await Models.tripPlan.all({where: {companyId: companyId, 
                status: EPlanStatus.COMPLETE, auditStatus: EAuditStatus.NO_NEED_AUDIT, 
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            _tripPlans = await Models.tripPlan.all({where: {companyId: companyId,
                status: {$in: [EPlanStatus.RESERVED, EPlanStatus.EXPIRED]},
                auditStatus: EAuditStatus.INVOICE_PASS, 
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            tripPlans = tripPlans.concat(_tripPlans);
        } else {
            let temp: TripPlan[] = await Models.tripPlan.all({where: {companyId: companyId, 
                status: EPlanStatus.COMPLETE, auditStatus: EAuditStatus.NO_NEED_AUDIT}}); 
            _tripPlans = await Models.tripPlan.all({where: {companyId: companyId,
                status: {$in: [EPlanStatus.RESERVED, EPlanStatus.EXPIRED]},
                auditStatus: EAuditStatus.INVOICE_PASS}});
            temp = temp.concat(_tripPlans);
            beginDate = moment(beginDate).startOf('M');
            endDate = moment(endDate).endOf('M');
            for (let i = 0; i < temp.length; i++) {
                if (moment(temp[i].createdAt).isSameOrAfter(beginDate) && moment(temp[i].createdAt).isSameOrBefore(endDate)) {
                    tripPlans.push(temp[i]);
                }
            }
        }
        
        let expenditureAll: number = 0;
        let savedAll: number = 0;
        let expenditureDepart: number = 0;
        let savedDepart: number = 0;
        let expenditureProj: number = 0;
        let savedProj: number = 0;
            for (let i = 0; i < tripPlans.length; i++) {
            expenditureAll += tripPlans[i].expenditure;
            savedAll += tripPlans[i].saved;
            }

            let tripPlansDepart: TripPlan[] = [];
            let tripPlansProj: TripPlan[] = [];
            for (let i = 0; i < tripPlans.length; i++) {
                let costCenter: CostCenter = await Models.costCenter.get(tripPlans[i].costCenterId);
            if (!costCenter)
                continue;
                if (costCenter.type == ECostCenterType.DEPARTMENT) {
                    tripPlansDepart.push(tripPlans[i]);
                }
                if (costCenter.type == ECostCenterType.PROJECT) {
                    tripPlansProj.push(tripPlans[i]);
                }
            }
                for (let j = 0; j < tripPlansDepart.length; j++) {
            expenditureDepart += tripPlansDepart[j].expenditure;
            savedDepart += tripPlansDepart[j].saved;
                }
                for (let j = 0; j < tripPlansProj.length; j++) {
            expenditureProj += tripPlansProj[j].expenditure;
            savedProj += tripPlansProj[j].saved;
                }
        return {
            expenditureAll: expenditureAll,
            savedAll: savedAll,
            expenditureDepart: expenditureDepart,
            savedDepart: savedDepart,
            expenditureProj: expenditureProj,
            savedProj: savedProj
        }
    }

    /**
     * 获取企业/部门/项目 已计划预算
     * @author lizeilin
     * @param {companyId: string, type: AnalysisType}
     * @return {budget}
     */
    static async getPlannedBudget(params: {companyId: string, departmentOrProjectId?: string, beginDate?: Date, endDate?: Date}) {
        let {companyId, departmentOrProjectId, beginDate, endDate} = params;
        let tripPlans: TripPlan[] = [];
        let _tripPlans: TripPlan[] = [];
        if (!beginDate && !endDate) {
            tripPlans = await Models.tripPlan.all({where: {companyId: companyId, 
                status: EPlanStatus.WAIT_RESERVE, auditStatus: EAuditStatus.NO_NEED_AUDIT,
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            _tripPlans = await Models.tripPlan.all({where: {companyId: companyId,
                status: {$in: [EPlanStatus.EXPIRED, EPlanStatus.RESERVED]},
                auditStatus: {$in: [EAuditStatus.WAIT_COMMIT, EAuditStatus.WAIT_UPLOAD, EAuditStatus.AUDITING]},
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            tripPlans = tripPlans.concat(_tripPlans);
        } else {
            let temp: TripPlan[] = await Models.tripPlan.all({where: {companyId: companyId, 
                status: EPlanStatus.WAIT_RESERVE, auditStatus: EAuditStatus.NO_NEED_AUDIT}}); 
            _tripPlans = await Models.tripPlan.all({where: {companyId: companyId,
                status: {$in: [EPlanStatus.EXPIRED, EPlanStatus.RESERVED]},
                auditStatus: {$in: [EAuditStatus.WAIT_COMMIT, EAuditStatus.WAIT_UPLOAD, EAuditStatus.AUDITING]}}});
            temp = temp.concat(_tripPlans);
            beginDate = moment(beginDate).startOf('M');
            endDate = moment(endDate).endOf('M');
            for (let i = 0; i < temp.length; i++) {
                if (moment(temp[i].createdAt).isSameOrAfter(beginDate) && moment(temp[i].createdAt).isSameOrBefore(endDate)) {
                    tripPlans.push(temp[i]);
                }
            }
        }
        
        let budget: number = 0;
        let budgetAll: number = 0;
        let budgetDepart: number = 0;
        let budgetProj: number = 0;
        if (departmentOrProjectId == null) {
                for (let i = 0; i < tripPlans.length; i++) {
                budgetAll += tripPlans[i].budget;
                }
                let tripPlansDepart: TripPlan[] = [];
                let tripPlansProj: TripPlan[] = [];
                for (let i = 0; i < tripPlans.length; i++) {
                    let costCenter: CostCenter = await Models.costCenter.get(tripPlans[i].costCenterId);
                if (!costCenter)
                    continue;

                    if (costCenter.type == ECostCenterType.DEPARTMENT) {
                        tripPlansDepart.push(tripPlans[i]);
                    }
                    if (costCenter.type == ECostCenterType.PROJECT) {
                        tripPlansProj.push(tripPlans[i]);
                    }
                }
                    for (let j = 0; j < tripPlansDepart.length; j++) {
                budgetDepart += tripPlansDepart[j].budget;
                }
                    for (let j = 0; j < tripPlansProj.length; j++) {
                budgetProj += tripPlansProj[j].budget;
                }
            return {
                budgetAll: budgetAll,
                budgetDepart: budgetDepart,
                budgetProj: budgetProj
            };
            } else {
            let tripPlans: TripPlan[] = await Models.tripPlan.all({where: {costCenterId: departmentOrProjectId, 
                status: EPlanStatus.WAIT_RESERVE, auditStatus: EAuditStatus.NO_NEED_AUDIT, 
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            let _tripPlans: TripPlan[] = await Models.tripPlan.all({where: {costCenterId: departmentOrProjectId,
                status: {$in: [EPlanStatus.EXPIRED, EPlanStatus.RESERVED]}, 
                auditStatus: {$in: [EAuditStatus.WAIT_COMMIT, EAuditStatus.WAIT_UPLOAD, EAuditStatus.AUDITING]}, 
                createdAt: {$gte: moment().startOf('Y').format().toString()}}});
            tripPlans = tripPlans.concat(_tripPlans);
            for (let i = 0; i < tripPlans.length; i++) {
                budget += tripPlans[i].budget;
            }
            return budget;
        }
    }


    


    static async getProjectByName(params: any) {
        let projects = await Models.project.find({ where: { name: params.name } });

        if (projects && projects.length > 0) {
            let project = projects[0];
            project.weight += 1;
            await project.save();
            return project;
        } else if (params.isCreate === true) {
            let p = { name: params.name, createUser: params.userId, code: '', companyId: params.companyId };
            return Models.project.create(p).save();
        }
    }

    //approve, trip_approve, trip_plan保存travelPolicyId
    @clientExport
    static async saveTravelPolicyId(tripApproveId: string): Promise<any> {
        let tripApprove = await API.tripApprove.getTripApprove({ id: tripApproveId });
        let approve = await Models.approve.get(tripApproveId);
        let submitUser = await Models.staff.get(tripApprove.accountId);
        let travelPolicyId = submitUser.travelPolicyId;

        if (typeof tripApprove.query == "string") {
            tripApprove.query = JSON.parse(tripApprove.query);
        }

        if (typeof approve.data == "string") {
            approve.data = JSON.parse(approve.data);
        }

        tripApprove.query.travelPolicyId = travelPolicyId;

        tripApprove.query = JSON.stringify(tripApprove.query);

        approve.data.query.travelPolicyId = travelPolicyId;

        // approve.data = JSON.stringify(approve.data);

        await API.tripApprove.updateTripApprove(tripApprove);
        await approve.save();

        return true;
    }

    /**
     * 完成行程
     * @param params 
     */
    @clientExport
    static async completeTrip(params: { id: string }) {
        // Filter inoperable status
        const tripPlan = await Models.tripPlan.get(params.id)
        if (moment().milliseconds < moment(tripPlan.backAt).milliseconds)
            throw new L.ERROR_CODE_C(400, '该行程当前无法完成')

        if (tripPlan.status != EPlanStatus.RESERVED || tripPlan.auditStatus != EAuditStatus.NO_NEED_AUDIT)
            throw new L.ERROR_CODE_C(400, '该行程当前无法完成')

        const tripDetails: TripDetail[] = await tripPlan.getTripDetails({ 
            where: { status: EPlanStatus.COMPLETE, reserveStatus: {$in: [EOrderStatus.ENDORSEMENT_SUCCESS, EOrderStatus.SUCCESS]}}
        })
        // if (R.any((t: TripDetail) => t.status != -4, tripDetails))
        //     throw new L.ERROR_CODE_C(400, '该行程需要上传票据')
        const promises: Promise<any>[] = []

        // Fetch orders and calculate saving
        tripPlan.expenditure = R.sumBy(R.prop('expenditure'), tripDetails)
        tripPlan.status = EPlanStatus.COMPLETE
        tripPlan.saved = tripPlan.budget - tripPlan.expenditure

        // Log tripPlan changes
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: tripPlan.auditUser});
        log.remark = `已完成`;
        promises.push(log.save());

        // Log budget changes
        const costCenterDeploy = _.first(await Models.costCenterDeploy.find({
            where: { costCenterId: tripPlan.costCenterId }
        }))
        if (costCenterDeploy) {
            const budgetLog = Models.budgetLog.create({
                costCenterId: tripPlan.costCenterId, type: BUDGET_CHANGE_TYPE.CONSUME_BUDGET, relateId: params.id,
                value: tripPlan.expendBudget, oldBudget: costCenterDeploy.expendBudget, remark: `完成行程花费预算`
            });
            promises.push(budgetLog.save())
            costCenterDeploy.expendBudget += tripPlan.expenditure
            promises.push(costCenterDeploy.save())
        }
        promises.push(tripPlan.save())
        await DB.transaction(async function () {
            await Promise.all(promises)
            // Special approve can't settle reward
            if (tripPlan.isSpecialApprove) return

            const isSuccess = await TripPlanModule.autoSettleReward(params)
            if (!isSuccess) {
                throw new L.ERROR_CODE_C(400, '企业余额不足')
            }
        })
        if (costCenterDeploy)
            await costCenterDeploy.checkoutBudgetNotice()
    }
   

}

async function updateTripDetailExpenditure(tripDetail: TripDetail) {
    //重新计算所有花费
    let invoices = await Models.tripDetailInvoice.find({ where: { tripDetailId: tripDetail.id } });
    let expenditure = 0;
    let personalExpenditure = 0;
    invoices.forEach((v: TripDetailInvoice) => {
        expenditure += Number(v.totalMoney);
        if (v.payType == EPayType.PERSONAL_PAY) {
            personalExpenditure += Number(v.totalMoney);
        }
    });
    tripDetail.personalExpenditure = personalExpenditure;
    tripDetail.expenditure = expenditure;
    tripDetail = await tripDetail.save();
    let tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
    await updateTripPlanExpenditure(tripPlan)
    return tripDetail;
}

async function updateTripPlanExpenditure(tripPlan: TripPlan) {
    let tripDetails = await Models.tripDetail.find({ where: { tripPlanId: tripPlan.id } });
    let expenditure = 0;
    let personalExpenditure = 0;
    tripDetails.forEach((v: any) => {
        expenditure += Number(v.expenditure);
        personalExpenditure += Number(v.personalExpenditure);
    });
    tripPlan.expenditure = expenditure;
    tripPlan.personalExpenditure = personalExpenditure;
    return tripPlan.save();
}


/**
 * @method 更新tripDetail的状态(status), 同时触发tripPlan的状态的检查并更新
 * 触发情况：
 *      1. 用户触发提交审核，
 *      2. 预定回调，更新预定状态，同步更新status和tripPlan的状态
 * @param tripDetail 
 * @param status {ETripDetailStatus} 
 * @return Promise<TripDetail>
 */
async function tryUpdateTripDetailStatus(tripDetail : TripDetail, status: ETripDetailStatus) :Promise<TripDetail> {

    let tripPlan = await Models.tripPlan.get(tripDetail["tripPlanId"]);
    let auditStatus: EAuditStatus = tripPlan.auditStatus;
    switch(status) {
        case ETripDetailStatus.WAIT_UPLOAD:
            tripDetail.status = status;
            auditStatus = EAuditStatus.WAIT_UPLOAD;
            break;

        case ETripDetailStatus.WAIT_COMMIT:   //如果票据不为空,则设置状态为可提交状态
            let invoices = await Models.tripDetailInvoice.find({where: {tripDetailId: tripDetail.id}});
            let isInWaitCommit = true;
            invoices.map((item: any) => {
                if (item.status == EInvoiceStatus.AUDIT_FAIL) {
                    isInWaitCommit = false;
                }
                return item;
            });
            if (invoices && invoices.length && isInWaitCommit) {
                tripDetail.status = ETripDetailStatus.WAIT_COMMIT;
            }
            let tripPlan = await Models.tripPlan.get(tripDetail["tripPlanId"]);
            if(new Date(tripPlan.backAt) > new Date() && tripDetail.type == ETripType.SUBSIDY) {  //类型为补助，且为行程未失效(此时只能上传补助)，tripPlan的aduitStatus不能为wait_commmit   
                auditStatus = EAuditStatus.WAIT_UPLOAD;
            } else {
                auditStatus = EAuditStatus.WAIT_COMMIT;
            }     
            break;
        case ETripDetailStatus.AUDITING:
            if ([ ETripDetailStatus.AUDIT_NOT_PASS, ETripDetailStatus.WAIT_COMMIT].indexOf(tripDetail.status) >= 0) {
                tripDetail.status = status;  
            }
            auditStatus = EAuditStatus.AUDITING;
            break;
        case ETripDetailStatus.COMPLETE:
            if (ETripDetailStatus.AUDITING == tripDetail.status) {
                tripDetail.status = status;
            } else if (tripDetail.type == ETripType.SUBSIDY) {
                tripDetail.status = status;
            }
            auditStatus = EAuditStatus.INVOICE_PASS;
            break;

        case ETripDetailStatus.WAIT_RESERVE: 
            tripDetail.status = status;
            break;
        case ETripDetailStatus.WAIT_TICKET:
            tripDetail.status = status;  
            break;    
    }

    //更改行程详情状态
    tripDetail = await tripDetail.save()
    //尝试更改行程状态
    await tryUpdateTripPlanStatus(tripPlan, auditStatus);
    return tripDetail;
}

// //尝试修改tripDetail状态
// async function tryUpdateTripDetailStatus(tripDetail: TripDetail, status: EPlanStatus) :Promise<TripDetail> {
//     /*if ([ETripType.SUBSIDY].indexOf(tripDetail.type) >= 0 ) {
//         tripDetail.status = status;
//     } else {

//     }*/
//     switch(status) {
//         case EPlanStatus.WAIT_UPLOAD:
//             tripDetail.status = status;
//             break;
//         case EPlanStatus.WAIT_COMMIT:
//             //如果票据不为空,则设置状态为可提交状态
//             let invoices = await Models.tripDetailInvoice.find({where: {tripDetailId: tripDetail.id}});
//             let isInWaitCommit = true;
//             invoices.map((item: any)=>{
//                 if(item.status == EInvoiceStatus.AUDIT_FAIL){
//                     isInWaitCommit = false;
//                 }
//                 return item;
//             });
//             if (invoices && invoices.length && isInWaitCommit) {
//                 tripDetail.status = EPlanStatus.WAIT_COMMIT;
//             }
//             break;
//         case EPlanStatus.AUDITING:
//             if ([ EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.WAIT_COMMIT].indexOf(tripDetail.status) >= 0) {
//                 tripDetail.status = status;
//             }
//             break;
//         case EPlanStatus.COMPLETE:
//             if (EPlanStatus.AUDITING == tripDetail.status) {
//                 tripDetail.status = status;
//             }else if(tripDetail.type == ETripType.SUBSIDY){
//                 tripDetail.status = status;
//             }
//             break;
//     }

//     //更改行程详情状态
//     tripDetail = await tripDetail.save()
//     //尝试更改行程状态
//     let tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
//     await tryUpdateTripPlanStatus(tripPlan, status);

//     return tripDetail;
// }

/**
 * @method 更新tripPlan状态
 *   1. 目标状态为EAuditStatus.AUDITING: 查找所有tripDetail的status满足一定条件，且reserveStatus为WAIT_SUBMIT,
 *          
 * @param tripPlan {TripPlan}
 * @param status {EPlanStatus} 
 */
async function tryUpdateTripPlanStatus(tripPlan: TripPlan, status: EAuditStatus) :Promise<TripPlan>{
    if (status == null) {return tripPlan};

    let cannotStatus = {};
    //变tripPlan状态需要tripDetail不能包含状态
    cannotStatus[EAuditStatus.WAIT_UPLOAD] = [];

    //tripPlan 进入等待上传状态，需要tripDetail中没有 审核不通过的单子
    cannotStatus[EAuditStatus.WAIT_COMMIT] = _.concat([ETripDetailStatus.WAIT_UPLOAD, ETripDetailStatus.AUDIT_NOT_PASS, ETripDetailStatus.CANCEL, ETripDetailStatus.NO_BUDGET],  cannotStatus[EAuditStatus.WAIT_UPLOAD]);
    cannotStatus[EAuditStatus.AUDITING] = _.concat([ETripDetailStatus.AUDIT_NOT_PASS, ETripDetailStatus.WAIT_COMMIT], cannotStatus[EAuditStatus.WAIT_COMMIT]);
    cannotStatus[EAuditStatus.INVOICE_PASS] = _.concat([ETripDetailStatus.AUDITING], cannotStatus[EAuditStatus.AUDITING]);

    //变tripPlan状态,只关注出发交通,返回交通,住宿,特殊审批、补助类型
    let preTripTypeNeeds = [ETripType.BACK_TRIP, ETripType.OUT_TRIP, ETripType.HOTEL, ETripType.SPECIAL_APPROVE, ETripType.SUBSIDY];
    //更新行程状态
    let tripDetails = await Models.tripDetail.find({
        where: {
            tripPlanId: tripPlan.id,
            type: {$in: preTripTypeNeeds},
            status: {$in: cannotStatus[status]},    //无预算, 等待上传
        },
        order: [['created_at', 'asc']]
    });

    if (!tripDetails || !tripDetails.length) {
        tripPlan.auditStatus = status;
        await tripPlan.save();
    }
    return tripPlan;
}

function tryObjId(obj: any) {
    if (obj && obj.id) return obj.id;
    return null;
}

function getOrderNo(): string {
    var d = new Date();
    var rnd = (Math.ceil(Math.random() * 1000));
    var str = `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}-${rnd}`;
    return str;
}

async function calculateBudget(params: { expenditure: number, id: string, orderNo: string }) {
    const { expenditure, id, orderNo } = params
    const tripDetail = await Models.tripDetail.get(id)
    const staff = await Models.staff.get(tripDetail.accountId)
    const saving = tripDetail.budget - expenditure
    console.log('saving==========', saving)
    if (saving <= 0) return

    const companyId = staff.company.id
    let route = ''
    if ([ETripType.BACK_TRIP, ETripType.OUT_TRIP].indexOf(tripDetail.type) != -1) {
        const tripDetailTraffic = await Models.tripDetailTraffic.get(tripDetail.id)
        const cityNames = R.pluck('name', await Promise.all([API.place.getCityById(tripDetailTraffic.deptCity, companyId), API.place.getCityById(tripDetailTraffic.arrivalCity, companyId)]))
        route = cityNames.join('-')
    } else if (tripDetail.type == ETripType.HOTEL) {
        const tripDetailHotel = await Models.tripDetailHotel.get(tripDetail.id)
        route = tripDetailHotel.city
    }

    let coins = saving * 0.05
    coins = coins > 100 ? coins : 100
    const tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId)
    await SavingEvent.emitTripSaving({
        coins, orderNo, staffId: staff.id,
        companyId, type: 2, record: {
            date: new Date(),
            companyName: staff.company.name,
            staffName: staff.name,
            mobile: staff.mobile,
            reserveStatus: EOrderStatus.SUCCESS,
            route,
            budget: tripDetail.budget,
            realCost: expenditure,
            saving,
            ratio: 0.05,
            coins,
            currStatus: tripPlan.status
        }
    })
}


TripPlanModule._scheduleTask();

export = TripPlanModule;