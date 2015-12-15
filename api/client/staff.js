/**
 * Created by wyl on 15-12-10.
 */
'use strict';

var Q = require("q");
var staffServer = require("../staff/index");
var staffProxy = require("../staff/proxy/staff.proxy");
var API = require("../../common/api");
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

staff.createStaff = needPowersMiddleware(function(params, callback) {
    var user_id = this.accountId;
    return staffProxy.getById(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.dataValues.companyId;//此处可不可以用data.companyId
                return staffServer.createStaff(params, callback);
            }else{
                return staffServer.createStaff(params, callback);//员工注册的时候
            }
        })
        .nodeify(callback);
}, ["user.add"]);

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
    params.accountId = this.accountId;
    return staffServer.importExcel(params, callback);
}
module.exports = staff;