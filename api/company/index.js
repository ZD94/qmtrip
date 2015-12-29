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
var Logger = require('common/logger');
var logger = new Logger("company");
var utils = require("common/utils");
var getColsFromParams = utils.getColsFromParams;
var errorHandle = require("common/errorHandle");

var company = {};

/**
 * 创建企业
 * @param {Object} params
 * @param {UUID} params.createUser 创建人
 * @param {String} params.name 企业名称
 * @param {String} params.domainName 域名,邮箱后缀
 * @param {Function} callback
 * @returns {Promise}
 */
company.createCompany = function(params, callback){
    return checkParams(['createUser', 'name', 'domainName'], params)
        .then(function(){
            if(!params.id){
                params.id = uuid.v1();
            }
            var funds = { id: params.id };
            return sequelize.transaction(function(t){
                return Q.all([
                    Company.create(params, {transaction: t}),
                    FundsAccounts.create(funds, {transaction: t})
                ])
                    .spread(function(company, funds){
                        return company;
                    });
            })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 是否在域名黑名单中
 *
 * @param {Object} params 参数
 * @param {String} params.domain 域名
 * @param {Function} callback 可选回调函数
 * @return {Promise}
 */
company.checkBlackDomain = function(params, callback) {
    var domain = params.domain;
    var defer = Q.defer();
    if (!domain) {
        defer.reject({code: -1, msg: "域名不存在或不合法"});
        return defer.promise.nodeify(callback);
    }

    return Models.BlackDomain.findOne({where: {domain: domain}})
        .then(function(result) {
            if (result) {
                throw {code: -1, msg: "域名不能使用"}
            }
            return true;
        })
        .nodeify(callback);
}

/**
 * 更新企业信息
 * @param params
 * @param callback
 * @returns {*}
 */
company.updateCompany = function(params, callback){
    return checkParams(['companyId'], params)
        .then(function(){
            var companyId = params.companyId;
            return Company.findById(companyId, {attributes: ['createUser']});
        })
        .then(function(company){
            if(!company){
                throw L.ERR.COMPANY_NOT_EXIST;
            }
            var companyId = params.companyId;
            delete params.companyId;
            params.updateAt = utils.now();
            var cols = getColsFromParams(params);
            return Company.update(params, {returning: true, where: {id: companyId}, fields: cols})
        })
        .spread(function(rownum, rows){
            if(!rownum || rownum == "NaN"){
                throw {code: -2, msg: '更新企业信息失败'};
            }
            return rows[0];
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 获取企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.getCompany = function(params, callback){
    return checkParams(['companyId'], params)
        .then(function(){
            var companyId = params.companyId;
            return Company.findById(companyId);
        })
        .then(function(company){
            if(!company){
                throw L.ERR.NOT_FOUND;
            }
            return company;
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 获取企业列表
 * @param params
 * @param callback
 * @returns {*}
 */
company.listCompany = function(params, callback){
    return checkParams(['agencyId'], params)
        .then(function(){
            return Company.findAll({where: params})
                .then(function(companys){
                    return companys;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 删除企业
 * @param params
 * @param callback
 * @returns {*}
 */
company.deleteCompany = function(params, callback){
    return checkParams(['companyId', 'userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            return Company.findById(companyId, {attributes: ['createUser']})
                .then(function(company){
                    if(!company){
                        throw L.ERR.COMPANY_NOT_EXIST;
                    }
                    if(company.createUser != userId){
                        throw L.ERR.PERMISSION_DENY;
                    }
                    return Company.destroy({where: {id: companyId}})
                        .then(function(ret){
                            return {code: 0, msg: '删除成功'};
                        })
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 获取企业资金账户信息
 * @param params
 * @param callback
 * @returns {*}
 */
company.getCompanyFundsAccount = function(params, callback){
    return checkParams(['companyId', 'userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            return FundsAccounts.findById(companyId, {attributes: ['id', 'balance', 'income', 'consume', 'frozen', 'isSetPwd','staffReward', 'status', 'createAt', 'updateAt']})  //{attributes: ['id', 'balance', 'income', 'consume', 'frozen', 'isSetPwd','staffReward', 'status', 'createAt', 'updateAt']}
                .then(function(ret){
                    logger.info(ret);
                    return ret;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 企业资金账户金额变动
 * @param params
 * @param params.type -2: 冻结账户资金 -1： 账户余额减少 1：账户余额增加 2：解除账户冻结金额
 * @param callback
 * @returns {*}
 */
company.moneyChange = function(params, callback){
    return checkParams(['money', 'channel', 'userId', 'type', 'companyId', 'remark'], params)
        .then(function() {
            var id = params.companyId;
            return FundsAccounts.findById(id);
        })
        .then(function(funds){
            if(!funds){
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
                var cols = getColsFromParams(fundsUpdates);
                return Q.all([
                    FundsAccounts.update(fundsUpdates, {returning: true, where: {id: id}, fields: cols, transaction: t}),
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
        })
        .catch(errorHandle)
        .nodeify(callback);
}


function checkParams(checkArray, params, callback){
    var defer = Q.defer();
    ///检查参数是否存在
    for(var key in checkArray){
        var name = checkArray[key];
        if(!params[name] && params[name] !== false && params[name] !== 0){
            defer.reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            return defer.promise.nodeify(callback);
        }
    }
    defer.resolve({code: 0});
    return defer.promise.nodeify(callback);
}

module.exports = company;