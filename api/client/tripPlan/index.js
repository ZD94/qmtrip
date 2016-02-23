/**
 * Created by yumiao on 15-12-12.
 */
"use strict";
var API = require("common/api");
var Q = require("q");
var L = require("common/language");
var _ = require('lodash');
var moment = require('moment');
var C = require("../../../config");

var tripPlan = {};

/**
 * 生成计划单
 * @param params
 * @returns {*}
 */
tripPlan.savePlanOrder = function (params) {
    var self = this;
    var accountId = self.accountId;
    params.accountId = accountId;
    params.type = params.type | 2;
    var order = {};
    var email = "";
    var staffName = "";

    return API.staff.getStaff({id: accountId, columns: ['companyId', 'email', 'name']})
        .then(function (staff) {
            email = staff.email;
            staffName = staff.name;
            params.companyId = staff.companyId;

            return Q.all([
                API.tripPlan.savePlanOrder(params),
                API.staff.findStaffs({companyId: staff.companyId, roleId: {$ne: 1}, columns: ['id', 'name','email']})
            ])
        })
        .spread(function(_order, staffs){
            order = _order;

            if(order.budget <= 0 ) {
                return order;
            }

            var go = '无', back = '无', hotel = '无';

            if(order.outTraffic.length > 0){
                var g = order.outTraffic[0];
                go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.startPlace + ' 到 ' + g.arrivalPlace;

                if(g.latestArriveTime){
                    go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
                }

                go += ', 动态预算￥' + g.budget;
            }

            if(order.backTraffic.length > 0){
                var b = order.backTraffic[0];
                back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.startPlace + ' 到 ' + b.arrivalPlace;

                if(b.latestArriveTime){
                    back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
                }

                back += ', 动态预算￥' + b.budget;
            }

            if(order.hotel.length > 0){
                var h = order.hotel[0];
                hotel = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') +
                    ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;
            }

            var url = C.host + '/staff.html#/travelPlan/PlanDetail?planId=' + order.id;

            return staffs.map(function(s){
                return API.auth.getAccount({id: s.id, type: 1, attributes: ['status']})
                    .then(function(a){
                        if(a.status != 1){
                            return {code: 0};
                        }else{
                            var vals = {
                                managerName: s.name,
                                username: staffName,
                                email: email,
                                time: moment(order.createAt).format('YYYY-MM-DD HH:mm:ss'),
                                projectName: order.description,
                                goTrafficBudget: go,
                                backTrafficBudget: back,
                                hotelBudget: hotel,
                                totalBudget: '￥'+order.budget,
                                url: url,
                                detailUrl: url
                            }

                            return API.mail.sendMailRequest({
                                toEmails: s.email, //'miao.yu@tulingdao.com',
                                templateName: 'qm_notify_new_travelbudget',
                                values: vals
                            })
                        }
                    })
            })
        })
        .then(function(){
            return order;
        })
}

/**
 * 保存消费支出明细
 * @param params
 * @returns {*}
 */
tripPlan.saveConsumeDetail = function (params) {
    var self = this;
    params.accountId = self.accountId;
    return API.tripPlan.saveConsumeRecord(params);
}

/**
 * 获取计划单详情
 * @param orderId
 */
tripPlan.getTripPlanOrderById = function (orderId) {
    var self = this;
    var accountId = self.accountId;
    var params = {
        orderId: orderId,
        userId: accountId
    }

    return Q.all([
        API.tripPlan.getTripPlanOrder(params),
        API.staff.getStaff({id: accountId, columns: ['companyId']})
    ])
        .spread(function (order, staff) {
            if (order.companyId != staff.companyId) {
                throw L.ERR.PERMISSION_DENY;
            }

            return order;
        })
}

/**
 * 获取员工已完成计划单分页列表
 * @returns {*}
 */
tripPlan.pageCompleteTripPlanOrder = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;
    var page = params.page;
    var perPage = params.perPage;
    typeof page == 'number' ? "" : page = 1;
    typeof perPage == 'number' ? "" : perPage = 10;

    var query = _.pick(params,
        ['status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark']);
    query.accountId = self.accountId;
    query.auditStatus = 1; //审核状态为审核通过
    query.status = {$gt: 1}; //计划单状态为已完成（2），可能会有结算完毕状态（3）

    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            query.companyId = companyId;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }

            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * 获取员工计划单分页列表
 * @returns {*}
 */
tripPlan.pageTripPlanOrder = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;

    params.status = {$gte: -1};
    if (params.isUpload === true) {
        params.status = {$gt: 0}
    } else if (params.isUpload === false) {
        params.status = {$in: [-1, 0]};
    }

    if(params.audit){ //判断计划单的审核状态，设定auditStatus参数, 只有上传了票据的计划单这个参数才有效
        var audit = params.audit;
        params.status = 1;
        if(audit == 'Y'){
            params.status = {$gte: 1};
            params.auditStatus = 1;
        }else if(audit == "P"){
            params.auditStatus = 0;
        }else if(audit == 'N'){
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }

    var page = params.page;
    var perPage = params.perPage;
    typeof page == 'number' ? "" : page = 1;
    typeof perPage == 'number' ? "" : perPage = 10;

    var query = _.pick(params,
        ['status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark']);

    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            query.accountId = self.accountId;
            query.companyId = companyId;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }

            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * 获取员工计划单分页列表(企业)
 * @returns {*}
 */
