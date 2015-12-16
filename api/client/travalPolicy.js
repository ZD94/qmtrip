/**
 * Created by wyl on 15-12-12.
 */
'use strict';

var Q = require("q");
var travalPolicyServer = require("../travalPolicy/index");
var API = require("../../common/api");
var travalPolicy = {};
travalPolicy.createTravalPolicy = function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    travalPolicyServer.getTravalPolicy(user_id)
        .then(function(data){
            if(data){
                params.companyId = data.dataValues.companyId;//此处可不可以用data.companyId
                return travalPolicyServer.createTravalPolicy(params, callback);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
}
travalPolicy.deleteTravalPolicy = travalPolicyServer.deleteTravalPolicy;
travalPolicy.updateTravalPolicy = travalPolicyServer.updateTravalPolicy;
travalPolicy.getTravalPolicy = travalPolicyServer.getTravalPolicy;
travalPolicy.listAndPaginateTravalPolicy = travalPolicyServer.listAndPaginateTravalPolicy;
travalPolicy.getAllTravalPolicy = travalPolicyServer.getAllTravalPolicy;
module.exports = travalPolicy;