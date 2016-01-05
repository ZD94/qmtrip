/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var Company = require("./index");
var API = require("common/api");
var Q = require("q");
var self = {accountId: ""};


describe("api/client/company.js", function() {

    var companyId = "";
    var ownerUserId = "";
    var agencyUserId = "";
    describe("company option by agency", function() {
        var agencyId = "";

        var company = {
            name: '喵喵的企业',
            userName: '测试企业姓名',
            domain: 'tulingdao.com',
            description: '企业API测试用',
            email: 'company.test@tulingdao.com',
            mobile: '15269866802'
        }

        before(function(done) {
            var agency = {
                email: "company.test@tulingdao.com",
                userName: "喵喵",
                name: '喵喵的代理商',
                mobile: "15269866802",
                description: '企业API测试用'
            };

            API.agency.registerAgency(agency, function(err, ret) {
                if (err) {
                    throw err;
                }
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                done();
            });
        });

        after(function(done) {
            API.agency.deleteAgency({agencyId: agencyId, userId: agencyUserId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#createCompany should be ok", function(done) {
            var self = {accountId: agencyUserId};
            Company.createCompany.call(self, company, function(err, ret){
                if (err) {
                    throw err;
                }
                var company = ret.company;
                companyId = company.id;
                ownerUserId = company.createUser;
                done();
            })
        });

        it("#getCompanyListByAgency should be ok", function(done) {
            var self = {accountId: agencyUserId};
            Company.getCompanyListByAgency.call(self, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });

    });


    describe("API.client.updateCompany company", function(){
        it("#updateCompany should be ok", function(done) {
            var self = {accountId: ownerUserId};
            API.client.company.updateCompany.call(self, {channel: '企业账户充值API测试', money: 1000, companyId: companyId}, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        });
    });



    describe("API.client.fundsCharge company", function(){
        it("#fundsCharge should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.company.fundsCharge.call(self, {channel: '企业账户充值API测试', money: 1000, companyId: companyId}, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        });
    });


    describe("API.client.frozenMoney company", function(){
        it("#frozenMoney should be ok", function(done) {
            var self = {accountId: ownerUserId};
            API.client.company.frozenMoney.call(self, {channel: '企业账户冻结资金API测试', money: 100, companyId: companyId}, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        });
    });


    describe("API.client.consumeMoney company", function(){
        it("#consumeMoney should be ok", function(done) {
            var self = {accountId: ownerUserId};
            API.client.company.consumeMoney.call(self, {channel: '企业账户消费API测试', money: 100.01, companyId: companyId}, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        });
    });


    describe("API.client.getCompanyFundsAccount company", function(){
        it("#getCompanyFundsAccount should be ok", function(done) {
            var self = {accountId: ownerUserId};
            API.client.company.getCompanyFundsAccount.call(self, companyId, function(err, ret){
                if(err){
                    throw err;
                }
                done();
            })
        });
    });


    describe("delete company by test", function(){
        it("#delete company should be ok", function(done) {
            Q.all([
                API.company.deleteCompany({companyId: companyId, userId: ownerUserId}),
                API.staff.deleteStaff({id: ownerUserId})
            ])
                .then(function(){
                    done();
                })
                .catch(function(err){
                    throw err;
                })
        });
    })

})