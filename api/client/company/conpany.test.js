/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var company = require("./index");
var companyId = '6cf36000-aa21-11e5-a377-2fe1a7dbc5e1';
var accountId = "6cee7e00-aa21-11e5-a377-2fe1a7dbc5e1";
var self = {accountId: accountId};
var orderId = '';

describe("api/client/company.js", function() {
    //it("#savePlanOrder should be ok", function(done){
    //    var companyOrder = {
    //        startPlace: '北京',
    //        destination: '上海',
    //        startAt: '2015-12-30 11:12:12',
    //        budget: '1000',
    //    }
    //    company.savePlanOrder.call(self, companyOrder, function(err, ret){
    //        if(err){
    //            throw err;
    //        }
    //        orderId = ret.id;
    //        done();
    //    })
    //})
    //
    //it("#getcompanyOrderById should be ok", function(done) {
    //    company.getcompanyOrderById.call(self, orderId, function(err, ret){
    //        if (err) {
    //            throw err;
    //        }
    //        done();
    //    })
    //});
    //
    //it("#deletecompanyOrder should be ok", function(done) {
    //    company.deletecompanyOrder.call(self, orderId, function(err, ret){
    //        if (err) {
    //            throw err;
    //        }
    //        done();
    //    })
    //});
    //
    //it("#listcompanyOrder should be ok", function(done) {
    //    company.listcompanyOrder.call(self, {}, function(err, ret){
    //        if (err) {
    //            throw err;
    //        }
    //        console.info("共列出计划单=>", ret.length);
    //        done();
    //    })
    //});

    it("#getCompanyListByAgency should be ok", function(done) {
        company.getCompanyListByAgency.call(self, function(err, ret){
            if (err) {
                throw err;
            }
            done();
        })
    });
})