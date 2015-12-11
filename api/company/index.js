/**
 * Created by yumiao on 15-12-9.
 */

var Q = require('q');
var Models = require("./models").sequelize.models;
var Company = Models.Company;
var uuid = require("node-uuid");
var L = require("../../common/language");
var Logger = require('../../common/logger');
var logger = new Logger("company");
var utils = require("../../common/utils");

var company = {};

/**
 * 创建企业
 * @param params
 * @param callback
 * @returns {*}
 */
company.createCompany = function(params, callback){
    return checkParams(['createUser', 'name', 'logo', 'email'], params)
        .then(function(){
            return Company.create(params)
                .then(function(company){
                    return {code: 0, msg: '', company: company.dataValues};
                })
        }).nodeify(callback);
}


/**
 * 更新企业信息
 * @param params
 * @param callback
 * @returns {*}
 */
company.updateCompany = function(params, callback){
    var defer = Q.defer();
    return checkParams(['companyId', 'userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            delete params.companyId;
            delete params.userId;
            return Company.findById(companyId, {attributes: ['createUser']}) // (['createUser'], {where: {id: companyId}})
                .then(function(company){
                    if(!company){
                        defer.reject(L.ERR.COMPANY_NOT_EXIST);
                        return defer.promise;
                    }
                    if(company.createUser != userId){
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    params.updateAt = utils.now();
                    var cols = getColumns(params);
                    return Company.update(params, {returning: true, where: {id: companyId}, fields: cols})
                        .then(function(ret){
                            logger.info("update fields=>", ret);
                            if(!ret[0] || ret[0] == "NaN"){
                                defer.reject({code: -2, msg: '更新企业信息失败'});
                                return defer.promise;
                            }
                            var company = ret[1][0].dataValues;
                            return {code: 0, msg: '更新企业信息成功', company: company};
                        })
                })
        }).nodeify(callback);
}

/**
 * 获取企业信息
 * @param companyId
 * @param callback
 * @returns {*}
 */
company.getCompany = function(params, callback){
    return checkParams(['companyId', 'userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            return Company.find({where: {id: companyId}})
                .then(function(ret){
                    return {code: 0, msg: '', company: ret.dataValues};
                })
        }).nodeify(callback);
}

/**
 * 获取企业列表
 * @param params
 * @param callback
 * @returns {*}
 */
company.listCompany = function(params, callback){
    return checkParams(['userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            delete params.userId;
            return Company.findAll({where: params})
                .then(function(ret){
                    return {code: 0, msg: '', company: ret};
                })
        }).nodeify(callback);
}

/**
 * 删除企业
 * @param params
 * @param callback
 * @returns {*}
 */
company.deleteCompany = function(params, callback){
    var defer = Q.defer();
    return checkParams(['companyId', 'userId'], params)
        .then(function(){
            var companyId = params.companyId;
            var userId = params.userId;
            return Company.findById(companyId, {attributes: ['createUser']})
                .then(function(company){
                    if(!company){
                        defer.reject(L.ERR.COMPANY_NOT_EXIST);
                        return defer.promise;
                    }
                    if(company.createUser != userId){
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    return Company.destroy({where: {id: companyId}})
                        .then(function(ret){
                            return {code: 0, msg: '删除成功'};
                        })
                })
        }).nodeify(callback);
}

/**
 * 获取json params中的columns
 * @param params
 */
function getColumns(params){
    var cols = new Array();
    for(var s in params){
        cols.push(s)
    }
    return cols;
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