/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var API = require("common/api");
var getSession = require('common/model').getSession;

describe("api/company", function() {
    var agencyId = "";
    var companyId = "";
    var staffId = "";
    var agencyUserId = "";
    var agency = {email: "company.test@jingli.tech", userName: "喵喵", name: '喵喵的代理商', mobile: "15269866802", description: '企业API测试用'};
    var company = {name: '喵喵的企业', userName: '喵喵', description: '企业API测试用', email: 'company.test@jingli.tech', mobile: '15269866802'}

    describe("company options by agency", function() {

        before(function(done) {
            API.agency.deleteAgencyByTest({mobile: agency.mobile, email: agency.email})
                .then(function(ret){
                    return API.agency.registerAgency(agency)
                })
                .then(function(ret){
                    console.info(ret);
                    var agency = ret.target;
                    agencyId = agency.id;
                    agencyUserId = agency.createUser;
                    var session = getSession();
                    session.accountId = agencyUserId;
                    session.tokenId = 'tokenId';
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

        describe("registerCompany", function(){
            before(function(done){
                Promise.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        assert.equal(ret1, true);
                        assert.equal(ret2, true);
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            })

            after(function(done){
                console.info("**********************");
                console.info('companyId=>', companyId);
                console.info('staffId=>', staffId);
                Promise.all([
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

            it("#registerCompany should be ok", function(done) {
                console.info('agencyUserId=>', agencyUserId);
                API.company.registerCompany(company, function(err, ret){
                    assert.equal(err, null);
                    var company = ret.target;
                    console.info("#######################");
                    console.info(company);
                    companyId = company.id;
                    staffId = company.createUser;
                    done();
                })
            });
        });


        describe("company options based on company created", function(){

            before(function(done){
                company.mobile = '15269866812';
                company.email = 'company.test@jingli.tech';
                Promise.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        assert.equal(ret1, true);
                        assert.equal(ret2, true);
                        return API.company.registerCompany(company);
                    })
                    .then(function(company){
                        assert.equal(company.status, 0);
                        companyId = company.id;
                        staffId = company.createUser;
                        done();
                    })
                    .done();
            });

            after(function(done){
                Promise.all([
                    API.company.deleteCompanyByTest({mobile: company.mobile, email: company.email}),
                    API.staff.deleteAllStaffByTest({companyId: companyId, mobile: company.mobile, email: company.email})
                ])
                    .spread(function(ret1, ret2){
                        assert.equal(ret1, true);
                        assert.equal(ret2, true);
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
                    .done();
            });


            it("#getCompanyListByAgency should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.company.getCompanyListByAgency({}, function(err, ret){
                    if (err) {
                        throw err;
                    }
                    assert(ret.items.length >= 0);
                    done();
                })
            });

            it("#updateCompany should be ok", function(done) {
                var self = {accountId: staffId};
                API.company.updateCompany({id: companyId, status: 1, address: '更新企业测试'}, function(err, ret){
                    assert.equal(err, null);
                    assert.equal(ret.status, 1);
                    done();
                })
            });


            it("#getCompanyById should be ok", function(done) {
                var self = {accountId: staffId};
                API.company.getCompany({id: companyId}, function(err, ret){
                    assert.equal(err, null);
                    assert.equal(ret.id, companyId);
                    done();
                })
            });



            it("#fundsCharge should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.company.fundsCharge({channel: '企业账户充值API测试', money: 1000, companyId: companyId}, function(err, ret){
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
                API.company.fundsCharge({channel: '企业账户充值API测试', money: -1000, companyId: companyId}, function(err, ret){
                    assert.equal(err.code, -5); //充值金额不正确
                    assert.equal(ret, null);
                    done();
                })
            });


            it("#frozenMoney should be ok", function(done) {
                var self = {accountId: staffId};
                API.company.frozenMoney({channel: '企业账户冻结资金API测试', money: 100, companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert(ret.frozen >= 100);
                    assert(ret.balance >= 0);
                    done();
                })
            });


            it("#consumeMoney should be ok", function(done) {
                var self = {accountId: staffId};
                API.company.consumeMoney({channel: '企业账户消费API测试', money: 100.01, companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert(ret.consume >= 100);
                    assert(ret.balance >= 0);
                    done();
                })
            });

            it("#deleteCompany should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.company.deleteCompany({companyId: companyId}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert.equal(ret, true);
                    done();
                })
            });

        })

    });

})