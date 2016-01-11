/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var Q = require("q");
var uuid = require("node-uuid");
var API = require("common/api");

describe("api/client/agencyTripPlan.js", function() {
    var agency = {
        email: "agencyTripPlan.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的代理商',
        description: '代理商计划单测试使用',
        mobile: "15269866804",
        remark: '计划单测使用代理商'
    };

    var company = {
        email: "agencyTripPlan.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的企业',
        mobile: "15269866804",
        domain: 'tulingdao.com',
        description: '代理商计划单测试用企业'
    }

    var tripPlanOrder = {
        startPlace: '北京',
        destination: '上海',
        budget: 1000,
        startAt: '2015-12-30 11:12:12',
        consumeDetails: [{
            type: 0,
            startTime: '2016-01-07 10:22:00',
            invoiceType: 2,
            budget: 1000,
            newInvoice: '票据详情'
        }]
    }
    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";
    var orderId = "";
    var consumeId = "";
    //before(function(done) {
    //    API.agency.registerAgency(agency, function(err, a){
    //        if(err){
    //            throw err;
    //        }
    //        agencyId = a.agency.id;
    //        agencyUserId = a.agencyUser.id;
    //        company.agencyId = agencyId;
    //        API.client.company.createCompany.call({accountId: agencyUserId}, company, function(err, c){
    //            if(err){
    //                throw err;
    //            }
    //            companyId = c.company.id;
    //            staffId = c.company.createUser;
    //            tripPlanOrder.consumeDetails = [{
    //                type: 0,
    //                startTime: '2016-01-07 10:22:00',
    //                invoiceType: 2,
    //                budget: 1000,
    //                newInvoice: '票据详情'
    //            }]
    //            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder, function(err, ret){
    //                if(err){
    //                    throw err;
    //                }
    //                assert(ret.hotel.length > 0);
    //                consumeId = ret.hotel[0].id;
    //                orderId = ret.id;
    //                done();
    //            })
    //        })
    //    })
    //});
    //
    //after(function(done) {
    //    Q.all([
    //        API.agency.deleteAgency({agencyId: agencyId, userId: agencyUserId}),
    //        API.company.deleteCompany({companyId: companyId, userId: staffId}),
    //        API.staff.deleteStaff({id: staffId}),
    //        API.tripPlan.deleteTripPlanOrder({orderId: orderId, userId: staffId})
    //    ])
    //        .then(function(){
    //            done();
    //        })
    //        .catch(function(err){
    //            throw err;
    //        })
    //});


    before(function(done){
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
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
                return API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder);
            })
            .then(function(ret){
                assert(ret.hotel.length > 0);
                orderId = ret.id;
                consumeId = ret.hotel[0].id;
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
    })


    after(function(done) {
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.tripPlan.deleteTripPlanOrder({orderId: orderId, userId: staffId})
        ])
            .spread(function(ret1, ret2, ret3, ret4){
                assert.equal(ret1.code, 0);
                assert.equal(ret2.code, 0);
                assert.equal(ret3.code, 0);
                assert.equal(ret4.code, 0);
                done()
            })
            .catch(function(err){
                throw err;
            })
    });


    it("#getTripPlanOrderById should be ok", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.getTripPlanOrderById.call(self, orderId, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.id, orderId);
            done();
        })
    });

    it("#pageTripPlanOrderByAgency should be ok", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlanOrder.call(self, {}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            done();
        })
    });

    it("#countTripPlanNum should be ok", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
            if (err) {
                throw err;
            }
            assert(ret >= 0)
            done();
        })
    });

    it("#approveInvoice should be error without params.expenditure", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.approveInvoice.call(self, {consumeId: consumeId, status: 1, remark: '审核票据测试'}, function(err, ret){
            assert.equal(err.code, -4);
            assert.equal(ret, null);
            done();
        })
    });

    it("#approveInvoice should be ok when audit not pass", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.approveInvoice.call(self, {consumeId: consumeId, status: -1, expenditure: '450', remark: '审核票据测试'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.status, -1);
            done();
        })
    });

    it("#approveInvoice should be ok when audit pass", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.approveInvoice.call(self, {consumeId: consumeId, status: 1, expenditure: '450', remark: '审核票据测试'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.status, 1);
            assert(ret.expenditure > 0);
            done();
        })
    });


})