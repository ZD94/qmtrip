/**
 * Created by yumiao on 15-12-9.
 */

var Q = require('q');
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var Company = Models.Company;
var FundsAccounts = Models.FundsAccounts;
var MoneyChanges = Models.MoneyChanges;
var uuid = require("node-uuid");
var L = require("common/language");
var _ = require('lodash');
var utils = require("common/utils");
var Paginate = require("common/paginate").Paginate;
var C = require("config");
var API = require("../../common/api");
var company = {};
var AGENCY_ROLE = {
    OWNER: 0,
    COMMON: 1,
    ADMIN: 2
};

company.companyCols = Object.keys(Company.attributes);

company.fundsAccountCols = Object.keys(FundsAccounts.attributes);

/**
 * 域名是否已被占用
 *
 * @param {Object} params
 * @param {String} params.domain 域名
 * @return {Promise} true|false
 */
company.domainIsExist = function(params) {
    var domain = params.domain;
    if (!domain) {
        throw {code: -1, msg: "domain not exist!"};
    }

    return Q()
    .then(function() {
        if (C.is_allow_domain_repeat) {
            return false;
        }

        return Models.Company.findOne({where: {domainName: domain}})
            .then(function(company) {
                if (company) {
                    return true;
                } else {
                    return false;
                }
            })
    })
}


/**
 * 创建企业
 * @param {Object} params
 * @param {UUID} params.createUser 创建人
 * @param {String} params.name 企业名称
 * @param {String} params.domainName 域名,邮箱后缀
 * @returns {Promise}
 */
company.createCompany = createCompany;
createCompany.required_params = ['createUser', 'name', 'domainName', 'mobile', 'email'];
createCompany.optional_params = ['id', 'agencyId', 'description', 'telephone', 'remark'];

function createCompany(params){
    var _company = params;

    if(!_company.id){
        _company.id = uuid.v1();
    }

    var funds = { id: _company.id };

    return sequelize.transaction(function(t){
        return Q.all([
            Company.create(_company, {transaction: t}),
            FundsAccounts.create(funds, {transaction: t})
        ])
    })
        .spread(function(c, f){
            return {
                id: c.id,
                status: c.status,
                name: c.name,
                mobile: c.mobile,
                email: c.email,
                createUser: c.createUser,
                balance: f.balance,
                staffReward: f.staffReward
            };
        });
}

/**
 * 是否在域名黑名单中
 *
 * @param {Object} params 参数
 * @param {String} params.domain 域名
 * @return {Promise}
 */
company.isBlackDomain = function(params) {
    var domain = params.domain;

    if (!domain) {
        throw {code: -1, msg: "域名不存在或不合法"};
    }
    domain = domain.toLowerCase();

    return Models.BlackDomain.findOne({where: {domain: domain}})
        .then(function(result) {
            if (result) {
                return true;
            }
            return false;
        });
}

/**
 * 更新企业信息
 * @param params
 * @returns {*}
 */
company.updateCompany = updateCompany;
updateCompany.required_params = ['companyId'];
updateCompany.optional_params = _.difference(_.keys(Company.attributes), ['id', 'companyNo', 'createUser', 'createAt', 'email']);

function updateCompany(params){
    var companyId = params.companyId;

    return Company.findById(companyId, {attributes: ['createUser', 'status']})
        .then(function(company){
            if(!company || company.status == -2){
                throw L.ERR.COMPANY_NOT_EXIST;
            }

            var companyId = params.companyId;
            delete params.companyId;
            params.updateAt = utils.now();

            return Company.update(params, {returning: true, where: {id: companyId}, fields: Object.keys(params)})
        })
        .spread(function(rownum, rows){
            if(!rownum || rownum == "NaN"){
                throw {code: -2, msg: '更新企业信息失败'};
            }

            return rows[0];
        });
}

/**
 * 获取企业信息
 * @param companyId
 * @returns {*}
 */
