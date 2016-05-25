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
import async = Q.async;

var agencyId = "";
var agencyUserId = "";
var companyId = "";
var staffId = "";
var tripPlanId = "";
var tripDetailId = '';
let tripPlanIds = [];

describe("api/tripPlan", function() {
    var agencyDefault = {email: "tripPlanAgency.test@jingli.tech", userName: "白菜帮九袋长老", name: '白菜帮', mobile: "15269866803", title: '计划单测试用代理商'};
    var companyDefault = {email: "tripPlanCompany.test@jingli.tech", userName: "白菜帮九袋长老", name: '白菜帮', mobile: "15269866803", title: '计划单测试用企业'};

    async function deleteTripPlanByTest() {
        let agencies = await Models.agency.find({where: {email: {$like: '%.test@jingli.tech'}}, paranoid: false});
        await Promise.all(agencies.map(async function (a) {
            let agencyUsers = await Models.agencyUser.find({where: {agencyId: a.id}, paranoid: false});
            let companies = await Models.company.find({where: {agencyId: a.id}, paranoid: false});

            await Promise.all(agencyUsers.map((user)=>user.destroy({force: true})));
            await Promise.all(companies.map(async function(c) {
                let staffs = await Models.staff.find({where: {companyId: c.id}, paranoid: false});
                await Promise.all(staffs.map(async function (s) {
                    let plans = await Models.tripPlan.find({where: {accountId: s.id}, paranoid: false});
                    await Promise.all(plans.map(async function(p){
                        let tripDetails = await Models.tripDetail.find({where: {tripPlanId: p.id}, paranoid: false});
                        await Promise.all(tripDetails.map((t)=>t.destroy({force: true})));
                        await p.destroy({force: true});
                    }));
                    await s.destroy({force: true});
                }));
                await c.destroy({force: true});
            }));
            await a.destroy({force: true});
        }));
    }

    before(function(done){
        deleteTripPlanByTest()
            .then(function(){
                return API.agency.registerAgency(agencyDefault);
            })
            .then(function(agency){
                agencyId = agency.id;
                agencyUserId = agency.createUser;
                var session = getSession();
                session.accountId = agencyUserId;
                session.tokenId = 'tokenId';
                return API.company.registerCompany(companyDefault);
            })
            .then(function(company){
                companyId = company.id;
                staffId = company.createUser;

                var session = getSession();
                session.accountId = staffId;
                session.tokenId = 'tokenId';
            })
            .nodeify(done);
    });
    
    after(function(done) {
        deleteTripPlanByTest()
            .nodeify(done);
    });


    var tripPlanOrder = {
        deptCity: '北京',
        arrivalCity: '上海',
        deptCityCode: 'BJ123',
        arrivalCityCode: 'SH123',
        budget: 1000,
        title: '发送邮件测试计划单',
        startAt: '2015-12-30 11:12:12',
        budgets: [{
            startTime: '2016-01-15 11:11:11',
            endTime: '2016-01-30 22:11:56',
            budget: '300',
            city: '上海市',
            cityCode: 'SH123',
            hotelName: '丐帮',
            invoiceType: EInvoiceType.HOTEL,
        }]
    }
    describe("saveTripPlan", function(){
        it("#saveTripPlan should be ok", function(done){
            let budgetId = 'cache:budgets:ed4e1520-2234-11e6-89a0-43b37ebb0409:1464152140092HPupGh';
            API.tripPlan.saveTripPlan({budgetId: '1464166365279CHeoy5', title: '新增出差计划测试'})
                .then(function(ret) {
                    console.info("saveTripPlan success...");
                    // console.info(ret);
                    // assert.equal(ret.companyId, companyId);
                    // assert.equal(ret.accountId, staffId);
                })
                .catch(function(err) {
                    console.info(err);
                    assert.equal(err, null);
                })
                .nodeify(done);
        });
    });

    describe('options based on tripPlan created', function() {
        before(function(done) {
            API.tripPlan.saveTripPlanByTest(tripPlanOrder)
                .then(async function(ret) {
                    tripPlanId = ret.id;
                    let hotels = await ret.getHotel();
                    tripDetailId = hotels[0].id;
                })
                .nodeify(done);
        });

        it("#getTripPlan should be error when param is not uuid", function (done) {
            API.tripPlan.getTripPlan({id: "123456"}, function (err, ret) {
                assert(err != null);
                assert.equal(ret, null);
                done();
            })
        });

        it("#getTripPlan should be ok by staff", function (done) {
            let session = getSession();
            session.accountId = staffId;
            API.tripPlan.getTripPlan( {id: tripPlanId}, function (err, ret) {
                assert.equal(err, null);
                assert.equal(ret.id, tripPlanId);
                done();
            })
        });

        it("#getTripPlan should be ok by agency", function(done) {
            let session = getSession();
            session.accountId = agencyUserId;
            API.tripPlan.getTripPlan( {id: tripPlanId})
                .then(function (ret) {
                    assert.equal(ret.id, tripPlanId);
                    done();
                })
                .catch(function (err) {
                    console.info(err);
                    assert.equal(err, null);
                });
        });

        it("#updateTripPlan should be ok", function (done) {
            let session = getSession();
            session.accountId = staffId;
            API.tripPlan.updateTripPlan({id: tripPlanId, description: 'test'}, function (err, ret) {
                assert.equal(err, null);
                assert.equal(ret.id, tripPlanId);
                assert.equal(ret.description, 'test');
                done();
            })
        });

        it("#listTripPlans should be ok", function (done) {
            let session = getSession();
            session.accountId = staffId;
            API.tripPlan.listTripPlans({}, function (err, ret) {
                assert.equal(err, null);
                assert(ret.length >= 0);
                done();
            })
        });

        it("#deleteTripPlan should be ok", function (done) {
            let session = getSession();
            session.accountId = staffId;
            API.tripPlan.deleteTripPlan({id: tripPlanId}, function (err, ret) {
                assert.equal(err, null);
                assert.equal(ret, true);
                done();
            })
        });
    })

});


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

        API.tripPlan.saveTripPlanByTest( _tripPlanOrder)
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

        it("#commitTripPlan should be ok", function (done) {
            var self = {accountId: staffId};
            API.tripPlan.commitTripPlan({tripPlanId: newplanId}, function (err, ret) {
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