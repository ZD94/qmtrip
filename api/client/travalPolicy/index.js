/**
 * Created by wyl on 15-12-12.
 */
'use strict';

/**
 * @module API
 */
var Q = require("q");
var API = require("common/api");
/**
 * @class travelPolicy 出差标准
 */
var travalPolicy = {};

/**
 * @method createTravalPolicy
 *
 * 企业创建差旅标准
 *
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.createTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许添加该企业下的差旅标准
                return API.travalPolicy.createTravalPolicy(params, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
};

/**
 * 企业删除差旅标准
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.deleteTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许删除该企业下的差旅标准
                return API.travalPolicy.deleteTravalPolicy(params, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
};

/**
 * 企业更新差旅标准
 * @param id
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.updateTravalPolicy = function(id, params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            return API.travalPolicy.getTravalPolicy(id)
                .then(function(tp){
                    if(tp.companyId == data.companyId){
                        params.companyId = data.companyId;//只允许删除该企业下的差旅标准
                        return API.travalPolicy.updateTravalPolicy(id, params, callback);
                    }else{
                        defer.reject({code: -1, msg: '无权限'});
                        return defer.promise;
                    }
                })
        })
};

/**
 * 企业根据id查询差旅标准
 * @param id
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.getTravalPolicy = function(id, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            return API.travalPolicy.getTravalPolicy(id)
                .then(function(tp){
                    if(tp.companyId == data.companyId){
                        return {code: 0, travalPolicy: tp}
                    }else{
                        defer.reject({code: -1, msg: '无权限'});
                        return defer.promise;
                    }
                })
        })
};

/**
 * 企业分页查询差旅标准
 * @param params
 * @param options
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.listAndPaginateTravalPolicy = function(params, options, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的差旅标准
                return API.travalPolicy.listAndPaginateTravalPolicy(params, options, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
};

/**
 * 企业得到所有差旅标准
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travalPolicy.getAllTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的差旅标准
                return API.travalPolicy.getAllTravalPolicy(params, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
};
module.exports = travalPolicy;