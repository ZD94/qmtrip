/**
 * Created by wlh on 15/12/24.
 */

var API = require("@jingli/dnode-api");
var assert = require("assert");

describe("api/auth/index.js", function() {

    var accountId;

    before(function(done) {
        API.auth.newAccount({mobile: "12341234123", email: "test@test1231.com", status: "1", pwd: "time9818", type: 1}, function(err, account) {
            if (err) {
                throw err;
            }

            accountId = account.id;
            done();
        });
    });

    after(function(done) {
        API.auth.removeByTest({email: "test@test1231.com"}, function(err) {
            if (err) {
                throw err;
            }
            done();
        })
    })

    it("#sendResetPwdEmail should be ok", function(done) {

        if (!accountId) {
            throw new Error("not found accountId");
        }

        API.auth.sendResetPwdEmail({email: "test@test1231.com", type: 1, isFirstSet: true}, function(err, result) {
            if (err) {
                throw err;
            }

            assert.equal(result, true);
            done();
        });
    });

    it("#login should be ok", function(done) {

        API.auth.login({email: "test@test1231.com", pwd: "time9818"}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.timestamp?true: false, true);
            done();
        })
    })
})