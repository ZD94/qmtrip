/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var Q = require("q");
var db = require("./models").sequelize;
var uuid = require("node-uuid");
var staffProxy = require("./proxy/staff.proxy");
var pointChangeProxy = require("./proxy/pointChange.proxy");
var L = require("../../common/language");
var API = require("../../common/api");
//var auth = require("../auth/index");
var staff = {};

/**
 * 创建员工
 * @param data
 * @param callback
 * @returns {*}
 */
staff.createStaff = function(data, callback){
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
    if (!data.company_id) {
        defer.reject({code: -4, msg: "所属企业不能为空"});
        return defer.promise.nodeify(callback);
    }
    var accData = {email: data.email, mobile: data.mobile, pwd: "123456"};//初始密码暂定123456
    return API.auth.newAccount(accData)
        .then(function(acc){
            if(acc.code == 0){
                data.id = acc.data.id;
                return staffProxy.create(data)
                    .then(function(obj){
                        return {code: 0, staff: obj};
                    })
            }
        })
        .nodeify(callback);
}

/**
 * 删除员工
 * @param params
 * @param callback
 * @returns {*}
 */
staff.deleteStaff = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.auth.remove({accountId: id})
        .then(function(acc){
            if(acc.code == 0){
                return staffProxy.deleteById(id)
                    .then(function(obj){
                        return {code: 0, msg: "删除成功"}
                    })
            }
        })
        .nodeify(callback);
}

/**
 * 更新员工
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
staff.updateStaff = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffProxy.update(id, data)
        .then(function(obj){
            return {code: 0, staff: obj, msg: "更新成功"}
        })
        .nodeify(callback);
}

/**
 * 分页查询员工集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
staff.listAndPaginateStaff = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    return staffProxy.listAndPaginateStaff(params, options)
        .then(function(paginate){
             return paginate;
        })
        .nodeify(callback);
}

/**
 * 增加员工积分
 * @param params{id: 员工id, increasePoint: 增加分数， remark: 增加原因}
 * @param options
 * @param callback
 * @returns {*}
 */
staff.increaseStaffPoint = function(params, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    var id = params.id;
    var increasePoint = params.increasePoint;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    if(!increasePoint){
        defer.reject({code: -2, msg: "increasePoint不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffProxy.getById(id)
        .then(function(obj) {
            var pointChange = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分"};
            return db.transaction(function(t) {
                return Q.all([
                        obj.increment(['total_points','balance_points'], {by: increasePoint, transaction: t}),
                        pointChangeProxy.create(pointChange, {transaction: t})
                    ])
                    .spread(function(ret1,ret2){
                        return ret1;
                    })
            })

        })
        .nodeify(callback);
}
/**
 * 减少员工积分
 * @param params{id: 员工id, increasePoint: 减少分数， remark: 减少原因}
 * @param options
 * @param callback
 * @returns {*}
 */
staff.decreaseStaffPoint = function(params, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    var id = params.id;
    var decreasePoint = params.decreasePoint;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    if(!decreasePoint){
        defer.reject({code: -2, msg: "decreasePoint不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffProxy.getById(id)
        .then(function(obj) {
            if(obj.dataValues.balancePoints < decreasePoint){//此处从obj.dataValues用model里的属性名取才能取到
                defer.reject({code: -3, msg: "积分不足"});
                return defer.promise.nodeify(callback);
            }
            var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分"}//此处也应该用model里的属性名封装obj
            return db.transaction(function(t) {
                return Q.all([
                        obj.decrement('balance_points', {by: decreasePoint, transaction: t}),
                        pointChangeProxy.create(pointChange, {transaction: t})
                    ])
                    .spread(function(ret1,ret2){
                        return ret1;
                    })
            })

        })
        .nodeify(callback);
}

/**
 * 分页查询员工积分记录
 * @param params 查询条件 params.staff_id 员工id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
staff.listAndPaginatePointChange = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    return pointChangeProxy.listAndPaginatePointChange(params, options)
        .then(function(paginate){
            return paginate;
        })
        .nodeify(callback);
}

module.exports = staff;