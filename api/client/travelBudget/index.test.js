/**
 * Created by wlh on 15/12/24.
 */

var travelBudget = require("./index");
var assert = require("assert");

describe("API.travelBudget", function() {

    it("#getTravelPolicyBudget should be ok", function(done) {
        travelBudget.getTravelPolicyBudget("北京", function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                result = JSON.parse(result);
            }
            var traffic = result.traffic ? true: false;
            var hotel = result.hotel ? true : false;

            assert.equal(traffic, true);
            assert.equal(hotel, true);
            done();
        })
    })
});