/**
 * Created by yumiao on 15-12-10.
 */
"use strict";
let sequelize = require("common/model").DB;
let DBM = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
let utils = require('common/utils');
let API = require('common/api');
let Logger = require('common/logger');
let logger = new Logger("tripPlan");
let config = require("../../config");
import _ = require('lodash');
import moment = require("moment");
import {requireParams, clientExport} from 'common/api/helper';
import {Project, TripPlan, TripDetail, EPlanStatus, EInvoiceType, TripPlanLog, ETripType, EAuditStatus } from "api/_types/tripPlan";
import {Models} from "api/_types/index";
import {FindResult} from "common/model/interface";
import {Staff, EStaffRole, EStaffStatus} from "api/_types/staff";
import {conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {AgencyUser} from "../_types/agency";

let TripDetailCols = TripDetail['$fieldnames'];
let TripPlanCols = TripPlan['$fieldnames'];

class TripPlanModule {
    // static async caculateTravelBudget(){
    //     let ret = await API.travelBudget.getTravelPolicyBudget({
    //         leaveDate: '2016-06-01',
    //         goBackDate: '2016-06-10',
    //         isRoundTrip: true,
    //         originPlace: '北京',
    //         destinationPlace: '上海',
    //         checkInDate: '2016-06-01',
    //         checkOutDate: '2016-06-10',
    //         leaveTime: '10:00',
    //         goBackTime: '10:00',
    //         isNeedHotel: false
    //     });
    //
    //     return ret;
    // }

    /**
     * @param params.budgetId 预算id
     * @param params.title 项目名称
     * @param params.description 出差事由
     * @param params.remark 备注
     * @param params
     * @returns {TripPlan}
     */
    @clientExport
    @requireParams(['budgetId', 'title', 'auditUser'], ['description', 'remark'])
    static async saveTripPlan(params): Promise<TripPlan> {
        let staff = await Staff.getCurrent();
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: params.budgetId});

        if(!budgetInfo) {
            throw L.ERR.TRAVEL_BUDGET_NOT_FOUND();
        }

        let {budgets, query} = budgetInfo;
        let project = await getProjectByName({companyId: staff.company.id, name: params.title, userId: staff.id, isCreate: true});
        let totalBudget = 0;
        let tripPlan = TripPlan.create(params);

        tripPlan['accountId'] = staff.id;
        tripPlan['companyId'] = staff.company.id;
        tripPlan.project = project;
        tripPlan.startAt = query.leaveDate;
        tripPlan.backAt = query.goBackDate;
        tripPlan.deptCity = query.originPlace;
        tripPlan.arrivalCity = query.destinationPlace;
        tripPlan.isNeedHotel = query.isNeedHotel;
        tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo');
        if (!tripPlan.auditUser) {
            tripPlan.auditUser = null;
        }
        let tripDetails: TripDetail[] = budgets.map(function (budget) {
            let tripType = budget.tripType;
            let detail = Models.tripDetail.create({type: tripType, invoiceType: budget.type, budget: Number(budget.price)});
            detail.accountId = staff.id;
            detail.isCommit = false;
            detail.status = EPlanStatus.WAIT_UPLOAD;
            detail.tripPlan = tripPlan;

            switch(tripType) {
                case ETripType.OUT_TRIP:
                    detail.deptCity = query.originPlace;
                    detail.arrivalCity = query.destinationPlace;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    break;
                case ETripType.BACK_TRIP:
                    detail.deptCity = query.destinationPlace;
                    detail.arrivalCity = query.originPlace;
                    detail.startTime = query.goBackDate;
                    detail.endTime = query.leaveDate;
                    break;
                case ETripType.HOTEL:
                    detail.city = query.destinationPlace;
                    detail.hotelName = query.businessDistrict;
                    detail.startTime = query.checkInDate || query.leaveDate;
                    detail.endTime = query.checkOutDate || query.goBackDate;
                    break;
                case ETripType.SUBSIDY:
                    detail.deptCity = query.originPlace;
                    detail.arrivalCity = query.destinationPlace;
                    detail.startTime = query.leaveDate || query.checkInDate;
                    detail.endTime = query.goBackDate || query.checkOutDate;
                    break;
                default:
                    detail.type = ETripType.OTHER;
                    detail.startTime = query.leaveDate;
                    detail.endTime = query.goBackDate;
                    break;
            }

            if(budget.price < 0 || totalBudget < 0) {
                totalBudget = -1;
            }else {
                totalBudget = totalBudget + Number(budget.price);
            }

            return detail;
        });

        tripPlan.budget = totalBudget;
        let tripPlanLog = Models.tripPlanLog.create({tripPlanId: tripPlan.id, userId: staff.id, remark: '创建出差计划' + tripPlan.planNo});

        await Promise.all([tripPlan.save(), tripPlanLog.save()]);
        await Promise.all(tripDetails.map((d)=>d.save()));

        if (tripPlan.budget > 0 || tripPlan.status === EPlanStatus.WAIT_UPLOAD) {
            await TripPlanModule.sendTripPlanEmails(tripPlan, staff.id);
        }

        return tripPlan;
    }

    /**
     * 发送邮件
     * @param tripPlan
     * @param userId
     * @returns {Promise<boolean>}
     */
    static async sendTripPlanEmails(tripPlan: TripPlan, userId: string) {
        let url = config.host + '/corp.html#/TravelStatistics/planDetail?tripPlanId=' + tripPlan.id;
        let user = await Models.staff.get(userId);
        let admins = await Models.staff.find({ where: {companyId: tripPlan['companyId'], roleId: [EStaffRole.OWNER, EStaffRole.ADMIN], status: EStaffStatus.ON_JOB}}); //获取激活状态的管理员
        let go = '无', back = '无', hotelStr = '无';

        let outTrip = await tripPlan.getOutTrip();
        if (outTrip && outTrip.length > 0) {
            let g = outTrip[0];
            go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.deptCity + ' 到 ' + g.arrivalCity;
            if (g.latestArriveTime)
                go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
            go += ', 动态预算￥' + g.budget;
        }

        let backTrip = await tripPlan.getBackTrip();
        if (backTrip && backTrip.length > 0) {
            let b = backTrip[0];
            back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.deptCity + ' 到 ' + b.arrivalCity;
            if (b.latestArriveTime)
                back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
            back += ', 动态预算￥' + b.budget;
        }

        let hotel = await tripPlan.getHotel();
        if (hotel && hotel.length > 0) {
            let h = hotel[0];
            hotelStr = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') +
                ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;
        }

        await Promise.all(admins.map(async function(s) {
            let vals = {managerName: s.name, username: user.name, email: user.email, time: moment(tripPlan.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                projectName: tripPlan.title, goTrafficBudget: go, backTripBudget: back, hotelBudget: hotelStr,
                totalBudget: '￥' + tripPlan.budget, url: url, detailUrl: url};

            let log = {userId: user.id, tripPlanId: tripPlan.id, remark: tripPlan.planNo + '给企业管理员' + s.name + '发送邮件'};

            // await Promise.all([
            //     API.mail.sendMailRequest({toEmails: s.email, templateName: 'qm_notify_new_travelbudget', values: vals}),
            //     Models.tripPlanLog.create(log).save()
            // ])

            await Models.tripPlanLog.create(log).save();
        }));

        return true;
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
    @requireParams(['id'], ['isNeedTraffic', 'isNeedHotel', 'title', 'description', 'status', 'deptCity', 'deptCityCode', 'arrivalCity', 'arrivalCityCode', 'startAt', 'backAt', 'remark'])
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
        options.order = options.order || 'start_at desc';
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
    static getTripDetail(params: {id: string}): Promise<TripDetail> {
        return Models.tripDetail.get(params.id);
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

    /**
     * 企业管理员审批员工预算
     * @param params
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['id', 'auditResult', 'auditRemark'])
    @modelNotNull('tripPlan')
    static async approveTripPlan(params: {id: string, auditResult: EAuditStatus, auditRemark?: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);
        let auditResult = params.auditResult;
        let staff = await Staff.getCurrent();

        if(auditResult != EAuditStatus.PASS && auditResult != EAuditStatus.NOT_PASS) {
            throw L.ERR.PERMISSION_DENIED(); //只能审批待审批的出差记录
        }

        if(tripPlan.status != EPlanStatus.WAIT_APPROVE) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR(); //只能审批待审批的出差记录
        }

        if(tripPlan.auditUser != staff.id) {
            throw L.ERR.PERMISSION_DENIED();
        }

        tripPlan.auditStatus = params.auditResult;
        if(params.auditRemark) {
            tripPlan.auditRemark = params.auditRemark;
        }
        await tripPlan.save();
        return true;
    }

    @clientExport
    @requireParams(['id', 'budget'])
    @modelNotNull('tripDetail')
    static async editTripDetailBudget(params: {id: string, budget: number}) {
        let user = AgencyUser.getCurrent(); //代理商用户才能修改预算
        let tripDetail = await Models.tripDetail.get(params.id);
        let tripPlan = tripDetail.tripPlan;
        tripDetail.budget = params.budget;
        tripDetail.status = EPlanStatus.WAIT_UPLOAD;
        await tripDetail.save();
        let details = await tripPlan.getTripDetails({where: {}});
        let budget = 0;

        for(let i=0; i< details.length; i++) {
            let detail = details[i];
            if(detail.budget <= 0) {
                budget = -1;
                break;
            }
            budget = budget + detail.budget;
        }

        if(budget > 0 ) {
            tripPlan.status = EPlanStatus.WAIT_UPLOAD;
        }
        tripPlan.budget = budget;
        await tripPlan.save();
        return true;
    }

    @clientExport
    @requireParams(['tripDetailId', 'pictureFileId'])
    @modelNotNull('tripDetail', 'tripDetailId')
    static async uploadInvoice(params: {tripDetailId: string, pictureFileId: string}): Promise<boolean> {
        let staff = await Staff.getCurrent();
        let accountId = staff.id;
        let tripDetail = await Models.tripDetail.get(params.tripDetailId);

        if (tripDetail.status != EPlanStatus.WAIT_UPLOAD) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let tripPlan = tripDetail.tripPlan;

        if(tripPlan.status != EPlanStatus.WAIT_UPLOAD) {
            throw {code: -3, msg: '该出差计划不能上传票据，请检查出差计划状态'};
        }

        let invoiceJson: any = tripDetail.invoice || [];
        let times = invoiceJson.length ? invoiceJson.length + 1 : 1;

        if(typeof invoiceJson =='string') {
            invoiceJson = JSON.parse(invoiceJson);
        }

        invoiceJson.push({times: times, pictureFileId: params.pictureFileId, created_at: utils.now(), status: EPlanStatus.WAIT_COMMIT, remark: '', approve_at: ''});
        tripDetail.newInvoice = params.pictureFileId;
        tripDetail.invoice = JSON.stringify(invoiceJson);
        tripDetail.status = EPlanStatus.WAIT_COMMIT;

        var details = await Models.tripDetail.find({where: {tripPlanId: tripPlan.id, status: EPlanStatus.WAIT_UPLOAD, id: {$ne: tripDetail.id}}});

        if(details || details.length == 0) {
            tripPlan.status = EPlanStatus.WAIT_COMMIT;
        }

        await Promise.all([tripPlan.save(), tripDetail.save()]);

        return true;
    }

    /**
     * 提交计划单
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('tripPlan')
    @conditionDecorator([{if: condition.isMyTripPlan('0.id')}])
    static async commitTripPlan(params: {id: string}): Promise<boolean> {
        let tripPlan = await Models.tripPlan.get(params.id);

        if(tripPlan.status != EPlanStatus.WAIT_APPROVE) {
            throw {code: -2, msg: "该出差计划不能提交，请检查状态"};
        }
        
        let tripDetails = await tripPlan.getTripDetails({where: {}});

        if(tripDetails && tripDetails.length > 0) {
            await Promise.all(tripDetails.map(async function(detail) {
                detail.status = EPlanStatus.AUDITING;
                detail.isCommit = true;
                await detail.save();
            }));
        }

        tripPlan.status = EPlanStatus.AUDITING;
        tripPlan.isCommit = true;
        await tripPlan.save();
        return true;
    }

    /**
     * 审核出差票据
     *
     * @param params
     */
    @clientExport
    @requireParams(['id', 'auditResult'])
    @modelNotNull('tripDetail')
    static async auditPlanInvoice(params: {id: string, auditResult: EAuditStatus}): Promise<boolean> {
        let tripDetail = await Models.tripDetail.get(params.id);

        if(tripDetail.status != EPlanStatus.AUDITING) {
            throw L.ERR.TRIP_PLAN_STATUS_ERR();
        }

        let audit = params.auditResult;
        let tripPlan = tripDetail.tripPlan;

        if(audit == EAuditStatus.INVOICE_PASS) {
            tripDetail.status = EPlanStatus.COMPLETE;
            let details = await tripPlan.getTripDetails({where: {id: {$ne: tripDetail.id, status: [EPlanStatus.AUDITING, EPlanStatus.AUDIT_NOT_PASS]}}}); //获取所有未经过审核的票据

            if(!details || details.length == 0 ) {
                tripPlan.status = EPlanStatus.COMPLETE;
            }
        }else if(audit == EAuditStatus.INVOICE_NOT_PASS) {
            tripDetail.status = EPlanStatus.AUDIT_NOT_PASS;
            tripPlan.status = EPlanStatus.AUDIT_NOT_PASS;
        }
        else {
            throw L.ERR.PERMISSION_DENIED(); //代理商只能审核票据权限
        }

        await Promise.all([tripPlan.save(), tripDetail.save()]);

        return true;
    }


    /**
     * 统计计划单数量
     *
     * @param params
     */
    @requireParams(['companyId'], ['accountId', 'status'])
    static countTripPlanNum(params) {
        let query = params;
        return DBM.TripPlan.count({where: query});
    }

    /**
     * 统计计划单的动态预算/计划金额和实际支出
     * @param params
     */
    @requireParams(['companyId'], ['startTime', 'endTime', 'accountId'])
    static statPlanOrderMoney(params) {
        let query = params;
        let query_complete:any = {
            companyId: query.companyId,
            status: EPlanStatus.COMPLETE,
            auditStatus: 1
        }
        let query_sql = 'select sum(budget-expenditure) as \"savedMoney\" from tripplan.trip_plan where company_id=\'' + params.companyId + '\' and status=2 and audit_status=1';
        query.status = {$gte: EPlanStatus.WAIT_COMMIT};
        let startAt:any = {};

        if (params.startTime) {
            startAt.$gte = params.startTime;
            query_sql += ' and start_at >=\'' + params.startTime + '\'';
            delete params.startTime;
        }

        if (params.endTime) {
            startAt.$lte = params.endTime;
            query_sql += ' and start_at <=\'' + params.endTime + '\'';
            delete params.endTime;
        }

        if (params.accountId) {
            query_complete.accountId = params.accountId;
            query_sql += ' and account_id=\'' + params.accountId + '\'';
        }

        query_sql += ' and budget>expenditure;';

        if (!_.isNull(startAt)) {
            query.startAt = startAt;
            query_complete.startAt = startAt;
        }

        return Promise.all([
            DBM.TripPlan.sum('budget', {where: query}),
            DBM.TripPlan.sum('budget', {where: query_complete}),
            DBM.TripPlan.sum('expenditure', {where: query_complete}),
            DBM.TripPlan.count({where: query_complete}),
            sequelize.query(query_sql)
        ])
            .spread(function (n1, n2, n3, n4, n5) {
                let savedMoney = n5[0][0].savedMoney || 0;
                return {
                    qmBudget: n1 || 0,
                    planMoney: n2 || 0,
                    expenditure: n3 || 0,
                    savedMoney: savedMoney,
                    NumOfStaff: n4 || 0
                }
            })
    }


    /**
     * @method previewConsumeInvoice 预览发票图片
     *
     * @param {Object} params
     * @param {UUID} params.tripDetailId
     * @param {UUID} params.accountId
     */
    @clientExport
    @requireParams(['tripDetailId'])
    static async previewInvoice(params: {tripDetailId: string}) :Promise<string> {
        let tripDetail = await Models.tripDetail.get(params.tripDetailId);
        if(!tripDetail) {
            throw L.ERR.TRIP_DETAIL_FOUND();
        }
        let attachment = await API.attachments.getAttachment({id: tripDetail.newInvoice});

        return "data:image/jpg;base64," + attachment.content;
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
    @requireParams(['where.companyId'], [''])
    static async getProjectList(options): Promise<FindResult> {
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
        let paginate = await Models.tripPlan.find(options);
        return {ids: paginate.map((plan) => {return plan.id;}), count: paginate["total"]}
    }

    /**

     * @method saveTripPlan
     * 生成出差计划单
     * @param params
     * @returns {Promise<TripPlan>}
     */
    @clientExport
    @requireParams(['deptCity', 'arrivalCity', 'startAt', 'title', 'budgets'], ['backAt', 'remark', 'description'])
    static async saveTripPlanByTest(params: {deptCity: string, arrivalCity: string, startAt: string, title: string,
        budgets: any[],backAt?: string, remark?: string, description?: string}): Promise<TripPlan> {
        let {accountId} = Zone.current.get('session');
        let staff = await Models.staff.get(accountId);
        let email = staff.email;
        let staffName = staff.name;
        let _tripPlan:any = _.pick(params, TripPlanCols);
        let totalPrice:number = 0;
        for(let budget of params.budgets) {
            if (budget.price < 0) {
                totalPrice = -1;
                break;
            }
            totalPrice += Number(budget.price);
        }

        let tripPlanId = uuid.v1();
        let project = await getProjectByName({companyId: staff.company.id, name: _tripPlan.title, userId: accountId, isCreate: true});

        _tripPlan.id = tripPlanId;
        _tripPlan.budget = totalPrice
        _tripPlan.status = 0;
        _tripPlan.planNo = await API.seeds.getSeedNo('TripPlanNo'); //获取出差计划单号
        _tripPlan.accountId = accountId;
        _tripPlan.companyId = staff.company.id;
        _tripPlan.projectId = project.id;

        let tripPlan = new TripPlan(await DBM.TripPlan.create(_tripPlan));

        await Promise.all(params.budgets.map(async function (detail) {
            let _detail: any = JSON.parse(JSON.stringify(detail));

            switch(detail.type) {
                case 'train':
                    _detail.invoiceType = EInvoiceType.TRAIN;
                    break;
                case 'hotel':
                    _detail.invoiceType = EInvoiceType.HOTEL;
                    break;
                case 'air':
                    _detail.invoiceType = EInvoiceType.PLANE;
                    break;
                default:
                    _detail.invoiceType = EInvoiceType.OTHER;
            }

            _detail.tripPlanId = tripPlanId;
            _detail.accountId = accountId;
            _detail.status = 0;
            _detail.budget = Number(_detail.price);
            let tripDetail = await DBM.TripDetail.create(_detail);
        }));

        let logs = {tripPlanId: tripPlanId, userId: accountId, remark: '新增计划单 ' + tripPlan.planNo, createdAt: utils.now()};
        await DBM.TripPlanLog.create(logs);

        return tripPlan;
    }

    static __initHttpApp = require('./invoice');

}

async function getProjectByName(params) {
    let projects = await Models.project.find({where: {name: params.name}});

    if(projects && projects.length > 0) {
        return projects[0]
    }else if(params.isCreate === true){
        let p = {name: params.name, createUser: params.userId, code: '', companyId: params.companyId, createdAt: utils.now()};
        return Models.project.create(p).save();
    }
}



/**
 * 从参数中获取计划详情数组
 * @param params
 * @returns {Object}
 */
function getPlanDetails(params:any):{orderStatus:EPlanStatus, budget:number, tripDetails:any} {
    let tripDetails:any = [];
    let tripDetails_required_fields = ['startTime', 'invoiceType', 'budget'];
    if(params.outTrip){
        params.outTrip.map(function (detail:any) {
            detail.type = 1;
            tripDetails.push(detail);
        });
    }

    if(params.backTrip){
        params.backTrip.map(function (detail:any) {
            detail.type = 2;
            tripDetails.push(detail);
        });
    }

    if(params.hotel){
        params.hotel.map(function (detail:any) {
            detail.type = 3;
            tripDetails.push(detail);
        });
    }

    let total_budget:number = 0;
    let isBudget = true;

    let _tripDetails = tripDetails.map(function (detail) {
        tripDetails_required_fields.forEach(function (key) {
            if (!_.has(detail, key)) {
                throw {code: '-1', msg: 'tripDetails的属性' + key + '没有指定'};
            }
        });

        if (detail.deptCity && !detail.deptCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (detail.arrivalCity && !detail.arrivaltCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (detail.city && !detail.cityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if (!/^-?\d+(\.\d{1,2})?$/.test(detail.budget)) {
            throw {code: -2, nsg: '预算金额格式不正确'};
        }

        detail.budget > 0 ? total_budget = total_budget + parseFloat(detail.budget) : isBudget = false;

        return _.pick(detail, API.tripPlan.TripDetailCols);
    });

    let orderStatus = isBudget ? EPlanStatus.WAIT_UPLOAD : EPlanStatus.NO_BUDGET; //是否有预算，设置出差计划状态

    return {orderStatus: orderStatus, budget: total_budget, tripDetails: _tripDetails};
}


export = TripPlanModule;