/**
 * Created by wyl on 15-12-11.
 */
'use strict';
var Q = require("q");
var db = require("./models").sequelize;
var uuid = require("node-uuid");
var agencyProxy = require("./proxy/agency.proxy");
var L = require("../../common/language");
var API = require("../../common/api");
//var auth = require("../auth/index");
var agency = {};

/**
 * 创建代理商
 * @param data
 * @param callback
 * @returns {*}
 */
agency.createAgency = function(data, callback){
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
    /*if (!data.company_id) {
     defer.reject({code: -4, msg: "所属企业不能为空"});
     return defer.promise.nodeify(callback);
     }*/
    var accData = {email: data.email, mobile: data.mobile, pwd: "123456"};//初始密码暂定123456
    return API.auth.newAccount(accData)
        .then(function(acc){
            if(acc.code == 0){
                data.id = acc.data.id;
                return agencyProxy.create(data)
                    .then(function(obj){
                        return {code: 0, agency: obj};
                    })
            }
        })
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
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.auth.remove({accountId: id})
        .then(function(acc){
            if(acc.code == 0){
                return agencyProxy.deleteById(id)
                    .then(function(obj){
                        return {code: 0, msg: "删除成功"}
                    })
            }
        })
        .nodeify(callback);
}

/**
 * 更新代理商
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
agency.updateAgency = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return agencyProxy.update(id, data)
        .then(function(obj){
            return {code: 0, agency: obj, msg: "更新成功"}
        })
        .nodeify(callback);
}

/**
 * 分页查询代理商集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
agency.listAndPaginateAgency = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    return agencyProxy.listAndPaginateAgency(params, options)
        .then(function(paginate){
            return paginate;
        })
        .nodeify(callback);
}

module.exports = agency;
