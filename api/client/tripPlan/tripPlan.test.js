/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var tripPlan = require("./index");
var companyId = '6cf36000-aa21-11e5-a377-2fe1a7dbc5e1';
var accountId = "6cee7e00-aa21-11e5-a377-2fe1a7dbc5e1";
var self = {accountId: accountId};
var orderId = '';

describe("api/client/tripPlan.js", function() {

    //before(function(done) {
    //    API.auth.remove({email: testCase.email}, function(err) {
    //        if (err) {
    //            throw err;
    //        }
    //
    //        done();
    //    });
    //});
    //
    //after(function(done) {
    //    API.auth.remove({email: testCase.email}, function(err) {
    //        if (err) {
    //            throw err;
    //        }
    //        done();
    //    })
    //});
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

    describe("API.tripPlan.savePlanOrder", function() {
        it("#savePlanOrder should be ok", function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                startAt: '2015-12-30 11:12:12',
                budget: '1000',
            }
            tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                //console.info("save orderId=>", orderId);
                done();
            })
        })
    })


    describe("API.tripPlan.getTripPlanOrderById", function() {
        it("#getTripPlanOrderById should be ok", function(done) {
            //console.info("get orderId=>", orderId);
            tripPlan.getTripPlanOrderById.call(self, orderId, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    })


    describe("API.tripPlan.listTripPlanOrder", function() {
        it("#deleteTripPlanOrder should be ok", function(done) {
            tripPlan.deleteTripPlanOrder.call(self, orderId, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    })


    describe("API.tripPlan.listTripPlanOrder", function() {
        it("#listTripPlanOrder should be ok", function(done) {
            tripPlan.listTripPlanOrder.call(self, {}, function(err, ret){
                if (err) {
                    throw err;
                }
                //console.info("共列出计划单=>", ret.length);
                done();
            })
        });
    })


    describe("API.tripPlan.countTripPlanNum", function() {
        it("#countTripPlanNum should be ok", function(done) {
            tripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    })


    describe("API.tripPlan.saveConsumeDetail", function() {
        it("#saveConsumeDetail should be ok", function(done){
            var tripPlanOrder = {
                orderId: "bb9dc000-ade2-11e5-a7fa-35aeb147987c",
                type: -1,
                startTime: '2015-12-31 10:00:00',
                invoiceType: 1,
                startPlace: '北京',
                destination: '上海',
                budget: '1000',
            }
            tripPlan.saveConsumeDetail.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                done();
            })
        })
    })

})