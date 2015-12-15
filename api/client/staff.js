/**
 * Created by wyl on 15-12-10.
 */
'use strict';

var Q = require("q");
var staffServer = require("../staff/index");
var staffProxy = require("../staff/proxy/staff.proxy");
var API = require("../../common/api");
var staff = {};
staff.createStaff = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    staffProxy.getById(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.dataValues.companyId;//此处可不可以用data.companyId
                return staffServer.createStaff(params, callback);
            }else{
                return staffServer.createStaff(params, callback);//员工注册的时候
//                defer.reject({code: -1, msg: '无权限'});
//                return defer.promise;
            }
        })
}
staff.deleteStaff = staffServer.deleteStaff;
staff.updateStaff = staffServer.updateStaff;
staff.getStaff = staffServer.getStaff;
staff.getCurrentStaff = function(callback){
    return staffServer.getStaff(this.accountId, callback);
}
staff.listAndPaginateStaff = staffServer.listAndPaginateStaff;
staff.increaseStaffPoint = staffServer.increaseStaffPoint;
staff.decreaseStaffPoint = staffServer.decreaseStaffPoint;
staff.listAndPaginatePointChange = staffServer.listAndPaginatePointChange
staff.importExcel = function(params, callback){
//    params.accountId = this.accountId || 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6';
    params.accountId = this.accountId;
    return staffServer.importExcel(params, callback);
}
module.exports = staff;