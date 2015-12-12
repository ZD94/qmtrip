/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var Q = require("q");
var db = require("./models").sequelize;
var uuid = require("node-uuid");
var travalPolicyProxy = require("./proxy/travalPolicy.proxy");
var L = require("../../common/language");
var API = require("../../common/api");
var travalPolicy = {};

/**
 * 创建差旅标准
 * @param data
 * @param callback
 * @returns {*}
 */
travalPolicy.createTravalPolicy = function(data, callback){
    return checkParams(["name","planeLevel","planeDiscount","trainLevel","hotelTevel","hotelPrice","companyTd"], data)
        .then(function(){
            return travalPolicyProxy.create(data)
                .then(function(obj){
                    return {code: 0, travalPolicy: obj.dataValues};
                })
        })
        .nodeify(callback);
}

/**
 * 删除差旅标准
 * @param params
 * @param callback
 * @returns {*}
 */
travalPolicy.deleteTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyProxy.deleteById(id)
        .then(function(obj){
            return {code: 0, msg: "删除成功"}
        })
        .nodeify(callback);
}

/**
 * 更新差旅标准
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
travalPolicy.updateTravalPolicy = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyProxy.update(id, data)
        .then(function(obj){
            return {code: 0, travalPolicy: obj[1].dataValues, msg: "更新成功"}
        })
        .nodeify(callback);
}
/**
 * 根据id查询差旅标准
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
travalPolicy.getTravalPolicy = function(id, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyProxy.getById(id)
        .then(function(obj){
            return {code: 0, travalPolicy: obj.dataValues}
        })
        .nodeify(callback);
}

/**
 * 分页查询差旅标准集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
travalPolicy.listAndPaginateTravalPolicy = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    return travalPolicyProxy.listAndPaginateTravalPolicy(params, options)
        .then(function(paginate){
            return paginate;
        })
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
module.exports = travalPolicy;