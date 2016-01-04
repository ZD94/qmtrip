/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var Q = require("q");
var uuid = require("node-uuid");
var API = require("common/api");

describe("api/client/tripPlan.js", function() {

    //describe("API.tripPlan.listTripPlanOrder", function() {
    //    it("#deleteTripPlanOrder should be ok", function(done) {
    //        tripPlan.deleteTripPlanOrder.call(self, orderId, function(err, ret){
    //            if (err) {
    //                throw err;
    //            }
    //            done();
    //        })
    //    });
    //})
    //
    //
    //describe("API.tripPlan.listTripPlanOrder", function() {
    //    it("#listTripPlanOrder should be ok", function(done) {
    //        tripPlan.listTripPlanOrder.call(self, {}, function(err, ret){
    //            if (err) {
    //                throw err;
    //            }
    //            //console.info("共列出计划单=>", ret.length);
    //            done();
    //        })
    //    });
    //})
    //
    //
    //describe("API.tripPlan.countTripPlanNum", function() {
    //    it("#countTripPlanNum should be ok", function(done) {
    //        tripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
    //            if (err) {
    //                throw err;
    //            }
    //            done();
    //        })
    //    });
    //})
    //
    //
    //describe("API.tripPlan.saveConsumeDetail", function() {
    //    it("#saveConsumeDetail should be ok", function(done){
    //        var tripPlanOrder = {
    //            orderId: "bb9dc000-ade2-11e5-a7fa-35aeb147987c",
    //            type: -1,
    //            startTime: '2015-12-31 10:00:00',
    //            invoiceType: 1,
    //            startPlace: '北京',
    //            destination: '上海',
    //            budget: '1000',
    //        }
    //        tripPlan.saveConsumeDetail.call(self, tripPlanOrder, function(err, ret){
    //            if(err){
    //                throw err;
    //            }
    //            orderId = ret.id;
    //            done();
    //        })
    //    })
    //});


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
            userName: "计划单测使用代理商用户",
            name: '喵喵的代理商',
            mobile: "15269866803",
            description: '计划单测使用代理商'
        };

        var company = {
            email: "trippan.test@tulingdao.com",
            userName: "喵喵",
            name: '喵喵的企业',
            mobile: "15269866803",
            domain: 'tulingdao.com',
            description: '计划单测使用企业'
        }

        API.agency.registerAgency(agency, function(err, a){
            if(err){
                throw err;
            }
            agencyId = a.agency.id;
            agencyUserId = a.agencyUser.id;
            self.accountId = agencyUserId;
            company.agencyId = agencyId;
            //console.info("agencyId=>", agencyId);
            //console.info("agencyUserId=>", agencyUserId);
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

    describe("API.tripPlan.savePlanOrder", function() {
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
                done();
            })
        })
    });

    describe("API.tripPlan.getTripPlanOrderById", function() {
        it("#getTripPlanOrderById should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.getTripPlanOrderById.call(self, orderId, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    });


    describe("API.tripPlan.countTripPlanNum", function() {
        it("#countTripPlanNum should be ok", function(done) {
            var self = {accountId: staffId};
            API.client.tripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
                if (err) {
                    throw err;
                }
                //console.info("查询的计划单数目是=>", ret);
                done();
            })
        });
    })


})