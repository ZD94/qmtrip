/**
 * Created by wlh on 15/12/28.
 */
/**
 * Created by wlh on 15/12/28.
 */
var API = require("@jingli/dnode-api");
var assert = require("assert");

describe("api/checkcode/index.js", function() {

    var testCase = {
        mobile: "15501149644",
        ip: "127.0.0.1"
    }

    it("#getMsgCheckCode should be ok", function(done) {

        API.client.checkcode.getMsgCheckCode(testCase, function(err, result) {
            if (err) {
                throw err;
            }
            assert.equal(result.ticket?true: false, true);
            done();
        })
    })

    it("#getPicCheckCode should be ok", function(done) {
        API.client.checkcode.getPicCheckCode({}, function(err, result) {
            if (err) {
                throw err;
            }

            assert.equal(result.ticket?true: false, true);
            assert.equal(result.captcha? true: false, true);
            done();
        })
    })
})