company.getCompany = getCompany;
getCompany.required_params = ['companyId'];
getCompany.optional_params = ['columns'];
function getCompany(params){
    var companyId = params.companyId;
    var options = {};

    if(params.columns){
        options.attributes = params.columns;
    }

    return Company.findById(companyId, options)
        .then(function(company){
            if(!company || company.status == -2){
                throw L.ERR.COMPANY_NOT_EXIST;
            }

            return company;
        });
}

/**
 * 获取企业列表
 * @param params
 * @returns {*}
 */
company.listCompany = listCompany;
listCompany.required_params = ['agencyId'];
listCompany.optional_params = ['columns'];
function listCompany(params){
    var query = params;
    var agencyId = query.agencyId;
    var options = {
        where: {agencyId: agencyId, status: {$ne: -2}},
        order: [['create_at', 'desc']]
    };

    if(query.columns){
        options.attributes =  query.columns;
        delete query.columns;
    }

    return Company.findAll(options);
}

/**
 * 获取企业列表
 * @param params
 * @returns {*}
 */
company.pageCompany = pageCompany;
function pageCompany(options){
    options.where.status = {$ne: -2};
    options.order = [['create_at', 'desc']];

    return Company.findAndCount(options)
        .then(function(ret){
            return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, ret.rows);
        })
}

/**
 * 得到企业代理商管理员地id
 * @type {getCompanyAgencies}
 */
company.getCompanyAgencies = getCompanyAgencies;
getCompanyAgencies.required_params = ['companyId'];
function getCompanyAgencies(params){
    var agencies = [];

    return API.company.getCompany({companyId: params.companyId})
        .then(function(company){
            return company;
        })
        .then(function(company){
            if(company && company.agencyId){
                return API.agency.getAgencyUsersId({agencyId: company.agencyId, roleId: [AGENCY_ROLE.OWNER, AGENCY_ROLE.ADMIN]})
                    .then(function(ids){
                        for(var i=0;i<ids.length;i++){
                            agencies.push(ids[i].id);
                        }
                        return agencies;
                    })
            }
            return agencies;
        })

}

/**
 * 判断某代理商是否有权限访问某企业
 * @param params
 * @param params.userId 代理商id
 * @param params.companyId 企业id
 */
company.checkAgencyCompany = checkAgencyCompany;
checkAgencyCompany.required_params = ['companyId','userId'];
function checkAgencyCompany(params){
    var userId = params.userId;
    var companyId = params.companyId;
    return Q.all([
        Company.findById(companyId, {attributes: ['agencyId', 'status']}),
        API.agency.getAgencyUser({id: userId}, {attributes: ['agencyId', 'status', 'roleId']})
    ])
        .spread(function(c, agency){
            if(!c || c.status == -2){
                throw {code:-1, msg:"企业不存在"};
            }

            if(!agency || agency.status == -2){
                throw {code:-1, msg:"代理商用户不存在"};
            }

            if(c.agencyId == agency.agencyId && (agency.roleId == AGENCY_ROLE.OWNER || agency.roleId == AGENCY_ROLE.ADMIN)){
                return true;
            }else{
                throw L.ERR.PERMISSION_DENY;
            }
        })
}


/**
 * 删除企业
 * @param params
 * @returns {*}
 */
company.deleteCompany = deleteCompany;
deleteCompany.required_params = ['companyId', 'userId'];
function deleteCompany(params){
    var companyId = params.companyId;
    var userId = params.userId;

    return Company.findById(companyId, {attributes: ['createUser']})
        .then(function(company){
            if(!company || company.status == -2){
                throw L.ERR.COMPANY_NOT_EXIST;
            }

            if(company.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }
        })
        .then(function(){
            return sequelize.transaction(function(t){
                return Q.all([
                    Company.update({status: -2, updateAt: utils.now()}, {where: {id: companyId}, fields: ['status', 'updateAt'], transaction: t}),
                    FundsAccounts.update({status: -2, updateAt: utils.now()}, {where: {id: companyId}, fields: ['status', 'updateAt'], transaction: t})
                ])
            })
        })
        .then(function(){
            return true;
        });
}

