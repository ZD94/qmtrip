/**
 * Created by yumiao on 15-12-12.
 */

var API = require("common/api");
var Q = require("q");
var Logger = require('common/logger');
var L = require("common/language");

var agencyTripPlan = {};


/**
 * 获取计划单详情
 * @param orderId
 * @param callback
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
 * 获取差旅计划单列表
 * @param params
 * @param callback
 * @returns {*}
 */
agencyTripPlan.listAllTripPlanOrder = function(callback){
    var self = this;
    var accountId = self.accountId;
    var params = {
        userId: accountId
    }
    return API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
        .then(function(user){
            return user.agencyId;
        })
        .then(function(agencyId){
            params.agencyId = agencyId;
            return API.company.listCompany(params)
        })
        .then(function(companys){
            var companyIdList = companys.map(function(company){
                return company.id;
            });
            params.companyId = {$in: companyIdList};
            return API.tripPlan.listTripPlanOrder(params);
        })
        .nodeify(callback);
}


/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params。consumeId 审核消费单id
 * @param params.userId 用户id
 * @param callback
 * @returns {*|*|Promise}
 */
agencyTripPlan.approveInvoice = function(params){
    var self = this;
    var user_id = self.accountId;
    params.userId = user_id;
    params.remark = params.remark || '审核票据';
    var consumeId = params.consumeId;
    return API.tripPlan.getConsumeDetail({consumeId: consumeId, userId: user_id})
        .then(function(consumeDetail){
            if(!consumeDetail.accountId){
                throw {code: -6, msg: '消费记录异常'};
            }
            return consumeDetail.accountId;
        })
        .then(function(staffId){
            return API.staff.getStaff({id: staffId, columns: ['companyId']})
        })
        .then(function(staff){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
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
};


/**
 * 代理商统计计划单数目(根据企业id和员工id,员工id为空的时候查询企业所有员工的数据)
 * @param params
 * @param callback
 * @returns {*}
 */
agencyTripPlan.countTripPlanNum = function(params, callback){
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
        })
    .nodeify(callback);
}

module.exports = agencyTripPlan;