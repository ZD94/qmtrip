/**
 * Created by wyl on 15-12-12.
 */
'use strict';

var Q = require("q");
var API = require("common/api");
var travalPolicy = {};
travalPolicy.createTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    API.travalPolicy.getTravalPolicy(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.dataValues.companyId;//此处可不可以用data.companyId
                return API.travalPolicy.createTravalPolicy(params, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
}
travalPolicy.deleteTravalPolicy = API.travalPolicy.deleteTravalPolicy;
travalPolicy.updateTravalPolicy = API.travalPolicy.updateTravalPolicy;
travalPolicy.getTravalPolicy = API.travalPolicy.getTravalPolicy;
travalPolicy.listAndPaginateTravalPolicy = API.travalPolicy.listAndPaginateTravalPolicy;
travalPolicy.getAllTravalPolicy = API.travalPolicy.getAllTravalPolicy;
module.exports = travalPolicy;