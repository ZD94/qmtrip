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
    describe("company option by agency", function() {
        var agencyId = "";

        var company = {
            name: '喵喵的测试企业',
            userName: '测试企业姓名',
            domain: 'tulingdao.com',
            email: 'miaomiao.yu@tulingdao.com',
            mobile: '15269866801',
        }

        before(function(done) {
            var agency = {
                email: "miaomiao.yu@tulingdao.com",
                userName: "喵喵",
                name: '创建企业测试用例代理商',
                mobile: "12345678901",
                remark: '测试用例企业'
            };

            API.agency.registerAgency(agency, function(err, ret) {
                if (err) {
                    throw err;
                }
                agencyId = ret.agency.id;
                self.accountId = ret.agencyUser.id;
                done();
            });
        });

        after(function(done) {
            API.agency.deleteAgency({agencyId: agencyId, userId: self.accountId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#createCompany should be ok", function(done) {
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
            Company.getCompanyListByAgency.call(self, function(err, ret){
                if (err) {
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