/**
 * Created by wlh on 16/1/12.
 */
var API = require('@jingli/dnode-api');
var assert = require("assert");

describe("api/mail/index.js", function() {


    it("#sendMailRequest with template = 'qm_active_email' should be ok", function(done) {

        API.mail.sendMailRequest({
            toEmails: "lihui.wang@tulingdao.com",
            templateName: "qm_active_email",
            values: {username: "王大拿", url: "http://www.baidu.com"}
        }, function(err, result) {
            assert.equal(err, null);
            done();
        })
    })

    it("#sendMailRequest with template = 'qm_invite_join_email' should be ok", function(done) {
        API.mail.sendMailRequest({
            toEmails: "lihui.wang@tulingdao.com",
            templateName: "qm_invite_join_email",
            values: {username: "王大拿", managerName: "王希望", companyName: "test2", time: "2015-10-10", url: "http://www.baidu.com"}
        }, function(err, result) {
            assert.equal(err, null);
            done();
        })
    })

    it("#sendMailRequest with template = 'qm_reset_pwd_email' should be ok", function(done) {
        API.mail.sendMailRequest({
            toEmails: "lihui.wang@tulingdao.com",
            templateName: "qm_reset_pwd_email",
            titleValues: [],
            values: {username: "王大拿", time: "2015-10-10", email: "test3", url: "http://www.baidu.com"}
        }, function(err, result) {
            assert.equal(err, null);
            done();
        })
    })

    it("#sendMailRequest with template = 'qm_first_set_pwd_email' should be ok", function(done) {
        API.mail.sendMailRequest({
            toEmails: "lihui.wang@tulingdao.com",
            templateName: "qm_first_set_pwd_email",
            titleValues: [],
            values: {username: "王大拿", time: "test2", email: "test3", url: "http://www.baidu.com", companyName: "途灵岛"}
        }, function(err, result) {
            assert.equal(err, null);
            done();
        })
    })

    it("#sendMailRequest with template = 'qm_notify_new_travelbudget' should be ok", function(done) {
        API.mail.sendMailRequest({
            toEmails: "lihui.wang@tulingdao.com",
            templateName: "qm_notify_new_travelbudget",
            titleValues: ["王大拿"],
            values: {projectName: "测试项目", managerName: "王大拿", username: "王大拿", email: "lihui.wang@tulingdao.com", hotelBudget: "$1000", time: new Date().getFullYear()+"年"+(new Date().getMonth()+1)+"月", goTrafficBudget: "test3", backTrafficBudget: "100", totalBudget: "200", url: "#"}
        }, function(err, result) {
            assert.equal(err, null);
            done();
        })
    })

    it("#sendMailRequest with template=qm_feedback_email should be ok", function(done) {
        API.mail.sendMailRequest({
            toEmails: "yali.wang@tulingdao.com",
            templateName: "qm_feedback_email",
            values: {
                username: "王希望",
                time: "2015-10-10",
                companyName: "测试企业",
                content: "测试内容部"
            }
        }, function(err, result) {
            assert.equal(null, err);
            done();
        })
    })
})