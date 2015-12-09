/**
 * Created by wlh on 15/12/9.
 */

var auth = require("../../../api/client/auth");
var assert = require("assert");

describe("api/client/auth.js", function() {

    describe("API.auth.newAccount", function() {
        it("API.auth.newAccount should be err without email", function(done) {
            auth.newAccount({pwd: "time9818"}, function(err, result) {
                assert.notEqual(err, null);
                done();
            });
        })

        it("API.auth.newAccount should be err without pwd", function(done) {
            auth.newAccount({email: "wanglihui.sjz@gmail.com"}, function(err, result) {
                assert.notEqual(err, null);
                done();
            });
        });

        it("API.auth.newAccount should be ok with email and pwd", function(done) {
            auth.newAccount({email: "wanglihui.sjz@gamil.com", pwd: "time9818"}, function(err, result) {
                assert.equal(null, err);
                assert.equal(result.code, 0);
                assert.notEqual(result.data, null);
                done();
            })
        });
    })

    describe("API.auth.login", function() {
        it("should be err with uncorrect email", function(done) {
            auth.login({email: "wangdana@tulingdao.com", pwd: "time9818"}, function(err, result) {
                assert.notEqual(null, err);
                done();
            });
        })

        it("should be ok with correct email and pwd", function(done) {
            auth.login({email: "wanglihui.sjz@gmail.com", pwd: "time9818"}, function(err, result) {
                assert.equal(null, err);
                assert.equal(result.code, 0);
                done();
            })
        })
    })
})