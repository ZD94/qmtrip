/**
 * Created by wyl on 11-01-22.
 */
'use strict';

/**
 * @module API
 */
var API = require("common/api");
var auth = require("../auth");
/**
 * @class feedback 意见反馈
 */
var feedback = {};

/**
 * @method sendFeedback
 *
 * 意见反馈
 * @param params
 * @param params.content //反馈内容
 * @param params.userName //姓名
 * @param params.companyName //企业名
 * @param params.isAnonymity //企业名是否匿名
 * @returns {*|Promise}
 */
feedback.sendFeedback = function(params){
    console.log("11111111111111111111111");
    var user_id = this.accountId;
    params.userId = user_id;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(!params.isAnonymity){
                params.userName = data.name;
            }
            return API.company.getCompany({companyId: data.companyId});

        })
        .then(function(company){
            params.companyName = company.name;
            console.log(params);
            return API.feedback.sendFeedback(params);
        });
}



module.exports = feedback;