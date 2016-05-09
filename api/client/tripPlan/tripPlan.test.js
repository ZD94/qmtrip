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
        email: "tripPlan.test@jingli.tech",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        title: '计划单测试用代理商'
    };

    var company = {
        email: "tripPlan.test@jingli.tech",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        domain: 'jingli.tech',
        title: '计划单测试用企业'
    }

    before(function(done){
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
        ])
            .spread(function(ret1, ret2, ret3){
                return API.agency.createAgency(agency);
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

    describe("editTripPlanBudget", function(){
        var _tripPlanOrder = {
            deptCity: '北京',
            arrivalCity: '上海',
            deptCityCode: 'BJ123',
            arrivalCityCode: 'SH123',
            startAt: '2016-01-07 10:22:00',
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
        };
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
            API.client.tripPlan.editTripPlanBudget.call(self, {id: new_consume_id, budget: '3333'}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret, true);
                done();
            })
        });

        it("#editTripPlanBudget should be error if params.budget is null", function(done) {
            var self = {accountId: agencyUserId};
            API.client.tripPlan.editTripPlanBudget.call(self, {id: new_consume_id})
                .then(function(ret) {
                    assert.equal(ret, null);
                    done();
                })
                .catch(function(err) {
                    console.info("*******************");
                    assert.equal(err.code, -1);
                    done();
                })
        });
    });

    describe("saveTripPlan", function(){
        after(function(done){
            API.tripPlan.deleteTripPlan({orderId: orderId, userId: staffId}, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        })

        it("#saveTripPlan should be ok", function(done){
            var tripPlanOrder = {
                deptCity: '北京',
                arrivalCity: '上海',
                deptCityCode: 'BJ123',
                arrivalCityCode: 'SH123',
                budget: 1000,
                title: '发送邮件测试计划单',
                startAt: '2015-12-30 11:12:12',
                hotel: [{
                    startTime: '2016-01-15 11:11:11',
                    endTime: '2016-01-30 22:11:56',
                    budget: '300',
                    city: '上海市',
                    cityCode: 'SH123',
                    hotelName: '丐帮',
                    invoiceType: 'HOTEL',
                }]
            }
            var self = {accountId: staffId};
            API.client.tripPlan.saveTripPlan.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                assert.equal(ret.companyId, companyId);
                assert.equal(ret.accountId, staffId);
                assert.equal(ret.orderStatus, 'WAIT_UPLOAD');
                done();
            })
        });

        it("#saveTripPlan should be error when budget is not number", function(done){
            var tripPlanOrder = {
                deptCity: '北京',
                arrivalCity: '上海',
                deptCityCode: 'BJ123',
                arrivalCityCode: 'SH123',
                budget: 1000,
                title: '发送邮件测试计划单',
                startAt: '2015-12-30 11:12:12',
                hotel: [{
                    startTime: '2016-01-15 11:11:11',
                    endTime: '2016-01-30 22:11:56',
                    budget: 'gg',
                    city: '上海市',
                    cityCode: 'SH123',
                    hotelName: '丐帮',
                    invoiceType: 'HOTEL',
                }]
            }
            var self = {accountId: staffId};
            API.client.tripPlan.saveTripPlan.call(self, tripPlanOrder, function(err, ret){
                assert.equal(err.code, -2);
                assert.equal(ret, null);
                done();
            })
        });
    })


    describe("deleteTripPlan", function(){
        var consume_id = '';
        var tripPlanOrder = {
            deptCity: '北京',
            arrivalCity: '上海',
            deptCityCode: 'BJ123',
            arrivalCityCode: 'SH123',
            budget: 1000,
            title: '发送邮件测试计划单',
            startAt: '2015-12-30 11:12:12',
            hotel: [{
                startTime: '2016-12-30 11:11:11',
                budget: 300,
                city: '上海市',
                cityCode: 'SH123',
                hotelName: '丐帮',
                invoiceType: 'HOTEL'
            }]
        }
        var newOrderId = "";
        beforeEach(function(done){

            API.client.tripPlan.saveTripPlan.call({accountId: staffId}, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                newOrderId = ret.id;
                consume_id = ret.hotel[0].id;
                done();
            })
        });

        it("#updateConsumeDetail should be ok", function (done) {
            API.tripPlan.updateConsumeDetail({consumeId: consume_id, optLog: '测试updateConsumeDetail', userId: staffId, updates: {orderStatus: 'BOOKED'}}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#deleteTripPlan should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.deleteTripPlan.call(self, {orderId: newOrderId}, function(err, ret){
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
            deptCity: '北京',
            arrivalCity: '上海',
            deptCityCode: 'BJ123',
            arrivalCityCode: 'SH123',
            budget: 1000,
            startAt: '2015-11-22 11:12:12',
            title: '我要去出差',
            hotel: [{
                startTime: '2016-12-30 11:11:11',
                budget: 400,
                invoiceType: 'PLANE'
            }]
        }
        before(function (done) {

            API.client.tripPlan.saveTripPlan.call({accountId: staffId}, _tripPlanOrder, function (err, ret) {
                if (err) {
                    throw err;
                }
                newOrderId = ret.id;
                consumeId = ret.hotel[0].id;
                done();
            })
        });

        after(function (done) {
            API.tripPlan.deleteTripPlan({orderId: newOrderId, userId: staffId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        })


        it("checkBudgetExist should be ok", function(done) {
            _tripPlanOrder.hotel[0].type = 0;
            API.client.tripPlan.checkBudgetExist.call({accountId: staffId}, _tripPlanOrder, function(err, ret) {
                if(err) {
                    throw err;
                }
                assert.equal(typeof ret, 'string');
                done();
            })
        });

        it("checkBudgetExist result should be false when there's no budget", function(done) {
            _tripPlanOrder.hotel[0].type = 1;
            API.client.tripPlan.checkBudgetExist.call({accountId: staffId}, _tripPlanOrder, function(err, ret) {
                if(err) {
                    throw err;
                }
                assert.equal(ret, false);
                done();
            })
        });


        it("#getTripPlanById should be error when param is not uuid", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanById.call(self, {orderId: "123456"}, function (err, ret) {
                assert(err != null);
                assert.equal(ret, null);
                done();
            })
        });

        it("#getTripPlanById should be ok by staff", function (done) {
            API.client.tripPlan.getTripPlanById.call({accountId: staffId}, {orderId: newOrderId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, newOrderId);
                done();
            })
        });

        it("#getTripPlanById should be ok by agency", function(done) {
            API.client.tripPlan.getTripPlanById.call({accountId: agencyUserId}, {orderId: newOrderId}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, newOrderId);
                done();
            })
        });

        it("#pageCompleteTripPlans should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageCompleteTripPlans.call(self, {page: 1}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });

        it("#pageTripPlans should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlans.call(self, {page: 1}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });


        it("#pageTripPlans should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlans.call(self, {page: 1, audit: 'P'}, function (err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.page, 1);
                assert.equal(ret.perPage, 10);
                done();
            })
        });

        it("#pageTripPlansByCompany should be ok", function (done) {
            var self = {accountId: staffId};
            API.client.tripPlan.pageTripPlansByCompany.call(self, {page: 1, audit: 'P', emailOrName: '白菜帮'}, function (err, ret) {
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
                API.client.tripPlan.commitTripPlanOrder.call(self, {orderId: newOrderId}, function (err, ret) {
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