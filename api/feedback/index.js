/**
 * Created by wyl on 16-01-21.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var feedbacktModel = sequelize.models.Feedback;
var utils = require("common/utils");
var API = require("../../common/api");
var feedback = {};

/**
 * 创建部门
 * @param data
 * @param data.content  反馈内容
 * @param data.userName  反馈用户名
 * @param data.companyName  反馈企业名
 * @param data.isAnonymity  是否匿名
 * @param data.userId  反馈人id
 * @returns {*}
 */
feedback.sendFeedback = function(data){
    console.log(data);
    console.log("111111111111111111112222222222222222");
    var content = data.content;
    if(!content){
        throw {code: -1, msg:"content不能为空"};
    }
    var companyName = data.companyName;
    if(!companyName){
        throw {code: -1, msg:"companyName不能为空"};
    }
    return feedbacktModel.create(data)
        .then(function(result){
            var vals = {
                time: utils.now(),
                content: content,
                companyName: companyName,
                userName: data.userName || "匿名"
            }
            console.log(vals);
            console.log("=====================================");
            return API.mail.sendMailRequest({
                toEmails: "yali.wang@tulingdao.com",
                templateName: "qm_feedback_email",
                values: vals
            })
                .then(function() {
                    return true;
                })
                .catch(function(err){
                    console.log(err);
                    console.log(err.message);
                    console.log(err.msg);
                    console.log(err.stack);
                })
        })
}



module.exports = feedback;