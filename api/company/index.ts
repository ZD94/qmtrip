/**
 * Created by yumiao on 15-12-9.
 */

let sequelize = require("common/model").importModel("./models");
let Models = sequelize.models;
let Company = Models.Company;
let FundsAccounts = Models.FundsAccounts;
let MoneyChanges = Models.MoneyChanges;
let uuid = require("node-uuid");
let L = require("common/language");
let _ = require('lodash');
let utils = require("common/utils");
let Paginate = require("common/paginate").Paginate;
let C = require("config");
let API = require("../../common/api");
// let company = {};

import {validateApi} from "common/api/helper";

let AGENCY_ROLE = {
    OWNER: 0,
    COMMON: 1,
    ADMIN: 2
};

export const companyCols = Object.keys(Company.attributes);
export const fundsAccountCols = Object.keys(FundsAccounts.attributes);

/**
 * 域名是否已被占用
 *
 * @param {Object} params
 * @param {String} params.domain 域名
 * @return {Promise} true|false
 */
export function domainIsExist(params) {
    var domain = params.domain;
    if (!domain) {
        throw {code: -1, msg: "domain not exist!"};
    }

    if (C.is_allow_domain_repeat) {
        return new Promise(function(resolve) {
            resolve(false);
        })
    }

    return Models.Company.findOne({where: {domainName: domain}})
        .then(function(company) {
            if (company) {
                return true;
            } else {
                return false;
            }
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
validateApi(createCompany, ['createUser', 'name', 'domainName', 'mobile', 'email', 'agencyId'], ['id', 'description', 'telephone', 'remark'])
export function createCompany(params){
    let _company = params;
    _company.id = _company.id || uuid.v1();
    let funds = { id: _company.id, createAt: utils.now()};

    return sequelize.transaction(function(t){
        return Promise.all([
            Company.create(_company, {transaction: t}),
            FundsAccounts.create(funds, {transaction: t})
        ])
    })
        .spread(function(c, f){
            c = c.toJSON();
            return _.assign(c, {balance: f.balance, staffReward: f.staffReward});
        });
}

/**
 * 是否在域名黑名单中
 *
 * @param {Object} params 参数
 * @param {String} params.domain 域名
 * @return {Promise}
 */
export function isBlackDomain(params) {
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
        })
}

/**
 * 更新企业信息
 * @param params
 * @returns {*}
 */
export function updateCompany(params){
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
validateApi(getCompany, ['companyId'], ['columns']);
export function getCompany(params){
    var companyId = params.companyId;
    var options : any = {};

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
validateApi(listCompany, ['agencyId'], ['columns']);
export function listCompany(params){
    var query = params;
    var agencyId = query.agencyId;
    var options : any = {
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
 * @param options
 * @returns {*}
 */
export function pageCompany(options){
    options.where.status = {$ne: -2};
    options.order = [['create_at', 'desc']];

    return Company.findAndCount(options)
        .then(function(ret){
            var items = ret.rows.map(function(c) {
                "use strict";
                return c.id;
            });
            
            return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, items);
        })
}

/**
 * 得到企业代理商管理员地id
 * @type {getCompanyAgencies}
 */
validateApi(getCompanyAgencies, ['companyId']);
export function getCompanyAgencies(params){
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
validateApi(checkAgencyCompany, ['companyId','userId']);
export function checkAgencyCompany(params){
    var userId = params.userId;
    var companyId = params.companyId;
    return Promise.all([
        Company.findById(companyId, {attributes: ['agencyId', 'status']}),
        API.agency.getAgencyUser({id: userId}, {attributes: ['agencyId', 'status', 'roleId']})
    ])
        .spread(function(c, agency){
            if(!c || c.status == -2){
                throw L.ERR.COMPANY_NOT_EXIST;
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
validateApi(deleteCompany, ['companyId', 'userId']);
export function deleteCompany(params){
    var companyId = params.companyId;
    var userId = params.userId;

    return Company.findById(companyId, {attributes: ['createUser']})
        .then(function(company){
            if(!company || company.status == -2){
                throw L.ERR.COMPANY_NOT_EXIST;
            }

            // if(company.createUser != userId){
            //     throw L.ERR.PERMISSION_DENY;
            // }
        })
        .then(function(){
            return sequelize.transaction(function(t){
                return Promise.all([
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
validateApi(getCompanyFundsAccount, ['companyId']);
export function getCompanyFundsAccount(params){
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
validateApi(moneyChange, ['money', 'channel', 'userId', 'type', 'companyId', 'remark']);
export function moneyChange(params){
    var id = params.companyId;
    return FundsAccounts.findById(id)
        .then(function(funds){
            if(!funds || funds.status == -2){
                throw {code: -2, msg: '企业资金账户不存在'};
            }

            var id = funds.id;
            var money : number = params.money;
            var userId = params.userId;
            var type = params.type;
            var fundsUpdates : any = {
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
                fundsUpdates.income = income + money;
            }else if(type == -1){
                var consume = funds.consume;
                var balance : number = funds.balance;
                fundsUpdates.consume = parseFloat(consume) + money;
                var balance : number = balance - money; //账户余额
                if(balance < 0){
                    throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
                }
            }else if(type == 2){
                if(parseFloat(frozen) < money){
                    throw {code: -4, msg: '账户冻结金额不能小于解除冻结的金额'};
                }
                fundsUpdates.frozen = parseFloat(frozen) - money;
            }else if(type == -2){
                var balance : number = funds.balance;
                fundsUpdates.frozen = parseFloat(frozen) + money;
                balance = balance - money; //账户余额
                if(balance < 0){
                    throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
                }
            }else{
                throw L.ERR.MONEY_STATUS_ERROR;
            }

            return sequelize.transaction(function(t){
                return Promise.all([
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
export function deleteCompanyByTest(params){
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