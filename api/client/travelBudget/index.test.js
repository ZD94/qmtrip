/**
 * Created by wlh on 15/12/24.
 */

var travelBudget = require("./index");
var auth = require("../auth/index");
var assert = require("assert");
var moment = require("moment");

var Q = require("q");
var pg_promise = require('pg-promise');
//var pgp = pg_promise({ promiseLib: Q});
//var config = require("config");

var CITY = {
    BeiJing: "CT_131",
    ShangHai: "CT_289"
};

//注册企业
//创建差旅标准
//使用差旅标准
//获取差旅预算

describe("api/client/travelBudget.js", function() {

    before(function(done) {
        //var db = pgp(config.postgres.url);
        //var queries = [];
        //queries.push("INSERT INTO auth.staff() values()");
        //queries.push("INSERT INTO company.company");
        //queries.push("INSERT INTO travelpolicy.travel_policy");
        //queries.push("UPDATE auth.staff SET travel_level=");
        done();
    });


    after(function(done) {
        done();
    });
    var self = {"accountId": "e31dc0a0-b358-11e5-bac8-cb0726cc8453"};

    var outboundDate = moment().add("1", "months").format("YYYY-MM-DD");
    var inboundDate = moment().add("1", "months").add("2", "days").format("YYYY-MM-DD");

    it("#getHotelBudget should be ok", function(done) {
        travelBudget.getHotelBudget.call(self, {cityId: "CT_131", checkInDate: outboundDate, checkOutDate: inboundDate}, function(err, result) {
            //console.info(result);
            if (err) {
                throw err;
            }

            var price = result.price ? true: false;
            assert.equal(price, true);
            done();
        })
    })

    it("#getTravelPolicyBudget should be ok", function(done) {
        //this.timeout(5000);
        travelBudget.getTravelPolicyBudget.call(self, {originPlace: "CT_131", destinationPlace: "CT_289",
            outboundDate: outboundDate, inboundDate: inboundDate}, function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                try{
                    result = JSON.parse(result);
                } catch(err) {
                    throw err;
                }
            }
            var traffic = result.traffic ? true: false;
            var hotel = result.hotel ? true : false;

            assert.equal(traffic, true);
            assert.equal(hotel, true);
            done();
        })
    });

    it("#getTravelPlicyBudget should be ok with isRoundTrip=true", function(done) {

        //this.timeout(5000);
        travelBudget.getTravelPolicyBudget.call(self, {originPlace: CITY.BeiJing, destinationPlace: CITY.ShangHai,
            outboundDate: outboundDate, inboundDate: inboundDate, isRoundTrip: true}, function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                try{
                    result = JSON.parse(result);
                } catch(err) {
                    throw err;
                }
            }
            console.info("=========>")
            console.info(result);
            console.info(result.price);
            var ret = result.price > 0 ?true: false;
            assert.equal(ret, true);
            done();
        })
    })

    it("#getTravelPolicyBudget should throw error without air information", function(done) {
        //this.timeout(5000);
        travelBudget.getTravelPolicyBudget.call(self, {originPlace: "abcd", destinationPlace: "CT_289", outboundDate: outboundDate, inboundDate: inboundDate}, function(err, result) {
            if (err) {
                done();
            }  else {
                throw new Error("not throw error");
            }
        });
    })


    it("#getTraiffic should be ok", function(done) {
        travelBudget.getTrafficBudget.call(self, {originPlace: "CT_131", destinationPlace: "CT_289",
            outboundDate: outboundDate, inboundDate: inboundDate}, function(err, result) {
            if (err) {
                throw err;
            }

            assert.equal(result.price ? true: false, true);
            done();
        })
    })
});