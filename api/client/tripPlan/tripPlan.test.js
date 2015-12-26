/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");
var travelPlan = require("./index");

describe("api/client/travelPlan.js", function() {
    /*var params = {
        userId: 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6',
        consumeId: '31f1c2b0-a3d4-11e5-b95c-8f85c45278d4',
        picture: '98ebf247e94c94a1d2cd4ef343208c95'
    }

    //上传票据
    describe("API.tripPlan.uploadInvoice", function() {
        it("API.tripPlan.uploadInvoice", function(done) {
            API.client.tripPlan.uploadInvoice(params, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })*/

    /*var params = {
        userId: 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6',
        consumeId: '31f1c2b0-a3d4-11e5-b95c-8f85c45278d4',
        status: 1,
        remark: '这次看清啦啦啦~'
    }
    //审核票据
    describe("API.tripPlan.approveInvoice", function() {
        it("API.tripPlan.approveInvoice", function(done) {
            API.client.tripPlan.approveInvoice(params, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                console.log("=================================");
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })*/

    it("#listTripPlanOrder should be ok", function(done) {
        var self = {accountId: "00000000-0000-0000-1234-123400001234"};
        travelPlan.listTripPlanOrder.call(self, {}, function(err, result){
            if (err) {
                throw err;
            }
            done();
        })
    });
})