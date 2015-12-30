/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var Company = require("./index");
var API = require("common/api");
var self = {accountId: ""};

describe("api/client/company.js", function() {

    describe("getCompanyListByAgency", function() {
        var agencyId = "";

        var company = {
            name: '测试企业',
            domainName: 'tulingdao.com',
            email: 'miaomiao.yu@tulingdao.com',
            mobile: '15269866801'
        }

        before(function(done) {
            var agency = {
                email: "miaomiao.yu@tulingdao.com",
                userName: "喵喵",
                name: '喵喵的代理商',
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

})