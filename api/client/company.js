/**
 * Created by yumiao on 15-12-9.
 */

var API = require('../../common/api');
var Logger = require('../../common/logger');
var needPowersMiddleware = require('./auth').needPowersMiddleware;
var logger = new Logger();

var company = {}


/**
 * 创建企业
 * @param params
 * @param callback
 * @returns {*}
 */
company.createCompany = function(params, callback){
    logger.info("createCompany=>\n", params);
    params.createUser = this.accountId;
    return API.company.createCompany(params, callback);
};

/**
 * 更新企业信息
 * @param params
 * @param callback
 * @returns {*}
 */
company.updateCompany = needPowersMiddleware(function(params, callback){
    params.createUser = this.accountId;
    return API.company.updateCompany(params, callback);
}, ["company.edit"]);

/**
 * 获取企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.getCompany = needPowersMiddleware(function(companyId, callback){
    var params = {
        companyId: companyId,
        userId: this.accountId
    }
    return API.company.getCompany(params, callback);
}, ["company.query"]);

/**
 * 根据查询条件获取企业列表
 * @param params
 * @param callback
 * @returns {*}
 */
company.listCompany = needPowersMiddleware(function(params, callback){
    params.userId = this.accountId;
    return API.company.listCompany(params, callback);
}, ["company.query"])

/**
 * 删除企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.deleteCompany = needPowersMiddleware(function(companyId, callback){
    var params = {
        companyId: companyId,
        userId: this.accountId
    };
    return API.company.deleteCompany(params, callback);
}, ["company.delete"]);

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

module.exports = company;