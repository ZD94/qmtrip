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
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
}
staff.deleteStaff = staffServer.deleteStaff;
staff.updateStaff = staffServer.updateStaff;
staff.listAndPaginateStaff = staffServer.listAndPaginateStaff;
staff.increaseStaffPoint = staffServer.increaseStaffPoint;
staff.decreaseStaffPoint = staffServer.decreaseStaffPoint;
staff.listAndPaginatePointChange = staffServer.listAndPaginatePointChange
module.exports = staff;