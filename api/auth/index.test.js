/**
 * Created by wlh on 15/12/24.
 */

var auth = require("./index");

describe("api/auth/index.js", function() {

    var accountId;

    before(function(done) {
        auth.newAccount({mobile: "12341234123", email: "test@test.com", status: "1", pwd: "time9818", type: 1}, function(err, account) {
            if (err) {
                throw err;
            }

            accountId = account.id;
            done();
        });
    });

    after(function(done) {
        auth.remove({email: "test@test.com"}, function(err) {
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

        auth.sendResetPwdEmail({accountId: accountId, isFirstSet: true}, function(err, reuslt) {
            if (err) {
                throw err;
            }

            assert.equal(result, true);
            done();
        });
    })
})