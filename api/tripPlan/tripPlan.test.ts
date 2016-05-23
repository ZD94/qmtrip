/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');
"use strict";
var API = require("common/api");
import assert = require("assert");
import {Models} from 'api/_types';
import {getSession} from 'common/model';
import {EInvoiceType, ETripType} from 'api/_types/tripPlan'

var agencyId = "";
var agencyUserId = "";
var companyId = "";
var staffId = "";
var tripPlanId = "";
var tripDetailId = '';

describe("api/tripPlan", function() {



    var agency = {email: "tripPlan.test@jingli.tech", userName: "白菜帮九袋长老", name: '白菜帮', mobile: "15269866803", title: '计划单测试用代理商'};
    var company = {email: "tripPlan.test@jingli.tech", userName: "白菜帮九袋长老", name: '白菜帮', mobile: "15269866803", domain: 'jingli.tech', title: '计划单测试用企业'};

    before(function(done){
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
        ])
            .spread(function(ret1, ret2, ret3){
                return API.client.agency.registerAgency(agency);
            })
            .then(function(ret: any){
                ret = ret.target;
                agencyId = ret.id;
                agencyUserId = ret.createUser;
                var session = getSession();
                session.accountId = agencyUserId;
                session.tokenId = 'tokenId';
                return API.company.registerCompany( company);
            })
            .then(function(company){
                company = company.target;
                companyId = company.id;
                staffId = company.createUser;

                console.info('staffId=>', staffId);
                var session = getSession();
                session.accountId = staffId;
                session.tokenId = 'tokenId';
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
                invoiceType: EInvoiceType.HOTEL,
                budget: -1,
                newInvoice: '票据详情'
            }]
        };
        var new_trip_plan_id = '';
        var new_consume_id = '';

        before(function(done) {
            API.tripPlan.saveTripPlan( _tripPlanOrder)
                .then(function(trip_plan) {
                    new_trip_plan_id = trip_plan.id;
                    return trip_plan.getHotel();
                })
                .then(function(hotels) {
                    new_consume_id = hotels[0].id;
                    done();
                })
                .catch(function(err) {
                    throw err;
                }).done();
        });

        after(function(done) {
            API.tripPlan.deleteTripPlan({tripPlanId: new_trip_plan_id, userId: staffId})
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
            API.tripPlan.editTripPlanBudget({id: new_consume_id, budget: '3333'}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret, true);
                done();
            })
        });

        it("#editTripPlanBudget should be error if params.budget is null", function(done) {
            var self = {accountId: agencyUserId};
            API.tripPlan.editTripPlanBudget({id: new_consume_id})
                .then(function(ret) {
                    assert.equal(ret, null);
                    done();
                })
                .catch(function(err) {
                    assert.equal(err.code, -1);
                    done();
                })
        });
    });

    describe("saveTripPlan", function(){
        after(function(done){
            API.tripPlan.deleteTripPlan({tripPlanId: tripPlanId, userId: staffId}, function(err, ret){
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
                    invoiceType: EInvoiceType.HOTEL,
                }]
            }
            API.tripPlan.saveTripPlan(tripPlanOrder)
                .then(function(ret) {
                    assert.equal(ret.companyId, companyId);
                    assert.equal(ret.accountId, staffId);
                    tripPlanId = ret.id;
                    tripDetailId = ret.hotel[0].id;
                })
                .catch(function(err) {
                    console.info(err.stack);
                    assert.equal(err, null);
                })
                .nodeify(done);
        });

        it("#listTripPlans should be ok", function (done) {
            API.tripPlan.listTripPlans({})
                .then(function(ret) {
                    console.info(ret);
                    tripPlanId = ret[0];
                })
                .catch(function(err) {
                    assert.equal(err, null);
                })
                .nodeify(done)
        });


    });

    describe("deleteTripPlan", function(){
        var planId = '';
        var detailId = '';
        var tripPlanOrder = {
            deptCity: '北京',
            arrivalCity: '上海',
            deptCityCode: 'BJ123',
            arrivalCityCode: 'SH123',
            title: '发送邮件测试计划单',
            startAt: '2015-12-30 11:12:12',
            budgets: [{
                startTime: '2016-12-30 11:11:11',
                budget: 300,
                type: ETripType.HOTEL,
                city: '上海市',
                cityCode: 'SH123',
                hotelName: '丐帮',
                invoiceType: EInvoiceType.HOTEL
            }]
        }

        before(function(done){
            var session = getSession();
            API.tripPlan.saveTripPlan(tripPlanOrder)
                .then(function(ret) {
                    planId = ret.id;
                    return ret.getHotel();
                })
                .then(function(hotels) {
                    detailId = hotels[0].id;
                    done();
                })
                .catch(function(err) {
                    if(err){
                        console.info(err);
                        throw err;
                    }
                })
        });


        it("#uploadInvoiceNew should be ok", function (done) {
            API.tripPlan.uploadInvoice( {tripDetailId: detailId, pictureFileId: '测试上传图片'}, function (err, ret) {
                console.info(err);
                console.info(ret);
                done();
            })
        });


        it("#updateTripDetail should be ok", function (done) {
            API.tripPlan.updateTripDetail({consumeId: detailId, optLog: '测试updateTripDetail', userId: staffId, updates: {orderStatus: 'BOOKED'}}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#deleteTripPlan should be ok", function(done) {
            var self = {accountId: staffId};
            API.tripPlan.deleteTripPlan({tripPlanId: planId}, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });

    })
})


