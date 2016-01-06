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
    var self = {accountId: ""};
    /**
     * 测试前先注册代理商，由代理商创建企业
     */
    before(function(done) {
        var agency = {
            email: "trippan.test@tulingdao.com",
            userName: "白菜帮九袋长老",
            name: '白菜帮',
            mobile: "15269866803",
            description: '计划单测试用代理商'
        };

        var company = {
            email: "trippan.test@tulingdao.com",
            userName: "白菜帮九袋长老",
            name: '白菜帮',
            mobile: "15269866803",
            domain: 'tulingdao.com',
            description: '计划单测试用企业'
        }

        API.agency.registerAgency(agency, function(err, a){
            if(err){
                throw err;
            }
            agencyId = a.agency.id;
            agencyUserId = a.agencyUser.id;
            self.accountId = agencyUserId;
            company.agencyId = agencyId;
            API.client.company.createCompany.call(self, company, function(err, c){
                if(err){
                    throw err;
                }
                companyId = c.company.id;
                staffId = c.company.createUser;
                done();
            })
        })
    });

    after(function(done) {
        Q.all([
            API.agency.deleteAgency({agencyId: agencyId, userId: agencyUserId}),
            API.company.deleteCompany({companyId: companyId, userId: staffId}),
            API.staff.deleteStaff({id: staffId})
        ])
            .then(function(){
                done();
            })
            .catch(function(err){
                throw err;
            })
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
            var self = {accountId: staffId};
            API.client.tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                orderId = ret.id;
                assert.equal(ret.budget, 1000);
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


    describe("options based on tripPlanOrder created", function(){
        var newOrderId = "";
        before(function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
            }
            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder, function(err, ret){
                if(err){
                    throw err;
                }
                newOrderId = ret.id;
                done();
            })
        });

        after(function(done){
            API.tripPlan.deleteTripPlanOrder({orderId: newOrderId, userId: staffId}, function(err, ret){
                if(err){
                    throw err;
                }
                assert.equal(ret.code, 0);
                done();
            })
        })


        it("#getTripPlanOrderById should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanOrderById.call(self, newOrderId, function(err, ret){
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, newOrderId);
                done();
            })
        });

        it("#listTripPlanOrder should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.listTripPlanOrder.call(self, function(err, ret){
                if (err) {
                    throw err;
                }
                assert(ret.length >= 0);
                done();
            })
        });

        it("#listTripPlanOrderByCompany should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.listTripPlanOrderByCompany.call(self, {status: -2}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert(ret.length >= 0);
                done();
            })
        });


        it("#countTripPlanNum should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
                if (err) {
                    throw err;
                }
                assert(ret >= 0);
                done();
            })
        });

    })

})