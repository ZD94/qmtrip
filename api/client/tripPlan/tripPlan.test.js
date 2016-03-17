/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');
"use strict";
var assert = require("assert");
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
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
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
                done();
            })
            .catch(function(err){
                console.error(err);
                throw err;
            })
            .done();
    })


    after(function(done) {
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
        ])
            .spread(function(ret1, ret2, ret3){
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
                done();
            })
        })

        it("#savePlanOrder should be ok", function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                startPlaceCode: 'BJ123',
                destinationCode: 'SH123',
                budget: 1000,
                description: '发送邮件测试计划单',
                startAt: '2015-12-30 11:12:12',
                consumeDetails: [{
                    startTime: '2016-01-15 11:11:11',
                    endTime: '2016-01-30 22:11:56',
                    budget: '300',
                    city: '上海市',
                    cityCode: 'SH123',
                    hotelName: '丐帮',
                    invoiceType: 'HOTEL',
                    type: 0
                }]
            }
            var self = {accountId: staffId};
            API.client.tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                console.info(ret.hotel);
                //assert.equal(ret.status, 0);
                done();
            })
        });

        it("#savePlanOrder should be error when budget is not number", function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                startPlaceCode: 'BJ123',
                destinationCode: 'SH123',
                budget: 1000,
                description: '发送邮件测试计划单',
                startAt: '2015-12-30 11:12:12',
                consumeDetails: [{
                    startTime: '2016-01-15 11:11:11',
                    endTime: '2016-01-30 22:11:56',
                    budget: 'gg',
                    city: '上海市',
                    cityCode: 'SH123',
                    hotelName: '丐帮',
                    invoiceType: 'HOTEL',
                    type: 0
                }]
            }
            var self = {accountId: staffId};
            API.client.tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, ret){
                assert.equal(err.code, -2);
                assert.equal(ret, null);
                done();
            })
        });
    })


    describe("deleteTripPlanOrder", function(){
        var tripPlanOrder = {
            startPlace: '北京',
            destination: '上海',
            startPlaceCode: 'BJ123',
            destinationCode: 'SH123',
            budget: 1000,
            description: '发送邮件测试计划单',
            startAt: '2015-12-30 11:12:12',
            consumeDetails: [{
                startTime: '2016-12-30 11:11:11',
                budget: 300,
                city: '上海市',
                cityCode: 'SH123',
                hotelName: '丐帮',
                invoiceType: 'HOTEL',
                type: 0
            }]
        }
        var newOrderId = "";
        before(function(done){

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
                done();
            })
        });

    })


    describe("options based on tripPlanOrder created", function() {
        var newOrderId = "";
        var consumeId = "";
        var _tripPlanOrder = {
            startPlace: '北京',
            destination: '上海',
            startPlaceCode: 'BJ123',
            destinationCode: 'SH123',
            budget: 1000,
            startAt: '2015-11-22 11:12:12',
            description: '我要去出差',
            consumeDetails: [{
                startTime: '2016-12-30 11:11:11',
                budget: 400,
                invoiceType: 'PLANE',
                type: 0
            }]
        }
        before(function (done) {

            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, _tripPlanOrder, function (err, ret) {
                if (err) {
                    throw err;
                }
                newOrderId = ret.id;
                consumeId = ret.hotel[0].id;
                done();
            })
        });

        after(function (done) {
            API.tripPlan.deleteTripPlanOrder({orderId: newOrderId, userId: staffId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        })


        it("checkBudgetExist should be ok", function(done) {
            _tripPlanOrder.consumeDetails[0].type = 0;
            API.client.tripPlan.checkBudgetExist.call({accountId: staffId}, _tripPlanOrder, function(err, ret) {
                if(err) {
                    throw err;
                }
                assert.equal(typeof ret, 'string');
                done();
            })
        });

        it("checkBudgetExist result should be false when there's no budget", function(done) {
            _tripPlanOrder.consumeDetails[0].type = 1;
            API.client.tripPlan.checkBudgetExist.call({accountId: staffId}, _tripPlanOrder, function(err, ret) {
                if(err) {
                    throw err;
                }
                assert.equal(ret, false);
                done();
            })
        });


        it("#getTripPlanOrderById should be error when param is not uuid", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanOrderById.call(self, {orderId: "123456"}, function (err, ret) {
                assert(err != null);
                assert.equal(ret, null);
                done();
            })
        });

        it("#getTripPlanOrderById should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanOrderById.call(self, {orderId: newOrderId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, newOrderId);
                console.info(ret.toJSON());
                console.info(ret.toJSON().hotel[0].toJSON());
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
            API.client.tripPlan.pageTripPlanOrder.call(self, {page: 1, audit: 'P'}, function (err, ret) {
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
            API.client.tripPlan.pageTripPlanOrderByCompany.call(self, {page: 1, audit: 'P', emailOrName: '白菜帮'}, function (err, ret) {
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

        describe("#saveConsumeDetail", function(){
            var newDetailId = "";
            after(function(done){
                API.client.tripPlan.uploadInvoice.call({accountId: staffId}, {consumeId: newDetailId, picture: '测试上传图片'}, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert(ret, true);
                    done();
                })
            })

            it("#saveConsumeDetail should be ok", function (done) {
                var self = {accountId: staffId};
                var detail = {
                    orderId: newOrderId,
                    type: 0,
                    startTime: '2016-01-10 11:00:00',
                    invoiceType: 'HOTEL',
                    budget: 350
                }
                API.client.tripPlan.saveConsumeDetail.call(self, detail, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(ret.status, 0);
                    newDetailId = ret.id;
                    done();
                })
            });
        })

        it("#getProjectsList should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getProjectsList.call(self, {}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert(ret.length >= 0 );
                done();
            })
        });

        describe('options based on consume details created', function(){
            before(function(done){
                API.tripPlan.uploadInvoice({userId: staffId, consumeId: consumeId, picture: '测试图片'})
                    .then(function(r){
                        assert.equal(r, true);
                        done()
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
                    assert(ret, true);
                    done();
                })
            });

            it("#uploadInvoice should be error with wrong user", function (done) {
                API.client.tripPlan.uploadInvoice.call({accountId: agencyUserId}, {consumeId: consumeId, picture: '测试上传图片'}, function (err, ret) {
                    assert.equal(err.code, 403);
                    assert.equal(ret, null);
                    done();
                })
            });

            it("#commitTripPlanOrder should be ok", function (done) {
                var self = {accountId: staffId};
                API.client.tripPlan.commitTripPlanOrder.call(self, newOrderId, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert(ret, true);
                    done();
                })
            });


            it("#statPlanOrderMoney should be ok", function (done) {
                var self = {accountId: staffId};
                API.client.tripPlan.statPlanOrderMoney.call(self, {startTime: '2016-01-01 00:00:00'}, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    console.info(ret);
                    assert(ret != null);
                    assert(ret.qmBudget >= 0);
                    assert(ret.planMoney >= 0);
                    assert(ret.expenditure >= 0);
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


            it("#statBudgetByMonth should be ok", function (done) {
                var self = {accountId: staffId};
                API.client.tripPlan.statBudgetByMonth.call(self, {startTime: '2016-01-01 00:00:00'}, function (err, ret) {
                    if (err) {
                        throw err;
                    }
                    //assert(ret != null);
                    //assert(ret.qmBudget >= 0);
                    //assert(ret.planMoney >= 0);
                    //assert(ret.expenditure >= 0);
                    done();
                })
            });

            it("statStaffsByCity should be ok", function(done) {
                API.client.tripPlan.statStaffsByCity.call({accountId: staffId}, {statTime: '2016-02-25', endTime: '2016-02-19'}, function(err, ret) {
                    if(err) {
                        throw err;
                    }
                    done();
                })
            });
        })

    });

})