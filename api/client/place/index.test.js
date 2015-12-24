/**
 * Created by wlh on 15/12/24.
 */

var place = require("./index");
var util = require("util")
var assert = require("assert");

describe("api/client/index.js", function() {

    it("#queryBusinessStrict should be ok", function(done) {

        place.queryBusinessDistrict({keyword: "北京"}, function(err, result) {
            if (err) {
                throw err;
            }

            var ret = util.isArray(result);
            assert.equal(ret, true);
            done();
        })
    });

    it("#queryPlace should be ok", function(done) {

        place.queryPlace({keyword: "北京"}, function(err, result) {
            if (err) {
                throw err;;
            }

            var ret = util.isArray(result);
            assert.equal(ret, true);
            done();
        })
    })
})