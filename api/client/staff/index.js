/**
 * Created by wyl on 15-12-10.
 */
'use strict';

/**
 * @module API
 */

var Q = require("q");
var API = require("common/api");
var auth = require("../auth");
var Logger = require("common/logger");
var logger = new Logger("staff");
var L = require("common/language");
/**
 * @class staff 员工信息
 */
var staff = {};

/**
 * @method createStaff
 *
 * 管理员添加员工
 *
 * @type {*}
 * @return {promise}
 */
staff.createStaff = function(params, callback) {
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                var companyId = data.companyId;
                params.companyId = companyId;
                return API.staff.createStaff(params);
            }else{
                return API.staff.createStaff(params);//员工注册的时候
            }
        })
        .nodeify(callback);
}

/**
 * @method deleteStaff
 *
 * 企业删除员工
 *
 * @type {*}
 * @return {promise}
 */
staff.deleteStaff = auth.checkPermission(["user.delete"],
    function(params, callback) {
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                return API.staff.getStaff({id:params.id})
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return API.staff.deleteStaff(params);
                        }
                    })
            })
            .nodeify(callback);
    });

/**
 * @method updateStaff
 *
 * 企业修改员工
 *
 * @type {*}
 */
staff.updateStaff = auth.checkPermission(["user.edit"],//三个参数权限判断要修改
    function(params, callback) {
        var user_id = this.accountId;
        var id = params.id;
        return API.staff.getStaff({id:user_id})
            .then(function(data){
                return API.staff.getStaff({id:id})
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return API.staff.updateStaff(params);
                        }
                    })
            })
            .nodeify(callback);
    });

/**
 * @method getStaff
 *
 * 企业根据id得到员工信息
 * @type {*}
 */
staff.getStaff = auth.checkPermission(["user.query"],
    function(params, callback) {
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                return API.staff.getStaff(params)
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return {staff: target};
                        }
                    })
            })
            .nodeify(callback);
    });

/**
 * @method getCurrentStaff
 *
 * 得到当前登录员工信息
 * @param callback
 * @returns {*}
 */
staff.getCurrentStaff = function(callback){
    var self = this;
    return API.staff.getStaff({id: self.accountId}, callback);
}

/**
 * @method listAndPaginateStaff
 *
 * 企业分页查询员工列表
 * @type {*}
 */
staff.listAndPaginateStaff = auth.checkPermission(["user.query"],
    function(params, callback) {
        var user_id = this.accountId;
        return API.staff.getStaff({id:user_id})
            .then(function(data){
                params.companyId = data.companyId;
                return API.staff.listAndPaginateStaff(params);
            })
            .nodeify(callback);
    });

/**
 * @method increaseStaffPoint
 *
 * 增加员工积分
 * @type {*|Function}
 */
staff.increaseStaffPoint = API.staff.increaseStaffPoint;

/**
 * @method decreaseStaffPoint
 *
 * 减少员工积分
 * @type {*|Function}
 */
staff.decreaseStaffPoint = API.staff.decreaseStaffPoint;


/**
 * @method listAndPaginatePointChange
 *
 * 员工分页查询自己积分记录列表
 *
 * @param {object} params
 * @param {Function} callback
 * @return {promise}
 */
staff.listAndPaginatePointChange = function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id:user_id})
        .then(function(data){
            params.companyId = data.companyId;
            return API.staff.listAndPaginatePointChange(params);
        })
        .nodeify(callback);
}

/**
 * @method importExcel
 *
 * 批量导入员工
 *
 * @param {object} params
 * @param {Function} callback
 * @return {promise}
 */
staff.beforeImportExcel = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.beforeImportExcel(params, callback);
}

/**
 * 执行导入数据
 * @param params
 * @param params.addObj 导入的数据
 * @param callback
 * @returns {*}
 */
staff.importExcelAction = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.importExcelAction(params, callback);
}

/**
 * 下载数据
 * @param params
 * @param params.objAttr 需要导出的数据
 * @param callback
 * @returns {*}
 */
staff.downloadExcle = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.downloadExcle(params, callback);
}

/**
 * @method API.staff.statisticStaffs
 *
 * 统计时间段内企业员工数量（在职 入职 离职）
 *
 * @param {object} params
 * @param {String} params.companyId
 * @param {String} params.startTime
 * @param {String} params.endTime
 * @param {Function} callback
 * @return {promise} {code: 0, msg: 'success', sta: {all: 0, inNum: 0, outNum: 0};
 */
staff.statisticStaffs = function(params, callback){
    return API.staff.statisticStaffs(params, callback);
}

module.exports = staff;