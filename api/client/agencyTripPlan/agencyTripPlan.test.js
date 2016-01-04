/**
 * Created by wyl on 15-12-12.
 */
//var API = require('common/api');

var assert = require("assert");
var Q = require("q");
var uuid = require("node-uuid");
var API = require("common/api");

describe("api/client/agencyTripPlan.js", function() {
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
            API.staff.deleteStaff({id: staffId}),
            API.tripPlan.deleteTripPlanOrder({orderId: orderId, userId: staffId})
        ])
            .then(function(){
                done();
            })
            .catch(function(err){
                throw err;
            })
    });


    describe("create tripPlanOrder by staff", function() {
        it("#create tripPlanOrder should be ok", function(done){
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
            }
            var self = {accountId: staffId};
            API.client.tripPlan.savePlanOrder.call(self, tripPlanOrder, function(err, order){
                if(err){
                    throw err;
                }
                orderId = order.id;
                done();
            })
        })
    });


    describe("API.agencyTripPlan.getTripPlanOrderById", function() {
        it("#getTripPlanOrderById should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agencyTripPlan.getTripPlanOrderById.call(self, orderId, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    });





    describe("API.agencyTripPlan.listTripPlanOrder", function() {
        it("#listTripPlanOrder should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agencyTripPlan.listAllTripPlanOrder.call(self, orderId, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    });


    describe("API.tripPlan.countTripPlanNum", function() {
        it("#countTripPlanNum should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agencyTripPlan.countTripPlanNum.call(self, {companyId: companyId}, function(err, ret){
                if (err) {
                    throw err;
                }
                //console.info("查询的计划单数目是=>", ret);
                done();
            })
        });
    })

})