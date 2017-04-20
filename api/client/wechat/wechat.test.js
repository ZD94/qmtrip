/**
 * Created by wlh on 16/1/24.
 */

var API = require("@jingli/dnode-api");
var assert = require("assert");
var path = require("path");

describe.skip("api/client/wechat/index.js", function() {
    this.timeout(60 * 1000);

    var key;
    var mediaId;
    before(function(done) {
        var filepath = path.join(__dirname, "../../../public/www/img/5050.jpg");
        var type = 'image';

        API.wechat.uploadMedia({filepath: filepath, type: type}, function(err, result) {
            assert.equal(err, null);
            mediaId = result.media_id;
            done();
        });
    });

    it("#mediaId2key should be ok", function(done) {
        var self = {accountId: "12341234-1234-1234-1234-123400001234"};
        API.client.wechat.mediaId2key.call(self, {mediaId: mediaId}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.length, 32);
            key = result;
            done();
        })
    })

})