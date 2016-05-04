/**
 * Created by yumiao on 15-12-12.
 */
"use strict";
let API = require("common/api");
let L = require("common/language");
let Logger = require('common/logger');
let logger = new Logger('client/tripPlan');
let config = require("../../../config");

import moment = require('moment');
import _ = require('lodash');
import {validateApi} from "common/api/helper";
import {PLAN_STATUS, TripPlan, Project, ConsumeDetails} from 'api/_types/tripPlan';

/**
 * 从参数中获取计划详情数组
 * @param params
 * @returns {Object}
 */
function getPlanDetails(params: TripPlan): {orderStatus: string, budget: number, tripDetails: Object[]} {
    let tripDetails = [];
    let tripDetails_required_fields = ['startTime', 'invoiceType', 'budget'];
    params.outTraffic.map(function(detail: any) {
        detail.type = 1;
        tripDetails.push(detail);
    });

    params.backTraffic.map(function(detail: any) {
        detail.type = 2;
        tripDetails.push(detail);
    });

    params.hotel.map(function(detail: any) {
        detail.type = 3;
        tripDetails.push(detail);
    });

    let total_budget: number = 0;
    let isBudget = true;

    let _tripDetails =  tripDetails.map(function(detail) {
        tripDetails_required_fields.forEach(function(key){
            if(!_.has(detail, key)){
                throw {code: '-1', msg: 'tripDetails的属性' + key + '没有指定'};
            }
        });

        if(detail.deptCity && !detail.deptCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.arrivalCity && !detail.arrivaltCityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(detail.city && !detail.cityCode) {
            throw {code: -3, msg: '城市代码不能为空'};
        }

        if(!/^-?\d+(\.\d{1,2})?$/.test(detail.budget)) {
            throw {code: -2, nsg: '预算金额格式不正确'};
        }

        detail.budget > 0 ? total_budget = total_budget + parseFloat(detail.budget) : isBudget = false;

        return _.pick(detail, API.tripPlan.TripDetailsCols);
    });

    let orderStatus = isBudget? 'WAIT_UPLOAD' : 'NO_BUDGET'; //是否有预算，设置出差计划状态

    return {orderStatus: orderStatus, budget: total_budget, tripDetails: tripDetails};
}

/**
 * @method saveTripPlan
 * 生成出差计划单
 * @param params
 * @returns {Promise<TripPlan>}
 */
validateApi(saveTripPlan, ['arrivalCityCode', 'arrivalCity', 'startAt', 'budget', 'title'], ['deptCityCode', 'deptCity', 'backAt',
    'isNeedTraffic', 'isNeedHotel', 'remark', 'projectId', 'outTraffic', 'backTraffic', 'hotel']);
export async function saveTripPlan(params: TripPlan): Promise<TripPlan> {
    let self = this;
    let accountId = self.accountId;
    let staff = await API.staff.getStaff({id: accountId, columns: ['companyId', 'email', 'name']});
    let email = staff.email;
    let staffName = staff.name;

    params = new TripPlan(params); //测试

    let _tripPlan :any = _.pick(params, API.tripPlan.TripPlanCols);
    let {orderStatus, budget, tripDetails} = getPlanDetails(params);

    _tripPlan.tripDetails = tripDetails;
    _tripPlan.orderStatus = orderStatus;
    _tripPlan.budget = budget;
    _tripPlan.orderNo = await API.seeds.getSeedNo('tripPlanNo'); //获取出差计划单号
    _tripPlan.accountId = accountId;
    _tripPlan.companyId = staff.companyId;

    let tripPlan = await API.tripPlan.saveTripPlan(_tripPlan);

    if(tripPlan.budget <= 0 || tripPlan.orderStatus === PLAN_STATUS.NO_BUDGET) {
        return tripPlan; //没有预算，直接返回计划单
    }

    let staffs = await API.staff.findStaffs({companyId: staff.companyId, roleId: {$ne: 1}, status: {$gte: 0}, columns: ['id', 'name','email']});
    let url = config.host + '/corp.html#/TravelStatistics/planDetail?orderId=' + tripPlan.id;
    let go = '无', back = '无', hotel = '无';

    if(tripPlan.outTraffic.length > 0){
        let g = tripPlan.outTraffic[0];
        go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.deptCity + ' 到 ' + g.arrivalCity;
        if(g.latestArriveTime)
            go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
        go += ', 动态预算￥' + g.budget;
    }

    if(tripPlan.backTraffic.length > 0){
        let b = tripPlan.backTraffic[0];
        back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.deptCity + ' 到 ' + b.arrivalCity;
        if(b.latestArriveTime)
            back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
        back += ', 动态预算￥' + b.budget;
    }

    if(tripPlan.hotel.length > 0){
        let h = tripPlan.hotel[0];
        hotel = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') +
            ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;
    }

    staffs.map(async function(s) {
        let account = await API.auth.getAccount({id: s.id, type: 1, attributes: ['status']});
        if(account.status != 1)
            return false;

        let vals = {managerName: s.name, username: staffName, email: email, time: moment(tripPlan.createAt).format('YYYY-MM-DD HH:mm:ss'),
            projectName: tripPlan.description, goTrafficBudget: go, backTrafficBudget: back, hotelBudget: hotel,
            totalBudget: '￥' + tripPlan.budget, url: url, detailUrl: url};
        let log = {userId: accountId, orderId: tripPlan.id, remark: tripPlan.orderNo + '给企业管理员' + s.name + '发送邮件'};

        await API.mail.sendMailRequest({toEmails: s.email, templateName: 'qm_notify_new_travelbudget',values: vals});
        await API.tripPlan.saveTripPlanLog(log);
        return true;
    });

    return tripPlan;
}

/**
 * @method saveConsumeDetail
 * 保存消费支出明细
 * @param params
 * @returns {Promise<TripDetails>}
 */
export function saveConsumeDetail(params) {
    let self = this;
    params.accountId = self.accountId;
    return API.tripPlan.saveConsumeRecord(params);
}

/**
 * @method getTripPlanById
 * 获取计划单详情
 * @param {string} params.orderId
 * @returns {Promise<TripPlan>}
 */
validateApi(getTripPlanById, ['orderId']);
export async function getTripPlanById(params: {orderId: string}) {
    let self = this;
    let accountId = self.accountId;
    let account = await API.auth.getAccount({id: accountId});
    let accountType = account.type;
    let tripPlan = await API.tripPlan.getTripPlanOrder(params);

    if(accountType === 1) { //企业员工账户
        let staff = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
        if (tripPlan.companyId != staff.companyId) {
            throw L.ERR.PERMISSION_DENY;
        }
    }else{
        let {agencyId: agencyIdOfCompany} = await API.company.getCompany({companyId: tripPlan.companyId, columns: ['agencyId']});
        let {agencyId: agencyIdOfUser} = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
        if(agencyIdOfCompany != agencyIdOfUser) {
            throw L.ERR.PERMISSION_DENY;
        }
    }

    return tripPlan;
}

/**
 * @method pageCompleteTripPlans
 * 获取员工已完成计划单分页列表
 * @param {object} params
 * @returns {Promise<Paginate>}
 */
validateApi(pageCompleteTripPlans, [], ['page', 'perPage', 'startTime', 'endTime', 'order', 'startAt', 'backAt', 'deptCity', 
    'arrivalCity', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark']);
export async function pageCompleteTripPlans(params) {
    let self = this;
    let accountId = self.accountId;
    let page = typeof params.page == 'number' ? params.page : 1;
    let perPage = typeof params.perPage == 'number' ? params.perPage : 10;

    if(params.startTime) {
        params.startAt ? params.startAt.$gte = params.startTime:params.startAt = {$gte: params.startTime};
    }

    if(params.endTime) {
        params.startAt ? params.startAt.$lte = params.endTime:params.startAt = {$lte: params.endTime};
    }

    let query : any = _.pick(params, ['startAt', 'backAt', 'deptCity', 'arrivalCity', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark']);
    query.accountId = accountId;
    query.status = 2;
    query.auditStatus = 1;
    
    let staff = await API.staff.getStaff({id: accountId, columns: ['companyId']});
    query.companyId = staff.companyId;
    let options : any = {where: query, limit: perPage, offset: perPage * (page - 1)};

    if(params.order) {
        options.order = [params.order];
    }

    return API.tripPlan.listTripPlanOrder(options);
}


/**
 * @method pageTripPlans
 * 获取员工计划单分页列表
 * @param params
 * @returns {Promise<Paginate>}
 */
validateApi(pageTripPlans, [], ['audit', 'startTime', 'endTime', 'deptCity', 'arrivalCity',
    'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark', 'isCommit', 'isHasBudget', 'isUpload',
    'isComplete', 'description', 'page', 'perPage']);
export async function pageTripPlans(params) {
    let self = this;
    let accountId = self.accountId;
    let page = typeof params.page == 'number' ? params.page : 1;
    let perPage = typeof params.perPage == 'number' ? params.perPage : 10;

    //判断出差计划是否完成
    if (params.isComplete === false) {
        params.status = {$gte: -1, $lte: 1};
        params.auditStatus = {$ne: 1};
    }else if(params.isComplete == true) {
        params.status = 2;
        params.auditStatus = 1;
    }

    let query : any = getQueryByParams(params);
    let staff = await API.staff.getStaff({id: accountId, columns: ['companyId']});
    query.accountId = accountId;
    query.companyId = staff.companyId;
    let options : any = {where: query, limit: perPage, offset: perPage * (page - 1)};

    if(params.order) {
        options.order = [params.order];
    }

    return API.tripPlan.listTripPlanOrder(options);
}

/**
 * 未完成          params.isComplete = false;
 * 待出预算        params.isHasBudget = false;
 * 待上传票据      params.isUpload = false;
 * 票据审核中      params.audit = 'P';
 * 审核未通过      params.audit = 'N';
 * 已完成          params.isComplete = true'
 * @param params
 * @returns {object}
 */
function getQueryByParams(params) {
    //判断计划单的审核状态，设定auditStatus参数, 只有上传了票据的计划单这个参数才有效
    if(params.audit){
        let audit = params.audit;
        params.status = 1;
        if(audit == 'Y'){
            params.status = 2;
            params.auditStatus = 1;
        }else if(audit == "P"){
            params.status = 1;
            params.auditStatus = 0;
        }else if(audit == 'N'){
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }

    //判断是否上传
    if (params.isUpload === true) {
        params.status = {$gt: 0};
    } else if (params.isUpload === false) {
        params.status = 0;
        params.auditStatus = {$ne: 1}; //审核状态不能是审核通过
        params.isCommit = false; //未提交
        params.budget = {$gt: 0}; //预算大于0
    }

    if(params.isHasBudget === false) {
        params.status = -1; //状态是未出预算
        params.budget = {$lte: 0}; //预算结果小于0
    }

    let query : any = _.pick(params, ['status', 'auditStatus', 'startAt', 'backAt', 'deptCity', 'arrivalCity',
        'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'description', 'remark', 'isCommit']);

    return query;
}

/**
 * @method pageTripPlansByCompany
 * 获取员工计划单分页列表(企业)
 * @returns {Promise<Paginate>}
 */
validateApi(pageTripPlansByCompany, [], ['audit', 'startTime', 'endTime', 'deptCity', 'arrivalCity',
    'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark', 'isCommit', 'isHasBudget', 'isUpload',
    'isComplete', 'description', 'page', 'perPage', 'emailOrName']);
export function pageTripPlansByCompany(params) {
    let self = this;
    let accountId = self.accountId;
    let emailOrName = params.emailOrName;
    let page = typeof params.page == 'number' ? params.page : 1;
    let perPage = typeof params.perPage == 'number' ? params.perPage : 10;

    //判断出差计划是否完成
    if (params.isComplete === false) {
        params.status = {$gt: -1, $lte: 1};
        params.auditStatus = {$ne: 1};
    }else if(params.isComplete == true) {
        params.status = 2;
        params.auditStatus = 1;
    }

    if(params.startTime) {
        params.startAt?params.startAt.$gte = params.startTime:params.startAt = {$gte: params.startTime};
    }

    if(params.endTime) {
        params.startAt?params.startAt.$lte = params.endTime:params.startAt = {$lte: params.endTime};
    }

    let query : any = getQueryByParams(params);
    let status = query.status;
    if(status == undefined) {
        status = query.status = {};
    }
    typeof status == 'object'?query.status.$gt = -1:query.status = status;

    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            query.companyId = companyId;
            let options : any = {where: query, limit: perPage, offset: perPage * (page - 1)};

            if(params.order) {
                options.order = [params.order];
            }

            if(!emailOrName) {
                return [false, options, []];
            }

            return [true, options,
                API.staff.findStaffs({companyId: companyId,
                    $or: [{name: {$like: '%' + emailOrName +'%'}}, {email: {$like: '%' + emailOrName +'%'}}],
                    status: {$ne: -2},
                    columns: ['id']
                    })];
        })
        .spread(function(isEmailOrName, options, staffs) {
            if(staffs && staffs.length > 0) {
                let idArr = staffs.map(function(staff) {
                    return staff.id;
                });

                options.where.accountId = {$in: idArr};
            }else if(isEmailOrName) {
                return {page: 1, perPage: 20, items: []};
            }

            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * @method deleteTripPlan
 * 删除差旅计划单/预算单
 * @param params.orderId 出差计划id
 * @returns {Promise<boolean>}
 */
validateApi(deleteTripPlan, ['orderId']);
export function deleteTripPlan(params: {orderId: string}) {
    let self = this;
    params['userId'] = self.accountId;
    return API.tripPlan.deleteTripPlan(params);
}

/**
 * @method deleteConsumeDetail
 * 删除差旅消费明细
 * @param params.id
 * @returns {Promise<boolean>}
 */
validateApi(deleteConsumeDetail, ['id']);
export function deleteConsumeDetail(params: {id: string}) {
    let self = this;
    params['userId'] = self.accountId;
    return API.tripPlan.deleteConsumeDetail(params);
}

/**
 * @method uploadInvoice
 * 上传票据
 * @param params
 * @param params.consumeId 消费详情id
 * @param params.picture 新上传的票据fileId
 * @returns {Promise<boolean>}
 */
validateApi(uploadInvoice, ['consumeId', 'picture']);
export function uploadInvoice(params: {consumeId: string, picture: string}) {
    let self = this;
    params['userId'] = self.accountId;
    return API.tripPlan.uploadInvoice(params)
}

/**
 * @method countTripPlanNum
 * 根据条件统计计划单数目
 * @param params
 * @returns {Promise<object>}
 */
export async function countTripPlanNum(params) {
    let self = this;
    let accountId = self.accountId;
    let {companyId} = await API.staff.getStaff({id: accountId});
    params.companyId = companyId;
    return API.tripPlan.countTripPlanNum(params);
}

/**
 * @method statBudgetByGroup
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 * @returns {Promise<object>}
 */
export async function statBudgetByGroup(params: {startTime: string, endTime: string}) {
    let self = this;
    let {companyId} = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    let params_S = {startTime: params.startTime, endTime: params.endTime, companyId: companyId, index: 0};
    let params_Z = {startTime: params.startTime, endTime: params.endTime, companyId: companyId, index: 1};
    let params_X = {startTime: params.startTime, endTime: params.endTime, companyId: companyId, index: 2};
    let S = await API.tripPlan.statBudgetByGroup(params_S);
    let Z = await API.tripPlan.statBudgetByGroup(params_Z);
    let X = await API.tripPlan.statBudgetByGroup(params_X);

    let ret = {};
    for(let name in S) {
        ret[name] = [S[name]];
    }

    for(let name in Z) {
        if(!ret[name]){
            ret[name] = [];
        }
        ret[name].push(Z[name]);
    }
    for(let name in X) {
        if(!ret[name]){
            ret[name] = [];
        }
        ret[name].push(X[name]);
    }

    return ret;
}

/**
 * @method statBudgetByMonth
 * 按月份统计预算/计划/完成金额
 * @param params
 * @returns {Promise<object>}
 */
export async function statBudgetByMonth(params) {
    let self = this;
    let {companyId} = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    params.companyId = companyId;
    return API.tripPlan.statBudgetByMonth(params)
}

/**
 * @method statPlanOrderMoneyByCompany 统计计划单的动态预算/计划金额和实际支出
 * @param params
 * @returns {Promise<object>}
 */
export async function statPlanOrderMoneyByCompany(params: {startTime?: string, endTime?: string}) {
    let self = this;
    let {companyId} = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    params['companyId'] = companyId;
    return API.tripPlan.statPlanOrderMoney(params);
}

/**
 * @method statPlanOrderMoneyByCompany 统计计划单的动态预算/计划金额和实际支出
 * @param params
 * @returns {Promise<object>}
 */
validateApi(statPlanOrderMoney, [], ['startTime', 'endTime']);
export async function statPlanOrderMoney(params: {startTime?: string, endTime?: string}) {
    let self = this;
    let {companyId, id : accountId} = await API.staff.getStaff({id: self.accountId, columns: ['id', 'companyId']});
    params['companyId'] = companyId;
    params['accountId'] = accountId;
    return API.tripPlan.statPlanOrderMoney(params);
}

/**
 * 用户提交订单(上传完票据后，提交订单后不可修改)
 * @param orderId
 * @returns {Promise<boolean>}
 */
validateApi(commitTripPlanOrder, ['orderId']);
export function commitTripPlanOrder(params: {orderId: string}){
    let self = this;
    params['accountId'] = self.accountId;
    return API.tripPlan.commitTripPlanOrder(params);
}

/**
 * @method getConsumeInvoiceImg
 * 获取发票图片
 * @param params
 * @returns {Promise<any>}
 */
export function getConsumeInvoiceImg(params: {consumeId: string}) {
    return API.tripPlan.getConsumeInvoiceImg(params);
}

/**
 * @method statStaffsByCity
 * 统计时间段内城市内的员工数
 * @param params
 */
validateApi(statStaffsByCity, ['statTime']);
export async function statStaffsByCity(params: {statTime: string}) {
    let self = this;
    let date = params.statTime;
    let query : any = {status: {$ne: -2}, startAt: {$lte: date}, backAt: {$gte: date}};

    let {companyId} = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    let list = await API.tripPlan.findOrdersByOption({where: query, order: ['ddd', 'dd']});

    let ret = {};
    for(let i= 0,ii=list.length; i<ii; i++) {
        let order = list[i];
        let cityCode = order.arrivalCityCode;
        if(!ret[cityCode]) {
            ret[cityCode] = new Array();
        }
        ret[cityCode].push(order);
    }
    return ret;
}

/**
 * @method checkBudgetExist
 * 判断用户是否已经生成改预算
 * @param params
 * @returns {Promise<boolean>}
 */
export async function checkBudgetExist(params): Promise<boolean> {
    let self = this;
    let accountId = self.accountId;
    let {companyId} = await API.staff.getStaff({id: accountId, columns: ['companyId']});
    params.accountId = accountId;
    params.companyId = companyId;
    params.outTraffic = params.outTraffic || [];
    params.backTraffic = params.backTraffic || [];
    params.hotel = params.hotel || [];
    let {tripDetails} = getPlanDetails(params);
    params.tripDetails = tripDetails;
    return API.tripPlan.checkBudgetExist(params)
}

/**
 * @method getProjectsList
 * 获取项目名称列表
 * @param params
 * @returns {Promise<string[]>}
 */
validateApi(getProjectsList, [], ['count', 'project_name']);
export async function getProjectsList(params: {count?: number, project_name?: string}) {
    let self = this;
    let project_name = params.project_name;

    if(project_name || project_name === '') {
        params['name'] = {$like: '%' + project_name + '%'};
        delete params.project_name;
    }

    let {companyId} = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    params['companyId'] = companyId;
    let list = await API.tripPlan.getProjectList(params);

    return list.map(function(p) {
        return p.name;
    })
}
