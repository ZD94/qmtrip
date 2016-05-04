/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var API = require("common/api");

describe("api/client/agencyTripPlan.js", function() {
    var agency = {
        email: "agencyTripPlan.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的代理商',
        title: '代理商计划单测试使用',
        mobile: "15269866804",
        remark: '计划单测使用代理商'
    };

    var company = {
        email: "agencyTripPlan.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的企业',
        mobile: "15269866804",
        domain: 'tulingdao.com',
        title: '代理商计划单测试用企业'
    }

    var tripPlanOrder = {
        deptCity: '北京',
        arrivalCity: '上海',
        deptCityCode: 'BJ123',
        arrivalCityCode: 'SH123',
        title: '审核发票用测试',
        startAt: '2016-01-07 10:22:00',
        budget: 1000,
        //startAt: '2015-12-30 11:12:12',
        hotel: [{
            type: 0,
            startTime: '2016-01-07 10:22:00',
            endTime: '2016-01-30 11:12:34',
            city: '北京市',
            cityCode: 'BJ123',
            hotelName: '丐帮总部',
            invoiceType: 'HOTEL',
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
        Promise.all([
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
                return API.client.tripPlan.saveTripPlan.call({accountId: staffId}, tripPlanOrder);
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
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.tripPlan.deleteTripPlan({orderId: orderId, userId: staffId})
        ])
            .spread(function(ret1, ret2, ret3, ret4){
                assert.equal(ret1, true);
                assert.equal(ret2, true);
                assert.equal(ret3, true);
                assert.equal(ret4, true);
                done()
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    describe("editTripPlanBudget", function(){
        "use strict";
        var _tripPlanOrder = {
            deptCity: '北京',
            arrivalCity: '上海',
            deptCityCode: 'BJ123',
            arrivalCityCode: 'SH123',
            title: '审核发票用测试',
            budget: -1,
            hotel: [{
                type: 0,
                startTime: '2016-01-07 10:22:00',
                endTime: '2016-01-30 11:12:34',
                city: '北京市',
                cityCode: 'BJ123',
                hotelName: '丐帮总部',
                invoiceType: 'HOTEL',
                budget: -1,
                newInvoice: '票据详情'
            }]
        }
        var new_trip_plan_id = '';
        var new_consume_id = '';

        before(function(done) {
            API.client.tripPlan.saveTripPlan.call({accountId: staffId}, _tripPlanOrder)
                .then(function(trip_plan) {
                    new_trip_plan_id = trip_plan.id;
                    new_consume_id = trip_plan.hotel[0].id;
                    done();
                })
                .catch(function(err) {
                    throw err;
                }).done();
        });

        after(function(done) {
            API.tripPlan.deleteTripPlan({orderId: new_trip_plan_id, userId: staffId})
                .then(function(){
                    done()
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        it("#editTripPlanBudget should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agencyTripPlan.editTripPlanBudget.call(self, {consumeId: new_consume_id, budget: '3333'}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret, true);
                done();
            })
        });

        it("#editTripPlanBudget should be error if params.budget is null", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agencyTripPlan.editTripPlanBudget.call(self, {consumeId: new_consume_id}, function(err, ret){
                assert.equal(err.code, -1);
                assert.equal(ret, null);
                done();
            })
        });
    })


    it("#getTripPlanById should be ok", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.getTripPlanById.call(self, {orderId: orderId}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.id, orderId);
            done();
        })
    });

    it("#pageTripPlansByAgency return values length should be 1 when params={}", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlans.call(self, {}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            assert.equal(ret.currentPageTotal, 1);
            assert.equal(ret.items.length, 1);
            done();
        })
    });

    it("#pageTripPlansByAgency return values length should be 0 when isUpload is true", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlans.call(self, {isUpload: true, audit: 'P'}, function(err, ret){
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            assert.equal(ret.currentPageTotal, 0);
            assert.equal(ret.items.length, 0);
            done();
        })
    });

    it("#pageTripPlansByAgency return values length should be 0 when audit is Y", function(done) {
        var self = {accountId: agencyUserId};
        API.client.agencyTripPlan.pageTripPlans.call(self, {audit: 'Y'}, function(err, ret){
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


    describe('options based on invoices upload', function(){
        beforeEach(function(done){
            API.tripPlan.uploadInvoice({userId: staffId, consumeId: consumeId, picture: '测试图片'})
                .then(function(ret){
                    assert(ret, true);
                    return API.tripPlan.commitTripPlanOrder({accountId: staffId, orderId: orderId});
                })
                .then(function(ret){
                    assert(ret, true);
                    done();
                })
                .catch(function(err){
                    console.info(err);
                    throw err;
                })
                .done();
        })

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

    })


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