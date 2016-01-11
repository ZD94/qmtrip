/**
 * Created by wlh on 15/12/24.
 */

var API = require("common/api");
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
})