/**
 * 获取企业资金账户信息
 * @param params
 * @returns {*}
 */
company.getCompanyFundsAccount = getCompanyFundsAccount;
getCompanyFundsAccount.required_params = ['companyId'];
function getCompanyFundsAccount(params){
    var companyId = params.companyId;

    return FundsAccounts.findById(companyId, {
        attributes: ['id', 'balance', 'income', 'consume', 'frozen', 'isSetPwd','staffReward', 'status', 'createAt', 'updateAt']
    })
        .then(function(funds){
            if(!funds || funds.status == -2){
                throw {code: -4, msg: '企业资金账户不存在'};
            }

            return funds.toJSON();
        });
}

/**
 * 企业资金账户金额变动
 * @param params
 * @param params.type -2: 冻结账户资金 -1： 账户余额减少 1：账户余额增加 2：解除账户冻结金额
 * @returns {*}
 */
company.moneyChange = moneyChange;
moneyChange.required_params = ['money', 'channel', 'userId', 'type', 'companyId', 'remark'];
function moneyChange(params){
    var id = params.companyId;
    return FundsAccounts.findById(id)
        .then(function(funds){
            if(!funds || funds.status == -2){
                throw {code: -2, msg: '企业资金账户不存在'};
            }

            var id = funds.id;
            var money = params.money;
            var userId = params.userId;
            var type = params.type;
            var fundsUpdates = {
                updateAt: utils.now()
            };

            var moneyChange = {
                fundsAccountId: id,
                status: type,
                money: money,
                channel: params.channel,
                userId: userId,
                remark: params.remark
            }

            var income = funds.income;
            var frozen = funds.frozen;

            if(type == 1){
                if(money <= 0){
                    throw {code: -5, msg: '充值金额不正确'};
                }
                fundsUpdates.income = parseFloat(income) + parseFloat(money);
            }else if(type == -1){
                var consume = funds.consume;
                var balance = funds.balance;
                fundsUpdates.consume = parseFloat(consume) + parseFloat(money);
                var balance = parseFloat(balance) - parseFloat(money); //账户余额
                if(balance < 0){
                    throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
                }
            }else if(type == 2){
                if(parseFloat(frozen) < parseFloat(money)){
                    throw {code: -4, msg: '账户冻结金额不能小于解除冻结的金额'};
                }
                fundsUpdates.frozen = parseFloat(frozen) - parseFloat(money);
            }else if(type == -2){
                var balance = funds.balance;
                fundsUpdates.frozen = parseFloat(frozen) + parseFloat(money);
                balance = parseFloat(balance) - parseFloat(money); //账户余额
                if(balance < 0){
                    throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
                }
            }else{
                throw L.ERR.MONEY_STATUS_ERROR;
            }

            return sequelize.transaction(function(t){
                return Q.all([
                    FundsAccounts.update(fundsUpdates, {returning: true, where: {id: id}, fields: Object.keys(fundsUpdates), transaction: t}),
                    MoneyChanges.create(moneyChange, {transaction: t})
                ])
                .spread(function(update, create){
                    return update;
                })
            })
        })
        .spread(function(rownum, rows){
            if(rownum != 1){
                throw {code: -3, msg: '充值失败'};
            }
            return rows[0];
        });
}

/**
 * 测试用例删除企业，不在client调用
 * @param params
 * @returns {*}
 */
company.deleteCompanyByTest = function(params){
    var mobile = params.mobile;
    var email = params.email;
    return Company.findAll({where: {$or: [{mobile: mobile}, {email: email}]}})
        .then(function(companys){
            return companys.map(function(c){
                var id = c.id;

                return FundsAccounts.destroy({where: {id: id}});
            })
        })
        .then(function(){
            return Company.destroy({where: {$or: [{mobile: mobile}, {email: email}]}});
        })
        .then(function(){
            return true;
        })
}

module.exports = company;