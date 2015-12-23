/**
 * Created by yumiao on 15-12-9.
 */
var Q = require('q');
var Models = require("common/model").importModel("./models").models;
var Agency = Models.Agency;
var AgencyUser = Models.AgencyUser;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var logger = new Logger("agency");
var utils = require("common/utils");
var getColsFromParams = utils.getColsFromParams;
var API = require("common/api");
var Paginate = require("common/paginate").Paginate;
var errorHandle = require("common/errorHandle");

var agency = {};

/**
 * 创建代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.createAgency = function(params, callback){
    return checkParams(['createUser', 'name'], params)
        .then(function(){
            return Agency.create(params)
                .then(function(agency){
                    var agency = agency.toJSON();
                    return {code: 0, msg: '', agency: agency};
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
                    var cols = getColsFromParams(params);
                    return Agency.update(params, {returning: true, where: {id: agencyId}, fields: cols})
                        .then(function(ret){
                            if(!ret[0] || ret[0] == "NaN"){
                                defer.reject({code: -2, msg: '更新代理商信息失败'});
                                return defer.promise;
                            }
                            var agency = ret[1][0].toJSON();
                            return {code: 0, msg: '更新代理商信息成功', agency: agency};
                        })
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
                    if(!ret){
                        defer.reject({code: -2, msg: '没有代理商'});
                        return defer.promise;
                    }
                    return {code: 0, msg: '', agency: ret.toJSON()};
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
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
        })
        .catch(errorHandle)
        .nodeify(callback);
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


/************************** 代理商用户 **************************/

/**
 * 创建代理商
 * @param data
 * @param callback
 * @returns {*}
 */
agency.createAgencyUser = function(data, callback){
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }
    if (!data.email) {
        defer.reject({code: -1, msg: "邮箱不能为空"});
        return defer.promise.nodeify(callback);
    }
    if (!data.mobile) {
        defer.reject({code: -2, msg: "手机号不能为空"});
        return defer.promise.nodeify(callback);
    }
    if (!data.name) {
        defer.reject({code: -3, msg: "姓名不能为空"});
        return defer.promise.nodeify(callback);
    }
    var accData = {email: data.email, mobile: data.mobile, pwd: "123456"};//初始密码暂定123456
    return API.auth.newAccount(accData)
        .then(function(acc){
            if(acc.code == 0){
                data.id = acc.data.id;
                return AgencyUser.create(data)
                    .then(function(obj){
                        return {code: 0, agency: obj.toJSON()};
                    })
            }
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 删除代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.deleteAgencyUser = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.auth.remove({accountId: id})
        .then(function(acc){
            if(acc.code == 0){
                return AgencyUser.destroy({where: {id: id}})
                    .then(function(obj){
                        return {code: 0, msg: "删除成功"}
                    })
            }
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 更新代理商
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
agency.updateAgencyUser = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return AgencyUser.update(data, options)
        .then(function(obj){
            return {code: 0, agency: obj[1][0].toJSON(), msg: "更新成功"}
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 根据id查询代理商
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
agency.getAgencyUser = function(id, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return AgencyUser.findById(id)
        .then(function(obj){
            if(!obj){
                defer.reject({code: -2, msg: '用户不存在'});
                return defer.promise;
            }
            return {code: 0, agency: obj.toJSON()}
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 分页查询代理商集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
agency.listAndPaginateAgencyUser = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }

    var page, perPage, limit, offset;
    if (options.page && /^\d+$/.test(options.page)) {
        page = options.page;
    } else {
        page = 1;
    }
    if (options.perPage && /^\d+$/.test(options.perPage)) {
        perPage = options.perPage;
    } else {
        perPage = 6;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = params;
    return AgencyUser.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .catch(errorHandle)
        .nodeify(callback);
}


module.exports = agency;