tripPlan.pageTripPlanOrderByCompany = function (params) {
    if (typeof params == 'function') {
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;

    if (params.isUpload === true) {
        params.status = {$gt: 0}
    } else if (params.isUpload === false) {
        params.status = {$in: [-1, 0]};
    }

    if(params.audit){ //判断计划单的审核状态，设定auditStatus参数, 只有上传了票据的计划单这个参数才有效
        var audit = params.audit;
        params.status = 0;
        if(audit == 'Y'){
            params.status = {$gt: 1};
            params.auditStatus = 1;
        }else if(audit == "P"){
            params.status = 1;
            params.auditStatus = 0;
        }else if(audit == 'N'){
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }

    var page = params.page;
    var perPage = params.perPage;
    page = typeof page == 'number' ? page : 1;
    perPage = typeof perPage == 'number' ? perPage : 10;
    var query = _.pick(params,
        ['accountId', 'status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure']);

    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            query.companyId = companyId;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            }

            return API.tripPlan.listTripPlanOrder(options);
        })
}

/**
 * 获取差旅计划单列表(企业)
 * @param params
 * @returns {*}
 */
tripPlan.listTripPlanOrderByCompany = function (params) {
    if (!params) {
        params = {}
    }
    var self = this;
    var accountId = self.accountId;

    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function (companyId) {
            params.companyId = companyId;
            return API.tripPlan.listTripPlanOrder(params);
        });
}

/**
 * 删除差旅计划单/预算单
 * @param orderId
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function (orderId) {
    var self = this;
    var params = {
        orderId: orderId,
        userId: self.accountId
    }
    return API.tripPlan.deleteTripPlanOrder(params);
}

/**
 * 删除差旅消费明细
 * @param orderId
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function (id) {
    var params = {
        id: id,
        userId: this.accountId
    }
    return API.tripPlan.deleteConsumeDetail(params);
}

/**
 * 上传票据
 * @param params
 * @param params.consumeId 消费详情id
 * @param params.picture 新上传的票据md5key
 * @returns {*}
 */
tripPlan.uploadInvoice = function (params) {
    var self = this;
    params.userId = self.accountId;
    return API.tripPlan.uploadInvoice(params);
}

/**
 * 根据条件统计计划单数目
 * @param params
 * @returns {*}
 */
tripPlan.countTripPlanNum = function (params) {
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId})
        .then(function (staff) {
            var companyId = staff.companyId;
            params.companyId = companyId;
            return API.tripPlan.countTripPlanNum(params);
        });
}

/**
 * @method statPlanOrderMoneyByCompany 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
tripPlan.statPlanOrderMoneyByCompany = function (params) {
    var self = this;
    var params = _.pick(params, ['startTime', 'endTime']);
    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function (staff) {
            params.companyId = staff.companyId;
            return API.tripPlan.statPlanOrderMoney(params);
        })
}

tripPlan.getProjectsList = function(){
    var self = this;
    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function(staff){
            return API.tripPlan.getProjects({companyId: staff.companyId})
        })
        .then(function(list){
            return list.map(function(s){
                return s.description;
            })
        })
}

/**
 * 用户提交订单(上传完票据后，提交订单后不可修改)
 * @param orderId
 */
tripPlan.commitTripPlanOrder = function(orderId){
    if(!orderId || typeof orderId == 'function'){
        throw {code: -1, msg: '参数不正确'};
    }
    var self = this;

    return API.tripPlan.commitTripPlanOrder({orderId: orderId, accountId: self.accountId})
}

/**
 * 获取发票图片
 *
 * @param params
 */
tripPlan.getConsumeInvoiceImg = function(params) {
    var consumeId = params.consumeId;
    return API.tripPlan.getConsumeInvoiceImg({
        consumeId: consumeId
    });
}

/**
 * 统计时间段内城市内的员工数
 * @type {statStaffsByCity}
 */
tripPlan.statStaffsByCity = statStaffsByCity;
statStaffsByCity.required_params = ['statTime'];
function statStaffsByCity(params) {
    var self = this;
    var date = params.statTime;
    var query = {status: {$ne: -2}, startAt: {$lte: date}, backAt: {$gte: date}};

    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function(staff){
            query.companyId = staff.companyId;
            //query.companyId = "00000000-0000-0000-0000-000000000001";

            return API.tripPlan.findOrdersByOption({where: query, order: ['ddd', 'dd']})
        })
        .then(function(list){
            var ret = {};
            for(var i= 0,ii=list.length; i<ii; i++) {
                var order = list[i];
                var cityCode = order.destinationCode;
                if(!ret[cityCode]) {
                    ret[cityCode] = new Array();
                }
                ret[cityCode].push(order);
            }
            return ret;
        })
}

module.exports = tripPlan;