describe("options based on tripPlanOrder created", function() {
    var newplanId = "";
    var consumeId = "";
    var session = getSession();
    session.accountId = staffId;
    session.tokenId = 'tokenId';
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
            invoiceType: EInvoiceType.PLANE
        }]
    }
    before(function (done) {

        API.tripPlan.saveTripPlan( _tripPlanOrder)
            .then(function(ret) {
                newplanId = ret.id;
                return ret.getHotel();
            })
            .then(function(hotels) {
                consumeId = hotels[0].id;
                done();
            })
            .catch(function(err) {
                throw err;
            })
    });

    after(function (done) {
        API.tripPlan.deleteTripPlan({tripPlanId: newplanId, userId: staffId}, function (err, ret) {
            if (err) {
                throw err;
            }
            done();
        })
    })


    it("checkBudgetExist should be ok", function(done) {
        _tripPlanOrder.hotel[0]['type'] = 0;
        API.tripPlan.checkBudgetExist( _tripPlanOrder, function(err, ret) {
            if(err) {
                throw err;
            }
            assert.equal(typeof ret, 'string');
            done();
        })
    });

    it("checkBudgetExist result should be false when there's no budget", function(done) {
        _tripPlanOrder.hotel[0]['type'] = 1;
        API.tripPlan.checkBudgetExist( _tripPlanOrder, function(err, ret) {
            if(err) {
                throw err;
            }
            assert.equal(ret, false);
            done();
        })
    });


    it("#getTripPlan should be error when param is not uuid", function (done) {
        var self = {accountId: staffId};
        API.tripPlan.getTripPlan({id: "123456"}, function (err, ret) {
            assert(err != null);
            assert.equal(ret, null);
            done();
        })
    });

    it("#getTripPlan should be ok by staff", function (done) {
        API.tripPlan.getTripPlan( {id: newplanId}, function (err, ret) {
            assert.equal(err, null);
            assert.equal(ret.id, newplanId);
            done();
        })
    });

    it("#getTripPlan should be ok by agency", function(done) {
        API.tripPlan.getTripPlan( {id: newplanId})
            .then(function (ret) {
                assert.equal(ret.id, newplanId);
                done();
            })
            .catch(function (err) {
                console.info(err);
                assert.equal(err, null);
            });
    });



    it("#pageTripPlans should be ok", function (done) {
        var self = {accountId: staffId};
        API.tripPlan.pageTripPlans({page: 1}, function (err, ret) {
            assert.equal(err, null);
            assert.equal(ret.page, 1);
            assert.equal(ret.perPage, 10);
            done();
        })
    });


    it("#pageTripPlans should be ok", function (done) {
        var self = {accountId: staffId};
        API.tripPlan.pageTripPlans({page: 1, audit: 'P'}, function (err, ret) {
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
        API.tripPlan.pageTripPlansByCompany({page: 1, audit: 'P', emailOrName: '白菜帮'}, function (err, ret) {
            if (err) {
                throw err;
            }
            assert.equal(ret.page, 1);
            done();
        })
    });


    it("#countTripPlanNum should be ok", function (done) {
        var self = {accountId: staffId};
        API.tripPlan.countTripPlanNum({companyId: companyId}, function (err, ret) {
            if (err) {
                throw err;
            }
            assert(ret >= 0);
            done();
        })
    });

    describe("#saveTripDetail", function(){
        var newDetailId = "";
        after(function(done){
            API.tripPlan.uploadInvoice( {consumeId: newDetailId, picture: '测试上传图片'}, function (err, ret) {
                if (err) {
                    throw err;
                }
                // assert(ret, true);
                done();
            })
        })

        it("#saveTripDetail should be ok", function (done) {
            var self = {accountId: staffId};
            var detail = {
                tripPlanId: newplanId,
                type: 0,
                startTime: '2016-01-10 11:00:00',
                invoiceType: EInvoiceType.HOTEL,
                budget: 350
            }
            API.tripPlan.saveTripDetail(detail, function (err, ret) {
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
        API.tripPlan.getProjectsList({}, function (err, ret) {
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
            API.tripPlan.uploadInvoice({consumeId: consumeId, picture: '测试上传图片'}, function (err, ret) {
                if (err) {
                    throw err;
                }
                // assert(ret, true);
                done();
            })
        });

        it("#uploadInvoice should be error with wrong user", function (done) {
            API.tripPlan.uploadInvoice( {consumeId: consumeId, picture: '测试上传图片'}, function (err, ret) {
                assert.equal(err.code, 403);
                assert.equal(ret, null);
                done();
            })
        });

        it("#commitTripPlanOrder should be ok", function (done) {
            var self = {accountId: staffId};
            API.tripPlan.commitTripPlanOrder({tripPlanId: newplanId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                // assert(ret, true);
                done();
            })
        });


        it("#statPlanOrderMoney should be ok", function (done) {
            var self = {accountId: staffId};
            API.tripPlan.statPlanOrderMoney({startTime: '2016-01-01 00:00:00'}, function (err, ret) {
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
            API.tripPlan.statPlanOrderMoneyByCompany({startTime: '2016-01-01 00:00:00'}, function (err, ret) {
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
            API.tripPlan.statBudgetByMonth({startTime: '2016-01-01 00:00:00'}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("statStaffsByCity should be ok", function(done) {
            API.tripPlan.statStaffsByCity( {statTime: '2016-02-25', endTime: '2016-02-19'}, function(err, ret) {
                if(err) {
                    throw err;
                }
                done();
            })
        });
    })

});