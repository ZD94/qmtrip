/**
 * Created by yumiao on 15-12-12.
 */

var API = require("common/api");
var Q = require("q");
var L = require("common/language");
var _ = require('lodash');
var checkAgencyPermission = require('../auth').checkAgencyPermission;
var C = require("../../../config");
var moment = require("moment");

var agencyTripPlan = {};


/**
 * 获取计划单详情
 * @param orderId
 */
agencyTripPlan.getTripPlanOrderById = function(orderId){
    var self = this;
    var params = {
        orderId: orderId,
        userId: self.accountId
    };

    var accountId = self.accountId;
    return Q.all([
        API.tripPlan.getTripPlanOrder(params),
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
    ])
    .spread(function(order, user){
            var companyId = order.companyId;
            return API.company.getCompany({companyId: companyId, columns: ['agencyId']})
            .then(function(company){
                    if(company.agencyId != user.agencyId){
                        throw L.ERR.PERMISSION_DENY;
                    }
                    return order;
                })
        })
}


/**
 * 代理商获取员工计划单分页列表
 * @returns {*}
 */
agencyTripPlan.pageTripPlanOrder = function(params){
    if(typeof params == 'function'){
        throw {code: -2, msg: '参数不正确'};
    }
    var self = this;
    var accountId = self.accountId;

    /* status -2:删除状态，不对外显示 -1:失效状态 0:待上传状态 1:已上传待审核状态 2:审核完成状态 */
    if (params.isUpload === true) {
        params.status = {$gt: 0};
    } else if (params.isUpload === false) {
        params.status = 0;
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

    var query = _.pick(params,
        ['companyId', 'accountId', 'status', 'auditStatus', 'startAt', 'backAt', 'startPlace', 'destination', 'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure']);

    return API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
        .then(function(user){
            return user.agencyId;
        })
        .then(function(agencyId){
            return API.company.listCompany({agencyId:agencyId});
        })
        .then(function(companys){
            var companyIdList = companys.map(function(company){
                return company.id;
            });
            if(query.companyId){
                if(companyIdList.indexOf(query.companyId) == -1)
                    throw L.ERR.PERMISSION_DENY;
            } else {
                query.companyId = {$in: companyIdList};
            }
            var page = params.page;
            var perPage = params.perPage;
            page = typeof(page) == 'number'?page:1;
            perPage = typeof(perPage) == 'number'?perPage:10;
            var options = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            };
            return API.tripPlan.listTripPlanOrder(options);
        })
}


/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params。consumeId 审核消费单id
 * @param params.userId 用户id
 * @returns {*|*|Promise}
 */
