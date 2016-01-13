/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var API = require("common/api");
var Q = require("q");

describe("api/client/company.js", function() {
    //var agencyId = "";
    var companyId = "";
    var ownerUserId = "";
    var agencyUserId = "";

    var agency = {
        email: "company.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的代理商',
        mobile: "15269866802",
        description: '企业API测试用'
    };

    var company = {
        name: '喵喵的企业',
        userName: '喵喵',
        domain: 'tulingdao.com',
        description: '企业API测试用',
        email: 'company.test@tulingdao.com',
        mobile: '15269866802'
    }

    describe("company options by agency", function() {

        before(function(done) {
            API.agency.deleteAgencyByTest({mobile: agency.mobile, email: agency.email})
                .then(function(ret){
                    return API.agency.registerAgency(agency)
                })
                .then(function(ret){
                    agencyId = ret.agency.id;
                    agencyUserId = ret.agencyUser.id;
                    done();
                })
                .catch(function(err){
                    throw err;
                })
        });

        after(function(done) {
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        describe("createCompany", function(){
            before(function(done){
                Q.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            })

            after(function(done){
                Q.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({companyId: companyId, mobile: company.mobile, email: company.email})
                ])
                    .then(function(){
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            })

            it("#createCompany should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.client.company.createCompany.call(self, company, function(err, company){
                    if (err) {
                        throw err;
                    }
                    companyId = company.id;
                    ownerUserId = company.createUser;
                    done();
                })
            });
        })


        describe("company options based on company created", function(){

            before(function(done){
                company.mobile = '15269866812';
                company.email = 'company.test@tulingdao.com';
                Q.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        return API.client.company.createCompany.call({accountId: agencyUserId}, company)
                    })
                    .then(function(company){
                        assert.equal(company.status, 0);
                        companyId = company.id;
                        ownerUserId = company.createUser;
                        done();
                    })
                    .done();
            });

            after(function(done){
                Q.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({companyId: companyId, mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            });


            it("#getCompanyListByAgency should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.client.company.getCompanyListByAgency.call(self, function(err, ret){
                    if (err) {
                        throw err;
                    }
                    assert(ret.length >= 0);
                    done();
                })
            });

            it("#updateCompany should be ok", function(done) {
                var self = {accountId: ownerUserId};
                API.client.company.updateCompany.call(self, {companyId: companyId, status: 1, address: '更新企业测试'}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert.equal(ret.status, 1);
                    done();
                })
            });


            it("#getCompanyById should be ok", function(done) {
                var self = {accountId: ownerUserId};
                API.client.company.getCompanyById.call(self, companyId, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert.equal(ret.id, companyId);
                    done();
                })
            });


            it("#getCompanyFundsAccount should be ok", function(done) {
                var self = {accountId: ownerUserId};
                API.client.company.getCompanyFundsAccount.call(self, companyId, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert.equal(ret.id, companyId);
                    done();
                })
            });


            it("#fundsCharge should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.client.company.fundsCharge.call(self, {channel: '企业账户充值API测试', money: 1000, companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert(ret.income >= 1000);
                    assert(ret.balance >= 0);
                    done();
                })
            });

            it("#fundsCharge should be error with wrong params", function(done) {
                var self = {accountId: agencyUserId};
                API.client.company.fundsCharge.call(self, {channel: '企业账户充值API测试', money: -1000, companyId: companyId}, function(err, ret){
                    assert.equal(err.code, -5); //充值金额不正确
                    assert.equal(ret, null);
                    done();
                })
            });


            it("#frozenMoney should be ok", function(done) {
                var self = {accountId: ownerUserId};
                API.client.company.frozenMoney.call(self, {channel: '企业账户冻结资金API测试', money: 100, companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert(ret.frozen >= 100);
                    assert(ret.balance >= 0);
                    done();
                })
            });


            it("#consumeMoney should be ok", function(done) {
                var self = {accountId: ownerUserId};
                API.client.company.consumeMoney.call(self, {channel: '企业账户消费API测试', money: 100.01, companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert(ret.consume >= 100);
                    assert(ret.balance >= 0);
                    done();
                })
            });

        })

    });

})