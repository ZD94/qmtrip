/**
 * Created by wlh on 15/12/24.
 */

var API = require("@jingli/dnode-api");
var util = require("util")
var assert = require("assert");


describe("api/client/place.js", function() {

    it("#queryBusinessStrict should be ok", function(done) {

        API.client.place.queryBusinessDistrict({keyword: "国贸", code: "CT_131"}, function(err, result) {
            if (err) {
                throw err;
            }

            var ret = util.isArray(result);
            //console.info(result);
            assert.equal(ret, true);
            done();
        })
    });

    it("#queryPlace should be ok", function(done) {

        API.client.place.queryPlace({keyword: "北京"}, function(err, result) {
            if (err) {
                throw err;
            }
            //console.info(result);
            var ret = util.isArray(result);
            assert.equal(ret, true);
            done();
        })
    });

    it("#hotCities should be ok", function(done) {
        this.timeout(1 * 60 * 1000);
        API.client.place.hotCities({limit: 20}, function(err, result) {
            if (err) {
                throw err;
            }

            var ret = util.isArray(result);
            assert.equal(ret, true);
            done();
        })
    });

    it("#getCityInfo should be ok", function(done) {
        this.timeout(60 * 1000)
        API.client.place.getCityInfo({cityCode: "CT_289"}, function(err, result) {
            if (err) {
                throw err;
            }
            done();
        })
    });

    it("#getAirPortsByCity should be ok", function(done) {
        this.timeout(60*1000)
        API.client.place.getAirPortsByCity({cityCode: "CT_289"}, function(err, result) {
            if (err) {
                throw err;
            }
            done();
        })
    });
})