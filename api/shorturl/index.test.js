/**
 * Created by wlh on 16/1/15.
 */


var API = require('@jingli/dnode-api');
var co = require("co");
var format = require("js-format");
// var C = require("config");
var assert = require("assert");

describe("api/shorturl/index", function() {

    var shortUrl;
    var url = "http://www.baidu.com#123455";

    it("#long2short with shorttype=base64 should be ok", function(done) {
        API.shorturl.long2short({longurl: url, shortType: "base64"}, function(err, result) {
            assert.equal(err, null);
            shortUrl = result;
            done();
        })
    });

    it("#short2long with shorttype=base64 should be ok", function(done) {
        var url = "http://www.baidu.com#123455";
        API.shorturl.short2long({shorturl: shortUrl, shortType: "base64"}, function(err, result) {
            assert.equal(err, null);
            assert.equal(url, result);
            done();
        })
    });


    it("#long2short with shortType=dwz should be ok", function(done) {
        var url = "http://www.baidu.com#123455";
        API.shorturl.long2short({longurl: url, shortType: 'dwz'}, function(err, result) {
            assert.equal(err, null);
            shortUrl = result;
            done();
        });
    })

    it("#short2long with shortType=dwz should be ok", function(done) {
        var url = "http://www.baidu.com#123455";
        API.shorturl.short2long({shorturl: shortUrl, shortType: 'dwz'}, function(err, result) {
            assert.equal(err, null);
            assert.equal(url, result);
            done();
        });
    })

    it("#long2short with shortType=md5 should be ok", function(done) {
        var url = "http://localhost:4002/staff.html#/businessTravel/CreateResult?purposename=%E6%B5%8B%E8%AF%95&tra=1&liv=0&spval=CT_131&epval=CT_289&sp=%E5%8C%97%E4%BA%AC%E5%B8%82&ep=%E4%B8%8A%E6%B5%B7%E5%B8%82&st=2016-01-22&stl=&et=&etl=";
        API.shorturl.long2short({longurl: url, shortType: 'md5'}, function(err, result) {
            assert.equal(err, null);
            shortUrl = result;
            done();
        });
    })

    it("#short2long with shortType=md5 should be ok", function(done) {
        var url = "http://localhost:4002/staff.html#/businessTravel/CreateResult?purposename=%E6%B5%8B%E8%AF%95&tra=1&liv=0&spval=CT_131&epval=CT_289&sp=%E5%8C%97%E4%BA%AC%E5%B8%82&ep=%E4%B8%8A%E6%B5%B7%E5%B8%82&st=2016-01-22&stl=&et=&etl=";
        API.shorturl.short2long({shorturl: shortUrl, shortType: 'md5'}, function(err, result) {
            assert.equal(err, null);
            assert.equal(url, result);
            done();
        });
    })
})