agencyTripPlan.approveInvoice = checkAgencyPermission("tripPlan.approveInvoice",
    function(params){
        var self = this;
        var user_id = self.accountId;
        params.userId = user_id;
        params.remark = params.remark || '审核票据';
        var consumeId = params.consumeId;
        var orderId = "";
        var staffId = "";
        var staffEmail = "";
        var staffName = "";
        var invoiceName = "";
        var expenditure = '0';
        var _startTime = "";
        return API.tripPlan.getConsumeDetail({consumeId: consumeId})
            .then(function(consumeDetail){
                if(!consumeDetail.accountId){
                    throw {code: -6, msg: '消费记录异常'};
                }
                orderId = consumeDetail.orderId;
                if(consumeDetail.type === -1){
                    invoiceName = '去程交通票据'
                }else if(consumeDetail.type === 0){
                    invoiceName = '酒店发票';
                }else if(consumeDetail === 1){
                    invoiceName = '回程交通票据';
                }
                expenditure = '￥' + params.expenditure;
                _startTime = consumeDetail.startTime;
                return consumeDetail.accountId;
            })
            .then(function(_staffId){
                staffId = _staffId;
                return API.staff.getStaff({id: staffId, columns: ['companyId', 'name', 'email']})
            })
            .then(function(staff){
                if(!staff.companyId){
                    throw {msg:"该员工不存在或员工所在企业不存在"};
                }
                staffName = staff.name;
                staffEmail = staff.email;
                return Q.all([
                    API.company.getCompany({companyId: staff.companyId, columns: ['agencyId']}),
                    API.agency.getAgencyUser({id: user_id, columns: ['agencyId']})
                ])
            })
            .spread(function(company, user){
                if(!company.agencyId){
                    throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                }
                if(company.agencyId != user.agencyId){
                    throw L.ERR.PERMISSION_DENY;
                }
                return API.tripPlan.approveInvoice(params);
            })
            .then(function(isSuccess){
                //判断审核操作是否完成，完成则执行后续操作
                if(!isSuccess){
                    return isSuccess;
                }
                return API.tripPlan.getTripPlanOrder({orderId: orderId, columns: ['status', 'score', 'budget', 'expenditure', 'description', 'startAt']});
            })
            .then(function(ret){
                //判断ret类型，如果是Boolean则直接返回
                if(typeof ret == 'Boolean'){
                    return ret;
                }
                var order = ret;
                if(typeof ret.toJSON == 'function'){
                    order = order.toJSON();
                }
                var go = '无', back = '无', hotel = '无';
                if(order.outTraffic.length > 0){
                    var g = order.outTraffic[0];
                    go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.startPlace + ' 到 ' + g.arrivalPlace;
                    if(g.latestArriveTime){
                        go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
                    }
                    go += ', 动态预算￥' + g.budget;
                    if(g.expenditure){
                        go += ',实际支出￥' + g.expenditure;
                    }
                }
                if(order.backTraffic.length > 0){
                    var b = order.backTraffic[0];
                    back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.startPlace + ' 到 ' + b.arrivalPlace;
                    if(b.latestArriveTime){
                        back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
                    }
                    back += ', 动态预算￥' + b.budget;
                    if(b.expenditure){
                        back += ',实际支出￥' + b.expenditure;
                    }
                }
                if(order.hotel.length > 0){
                    var h = order.hotel[0];
                    hotel = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') + ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;
                    if(h.expenditure){
                        hotel += ',实际支出￥' + h.expenditure;
                    }
                }
                var orderTime = ret.startAt;
                if(!orderTime){ orderTime = _startTime}
                orderTime = moment(orderTime).format('YYYY-MM-DD');
                var url = C.host + '/staff.html#/travelPlan/PlanDetail?planId=' + order.id;
                //审核完成后给用户发送邮件
                if(params.status == -1){ //审核不通过
                    var vals = {
                        username: staffName,
                        email: staffEmail,
                        ticket: invoiceName,
                        goTrafficBudget: go,
                        backTrafficBudget: back,
                        hotelBudget: hotel,
                        totalBudget: '全麦预算￥'+order.budget,
                        url: url,
                        reason: params.remark,
                        projectName: ret.description
                    }
                    API.mail.sendMailRequest({
                        toEmails: staffEmail,
                        templateName: "qm_notify_invoice_not_pass",
                        values: vals
                    })
                }
                //"%s,您好<br/>您有1张%s票据被审核通过，实际支出为%s，关联出差记录如下：<br/>项目名称:%s<br/>出差时间：%s<br/>去程交通:%s<br/>回程交通:%s<br/>住宿:%s<br/>总计：%s<br/><a href="%s">点击此处查看出差详情</a>"
                if(params.status == 1){
                    var vals = {
                        username: staffName,
                        ticket: invoiceName,
                        consume: expenditure,
                        projectName:ret.description,
                        time: orderTime,
                        goTrafficBudget: go,
                        backTrafficBudget: back,
                        hotelBudget: hotel,
                        totalBudget: '全麦预算￥'+order.budget,
                        url: url
                    }
                    API.mail.sendMailRequest({
                        toEmails: staffEmail,
                        templateName: "qm_notify_invoice_one_pass",
                        titleValues: [],
                        values: vals
                    })
                }
                if(ret.status == 2){
                    var s = order.budget - order.expenditure;
                    if(s <0){s = 0;}
                    var _score = order.score;
                    if(_score> 0 ){ _score += '积分已发放到您的积分账户'; }
                    var total = '全麦预算￥' + order.budget + ',实际支出￥' + order.expenditure + ',节省￥' + s;
                    var vals = {
                        username: staffName,
                        time: orderTime,
                        projectName: ret.description,
                        goTrafficBudget: go,
                        backTrafficBudget: back,
                        hotelBudget: hotel,
                        totalBudget: total,
                        score: _score,
                        url: url
                    }
                    API.mail.sendMailRequest({
                        toEmails: staffEmail,
                        templateName: "qm_notify_invoice_all_pass",
                        titleValues: [],
                        values: vals
                    })
                }
                if(ret.status != 2 || ret.score == 0){ //status == 2 是审核通过的状态，通过后要给企业用户增加积分操作，积分为0时不需要此操作
                    return true;
                }
                return API.staff.increaseStaffPoint({id: staffId, accountId: user_id, increasePoint: ret.score})
            })
            .then(function(){
                return true;
            })
    });

/**
 * 代理商统计计划单数目(根据企业id和员工id,员工id为空的时候查询企业所有员工的数据)
 * @param params
 * @returns {*}
 */
agencyTripPlan.countTripPlanNum = function(params){
    var self = this;
    var accountId = self.accountId; //代理商用户Id
    if(!params.companyId){
        throw {code: -1, msg: 'companyId不能为空'};
    }
    var companyId = params.companyId;
    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['id', 'agencyId']}),
        API.company.getCompany({companyId: companyId, columns: ['agencyId']})
    ])
        .spread(function(user, company){
            if(user.agencyId != company.agencyId){
                throw {code: -2, msg: '没有权限'};
            }
        })
        .then(function(ret){
            return API.tripPlan.countTripPlanNum(params);
        });
}

/**
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
agencyTripPlan.statPlanOrderMoneyByAgency = function (params) {
    var self = this;
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    var companyId = params.companyId;
    var params = _.pick(params, ['companyId', 'startTime', 'endTime']);
    return Q.all([
        API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']}),
        API.company.getCompany({companyId: companyId, columns: ['agencyId']})
    ])
        .spread(function(u, c){
            if(u.agencyId != c.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }
            params.companyId = companyId;
            return API.tripPlan.statPlanOrderMoney(params);
        })
}

module.exports = agencyTripPlan;