/**
 * Created by wlh on 15/12/9.
 */
var assert = require("assert");
var mail = require("../../../api/mail");

describe("api/mail", function() {

    describe("mail.sendMail", function() {

        it("send ACTIVE_EMAIL should be ok", function(done) {
            mail.sendEmail("miao.yu@tulingdao.com", "ACTIVE_EMAIL", ["王大拿", "http://qmtrip.com/active-email?id=123456"], function(err, result) {
                assert.equal(null, err);
                done();
            })
        });

        it("SEND INVITE_JOIN_EMAIL should be ok", function(done) {
            mail.sendEmail("miao.yu@tulingdao.com", "INVITE_JOIN_EMAIL", ["王大拿", "齐丹", "途灵岛", "http://qmtrip.com"], function(err, result) {
                assert.equal(null, err);
                done();
            })
        })
    })
})