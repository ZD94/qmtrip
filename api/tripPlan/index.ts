/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
let sequelize = require("common/model").DB;
let uuid = require("node-uuid");
import L from 'common/language';
import utils = require("common/utils");
let API = require('common/api');
let Logger = require('common/logger');
let logger = new Logger("tripPlan");
let config = require("../../config");
let moment = require("moment");
let scheduler = require('common/scheduler');
import _ = require('lodash');
import {requireParams, clientExport} from 'common/api/helper';
import {
    Project, TripPlan, TripDetail, EPlanStatus, TripPlanLog, ETripType, EAuditStatus, EInvoiceType,
    TripApprove, QMEApproveStatus, EApproveResult, EApproveResult2Text,
    EPayType, ESourceType, EInvoiceFeeTypes, EInvoiceStatus
} from "api/_types/tripPlan";
import {Models} from "api/_types";
import {FindResult, PaginateInterface} from "common/model/interface";
import {Staff, EStaffRole, EStaffStatus} from "api/_types/staff";
import {conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {getSession} from "common/model";
import {AgencyUser} from "../_types/agency";
import {makeSpendReport} from './spendReport';
import fs = require("fs");
import {TripDetailTraffic, TripDetailHotel, TripDetailSubsidy, TripDetailSpecial, TripDetailInvoice} from "../_types/tripPlan";
import {ENoticeType} from "../_types/notice/notice";
import TripApproveModule = require("../tripApprove/index");
import {MPlaneLevel, MTrainLevel} from "../_types/travelPolicy";


class TripPlanModule {

    /**
     * 获取出差计划中发送邮件的模板数据详情
     * @param tripPlan
     * @returns {{go: string, back: string, hotel: string}}
     */
    static async getPlanEmailDetails(tripPlan: TripPlan): Promise<{go: string, back: string, hotel: string, subsidy: string, special?: string }> {
        let go = '', back = '', hotelStr = '', subsidyStr = '', specialStr = '';
        let sumSubsidy = 0;

        let tripDetails = await Models.tripDetail.find({
            where: {tripPlanId: tripPlan.id},
            order: [['created_at', 'asc']]
        });
        let ps = tripDetails.map( async (tripDetail) => {
            switch (tripDetail.type) {
                case ETripType.OUT_TRIP:
                    let g = <TripDetailTraffic>tripDetail;
                    var deptCity = await API.place.getCityInfo({cityCode: g.deptCity})
                    var arrivalCity = await API.place.getCityInfo({cityCode: g.arrivalCity});
                    go += moment(g.deptDateTime).format('YYYY-MM-DD') + ', ' + deptCity.name + ' 到 ' + arrivalCity.name;
                    // if (g.latestArriveTime)
                    //     go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
                    go += ', 动态预算￥' + g.budget + '<br>';
                    break;
                case ETripType.BACK_TRIP:
                    let b = <TripDetailTraffic>tripDetail;
                    var deptCity = await API.place.getCityInfo({cityCode: b.deptCity})
                    var arrivalCity = await API.place.getCityInfo({cityCode: b.arrivalCity});
                    back += moment(b.deptDateTime).format('YYYY-MM-DD') + ', ' + deptCity.name + ' 到 ' + arrivalCity.name;
                    // if (b.latestArriveTime)
                    //     back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
                    back += ', 动态预算￥' + b.budget + '<br>';
                    break;
                case ETripType.HOTEL:
                    let h = <TripDetailHotel>tripDetail;
                    var city = await API.place.getCityInfo({cityCode: h.city});
                    hotelStr += moment(h.checkInDate).format('YYYY-MM-DD') + ' 至 ' + moment(h.checkOutDate).format('YYYY-MM-DD') +
                        ', ' + city.name + ',';
                    if(h.placeName) {
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
        return {go: go, back: back, hotel: hotelStr, subsidy: subsidyStr, special: specialStr};
    }

    static async getEmailInfoFromDetails(details: TripDetail[]): Promise<{go: string, back: string, hotel: string, subsidy: string, special?: string}> {
        let goStr = '', backStr = '', hotelStr = '', subsidyStr = '', specialStr = '';
        let sumSubsidy = 0;
        let ps = details.map(async (d) => {
            switch (d.type) {
                case ETripType.OUT_TRIP:
                    let d1: TripDetailTraffic = <TripDetailTraffic>d;
                    var deptCity = await API.place.getCityInfo({cityCode: d1.deptCity});
                    var arrivalCity = await API.place.getCityInfo({cityCode: d1.arrivalCity})
                    goStr += `${moment(d1.deptDateTime).format('YYYY-MM-DD')}, ${deptCity.name} 到 ${arrivalCity.name}`;
                    // if (d.latestArriveTime)
                    //     goStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    goStr += `, 动态预算￥${d1.budget}<br>`;
                    break;
                case ETripType.BACK_TRIP:
                    let d2: TripDetailTraffic = <TripDetailTraffic>d;
                    var deptCity = await API.place.getCityInfo({cityCode: d2.deptCity});
                    var arrivalCity = await API.place.getCityInfo({cityCode: d2.arrivalCity})
                    backStr += `${moment(d2.deptDateTime).format('YYYY-MM-DD')}, ${deptCity.name} 到 ${arrivalCity.name}`;
                    // if (d.latestArriveTime)
                    //     backStr += `, 最晚${moment(d.latestArriveTime).format('HH:mm')}到达`;
                    backStr += `, 动态预算￥${d2.budget}<br>`;
                    break;
                case ETripType.HOTEL:
                    let d3: TripDetailHotel = <TripDetailHotel>d;
                    var city = await API.place.getCityInfo({cityCode: d3.city});
                    hotelStr += `${moment(d3.checkInDate).format('YYYY-MM-DD')} 至 ${moment(d3.checkOutDate).format('YYYY-MM-DD')}, ${city.name}`;
                    if(d3.placeName) {
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
        return {go: goStr, back: backStr, hotel: hotelStr, subsidy: subsidyStr, special: specialStr};
    }

    /**
     * 获取计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.canGetTripPlan('0.id')}])
    static getTripPlan(params: {id: string}): Promise<TripPlan> {
        return Models.tripPlan.get(params.id);
    }

    /**
     * 更新计划单/预算单信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['isNeedTraffic', 'isNeedHotel', 'title', 'description', 'status', 'deptCity',
        'deptCityCode', 'arrivalCity', 'arrivalCityCode', 'startAt', 'backAt', 'remark'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async updateTripPlan(params): Promise<TripPlan> {
        let tripPlan = await Models.tripPlan.get(params.id);
        for(let key in params) {
            tripPlan[key] = params[key];
        }
        return tripPlan.save();
    }

    /**
     * 获取差旅计划单/预算单列表
     * @param params
     * @returns {*}
     */
    @clientExport
    static async listTripPlans(options: any): Promise<FindResult> {
        options.order = options.order || [['start_at', 'desc'], ['created_at', 'desc']];
        let paginate = await Models.tripPlan.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
    }

    /**
     * 删除差旅计划单/预算单;用户自己可以删除自己的计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async deleteTripPlan(params): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        let tripDetails = await tripPlan.getTripDetails({where: {}});
        await tripPlan.destroy();
        await Promise.all(tripDetails.map((detail)=> detail.destroy()));
        return true;
    }

    /**
     * 保存消费记录详情
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['tripPlanId', 'type', 'startTime', 'invoiceType', 'budget'])
    static saveTripDetail(params): Promise<TripDetail> {
        return Models.tripDetail.create(params).save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static async getTripDetail(params: {id: string, notRetChild: boolean}): Promise<TripDetail> {
        return Models.tripDetail.get(params.id, {notRetChild: true});
    }

    @clientExport
    @requireParams(['id'])
    static async getOddBudget(params: {id: string}){
        var tripPlan = await Models.tripPlan.get(params.id);
        var oddBudget = tripPlan.budget;
        var details = await Models.tripDetail.find({
            where: {tripPlanId: tripPlan.id},
            order: [['created_at', 'asc']]
        });
        details.forEach(function(item, i){
            oddBudget = oddBudget - item.expenditure;
        })
        return oddBudget;
    }

    @clientExport
    @requireParams(['id'])
    static async getTripDetailTraffic(params: {id: string}):Promise<TripDetailTraffic> {
        return Models.tripDetailTraffic.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailHotel(params: {id: string}) :Promise<TripDetailHotel> {
        return Models.tripDetailHotel.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailSubsidy(params: {id: string}) :Promise<TripDetailSubsidy> {
        return Models.tripDetailSubsidy.get(params.id)
    }

    @clientExport
    @requireParams(["id"])
    static async getTripDetailSpecial(params: {id: string}) :Promise<TripDetailSpecial> {
        return Models.tripDetailSpecial.get(params.id);
    }

    /**
     * 更新消费详情
     * @param params
     */
    @clientExport
    @requireParams(['id'], TripDetail['$fieldnames'])
    @modelNotNull('tripDetail')
    static async updateTripDetail(params): Promise<TripDetail> {
        let tripDetail =  await Models.tripDetail.get(params.id);

        for(let key in params) {
            tripDetail[key] = params[key];
        }

        return tripDetail.save();
    }

    /**
     * 根据出差记录id获取出差详情(包括已删除的)
     * @param params
     * @returns {Promise<string[]>}
     */
    @requireParams(['where.tripPlanId'], ['where.type', 'where.status', 'where.id'])
    @clientExport
    static async getTripDetails(options: {where: any, offset?: number, limit?: number}): Promise<FindResult> {
        let details = await Models.tripDetail.find(options);
        let ids = details.map(function (d) {
            return d.id;
        });
        return {ids: ids, count: details['total']};
    }

    /**
     * 删除差旅消费明细
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripDetail')
    static async deleteTripDetail(params: {id: string}): Promise<boolean> {
        let tripDetail = await Models.tripDetail.get(params.id);
        await tripDetail.destroy();
        return true;
    }

    /* 提交计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async commitTripPlan(params: {id: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        if(tripPlan.status != EPlanStatus.WAIT_COMMIT) {
            throw {code: -2, msg: "该出差计划不能提交，请检查状态"};
        }

        let tripDetails = await tripPlan.getTripDetails({where: {}});
        if(tripDetails && tripDetails.length > 0) {
            let tripDetailPromise = tripDetails.map(async function (detail) {
                if (detail.type == ETripType.SUBSIDY) {
                    return detail;
                }
                return tryUpdateTripDetailStatus(detail, EPlanStatus.AUDITING);
            });
            await (Promise.all(tripDetailPromise));
        }
        //记录日志
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: `提交票据`});
        await log.save();
        //更改状态
        tripPlan.isCommit = true;
        tripPlan = await tryUpdateTripPlanStatus(tripPlan, EPlanStatus.AUDITING)

        let default_agency = config.default_agency;
        if(default_agency && default_agency.manager_email) {
            let auditEmail = default_agency.manager_email;
            let accounts = await Models.account.find({where: {email: auditEmail}});

            if(!accounts || accounts.length <= 0) {
                return true;
            }

            let user:any = await Models.agencyUser.get(accounts[0].id);
            if(!user) {
                user = await Models.staff.get(accounts[0].id);
            }
            let staff = tripPlan.account;
            if(!staff) {
                staff = await Models.staff.get(tripPlan['accountId']);
            }

            let company = await tripPlan.getCompany();
            let auditUrl = `${config.host}/agency.html#/travelRecord/TravelDetail?orderId==${tripPlan.id}`;
            let appMessageUrl = `#/travelRecord/TravelDetail?orderId==${tripPlan.id}`;
            let {go, back, hotel, subsidy} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            let openId = await API.auth.getOpenIdByAccount({accountId: user.id});
            let auditValues = {username: user.name, time:tripPlan.createdAt, auditUserName: user.name, companyName: company.name, staffName: staff.name, projectName: tripPlan.title, goTrafficBudget: go,
                backTrafficBudget: back, hotelBudget: hotel, otherBudget: subsidy, totalBudget: tripPlan.budget, appMessageUrl: appMessageUrl, url: auditUrl, detailUrl: auditUrl,
                approveUser: user.name, tripPlanNo: tripPlan.planNo,
                content: `企业 ${company.name} 员工 ${staff.name}${moment(tripPlan.startAt).format('YYYY-MM-DD')}到${tripPlan.arrivalCity}的出差计划票据已提交，预算：￥${tripPlan.budget}，等待您审核！`,
                createdAt: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            try {
                await API.notify.submitNotify({
                    key: 'qm_notify_agency_budget',
                    values: auditValues,
                    accountId: default_agency.id
                })
            } catch(err) { console.error(err);}

        }
        return true;
    }

    /**
     * 审核出差票据
     *
     * @param params
     */
    @clientExport
    @requireParams(['id', 'auditResult'], ["reason", "expenditure"])
    @modelNotNull('tripDetail')
    static async auditPlanInvoice(params: {id: string, auditResult: EAuditStatus, expenditure?: number, reason?: string}): Promise<boolean> {
        const SAVED2SCORE = config.score_ratio;
        let {id, expenditure, reason, auditResult} = params;
        let tripDetail = await Models.tripDetail.get(params.id);

        if((tripDetail.status != EPlanStatus.AUDITING) && (tripDetail.status != EPlanStatus.AUDIT_NOT_PASS)) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }

        let audit = params.auditResult;
        let tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
        let templateValue: any = {
            invoiceDetail: '无',
            projectName: tripPlan.title,
            totalBudget: '￥' + tripPlan.budget,
            time: moment(tripPlan.startAt).format('YYYY-MM-DD')};
        let templateName: any = '';
        let isNotify = false;
        let savedMoney = 0;
        let logResult = '';

        if(audit == EAuditStatus.INVOICE_PASS) {
            logResult = '通过';
            tripDetail.status = EPlanStatus.COMPLETE;
            tripDetail.expenditure = expenditure;
            let query = {where: {id: {$ne: tripDetail.id}, status: [EPlanStatus.AUDITING, EPlanStatus.AUDIT_NOT_PASS]}}
            let noAuditDetails = await tripPlan.getTripDetails(query); //获取所有未经过审核的票据
            if(!noAuditDetails || noAuditDetails.length == 0 ) {
                isNotify = true;
                let details = await tripPlan.getTripDetails({ where: {}});
                let expenditure = 0;
                details.forEach( (detail) => {
                    expenditure += Number(detail.expenditure);
                });

                tripPlan.expenditure = expenditure;
                tripPlan.status = EPlanStatus.COMPLETE;
                tripPlan.auditStatus = EAuditStatus.INVOICE_PASS;
                savedMoney = (tripPlan.budget - tripPlan.expenditure);
                savedMoney = savedMoney > 0 ? savedMoney : 0;
                tripPlan.score = parseInt((savedMoney * SAVED2SCORE).toString());
            }
            templateValue.consume = '￥' + (tripDetail.expenditure || 0);
            templateName = 'qm_notify_invoice_one_pass';
            let detailSavedM = tripDetail.budget - tripDetail.expenditure;
            detailSavedM = detailSavedM > 0 ? detailSavedM : 0;

            if(tripPlan.isSpecialApprove){
                templateValue.invoiceDetail += '，实际花费：' + tripDetail.expenditure + '元';
            }else{
                templateValue.invoiceDetail += '，实际花费：' + tripDetail.expenditure + '元，节省：' + detailSavedM + '元';
            }
        } else if(audit == EAuditStatus.INVOICE_NOT_PASS) {
            logResult = '未通过';
            isNotify = true;
            tripDetail.auditRemark = reason;
            tripDetail.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.auditStatus = EAuditStatus.INVOICE_NOT_PASS;
            templateValue.reason = reason;
            templateName = 'qm_notify_invoice_not_pass';
        } else {
            throw L.ERR.PERMISSION_DENY(); //代理商只能审核票据权限
        }


        //保存更改记录
        await Promise.all([tripPlan.save(), tripDetail.save()]);

        /*******************************************发送通知消息**********************************************/
        let staff = await Models.staff.get(tripPlan['accountId']);

        switch (tripDetail.type) {
            case ETripType.OUT_TRIP:
                let d1 = <TripDetailTraffic>tripDetail;
                var deptCity = await API.place.getCityInfo({cityCode: d1.deptCity});
                var arrivalCity = await API.place.getCityInfo({cityCode: d1.arrivalCity});
                templateValue.tripType = '去程';
                templateValue.invoiceDetail = `${moment(d1.deptDateTime).format('YYYY-MM-DD')} 由 ${deptCity.name} 到 ${arrivalCity.name}， 去程发票， 预算：${d1.budget}元`;
                break;
            case ETripType.BACK_TRIP:
                let d2 = <TripDetailTraffic>tripDetail;
                var deptCity = await API.place.getCityInfo({cityCode: d2.deptCity});
                var arrivalCity = await API.place.getCityInfo({cityCode: d2.arrivalCity});
                templateValue.tripType = '回程';
                templateValue.invoiceDetail = `${moment(d2.deptDateTime).format('YYYY-MM-DD')} 由 ${deptCity.name} 到 ${arrivalCity.name}， 回程发票， 预算：${d2.budget}元`;
                break;
            case ETripType.HOTEL:
                let d3 = <TripDetailHotel>tripDetail;
                var city = await API.place.getCityInfo({cityCode: d3.city});
                templateValue.tripType = '酒店';
                templateValue.invoiceDetail = `${moment(d3.checkInDate).format('YYYY.MM.DD')} - ${moment(d3.checkOutDate).format('YYYY.MM.DD')}， ${city.name}`;
                if(d3.placeName) {
                    templateValue.invoiceDetail += d3.placeName;
                }
                templateValue.invoiceDetail += `，酒店发票，预算：${d3.budget}元`;
                break;
            case ETripType.SUBSIDY:
                let d4 = <TripDetailSubsidy>tripDetail;
                templateValue.tripType = '补助';
                templateValue.invoiceDetail = `补助发票，预算：${d4.budget}元`;
                break;
            case ETripType.SPECIAL_APPROVE:
                let d5 = <TripDetailSpecial>tripDetail;
                templateValue.tripType = '特殊审批'
                templateValue.invoiceDetail = `特殊审批发票,预算 ${d5.budget}元`
                break;
            default:
                templateValue.tripType = ''; break;
        }
        if(isNotify) {
            if(tripPlan.status == EPlanStatus.COMPLETE) {
                if(tripPlan.isSpecialApprove){
                    templateValue.invoiceDetail = `${moment(tripPlan.startAt).format('YYYY-MM-DD')}到${tripPlan.arrivalCity}的出差票据，预算：${tripPlan.budget}元，实际花费：${tripPlan.expenditure}元`;
                }else{
                    templateValue.invoiceDetail = `${moment(tripPlan.startAt).format('YYYY-MM-DD')}到${tripPlan.arrivalCity}的出差票据，预算：${tripPlan.budget}元，实际花费：${tripPlan.expenditure}元，节省：${savedMoney}元`;
                }
            }

            let {go, back, hotel, subsidy} = await TripPlanModule.getPlanEmailDetails(tripPlan);
            let self_url = `${config.host}/index.html#/trip/list-detail?tripid=${tripPlan.id}`;
            let appMessageUrl = `#/trip/list-detail?tripid=${tripPlan.id}`;

            templateValue.ticket = templateValue.tripType;
            templateValue.username = staff.name;
            templateValue.goTrafficBudget = go;
            templateValue.backTrafficBudget = back;
            templateValue.hotelBudget = hotel;
            templateValue.otherBudget = subsidy;
            templateValue.detailUrl = self_url;
            templateValue.url = self_url;
            templateValue.appMessageUrl = appMessageUrl;
            templateValue.auditUser = '鲸力商旅';
            templateValue.auditTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

            let openId = await API.auth.getOpenIdByAccount({accountId: staff.id});
            try {
                await API.notify.submitNotify({key: templateName, values: templateValue, accountId: staff.id});

            } catch(err) {
                console.error(`发送通知失败:`, err);
            }
            try {
                await API.ddtalk.sendLinkMsg({accountId: staff.id, text: '票据已审批通过', url: self_url})
            } catch(err) {
                console.error(`发送钉钉通知失败`, err);
            }
        }

        let user = await AgencyUser.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, tripDetailId: tripDetail.id, userId: user.id, remark: `${templateValue.tripType}票据审核${logResult}`});
        log.save();

        //如果出差已经完成,并且有节省反积分,并且非特别审批，增加员工积分
        if (tripPlan.status == EPlanStatus.COMPLETE && tripPlan.score > 0 && !tripPlan.isSpecialApprove) {
            let pc = Models.pointChange.create({
                currentPoints: staff.balancePoints, status: 1,
                staff: staff, company: staff.company,
                points: tripPlan.score, remark: `节省反积分${tripPlan.score}`,
                orderId: tripPlan.id});
            await pc.save();
            try {
                if(!staff.totalPoints){
                    staff.totalPoints = 0;
                }
                if(!tripPlan.score){
                    tripPlan.score = 0;
                }
                if(!staff.balancePoints){
                    staff.balancePoints = 0;
                }
                if(typeof staff.totalPoints == 'string'){
                    staff.totalPoints = Number(staff.totalPoints);
                }
                if(typeof tripPlan.score == 'string'){
                    tripPlan.score = Number(tripPlan.score);
                }
                if(typeof staff.balancePoints == 'string'){
                    staff.balancePoints = Number(staff.balancePoints);
                }
                staff.totalPoints = staff.totalPoints + tripPlan.score;
                staff.balancePoints = staff.balancePoints + tripPlan.score;
                let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: user.id, remark: `增加员工${tripPlan.score}积分`});
                console.info("查看sql================");
                await Promise.all([staff.save(), log.save()]);
            } catch(err) {
                //如果保存出错,删除日志记录
                await pc.destroy();
            }
        }
        return true;
    }


    @clientExport
    @requireParams(['name', 'createUser', 'company_id'], ['code'])
    static createProject(params): Promise<Project> {
        return Project.create(params).save();
    }

    @clientExport
    @requireParams(['id'])
    @modelNotNull('project')
    static getProjectById(params:{id:string}):Promise<Project> {
        return Models.project.get(params.id);
    }

    @clientExport
    @requireParams(['where.companyId'], ['where.name'])
    static async getProjectList(options): Promise<FindResult> {
        options.order = options.order || [['weight', 'desc'], ['created_at', 'desc']];
        let projects = await Models.project.find(options);
        return {ids: projects.map((p)=> {return p.id}), count: projects['total']};
    }

    @requireParams(['id'])
    @modelNotNull('project')
    static async deleteProject(params:{id:string}):Promise<boolean> {
        let project = await Models.project.get(params.id);
        return await project.destroy();
    }


    /**
     * @method saveTripPlanLog
     * 保存出差计划改动日志
     * @type {saveTripPlanLog}
     */
    @requireParams(['tripPlanId', 'remark'], ['tripDetailId'])
    static async saveTripPlanLog(params): Promise<TripPlanLog> {
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
    static getTripPlanLog(params: {id: string}): Promise<TripPlanLog> {
        return Models.tripPlanLog.get(params.id);
    }

    /**
     * @method updateTripPlanLog
     * @param param
     */
    static updateTripPlanLog(param): Promise<TripPlanLog> {
        throw {code: -1, msg: '不能更新日志'};
    }

    @clientExport
    @requireParams(['where.tripPlanId'], ['where.tripDetailId'])
    static async getTripPlanLogs(options): Promise<FindResult> {
        let paginate = await Models.tripPlanLog.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
    }

    /**
     * 撤销tripPlan
     * @param params
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['id'],['remark'])
    static async cancelTripPlan(params: {id: string, remark?: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        if( tripPlan.status != EPlanStatus.NO_BUDGET && tripPlan.status != EPlanStatus.WAIT_UPLOAD) {
            throw {code: -2, msg: "出差记录状态不正确！"};
        }

        let tripDetails = await tripPlan.getTripDetails({});
        if(tripDetails && tripDetails.length > 0) {
            await Promise.all(tripDetails.map((d) => {
                d.status = EPlanStatus.CANCEL;
                return d.save();
            }));
        }
        tripPlan.status = EPlanStatus.CANCEL;
        tripPlan.cancelRemark = params.remark || "";
        let staff = await Staff.getCurrent();
        let log = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: `撤销行程`});
        await Promise.all([tripPlan.save(), log.save()]);
        await tripPlan.save();
        return true;
    }

    //
    /********************************************统计相关API***********************************************/

    @clientExport
    @requireParams(['companyId', 'month'])
    static async statisticTripPlanOfMonth(params: {companyId: string, month: string}) {
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

        let staff_num_sql_ret = await sequelize.query(staff_num_sql);
        let project_num_sql_ret = await sequelize.query(project_num_sql);
        let budget_sql_ret = await sequelize.query(budget_sql);
        let saved_sql_ret = await sequelize.query(saved_sql);
        let expenditure_sql_ret = await sequelize.query(expenditure_sql);

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
    @requireParams([], ['startTime', 'endTime', 'isStaff'])
    static async statisticTripBudget(params: {startTime?: Date, endTime?: Date, isStaff?: boolean}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let formatStr = 'YYYY-MM-DD HH:mm:ss';

        let selectSql = `select count(id) as "tripNum", sum(budget) as budget, sum(expenditure) as expenditure, sum(budget-expenditure) as "savedMoney" from`;
        let completeSql = `trip_plan.trip_plans where deleted_at is null and company_id='${companyId}'`;

        if(params.startTime){
            let startTime = moment(params.startTime).format(formatStr);
            completeSql += ` and start_at>='${startTime}'`;
        }
        if(params.endTime){
            let endTime = moment(params.endTime).format(formatStr);
            completeSql += ` and start_at<='${endTime}'`;
        }
        if(params.isStaff){
            completeSql += ` and account_id='${staff.id}'`;
        }

        let planSql = `${completeSql}  and status in (${EPlanStatus.WAIT_UPLOAD}, ${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDITING}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.COMPLETE})`;
        completeSql += ` and status=${EPlanStatus.COMPLETE}`;

        let savedMoneyCompleteSql = completeSql + ' and is_special_approve = false';

        let savedMoneyComplete = `${selectSql} ${savedMoneyCompleteSql};`;
        let complete = `${selectSql} ${completeSql};`;
        let plan = `${selectSql} ${planSql};`;

        let savedMoneyCompleteInfo = await sequelize.query(savedMoneyComplete);
        let completeInfo = await sequelize.query(complete);
        let planInfo = await sequelize.query(plan);

        let ret = {
            planTripNum: 0,//计划出差人数(次)
            completeTripNum: 0,//已完成出差人数(次)
            planBudget: 0,//计划支出(元)
            completeBudget: 0,//动态预算(元)
            expenditure: 0,//累计支出(元)
            actualExpenditure: 0,//动态预算实际支出(元)
            savedMoney: 0//节省
        };

        if(completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            let c = completeInfo[0][0];
            ret.completeTripNum = Number(c.tripNum);
            ret.expenditure = Number(c.expenditure);
        }
        if(savedMoneyCompleteInfo && savedMoneyCompleteInfo.length > 0 && savedMoneyCompleteInfo[0].length > 0) {
            let c = savedMoneyCompleteInfo[0][0];
            ret.completeBudget = Number(c.budget);
            ret.savedMoney = Number(c.savedMoney);
            ret.actualExpenditure = Number(c.expenditure);
        }

        if(planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            let p = planInfo[0][0];
            ret.planTripNum = Number(p.tripNum);
            ret.planBudget = Number(p.budget);
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
    static async statisticBudgetsInfo(params: {startTime: string, endTime: string, type: string, keyWord?: string}) {
        let staff = await Staff.getCurrent();
        let company =staff.company;
        let completeSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status=${EPlanStatus.COMPLETE} and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;
        let savedMoneyCompleteSql = '';
        let planSql = `from trip_plan.trip_plans where deleted_at is null and company_id='${company.id}' and status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}, ${EPlanStatus.COMPLETE}) and start_at>'${params.startTime}' and start_at<'${params.endTime}'`;

        let type = params.type;
        let selectKey = '', modelName = '';
        if(type == 'S' || type == 'P'){ //按员工统计
            selectKey = type == 'S' ? 'account_id' : 'project_id';
            modelName = type == 'S' ? 'staff' : 'project';
            if(params.keyWord) {
                let  pagers = await Models[modelName].find({where: {name: {$like: `%${params.keyWord}%`}, companyId: company.id}, order: [['created_at','desc']]});

                let objs = [];
                objs.push.apply(objs, pagers);
                while(pagers.hasNextPage()){
                    let nextPager = await pagers.nextPage();
                    objs.push.apply(objs, nextPager);
                    // pagers = nextPager;
                }

                let selectStr = '';
                objs.map((s) => {
                    if(s && s.id) {
                        selectStr+= selectStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if(! selectStr || selectStr == ''){selectStr = `'${uuid.v1()}'`; }
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
        let complete =  `${selectSql} ${completeSql}`;
        let savedMoneyComplete =  `${savedMoneySelectSql} ${savedMoneyCompleteSql}`;
        let plan = `${selectSql} ${planSql}`;

        if(type == 'D') {
            selectKey = 'departmentId';
            completeSql = `from department.departments as d, staff.staffs as s, trip_plan.trip_plans as p where d.deleted_at is null and s.deleted_at is null and p.deleted_at is null and p.company_id='${company.id}' and d.id=s.department_id and p.account_id=s.id and p.start_at>'${params.startTime}' and p.start_at<'${params.endTime}'`;
            savedMoneyCompleteSql = '';
            planSql = `${completeSql} and p.status in (${EPlanStatus.WAIT_UPLOAD},${EPlanStatus.WAIT_COMMIT}, ${EPlanStatus.AUDIT_NOT_PASS}, ${EPlanStatus.AUDITING}, ${EPlanStatus.COMPLETE})`;
            completeSql += ` and p.status=${EPlanStatus.COMPLETE}`;
            if(params.keyWord) {
                let pagers = await Models.department.find({where: {name: {$like: `%${params.keyWord}%`}, companyId: company.id}, order: [['created_at','desc']]});

                let depts = [];
                depts.push.apply(depts, pagers);
                while(pagers.hasNextPage()){
                    let nextPager = await pagers.nextPage();
                    depts.push.apply(depts, nextPager);
                    // pagers = nextPager;
                }

                let deptStr = '';
                depts.map((s) => {
                    if(s && s.id) {
                        deptStr+= deptStr ? `,'${s.id}'` : `'${s.id}'`;
                    }
                });
                if(! deptStr || deptStr == ''){deptStr = `'${uuid.v1()}'`; }
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

        let completeInfo = await sequelize.query(complete);
        let savedMoneyCompleteInfo = await sequelize.query(savedMoneyComplete);
        let planInfo = await sequelize.query(plan);

        let result = {};
        if(completeInfo && completeInfo.length > 0 && completeInfo[0].length > 0) {
            completeInfo[0].map((ret) => {
                result[ret[selectKey]] = {
                    typeKey: ret[selectKey],
                    completeTripNum: Number(ret.tripNum),
                    completeBudget: Number(ret.budget),
                    expenditure: Number(ret.expenditure),
                    // savedMoney: Number(ret.savedMoney)
                };
            });
        }
        if(savedMoneyCompleteInfo && savedMoneyCompleteInfo.length > 0 && savedMoneyCompleteInfo[0].length > 0) {
            savedMoneyCompleteInfo[0].map((ret) => {
                let key = ret[selectKey];
                if(!result[key]){
                    result[key] = {};
                }
                result[key].savedMoney = Number(ret.savedMoney);
            });
        }

        if(planInfo && planInfo.length > 0 && planInfo[0].length > 0) {
            planInfo[0].map((ret) => {
                let key = ret[selectKey];
                if(!result[key]){
                    result[key] = {};
                }
                result[key].typeKey = ret[selectKey];
                result[key].planTripNum = Number(ret.tripNum);
                result[key].planBudget = Number(ret.budget);
                if(!result[key].expenditure) {
                    result[key].expenditure = 0;
                }
            });
        }

        result = _.orderBy(_.values(result), ['expenditure'], ['desc']);
        return result;
    }

    /**
     * @method saveTripPlan
     * 生成出差计划单
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['tripApproveId'])
    static async saveTripPlanByApprove(params: {tripApproveId: string}): Promise<TripPlan> {
        let formatStr = 'YYYY-MM-DD';
        let approve = await Models.approve.get(params.tripApproveId);
        let account = await Models.staff.get(approve.submitter);
        let approveUser = await Models.staff.get(approve.approveUser);
        let company = approveUser.company;
        if (typeof approve.data == 'string') approve.data = JSON.parse(approve.data);
        let query: any  = approve.data.query;   //查询条件
        if(typeof query == 'string') query = JSON.parse(query);
        if(typeof query.destinationPlacesInfo == 'string') query.destinationPlacesInfo = JSON.parse(query.destinationPlacesInfo);
        let destinationPlacesInfo = query.destinationPlacesInfo;
        let budgets: any = approve.data.budgets;
        if (typeof budgets == 'string') budgets = JSON.parse(budgets);

        let tripPlan = TripPlan.create({id: approve.id});
        let projectIds = [];//事由名称
        let arrivalCityCodes = [];//目的地代码
        let project: Project;

        if(query.originPlace) {
            let deptInfo = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace}) || {name: null};
            tripPlan.deptCityCode = deptInfo.id;
            tripPlan.deptCity = deptInfo.name;
        }
        tripPlan.isRoundTrip = query.isRoundTrip;
        if(destinationPlacesInfo && _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let q = destinationPlacesInfo[i];
                //处理出差事由放入projectIds 原project存放第一程出差事由
                if(q.reason){
                    let projectItem = await TripPlanModule.getProjectByName({companyId: company.id, name: q.reason,
                        userId: account.id, isCreate: true});
                    if(i == 0){
                        project = projectItem;
                    }
                    if(projectIds.indexOf(projectItem.id) == -1){
                        projectIds.push(projectItem.id);
                    }
                }

                //处理目的地 放入arrivalCityCodes 原目的地信息存放第一程目的地信息
                if(q.destinationPlace){
                    let arrivalInfo = await API.place.getCityInfo({cityCode: q.destinationPlace.id|| q.destinationPlace}) || {name: null};
                    arrivalCityCodes.push(arrivalInfo.id);
                    if(i == (destinationPlacesInfo.length - 1)){
                        tripPlan.arrivalCityCode = arrivalInfo.id;
                        tripPlan.arrivalCity = arrivalInfo.name;
                    }
                }

                //处理其他数据
                if(i == 0){
                    tripPlan.startAt = q.leaveDate;
                    //处理原始数据 用第一程数据
                    tripPlan.isNeedTraffic = q.isNeedTraffic;
                    tripPlan.isNeedHotel = q.isNeedHotel;
                }
                if(i == (destinationPlacesInfo.length - 1)){
                    tripPlan.backAt = q.goBackDate;
                }
            }
        }
        // let deptCity = await API.place.getCityInfo({cityCode: query.originPlace});
        // let arrivalCity = await API.place.getCityInfo({cityCode: query.destinationPlace});

        tripPlan.projectIds = JSON.stringify(projectIds);
        tripPlan.arrivalCityCodes = JSON.stringify(arrivalCityCodes);

        tripPlan['companyId'] = account.company.id;
        // tripPlan.startAt = moment(query.leaveDate).toDate();
        // tripPlan.backAt = moment(query.goBackDate).toDate();
        tripPlan.auditUser = tryObjId(approveUser);
        tripPlan.project = project;
        tripPlan.title = approve.title;//project名称
        tripPlan.account = account;
        tripPlan.status = EPlanStatus.WAIT_UPLOAD;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号
        tripPlan.query = query;
        tripPlan.isSpecialApprove = approve.isSpecialApprove;
        tripPlan.specialApproveRemark = approve.specialApproveRemark;

        //计算总预算
        let totalBudget = budgets
            .map( (item) => {
                return Number(item.price) || 0;
            })
            .reduce( (total, cur) => {
                return total + cur;
            }, 0);

        tripPlan.budget = totalBudget;

        let log = TripPlanLog.create({tripPlanId: tripPlan.id, userId: tryObjId(approveUser), remark: `出差审批通过，生成出差记录`});
        await Promise.all([tripPlan.save(), log.save()]);

        let tripDetails: TripDetail[] = [];

        tripDetails = budgets.map(function (budget) {
            let tripType = budget.tripType;
            let price = Number(budget.price);
            let detail;
            let data: any = {};
            if(budget.originPlace){
                if (typeof budget.originPlace == 'string') budget.originPlace = JSON.parse(budget.originPlace);
            }
            if(budget.destination){
                if (typeof budget.destination == 'string') budget.destination = JSON.parse(budget.destination);
            }
            console.info('BUDGET====>', budget);
            switch(tripType) {
                case ETripType.OUT_TRIP:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity= budget.destination.id;
                    data.deptDateTime = budget.departDateTime;
                    data.arrivalDateTime = budget.arrivalDateTime;
                    data.leaveDate = budget.leaveDate;
                    data.cabin = budget.cabinClass;
                    data.invoiceType = budget.type;
                    detail = Models.tripDetailTraffic.create(data);
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.BACK_TRIP:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity= budget.destination.id;
                    data.deptDateTime = budget.departDateTime;
                    data.arrivalDateTime = null;
                    data.leaveDate = budget.leaveDate;
                    data.cabin = budget.cabinClass;
                    data.invoiceType = budget.type;
                    detail = Models.tripDetailTraffic.create(data);
                    tripPlan.isNeedTraffic = true;
                    break;
                case ETripType.HOTEL:
                    data.city = budget.cityName;
                    data.placeName = budget.hotelName;
                    data.name = budget.name;
                    data.position = budget.hotelName;
                    data.checkInDate = budget.checkInDate;
                    data.checkOutDate = budget.checkOutDate;
                    detail = Models.tripDetailHotel.create(data);
                    tripPlan.isNeedHotel = true;
                    break;
                case ETripType.SUBSIDY:
                    data.hasFirstDaySubsidy = budget.hasFirstDaySubsidy;
                    data.hasLastDaySubsidy = budget.hasLastDaySubsidy;
                    data.template = budget.template.id;
                    data.subsidyMoney = budget.price;//此字段做什么
                    data.startDateTime = budget.fromDate;
                    data.endDateTime = budget.endDate;
                    detail = Models.tripDetailSubsidy.create(data);
                    detail.expenditure = price;//此字段与budget字段有什么区别
                    detail.status = EPlanStatus.COMPLETE;
                    break;
                case ETripType.SPECIAL_APPROVE:
                    data.deptCity = budget.originPlace ? budget.originPlace.id : "";
                    data.arrivalCity = budget.destination.id;
                    data.deptDateTime = budget.startAt;
                    data.arrivalDateTime = budget.backAt;
                    detail = Models.tripDetailSpecial.create(data);
                    break;
                default:
                    throw new Error("not support tripDetail type!");
            }
            detail.type = tripType;
            detail.budget = price;
            detail.accountId= account.id;
            detail.status = EPlanStatus.WAIT_UPLOAD;
            detail.tripPlanId = tripPlan.id;
            return detail;
        });

        if(tripDetails && tripDetails.length > 0){
            let ps = tripDetails.map((d) => {
                return d.save();
            });
            await Promise.all(ps);
        }

        let data = await TripPlanModule.getPlanEmailDetails(tripPlan);
        let {go, back, hotel, subsidy} = data;

        let self_url = config.host + '/index.html#/trip/list-detail?tripid=' + approve.id;
        let appMessageUrl = '#/trip/list-detail?tripid=' + approve.id;

        try {
            self_url = await API.wechat.shorturl({longurl: self_url});
        } catch(err) {
            console.error(err);
        }

        let self_values = {
            noticeType: ENoticeType.TRIP_APPROVE_NOTICE,
            username: account.name,
            planNo: tripPlan.planNo,
            approveTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            approveUser: approveUser.name,
            projectName: tripPlan.title,
            goTrafficBudget: go,
            backTrafficBudget: back,
            hotelBudget: hotel,
            otherBudget: subsidy,
            totalBudget: '￥' + tripPlan.budget,
            url: self_url,
            detailUrl: self_url,
            appMessageUrl: appMessageUrl,
            time: moment(tripPlan.startAt).format('YYYY-MM-DD'),
            destination: tripPlan.arrivalCity,
            staffName: account.name,
            startTime: moment(tripPlan.startAt).format('YYYY-MM-DD'),
            arrivalCity: tripPlan.arrivalCity,
            budget: tripPlan.budget,
            tripPlanNo: tripPlan.planNo,
            approveResult: EApproveResult2Text[EApproveResult.PASS],
            reason: '',
            emailReason: '',
            startAt: moment(tripPlan.startAt).format('MM.DD'),
            backAt: moment(tripPlan.backAt).format('MM.DD'),
            deptCity: tripPlan.deptCity,
        };
        try {
            await API.tripApprove.sendApprovePassNoticeToCompany({approveId: approve.id});
        } catch(err) {
            console.error(err);
        }
        let tplName = 'qm_notify_approve_pass';
        try {
            await API.notify.submitNotify({accountId: account.id, key: tplName, values: self_values});
        } catch(err) {
            console.error(err);
        }
        try {
            await API.ddtalk.sendLinkMsg({ accountId: account.id, text: '您的预算已审批完成', url: self_url});
        } catch(err) {
            console.error(err);
        }

        return tripPlan;
    }

    @clientExport
    @requireParams([], ['limit', 'staffId', 'startTime', 'endTime'])
    static async tripPlanSaveRank(params: {limit?: number|string, staffId?: string, startTime?: string, endTime?: string}) {
        let staff = await Staff.getCurrent();
        let companyId = staff.company.id;
        let limit = params.limit || 10;
        if (!limit || !/^\d+$/.test(limit as string) || limit > 100) {
            limit = 10;
        }
        let sql = `select account_id, sum(budget) - sum(expenditure) as save from trip_plan.trip_plans 
        where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}' and is_special_approve = false `;
        if(params.staffId)
            sql += ` and account_id = '${params.staffId}'`;
        if(params.startTime)
            sql += ` and start_at > '${params.startTime}'`;
        if(params.endTime)
            sql += ` and start_at < '${params.endTime}'`;
        sql += ` group by account_id order by save desc limit ${limit};`;

        let ranks = await sequelize.query(sql)
            .then(function(result) {
                return result[0];
            });

        ranks = await Promise.all(ranks.map((v: any) => {
            return Models.staff.get(v.account_id)
                .then(function(staff) {
                    return {staff: staff, save: v.save};
                })
        }));

        return ranks;
    }

    @clientExport
    static async getTripPlanSave(params: {accountId?: string}) {
        let staff = await Models.staff.get(params.accountId);
        let accountId = params.accountId;
        let companyId = staff.company.id;
        let sql = `select sum(budget) - sum(expenditure) as save from trip_plan.trip_plans where deleted_at is null and status = ${EPlanStatus.COMPLETE} AND company_id = '${companyId}' AND account_id =  '${accountId}' `;

        let ranks = await sequelize.query(sql)
            .then(function(result) {
                return result[0];
            });

        return ranks[0].save;
    }


    @clientExport
    @requireParams(["tripPlanId"])
    static async makeFinalBudget(params: {tripPlanId: string}) {
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
            let {deptCityCode, arrivalCityCode, startAt, backAt, isNeedTraffic, isNeedHotel} = tripPlan;
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
        let budgetResult = await API.client.travelBudget.getBudgetInfo({id: budgetId});
        let budgets = budgetResult.budgets;

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
    @requireParams(["tripPlanId"])
    static async makeSpendReport(params: {tripPlanId: string}) {
        var money2hanzi = require("money2hanzi");
        let staff = await Staff.getCurrent()
        let {tripPlanId} = params;
        let tripPlan = await Models.tripPlan.get(tripPlanId);
        if (tripPlan.account.id != staff.id) {
            throw L.ERR.PERMISSION_DENY();
        }
        if (!tripPlan || tripPlan.status != EPlanStatus.COMPLETE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }
        if (!staff.email) {
            throw L.ERR.EMAIL_EMPTY();
        }
        let title = moment(tripPlan.startAt).format('MM.DD') + '-'+ moment(tripPlan.backAt).format("MM.DD") + tripPlan.deptCity + "到" + tripPlan.arrivalCity + '报销单'
        let tripDetails = await Models.tripDetail.find({
            where: {tripPlanId: tripPlanId},
            order: [["created_at", "asc"]]
        })
        // let tripDetails = await tripPlan.getTripDetails({where: {}, order: [["created_at", "asc"]]});
        let tripApprove = await Models.tripApprove.get(tripPlanId);
        let approveUsers: Array<any> = (tripApprove && tripApprove.approvedUsers ? tripApprove.approvedUsers:'').split(/,/g)
            .filter((v)=> {
                return !!v;
            }).map( async (userId) => {
                if (userId) {
                    let staff =  await Models.staff.get(userId)
                    return staff.name;
                }
                return '';
            })
        approveUsers = await Promise.all(approveUsers)
        let _tripDetails = tripDetails.map (async (v) :Promise<any> => {
            let tripDetailInvoices = await Models.tripDetailInvoice.find({where: {tripDetailId: v.id, payType: {$ne: EPayType.COMPANY_PAY}}});
            if (v.type == ETripType.OUT_TRIP || v.type == ETripType.BACK_TRIP) {
                let v1 = <TripDetailTraffic>v;
                let trafficType;
                let trafficInfo;
                let type;
                type = '交通'
                trafficType = v1.type == ETripType.OUT_TRIP ? 'GO': 'BACK';
                trafficInfo = v1.invoiceType == EInvoiceType.TRAIN ? '火车': '飞机';
                trafficInfo += v1.invoiceType == EInvoiceType.PLANE ? MPlaneLevel[v1.cabin] : MTrainLevel[v1.cabin];
                let deptCity = await API.place.getCityInfo({cityCode: v1.deptCity});
                let arrivalCity = await API.place.getCityInfo({cityCode: v1.arrivalCity});
                return {
                    type: type,
                    date: moment(v1.deptDateTime).format('YYYY.MM.DD'),
                    invoiceInfo: `${type}费`,
                    quantity: tripDetailInvoices.length,
                    money: v1.personalExpenditure,
                    departCity: deptCity.name,
                    arrivalCity: arrivalCity.name,
                    remark: `${deptCity.name}-${arrivalCity.name}`,
                    trafficType: `${trafficType}`,
                    trafficInfo: `${trafficInfo}`
                }
            }
            if (v.type == ETripType.HOTEL) {
                let v1 = <TripDetailHotel>v;
                let city = await API.place.getCityInfo({cityCode: v1.city})
                return {
                    "type": "住宿",
                    "date": moment(v1.checkInDate).format('YYYY.MM.DD'),
                    "invoiceInfo": "住宿费",
                    "quantity": tripDetailInvoices.length,
                    "money": v1.personalExpenditure,
                    "remark": `${moment(v1.checkInDate).format('YYYY.MM.DD')}-${moment(v1.checkOutDate).format('YYYY.MM.DD')} ${city.name} 共${moment(v1.checkOutDate).diff(v1.checkInDate, 'days')}日`,
                    "duration": `${moment(v1.checkOutDate).diff(v1.checkInDate, 'days')}`
                }
            }
            if (v.type == ETripType.SUBSIDY) {
                let v1 = <TripDetailSubsidy>v;
                return {
                    "type": '补助',
                    "date": moment(v1.startDateTime).format('YYYY.MM.DD'),
                    "invoiceInfo": "补助费",
                    quantity: 0,
                    money: v1.personalExpenditure,
                    remark: '补助费'
                }
            }
            if (v.type == ETripType.SPECIAL_APPROVE) {
                let v1 = <TripDetailSpecial>v;
                return {
                    "type": '出差费用',
                    "date": moment(v1.deptDateTime).format('YYYY.MM.DD'),
                    "invoiceInfo": "出差费",
                    quantity: tripDetailInvoices.length,
                    money: v1.personalExpenditure,
                    remark: '特别审批出差费用'
                }
            }
        })
        let financeCheckCode = Models.financeCheckCode.create({tripPlanId: tripPlanId, isValid: true});
        financeCheckCode = await financeCheckCode.save();
        let roundLine = `${tripPlan.deptCity}-${tripPlan.arrivalCity}${tripPlan.isRoundTrip ? '-' + tripPlan.deptCity: ''}`;
        _tripDetails = await Promise.all(_tripDetails);
        _tripDetails = _tripDetails.filter( (v) => {
            return v['money'] > 0;
        });
        var invoiceQuantity = _tripDetails
            .map( (v) => {
                return v['quantity'] || 0;
            })
            .reduce(function(previousValue, currentValue) {
                return previousValue + currentValue;
            });

        //计算用户总花费
        let _personalExpenditure = _tripDetails
            .map( (v) => {
                return v['money'];
            })
            .reduce((prev, cur) => {
                return Number(prev) + Number(cur)
            });

        let content: any = [
            `出差人:${staff.name}`,
            `出差日期:${moment(tripPlan.startAt).format('YYYY.MM.DD')}-${moment(tripPlan.backAt).format('YYYY.MM.DD')}`,
            `出差路线: ${roundLine}`,
            `出差预算:${tripPlan.budget}`,
            `实际支出:${_personalExpenditure}个人支付, ${(Number(tripPlan.expenditure)-_personalExpenditure).toFixed(2)}公司支付`,
            `出差记录编号:${tripPlan.planNo}`,
            `校验地址: ${config.host}#/finance/trip-detail?id=${tripPlan.id}&code=${financeCheckCode.code}`
        ]

        let qrcodeCxt = await API.qrcode.makeQrcode({content: content.join('\n\r')});
        let departmentsStr = await staff.getDepartmentsStr();


        var data = {
            "submitter": staff.name,  //提交人
            "department": departmentsStr,  //部门
            "budgetMoney": tripPlan.budget || 0, //预算总金额
            "totalMoney": _personalExpenditure || 0,  //实际花费
            "totalMoneyHZ": money2hanzi.toHanzi(_personalExpenditure),  //汉字大写金额
            "invoiceQuantity": invoiceQuantity, //票据数量
            "createAt": moment().format('YYYY年MM月DD日HH:mm'), //生成时间
            "departDate": moment(tripPlan.startAt).format('YYYY.MM.DD'), //出差起始时间
            "backDate": moment(tripPlan.backAt).format('YYYY.MM.DD'), //出差返回时间
            "reason": tripPlan.project.name, //出差事由
            "approveUsers": approveUsers, //本次出差审批人
            "qrcode": `data:image/png;base64,${qrcodeCxt}`,
            "invoices": _tripDetails,
            "roundLine": roundLine,
        }

        let buf = await makeSpendReport(data);
        try {
            await API.notify.submitNotify({
                key: 'qm_spend_report',
                accountId: staff.id,
                values: {
                    title: title,
                    attachments: [{
                        filename: title + '.pdf',
                        content: buf.toString("base64"),
                        encoding: 'base64'
                    }]
                },
            });

        } catch(err) {
            console.error(err.stack);
        }
        return true;
    }

    @clientExport
    static async getTripDetailInvoices(options: {where: any, limit?: any, order?: any}) :Promise<FindResult>{
        if (!options  || !options.where) throw new Error('查询条件不能为空');
        let where = options.where;
        if (!where.tripDetailId) throw new Error('查询条件错误');
        let qs: any = {
            where: {tripDetailId: options.where.tripDetailId},
        }
        if (options.limit) qs.limit = options.limit;
        if (options.order) {
            qs.order = options.order;
        } else {
            qs.order = [['created_at', 'asc']];
        }
        let invoices = await Models.tripDetailInvoice.find(qs);
        let ids = invoices.map( (v) => {
            return v.id;
        });
        return {ids: ids, count: invoices.length};
    }

    @clientExport
    @requireParams(['id'])
    static async getTripDetailInvoice(params: {id: string}):Promise<TripDetailInvoice> {
        return Models.tripDetailInvoice.get(params.id);
    }

    @clientExport
    @requireParams(['tripDetailId', 'totalMoney', 'payType', 'invoiceDateTime', 'type', 'remark'], ['id', 'pictureFileId', 'accountId', 'orderId', 'sourceType','status', 'supplierId'])
    static async saveTripDetailInvoice(params) :Promise<TripDetailInvoice> {
        let tripDetailInvoice = Models.tripDetailInvoice.create(params);
        tripDetailInvoice = await tripDetailInvoice.save();
         await TripPlanModule.notifyDesignatedAcount();

        let tripDetail = await Models.tripDetail.get(tripDetailInvoice.tripDetailId);
        if (!tripDetail.expenditure) {
            tripDetail.expenditure = 0;
        }
        await updateTripDetailExpenditure(tripDetail);
        await tryUpdateTripDetailStatus(tripDetail, EPlanStatus.WAIT_COMMIT);
        return tripDetailInvoice;
    }

    static async notifyDesignatedAcount():Promise<any>{
        let staff=await Staff.getCurrent();
        let companyName=staff.company.name;
        let staffName=staff.name;

        return await API.notify.notifyDesignatedAccount({
         mobile:"13810529805",
         email:"notice@jingli365.com",
         key:"qm_notify_designated_account",
         values:{
             company:companyName,
             staffName:staff.name
         }
         });
    }



    @clientExport
    @requireParams(['detailId', 'orderIds', 'supplierId'])
    static async relateOrders(params) :Promise<any> {
        let result = {success: [], failed: []};
        let currentStaff = await Staff.getCurrent();
        let orders = await currentStaff.getOrders({supplierId: params.supplierId});
        let Morders: any = {};
        orders.forEach(async function(o){
            Morders[o.id] = o;
        })
        let orderIds = params.orderIds;
        let ps = orderIds.map(async function(id){
            let o = Morders[id];
            let detailInvoice = await Models.tripDetailInvoice.find({where: {orderId: id, accountId: currentStaff.id, sourceType: ESourceType.RELATE_ORDER}});
            if(detailInvoice && detailInvoice.length > 0){
                result.failed.push({desc: o.desc, remark: '该订单已被关联过'});
                return o.id;
                // throw L.ERR.ORDER_HAS_RELATED();
            }

            if(o.persons.indexOf(currentStaff.name) < 0){
                result.failed.push({desc: o.desc, remark: '只能关联自己的订单'});
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
            let iv =  await TripPlanModule.saveTripDetailInvoice(invoice);
            result.success.push({desc: o.desc, remark: '关联成功'});
            return o.id;
        })
        await Promise.all(ps);
        return result;
    }

    @clientExport
    @requireParams(["id"], ['totalMoney', 'payType', 'invoiceDateTime', 'type', 'remark', 'pictureFileId'])
    static async updateTripDetailInvoice(params) :Promise<TripDetailInvoice> {
        let {id, totalMoney} = params;
        let oldMoney = 0;
        let newMoney = 0;
        if (totalMoney) {
            newMoney = Number(totalMoney);
        }
        if (newMoney <0 ) {
            throw L.ERR.MONEY_FORMAT_ERROR();
        }
        let tripDetailInvoice = await Models.tripDetailInvoice.get(id);
        if (tripDetailInvoice.totalMoney) {
            oldMoney = tripDetailInvoice.totalMoney;
        }
        for(let key in params) {
            tripDetailInvoice[key] = params[key];
        }
        tripDetailInvoice = await tripDetailInvoice.save()

        let tripDetail = await Models.tripDetail.get(tripDetailInvoice.tripDetailId);
        await updateTripDetailExpenditure(tripDetail);
        await tryUpdateTripDetailStatus(tripDetail, EPlanStatus.WAIT_COMMIT);
        return tripDetailInvoice;
    }

    @clientExport
    @requireParams(['id'])
    static async deleteTripDetailInvoice(params):Promise<boolean> {
        let {id } = params;
        let tripDetailInvoice = await Models.tripDetailInvoice.get(id);
        let tripDetailId = tripDetailInvoice.tripDetailId;
        await tripDetailInvoice.destroy();
        let tripDetail = await Models.tripDetail.get(tripDetailId);
        await updateTripDetailExpenditure(tripDetail);
        let invoices = await tripDetail.getInvoices();
        if (invoices && invoices.length) {
            await tryUpdateTripDetailStatus(tripDetail, EPlanStatus.WAIT_COMMIT);
        } else {
            await tryUpdateTripDetailStatus(tripDetail, EPlanStatus.WAIT_UPLOAD);
        }
        return true;
    }

    static __initHttpApp = require('./invoice');

    static _scheduleTask () {
        let taskId = "authApproveTrainPlan";
        logger.info('run task ' + taskId);
        scheduler('*/5 * * * *', taskId, async function() {
            let tripApproves = await Models.tripApprove.find({where: {autoApproveTime: {$lte: new Date()}, status: QMEApproveStatus.WAIT_APPROVE}, limit: 10, order: 'auto_approve_time'});
            tripApproves.map(async (approve) => {
                let approveCompany = await approve.getCompany();
                let number = 0;
                if(approve.isSpecialApprove){
                    number = number + 1;
                }
                if(approve.isNeedHotel){
                    number = number + 1;
                }
                if(approve.isNeedTraffic){
                    number = number + 1;
                }
                if(approve.isRoundTrip){
                    number = number + 1;
                }

                await approveCompany.beforeApproveTrip({number : number});

                approve.status = QMEApproveStatus.PASS;
                approve = await approve.save();

                let content = approve.deptCity+"-"+approve.arrivalCity;
                let frozenNum = JSON.parse(approve.query).frozenNum;
                if(approve.createdAt.getMonth() == new Date().getMonth() && !approve.isSpecialApprove){
                    await approveCompany.approvePassReduceTripPlanNum({accountId: approve.account.id, tripPlanId: approve.id,
                        remark: "自动审批通过消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                }else{
                    await approveCompany.approvePassReduceBeforeNum({accountId: approve.account.id, tripPlanId: approve.id,
                        remark: "自动审批通过上月申请消耗行程点数" , content: content, isShowToUser: false, frozenNum: frozenNum});
                }

                if(approve.approveUser && approve.approveUser.id && /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(approve.approveUser.id)) {
                    let log = Models.tripPlanLog.create({tripPlanId: approve.id, userId: approve.approveUser.id, approveStatus: EApproveResult.AUTO_APPROVE, remark: '自动通过'});
                    await log.save();
                }
                await TripPlanModule.saveTripPlanByApprove({tripApproveId: approve.id});
            });
        });
    }

    static async getProjectByName(params) {
        let projects = await Models.project.find({where: {name: params.name}});

        if(projects && projects.length > 0) {
            let project = projects[0];
            project.weight += 1;
            await project.save();
            return project;
        }else if(params.isCreate === true){
            let p = {name: params.name, createUser: params.userId, code: '', companyId: params.companyId};
            return Models.project.create(p).save();
        }
    }
}



async function updateTripDetailExpenditure(tripDetail: TripDetail) {
    //重新计算所有花费
    let invoices = await Models.tripDetailInvoice.find({ where: {tripDetailId: tripDetail.id}});
    let expenditure = 0;
    let personalExpenditure = 0;
    invoices.forEach( (v: TripDetailInvoice) => {
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
    let tripDetails = await Models.tripDetail.find({where: {tripPlanId: tripPlan.id}});
    let expenditure = 0;
    let personalExpenditure = 0;
    tripDetails.forEach( (v) => {
        expenditure += Number(v.expenditure);
        personalExpenditure += Number(v.personalExpenditure);
    });
    tripPlan.expenditure = expenditure;
    tripPlan.personalExpenditure = personalExpenditure;
    return tripPlan.save();
}

//尝试修改tripDetail状态
async function tryUpdateTripDetailStatus(tripDetail: TripDetail, status: EPlanStatus) :Promise<TripDetail> {
    if ([ETripType.SUBSIDY].indexOf(tripDetail.type) >= 0 ) {
        tripDetail.status = status;
    } else {
        switch(status) {
            case EPlanStatus.WAIT_UPLOAD:
                tripDetail.status = status;
                break;
            case EPlanStatus.WAIT_COMMIT:
                //如果票据不为空,则设置状态为可提交状态
                let invoices = await Models.tripDetailInvoice.find({where: {tripDetailId: tripDetail.id}});
                if (invoices && invoices.length) {
                    tripDetail.status = EPlanStatus.WAIT_COMMIT;
                }
                break;
            case EPlanStatus.AUDITING:
                if ([ EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.WAIT_COMMIT].indexOf(tripDetail.status) >= 0) {
                    tripDetail.status = status;
                }
                break;
            case EPlanStatus.COMPLETE:
                if (EPlanStatus.AUDITING == tripDetail.status) {
                    tripDetail.status = status;
                }
                break;
        }
    }

    //更改行程详情状态
    tripDetail = await tripDetail.save()
    //尝试更改行程状态
    let tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
    await tryUpdateTripPlanStatus(tripPlan, status);

    return tripDetail;
}

//尝试修改tripPlan状态
async function tryUpdateTripPlanStatus(tripPlan: TripPlan, status: EPlanStatus) :Promise<TripPlan>{
    let cannotStatus = {};
    //变tripPlan状态需要tripDetail不能包含状态
    cannotStatus[EPlanStatus.WAIT_UPLOAD] = [];
    cannotStatus[EPlanStatus.WAIT_COMMIT] = _.concat([EPlanStatus.WAIT_UPLOAD],  cannotStatus[EPlanStatus.WAIT_UPLOAD]);
    cannotStatus[EPlanStatus.AUDITING] = _.concat([EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.WAIT_COMMIT], cannotStatus[EPlanStatus.WAIT_COMMIT]);
    cannotStatus[EPlanStatus.COMPLETE] = _.concat([EPlanStatus.AUDITING], cannotStatus[EPlanStatus.AUDITING]);
    //变tripPlan状态,只关注出发交通,返回交通,住宿,特殊审批类型
    let preTripTypeNeeds = [ETripType.BACK_TRIP, ETripType.OUT_TRIP, ETripType.HOTEL, ETripType.SPECIAL_APPROVE];

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
        tripPlan.status = status;
        await tripPlan.save();
    }
    return tripPlan;
}

function tryObjId(obj) {
    if (obj && obj.id) return obj.id;
    return null;
}


TripPlanModule._scheduleTask();

export = TripPlanModule;