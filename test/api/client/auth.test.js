/**
 * Created by wlh on 15/12/9.
 */

var auth = require("../../../api/client/auth");
var authServer = require("../../../api/auth");

var assert = require("assert");

describe("api/client/auth.js", function() {

    var account = {
        email: "wanglihui.sjz@gmail.com",
        pwd: "time9818"
    }

    describe("API.auth.newAccount", function() {
        it("API.auth.newAccount should be err without email", function(done) {
            auth.newAccount(account.pwd, function(err, result) {
                assert.notEqual(null, err);
                done();
            });
        })

        it("API.auth.newAccount should be err without pwd", function(done) {
            auth.newAccount({email: account.email}, function(err, result) {
                assert.notEqual(err, null);
                done();
            });
        });

        it("API.auth.newAccount should be ok with email and pwd", function(done) {
            auth.newAccount({email: account.email, pwd: account.pwd}, function(err, result) {
                assert.equal(null, err);
                assert.equal(result.code, 0);
                assert.notEqual(result.data, null);
                assert.equal(result.data.status, 0);
                account.id = result.data.id;
                account.status = result.data.status;
                done();
            })
        });
    })

    describe("#API.auth.login", function() {
        //登录之前激活账号
        before(function(done) {
            authServer.active({accountId: account.id}, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                account.status = 1;
                done();
            });
        });

        it("should be err with uncorrect email", function(done) {
            auth.login({email: "shalabaji#qq.com", pwd: account.pwd}, function(err, result) {
                assert.notEqual(err, null);
                done();
            });
        })

        it("should be ok with correct email and pwd", function(done) {
            auth.login({email:account.email, pwd: account.pwd}, function(err, result) {
                var hasErr = false;
                if (err) {
                    hasErr = true;
                }
                assert.equal(hasErr, false);
                assert.equal(result.code, 0);
                done();
            })
        })

        after(function(done) {
            authServer.remove({accountId: account.id}, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                done();
            })
        })
    })
})