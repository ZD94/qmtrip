/**
 * Created by wlh on 15/12/9.
 */
var API = require('common/api');
var assert = require("assert");

describe.skip("api/client/auth/index.js", function() {

    var testCase = {
        companyName: "测试公司",
        name: "测试名字",
        email: "register.test@gmailxxoo.com",
        pwd: "time9818",
        status: 1,
        mobile: "15501149655",
        msgTicket: "test",
        msgCode: "test",
        picTicket: "test",
        picCode: "test"
    }

    describe("#registryCompany", function() {
        before(function(done) {
            API.auth.remove({email: testCase.email}, function(err) {
                if (err) {
                    throw err;
                }

                done();
            });
        });

        after(function(done) {
            API.auth.remove({email: testCase.email}, function(err) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#registryCompany should be ok", function(done) {
            API.client.auth.registryCompany(testCase, function(err, result) {
                if (err) {
                    throw err;
                }
                assert.equal(result, true);
                done();
            })
        })
    })
})