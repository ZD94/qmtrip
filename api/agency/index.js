/**
 * Created by yumiao on 15-12-9.
 */
var Q = require('q');
var sequelize = require("common/model").importModel("./models");
var Agency = sequelize.models.Agency;
var uuid = require("node-uuid");
var L = require("../../common/language");
var Logger = require('../../common/logger');
var logger = new Logger("agency");
var utils = require("../../common/utils");

var agency = {};

/**
 * 创建代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.createAgency = function(params, callback){
    return checkParams(['createUser', 'name', 'email'], params)
        .then(function(){
            return Agency.create(params)
                .then(function(agency){
                    return {code: 0, msg: '', agency: agency.dataValues};
                })
        }).nodeify(callback);
}


/**
 * 更新代理商信息
 * @param params
 * @param callback
 * @returns {*}
 */
agency.updateAgency = function(params, callback){
    var defer = Q.defer();
    return checkParams(['agencyId', 'userId'], params)
        .then(function(){
            var agencyId = params.agencyId;
            var userId = params.userId;
            delete params.agencyId;
            delete params.userId;
            return Agency.findById(agencyId, {attributes: ['createUser']})
                .then(function(agency){
                    if(!agency){
                        defer.reject(L.ERR.AGENCY_NOT_EXIST);
                        return defer.promise;
                    }
                    if(agency.createUser != userId){
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    params.updateAt = utils.now();
                    var cols = getColumns(params);
                    return Agency.update(params, {returning: true, where: {id: agencyId}, fields: cols})
                        .then(function(ret){
                            logger.info("update fields=>", ret);
                            if(!ret[0] || ret[0] == "NaN"){
                                defer.reject({code: -2, msg: '更新代理商信息失败'});
                                return defer.promise;
                            }
                            var agency = ret[1][0].dataValues;
                            return {code: 0, msg: '更新代理商信息成功', agency: agency};
                        })
                })
        }).nodeify(callback);
}

/**
 * 获取代理商信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.getAgency = function(params, callback){
    return checkParams(['agencyId', 'userId'], params)
        .then(function(){
            var agencyId = params.agencyId;
            var userId = params.userId;
            return Agency.find({where: {id: agencyId}})
                .then(function(ret){
                    return {code: 0, msg: '', agency: ret.dataValues};
                })
        }).nodeify(callback);
}

/**
 * 获取代理商列表
 * @param params
 * @param callback
 * @returns {*}
 */
agency.listAgency = function(params, callback){
    return checkParams(['userId'], params)
        .then(function(){
            //var agencyId = params.agencyId;
            var userId = params.userId;
            delete params.userId;
            return Agency.findAll({where: params})
                .then(function(ret){
                    return {code: 0, msg: '', agencys: ret};
                })
        }).nodeify(callback);
}

/**
 * 删除代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.deleteAgency = function(params, callback){
    var defer = Q.defer();
    return checkParams(['agencyId', 'userId'], params)
        .then(function(){
            var agencyId = params.agencyId;
            var userId = params.userId;
            return Agency.findById(agencyId, {attributes: ['createUser']})
                .then(function(agency){
                    if(!agency){
                        defer.reject(L.ERR.AGENCY_NOT_EXIST);
                        return defer.promise;
                    }
                    if(agency.createUser != userId){
                        defer.reject(L.ERR.PERMISSION_DENY);
                        return defer.promise;
                    }
                    return Agency.destroy({where: {id: agencyId}})
                        .then(function(){
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

module.exports = agency;