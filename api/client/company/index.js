/**
 * Created by yumiao on 15-12-9.
 */

/**
 * @module API
 */

var API = require('common/api');
var Logger = require('common/logger');
var md5 = require("common/utils").md5;
var checkPermission = require('../auth').checkPermission;
var checkAgencyPermission = require('../auth').checkAgencyPermission;
var uuid = require("node-uuid");

/**
 * @class company 公司信息
 */
var company = {}


/**
 * @method createCompany
 *
 * 代理商创建企业
 *
 * @param params
 * @returns {*}
 */
company.createCompany = function(params){
    var self = this;
    var accountId = self.accountId;
    params.createUser = accountId;
    if(!params.mobile || !params.email || !params.name || !params.domain){
        throw {code: -1, msg: '参数不正确'};
    }
    if(!params.userName){
        throw {code: -2, msg: '联系人姓名不能为空'};
    }
    var mobile = params.mobile;
    var email = params.email;
    var pwd = params.pwd || md5('123456');
    var domain = params.domain;
    var companyName = params.name;
    var userName = params.userName;
    return API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
        .then(function(user){
            return user.agencyId;
        })
        .then(function(agencyId){
            params.agencyId = agencyId;
            return API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, type: 1})
        })
        .then(function(account){
            var companyId = params.companyId || uuid.v1();
            return [account, API.company.createCompany({
                    id: companyId, createUser: account.id, name: companyName, domainName: domain,
                    mobile:mobile, email: email, agencyId: params.agencyId,
                    remark: params.remark, description: params.description
                })];
        })
        .spread(function(account, company){
            return [company, API.staff.createStaff({
                accountId: account.id, companyId: company.id, email: email,
                mobile: mobile, name: userName, roleId: 0
            })];
        })
        .spread(function(company, staff){
            return company;
        });
};

/**
 * 更新企业信息(企业创建者)
 * @param params
 * @returns {*}
 */
company.updateCompany = checkPermission(["company.edit"],
    function updateCompany(params){
        var self = this;
        var accountId = self.accountId;
        params.createUser = accountId;
        return API.staff.getStaff({id: accountId, columns: ['companyId']})
            .then(function(staff){
                params.companyId = staff.companyId;
                return API.company.updateCompany(params)
            });
    });

/**
 * 获取企业信息
 * @param companyId
 * @returns {*}
 */
company.getCompanyById = function(companyId){
    var self = this;
    var params = {
        companyId: companyId,
        userId: self.accountId
    }
    return API.company.getCompany(params);
};

/**
 * 根据查询条件获取企业列表
 * @param params
 * @returns {*}
 */
company.getCompanyListByAgency = checkAgencyPermission(["company.query"],
    function(params){
        var self = this;
        var accountId = self.accountId;
        var page = params.page;
        var perPage = params.perPage;
        typeof page == 'number' ? "" : page = 1;
        typeof perPage == 'number' ? "" : perPage = 10;
        return API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
            .then(function(user){
                return API.company.pageCompany({where: {agencyId: user.agencyId}, limit: perPage, offset: perPage * (page - 1)})
            });
    });

/**
 * 删除企业信息
 * @param companyId
 * @returns {*}
 */
company.deleteCompany = checkPermission(["company.delete"],
    function(companyId){
        var self = this;
        var params = {
            companyId: companyId,
            userId: self.accountId
        };
        return API.company.deleteCompany(params);
    });

/**
 * 企业资金账户充值
 * @param params
 * @returns {*}
 */
company.fundsCharge = function(params){
    var self = this;
    params.userId = self.accountId;
    params.type = 1;
    params.remark = params.remark || '充值';
    return API.company.moneyChange(params);
}

/**
 * 冻结账户资金
 * @param params
 * @returns {*}
 */
company.frozenMoney = function(params){
    var self = this;
    params.userId = self.accountId;
    params.type = -2;
    params.channel = params.channel || '冻结';
    params.remark = params.remark || '冻结账户资金';
    return API.company.moneyChange(params);
}

/**
 * 消费企业账户余额
 * @param params
 * @returns {boolean|*|{options, src}|{src}|{files, tasks}}
 */
company.consumeMoney = function(params){
    var self = this;
    params.userId = self.accountId;
    params.type = -1;
    params.channel = params.channel || '消费';
    params.remark = params.remark || '账户余额消费';
    return API.company.moneyChange(params);
}

/**
 * 获取企业资金账户信息
 * @param companyId
 * @returns {*}
 */
company.getCompanyFundsAccount = function(companyId){
    var self = this;
    var params = {
        userId: self.accountId,
        companyId: companyId
    };
    return API.company.getCompanyFundsAccount(params);
}


module.exports = company;