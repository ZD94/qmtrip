/**
 * Created by wyl on 15-12-12.
 */
//var API = require('@jingli/dnode-api');
"use strict";
var API = require("@jingli/dnode-api");
import assert = require("assert");
import {Models} from '_types';
import {getSession} from 'common/model';
import {EInvoiceType, ETripType} from '_types/tripPlan'

var agencyId = "";
var agencyUserId = "";
var companyId = "";
var staffId = "";
var tripPlanId = "";
var tripDetailId = '';

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
                // staffId = 'd2a653f0-2251-11e6-b1f2-f5e5142d3f50';

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
            type: ETripType.HOTEL,
            invoiceType: EInvoiceType.HOTEL,
        }]
    }
    describe("saveTripPlan", function(){
        it("#saveTripPlan should be ok", function(done){
            //let budgetId = 'cache:budgets:ed4e1520-2234-11e6-89a0-43b37ebb0409:1464756130662p4xkW3';
            API.tripPlan.saveTripPlan({budgetId: '146416455072613g0yw', title: '新增出差计划测试'})
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

        it("#editTripDetailBudget should be ok", function (done) {
            let session = getSession();
            session.accountId = agencyUserId;
            API.tripPlan.editTripDetailBudget({id: tripDetailId}, function (err, ret) {
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