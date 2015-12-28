/**
 * Created by wlh on 15/12/24.
 */

var travelBudget = require("./index");
var assert = require("assert");
var moment = require("moment");

var CITY = {
    BeiJing: "CT_131",
    ShangHai: "CT_289"
};

describe("api/client/travelBudget.js", function() {
    var outboundDate = moment().add("1", "months").format("YYYY-MM-DD");
    var inboundDate = moment().add("a", "months").add("2", "days").format("YYYY-MM-DD");

    it("#getTravelPolicyBudget should be ok", function(done) {
        this.timeout(5000);
        travelBudget.getTravelPolicyBudget({originPlace: "CT_131", destinationPlace: "CT_289", outboundDate: outboundDate}, function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                result = JSON.parse(result);
            }
            console.info(result);
            var traffic = result.traffic ? true: false;
            var hotel = result.hotel ? true : false;

            assert.equal(traffic, true);
            assert.equal(hotel, true);
            done();
        })
    });

    it("#getTravelPlicyBudget should be ok with isRoundTrip=true", function(done) {

        this.timeout(5000);
        travelBudget.getTravelPolicyBudget({originPlace: CITY.BeiJing, destinationPlace: CITY.ShangHai,
            outboundDate: outboundDate, inboundDate: inboundDate, isRoundTrip: true}, function(err, result) {
            if (err) {
                throw err;
            }

            var ret = result.price > 0 ?true: false;
            assert.equals(ret, true);
            done();
        })
    })

    it("#getTravelPolicyBudget should throw error without air information", function(done) {
        this.timeout(5000);
        travelBudget.getTravelPolicyBudget({originPlace: "abcd", destinationPlace: "CT_289", outboundDate: outboundDate}, function(err, result) {
            if (err) {
                done();
            }  else {
                throw new Error("not throw error");
            }
        });
    })
});