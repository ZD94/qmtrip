/**
 * Created by yumiao on 15-12-12.
 */

var API = require("common/api");
var Q = require("q");
var Logger = require('common/logger');

var tripPlan = {};

/**
 * 生成计划单
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.savePlanOrder = function(params, callback){
    var self = this;
    var accountId = self.accountId;
    params.accountId = accountId;
    params.type = params.type | 2;
    return API.staff.getStaff({id: accountId, columns: ['companyId']})
        .then(function(staff){
            params.companyId = staff.companyId;
            return API.tripPlan.savePlanOrder(params, callback);
        })
}

/**
 * 保存消费支出明细
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.saveConsumeDetail = function(params, callback){
    params.accountId = this.accountId;
    return API.tripPlan.saveConsumeRecord(params, callback);
}

/**
 * 获取计划单详情
 * @param orderId
 * @param callback
 */
tripPlan.getTripPlanOrderById = function(orderId, callback){
    var params = {
        orderId: orderId,
        userId: this.accountId
    }
    return API.tripPlan.getTripPlanOrder(params, callback);
}

/**
 * 获取差旅计划单列表(员工)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrder = function(query, callback){
    var accountId = this.accountId;
    query.accountId = accountId;
    var params = {
        userId: accountId,
        query: query
    }
    return API.tripPlan.listTripPlanOrder(params, callback);
}

/**
 * 获取差旅计划单列表(企业)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.listTripPlanOrderByCompany = function(query, callback){
    query.companyId = this.companyId; //test
    var params = {
        userId: this.accountId,
        query: query
    }
    return API.tripPlan.listTripPlanOrder(params, callback);
}

/**
 * 删除差旅计划单/预算单
 * @param orderId
 * @param callback
 * @returns {*}
 */
tripPlan.deleteTripPlanOrder = function(orderId, callback){
    var self = this;
    var params = {
        orderId: orderId,
        userId: self.accountId
    }
    return API.tripPlan.deleteTripPlanOrder(params, callback);
}

/**
 * 删除差旅消费明细
 * @param orderId
 * @param callback
 * @returns {*}
 */
tripPlan.deleteConsumeDetail = function(id, callback){
    var params = {
        id: id,
        userId: this.accountId
    }
    return API.tripPlan.deleteConsumeDetail(params, callback);
}

/**
 * 上传票据
 * @param params
 * @param params.userId 用户id
 * @param params.consumeId 消费详情id
 * @param params.picture 新上传的票据md5key
 * @param callback
 * @returns {*}
 */
tripPlan.uploadInvoice = function(params, callback){
    params.userId = this.accountId;
    return API.tripPlan.uploadInvoice(params, callback);
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
tripPlan.approveInvoice = function(params, callback){
    params.userId = this.accountId;
    var consumeId = params.consumeId;
    return API.tripPlan.getConsumeDetail({consumeId: consumeId})
        .then(function(consumeDetail){
            if(consumeDetail && consumeDetail.accountId){
                return consumeDetail.accountId;
            }
        })
        .then(function(accountId){
            return API.staff.getStaff({id:accountId})
                .then(function(result){
                    if(result && result.companyId){
                        return result.companyId;
                    }else{
                        throw {msg:"该员工不存在或员工所在企业不存在"};
                    }
                })
        })
        .then(function(companyId){
            return API.company.getCompany({companyId: companyId})
                .then(function(company){
                    if(company && company.agencyId){
                        return company.agencyId;
                    }else{
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                })
        })
        .then(function(agencyId){
            if(agencyId == this.accountId){
                return API.tripPlan.approveInvoice(params);
            }else{
                throw {msg:"无权限"};
            }
        })
        .nodeify(callback);
};

/**
 * 根据条件统计计划单数目
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.countTripPlanNum = function(params, callback){
    var self = this;
    var accountId = self.accountId;
    return API.staff.getStaff({id: accountId})
        .then(function(staff){
            var companyId = staff.companyId;
            params.companyId = companyId;
            return API.tripPlan.countTripPlanNum(params, callback);
        });
}

/**
 * 代理商统计计划单数目(根据企业id和员工id,员工id为空的时候查询企业所有员工的数据)
 * @param params
 * @param callback
 * @returns {*}
 */
tripPlan.countTripPlanNumByAgency = function(params, callback){
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
        .then(function(){
            return API.tripPlan.countTripPlanNum(params, callback);
        })
}

module.exports = tripPlan;