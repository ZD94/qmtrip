/**
 * Created by yumiao on 15-12-9.
 */

/**
 * @module API
 */

var API = require('common/api');
var Logger = require('common/logger');
var checkPermission = require('../auth').checkPermission;
var logger = new Logger();

/**
 * @class company 公司信息
 */
var company = {}


/**
 * @method createCompany
 *
 * 创建企业
 *
 * @param params
 * @param callback
 * @returns {*}
 */
company.createCompany = function(params, callback){
    params.createUser = this.accountId;
    return API.company.createCompany(params, callback);
};

/**
 * 更新企业信息
 * @param params
 * @param callback
 * @returns {*}
 */
company.updateCompany = checkPermission(["company.edit"],
    function(params, callback){
        params.createUser = this.accountId;
        return staff.getCurrentStaff()
            .then(function(staff){
                params.companyId = staff.companyId;
                return API.company.updateCompany(params)
            }).nodeify(callback);
    });

/**
 * 获取企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.getCompany = function(companyId, callback){
    var params = {
        companyId: companyId,
        userId: this.accountId
    }
    return API.company.getCompany(params, callback);
};

/**
 * 根据查询条件获取企业列表
 * @param params
 * @param callback
 * @returns {*}
 */
company.getCompanyListByAgency = checkPermission(["company.query"],
    function(params, callback){
        var self = this;
        var accountId = self.accountId;
        params.userId = accountId;
        return API.agency.getAgencyUser(accountId)
            .then(function(user){
                params.agencyId = user.agencyId;
                return API.company.listCompany(params, callback);
            })
    });

/**
 * 删除企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.deleteCompany = checkPermission(["company.delete"],
    function(companyId, callback){
        var params = {
            companyId: companyId,
            userId: this.accountId
        };
        return API.company.deleteCompany(params, callback);
    });

/**
 * 企业资金账户充值
 * @param params
 * @param callback
 * @returns {*}
 */
company.fundsCharge = function(params, callback){
    params.userId = this.accountId;
    params.type = 1;
    params.remark = params.remark | '充值';
    return API.company.moneyChange(params, callback);
}

/**
 * 冻结账户资金
 * @param params
 * @param callback
 * @returns {*}
 */
company.frozenMoney = function(params, callback){
    params.userId = this.accountId;
    params.type = -2;
    params.channel = '冻结';
    return API.company.moneyChange(params, callback);
}

/**
 * 消费企业账户余额
 * @param params
 * @param callback
 * @returns {boolean|*|{options, src}|{src}|{files, tasks}}
 */
company.consumeMoney = function(params, callback){
    params.userId = this.accountId;
    params.type = -1;
    params.channel = '消费';
    return API.moneyChange.test(params, callback);
}

/**
 * 获取企业资金账户信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.getCompanyFundsAccount = function(companyId, callback){
    var params = {
        userId: this.accountId,
        companyId: companyId
    };
    return API.company.getCompanyFundsAccount(params, callback);
}

company.setPayPassword = function(params, callback){
    logger.info("设置支付密码");
}

module.exports = company;