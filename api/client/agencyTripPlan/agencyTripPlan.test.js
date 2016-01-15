/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var Q = require("q");
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
        description: '审核发票用测试',
        budget: 1000,
        //startAt: '2015-12-30 11:12:12',
        consumeDetails: [{
            type: 0,
            startTime: '2016-01-07 10:22:00',
            endTime: '2016-01-30 11:12:34',
            city: '北京市',
            hotelName: '丐帮总部',
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

    before(function(done){
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
        ])
            .spread(function(ret1, ret2, ret3){
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                companyId = company.id;
                staffId = company.createUser;
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
            .done();
    })


    after(function(done) {
        Q.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.tripPlan.deleteTripPlanOrder({orderId: orderId, userId: staffId})
        ])
            .spread(function(ret1, ret2, ret3, ret4){
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
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

    it("#pageTripPlanOrderByAgency return values length should be 1 when params={}", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlanOrder.call(self, {}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            assert.equal(ret.currentPageTotal, 1);
            assert.equal(ret.items.length, 1);
            done();
        })
    });

    it("#pageTripPlanOrderByAgency return values length should be 0 when isUpload is true", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlanOrder.call(self, {isUpload: true}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            assert.equal(ret.currentPageTotal, 0);
            assert.equal(ret.items.length, 0);
            done();
        })
    });

    it("#pageTripPlanOrderByAgency return values length should be 0 when audit is Y", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlanOrder.call(self, {isUpload: true, audit: 'Y'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            assert.equal(ret.currentPageTotal, 0);
            assert.equal(ret.items.length, 0);
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
        API.client.agencyTripPlan.approveInvoice.call(self, {consumeId: consumeId, status: -1, remark: '审核票据测试'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret, true);
            done();
        })
    });

    it("#approveInvoice should be ok when audit pass", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.approveInvoice.call(self, {consumeId: consumeId, status: 1, expenditure: '450', remark: '审核票据测试'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret, true);
            done();
        })
    });

    it("#statPlanOrderMoneyByAgency should be ok when audit pass", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.statPlanOrderMoneyByAgency.call(self, {companyId: companyId}, function(err, ret){
            if (err) {
                throw err;
            }
            assert(ret != null);
            done();
        })
    });

})