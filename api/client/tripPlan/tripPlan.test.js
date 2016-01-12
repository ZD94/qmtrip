/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');
"use strict";
var assert = require("assert");
var Q = require("q");
var uuid = require("node-uuid");
var API = require("common/api");

describe("api/client/tripPlan.js", function() {

    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";
    var orderId = "";

    var agency = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        description: '计划单测试用代理商'
    };

    var company = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        domain: 'tulingdao.com',
        description: '计划单测试用企业'
    }

    before(function(done){
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
        ])
            .spread(function(ret1, ret2, ret3){
                assert.equal(ret1.code, 0);
                assert.equal(ret2.code, 0);
                assert.equal(ret3.code, 0);
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(ret){
                companyId = ret.company.id;
                staffId = ret.company.createUser;
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    })


    after(function(done) {
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
        ])
            .spread(function(ret1, ret2, ret3){
                assert.equal(ret1.code, 0);
                assert.equal(ret2.code, 0);
                assert.equal(ret3.code, 0);
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
    });

    describe("savePlanOrder", function(){
        after(function(done){
            API.tripPlan.deleteTripPlanOrder({orderId: orderId, userId: staffId}, function(err, ret){
                if(err){
                    throw err;
                }
                assert.equal(ret.code, 0);
                done();
            })
        })

        it("#savePlanOrder should be ok", function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
            }
            tripPlanOrder.consumeDetails = [{
                startTime: '2016-12-30 11:11:11',
                budget: 300,
                invoiceType: 2,
                type: 0
            }]
            var self = {accountId: staffId};
            API.client.tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                assert.equal(ret.status, 0);
                done();
            })
        })
    })

    describe("deleteTripPlanOrder", function(){
        var newOrderId = "";
        before(function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
                consumeDetails: [{
                    startTime: '2016-12-30 11:11:11',
                    budget: 300,
                    invoiceType: 2,
                    type: 0
                }]
            }
            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                newOrderId = ret.id;
                done();
            })
        });

        it("#deleteTripPlanOrder should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.deleteTripPlanOrder.call(self, newOrderId, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret.code, 0);
                done();
            })
        });
    })


    describe("options based on tripPlanOrder created", function() {
        var newOrderId = "";
        before(function (done) {
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
                consumeDetails: [{
                    startTime: '2016-12-30 11:11:11',
                    budget: 300,
                    invoiceType: 2,
                    type: 0
                }]
            }
            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder, function (err, ret) {
                if (err) {
                    throw err;
                }
                newOrderId = ret.id;
                done();
            })
        });

        after(function (done) {
            API.tripPlan.deleteTripPlanOrder({orderId: newOrderId, userId: staffId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.code, 0);
                done();
            })
        })


        it("#getTripPlanOrderById should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanOrderById.call(self, newOrderId, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, newOrderId);
                done();
            })
        });

        it("#pageCompleteTripPlanOrder should be error without params", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageCompleteTripPlanOrder.call(self, function (err, ret) {
                assert.equal(err.code, -2);
                assert.equal(ret, null);
                done();
            })
        });

        it("#pageCompleteTripPlanOrder should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageCompleteTripPlanOrder.call(self, {page: 1}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });

        it("#pageTripPlanOrder should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlanOrder.call(self, {page: 1}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });


        it("#pageTripPlanOrder should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlanOrder.call(self, {page: 1, isUpload: false, audit: 'Y'}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });

        it("#pageTripPlanOrderByCompany should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlanOrderByCompany.call(self, {page: 1, isUpload: false}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                done();
            })
        });


        it("#countTripPlanNum should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.countTripPlanNum.call(self, {companyId: companyId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert(ret >= 0);
                done();
            })
        });

        it("#saveConsumeDetail should be ok", function (done) {
            var self = {accountId: staffId};
            var detail = {
                orderId: newOrderId,
                type: 0,
                startTime: '2016-01-10 11:00:00',
                invoiceType: 2,
                budget: 350
            }
            API.client.tripPlan.saveConsumeDetail.call(self, detail, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.status, 0);
                done();
            })
        });

        describe('options based on consume details created', function(){
            var consumeId = "";
            before(function(done){
                Q.all([
                    API.tripPlan.saveConsumeRecord({orderId: newOrderId, accountId: staffId, type: 0, startTime: '2016-01-11 11:22:22', invoiceType: 2, budget: 150}),
                    API.tripPlan.saveConsumeRecord({orderId: newOrderId, accountId: staffId, type: 1, startTime: '2016-01-12 11:33:44', invoiceType: 2, budget: 300})
                ])
                    .spread(function(ret1, ret2){
                        assert.equal(ret1.type, 0);
                        assert.equal(ret2.type, 1);
                        consumeId = ret2.id;
                        return API.tripPlan.uploadInvoice({userId: staffId, consumeId: ret1.id, picture: '测试图片'})
                            .then(function(t){
                                assert.equal(t.code, 0);
                                return  API.client.agencyTripPlan.approveInvoice.call({accountId: agencyUserId}, {consumeId: ret1.id, status: 1, expenditure: '521', remark: '审核票据测试'})
                                    .then(function(r){
                                        assert.equal(r.code, 0);
                                        done()
                                    })
                            })
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            });

            it("#uploadInvoice should be ok", function (done) {
                var self = {accountId: staffId};
                API.client.tripPlan.uploadInvoice.call(self, {consumeId: consumeId, picture: '测试上传图片'}, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(ret.code, 0);
                    done();
                })
            });

            it("#statPlanOrderMoneyByCompany should be ok", function (done) {
                var self = {accountId: staffId};
                API.client.tripPlan.statPlanOrderMoneyByCompany.call(self, {startTime: '2016-01-01 00:00:00'}, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert(ret != null);
                    assert(ret.qmBudget >= 0);
                    assert(ret.planMoney >= 0);
                    assert(ret.expenditure >= 0);
                    done();
                })
            });
        })

    })

})