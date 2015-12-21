/**
 * Created by wyl on 15-12-10.
 */
'use strict';

/**
 * @module API
 */

var Q = require("q");
var API = require("common/api");
/**
 * @class staff 员工信息
 */
var staff = {};

function needPowersMiddleware(fn, needPowers) {
    return function(params, callback) {
        var self = this;
        var accountId = self.accountId;
        return API.power.checkPower({accountId: accountId, powers: needPowers})
            .then(function(result) {
                if (result.code) {
                    throw result;
                }
                return fn.apply(self, params);
            })
            .nodeify(callback);
    }
}

/**
 * @method createStaff
 *
 * 管理员添加员工
 *
 * @type {*}
 */
staff.createStaff = needPowersMiddleware(function(params, callback) {
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.companyId;
                return API.staff.createStaff(params, callback);
            }else{
                return API.staff.createStaff(params, callback);//员工注册的时候
            }
        })
        .nodeify(callback);
}, ["user.add"]);

/**
 * 企业删除员工
 * @type {*}
 */
staff.deleteStaff = needPowersMiddleware(function(params, callback) {
    var user_id = this.accountId;
    var defer = Q.defer();
    if(!params.id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.staff.getStaff(user_id)
        .then(function(data){
            return API.staff.getStaff(params.id)
                .then(function(target){
                    if(data.companyId != target.companyId){
                        defer.reject({code: -1, msg: "无权限"});
                        return defer.promise.nodeify(callback);
                    }else{
                        return API.staff.deleteStaff(params, callback);
                    }
                })
        })
        .nodeify(callback);
}, ["user.delete"]);

/**
 * 企业修改员工
 * @type {*}
 */
staff.updateStaff = needPowersMiddleware(function(id, params, callback) {
    var user_id = this.accountId;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.staff.getStaff(user_id)
        .then(function(data){
            return API.staff.getStaff(id)
                .then(function(target){
                    if(data.companyId != target.companyId){
                        defer.reject({code: -1, msg: "无权限"});
                        return defer.promise.nodeify(callback);
                    }else{
                        return API.staff.updateStaff(id, params, callback);
                    }
                })
        })
        .nodeify(callback);
}, ["user.edit"]);

/**
 * 企业根据id得到员工信息
 * @type {*}
 */
staff.getStaff = needPowersMiddleware(function(id, params, callback) {
    var user_id = this.accountId;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.staff.getStaff(user_id)
        .then(function(data){
            return API.staff.getStaff(id)
                .then(function(target){
                    if(data.companyId != target.companyId){
                        defer.reject({code: -1, msg: "无权限"});
                        return defer.promise.nodeify(callback);
                    }else{
                        return {staff: target};
                    }
                })
        })
        .nodeify(callback);
}, ["user.query"]);

/**
 * 得到当前登录员工信息
 * @param callback
 * @returns {*}
 */
staff.getCurrentStaff = function(callback){
    return API.staff.getStaff(this.accountId, callback);
}

/**
 * 企业分页查询员工列表
 * @type {*}
 */
staff.listAndPaginateStaff = needPowersMiddleware(function(params, options, callback) {
    var user_id = this.accountId;
    return API.staff.getStaff(user_id)
        .then(function(data){
            params.companyId = data.companyId;
            return API.staff.listAndPaginateStaff(params, options, callback);
        })
        .nodeify(callback);
}, ["user.query"]);

/**
 * 增加员工积分
 * @type {*|Function}
 */
staff.increaseStaffPoint = API.staff.increaseStaffPoint;

/**
 * 减少员工积分
 * @type {*|Function}
 */
staff.decreaseStaffPoint = API.staff.decreaseStaffPoint;

/**
 * 员工分页查询自己积分记录列表
 * @param params
 * @param options
 * @param callback
 * @returns {*}
 */
staff.listAndPaginatePointChange = function(params, options, callback){
    return API.staff.getStaff(user_id)
        .then(function(data){
            params.companyId = data.companyId;
            return API.staff.listAndPaginatePointChange(params, options, callback);
        })
        .nodeify(callback);
}

/**
 * 批量导入员工
 * @param params
 * @param callback
 * @returns {*}
 */
staff.importExcel = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.importExcel(params, callback);
}

/**
 * 统计企业内员工数据
 * @param params
 * @param callback
 * @returns {*}
 */
staff.statisticStaffs = function(params, callback){
    return API.staff.statisticStaffs(params, callback);
}

module.exports = staff;