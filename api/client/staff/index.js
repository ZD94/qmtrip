/**
 * Created by wyl on 15-12-10.
 */
'use strict';

var Q = require("q");
var API = require("common/api");
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
    return API.staff.getStaff(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.toJSON().companyId;
                return API.staff.createStaff(params, callback);
            }else{
                return API.staff.createStaff(params, callback);//员工注册的时候
            }
        })
        .nodeify(callback);
}, ["user.add"]);

staff.deleteStaff = API.staff.deleteStaff;
staff.updateStaff = API.staff.updateStaff;
staff.getStaff = API.staff.getStaff;
staff.getCurrentStaff = function(callback){
    return API.staff.getStaff(this.accountId, callback);
}
staff.listAndPaginateStaff = API.staff.listAndPaginateStaff;
staff.increaseStaffPoint = API.staff.increaseStaffPoint;
staff.decreaseStaffPoint = API.staff.decreaseStaffPoint;
staff.listAndPaginatePointChange = API.staff.listAndPaginatePointChange
staff.importExcel = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.importExcel(params, callback);
}
module.exports = staff;