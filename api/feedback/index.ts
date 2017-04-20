/**
 * Created by wyl on 16-01-21.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var feedbacktModel = sequelize.models.Feedback;
var utils = require("common/utils");
var API = require("@jingli/dnode-api");

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
class FeedBackModule {
    static sendFeedback(data) {
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
                    time: new Date(),
                    content: content,
                    companyName: companyName,
                    username: data.userName || "匿名"
                }
                return API.notify.submitNotify({
                    email: 'bd@tulingdao.com',
                    key: 'qm_feedback',
                    values: vals
                });
            })
    }
}

export= FeedBackModule;