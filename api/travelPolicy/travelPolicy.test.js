/**
 * Created by wyl on 15-12-12.
 */
var API = require('@jingli/dnode-api');

var assert = require("assert");
var getSession = require('common/model').getSession;


var id = "";
var agencyId = "";
var agencyUserId = "";
var companyId = "";
var accountId = "";
var obj= {
    name: "四级标准",
    planeLevel: "经济舱" ,
    planeDiscount: "7.5",
    trainLevel: "硬卧",
    hotelLevel: "三星级",
    hotelPrice: "300",
    subsidy: "300",
    companyId: companyId
}
var company = {
    name: 'travelPolicyTest的企业',
    userName: 'travelPolicyTest企业',
    domain: 'tulingdao.com',
    description: '企业API测试用',
    email: 'tp.company.test@tulingdao.com',
    mobile: '15269866999'
}

var agency = {
    email: "tp.agency.test@tulingdao.com",
    userName: "travelPolicyTest代理商",
    name: 'travelPolicyTest的代理商',
    mobile: "15269866777",
    description: '企业API测试用'
};

describe("api/travelPolicy.js", function() {

    describe("travelPolicy/companyHndel", function() {

        //创建差旅标准
        before(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .spread(function(ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function(ret){
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function(company){
                    assert.equal(company.status, 0);
                    companyId = company.id;
                    accountId = company.createUser;
                    var session = getSession();
                    session.accountId = accountId;
                })
                .nodeify(done);
        });

        after(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .nodeify(done);
        });
        it("#createTravelPolicy should be ok", function(done) {
            obj.companyId = companyId;
            API.travelPolicy.createTravelPolicy(obj, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询差旅标准
        it("#getTravelPolicyaaa should be ok", function(done) {
            API.travelPolicy.getTravelPolicy({id: id}, done);
        })
        //查询差旅标准集合
        it("#listAndPaginateTravelPolicy should be ok", function(done) {
            API.travelPolicy.listAndPaginateTravelPolicy({companyId: companyId}, done);
        })
        it("#getAllTravelPolicy should be ok", function(done) {
            API.travelPolicy.getAllTravelPolicy({companyId: companyId}, done);
        })
        it("#getTravelPolicies should be ok", function(done) {
            API.travelPolicy.getTravelPolicies({name: "456", companyId: companyId}, done);
        })
        //更新差旅标准信息
        it("#updateTravelPolicy should be ok", function(done) {
            obj.id = id;
            obj.name = "修改过的123";
            API.travelPolicy.updateTravelPolicy(obj, done);
        })
        //删除差旅标准信息
        it("#deleteTravelPolicy should be ok", function(done) {
            API.travelPolicy.deleteTravelPolicy({id: id}, done);
        })

    });


    describe("travelPolicy/agencyHandel", function() {
        var objTwo= {
            name: "四级标准",
            planeLevel: "经济舱" ,
            planeDiscount: "7.5",
            trainLevel: "硬卧",
            hotelLevel: "三星级",
            hotelPrice: "300",
            subsidy: "300"
        }
        /********代理商代企业管理差旅标准api********/

        before(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .spread(function(ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function(ret){
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function(company){
                    assert.equal(company.status, 0);
                    companyId = company.id;
                })
                .nodeify(done);
        });

        after(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .nodeify(done);
        });


        //创建差旅标准
        it("#agencyCreateTravelPolicy should be ok", function(done) {
            objTwo.companyId = companyId;
            objTwo.name = "agencyCreateTravelPolicy";
            API.travelPolicy.createTravelPolicy(objTwo, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询差旅标准
        it("#agencyGetTravelPolicy should be ok", function(done) {
            API.travelPolicy.getTravelPolicy({id: id, companyId: companyId}, done);
        })
        //查询差旅标准集合
        it("#agencyListAndPaginateTravelPolicy should be ok", function(done) {
            API.travelPolicy.listAndPaginateTravelPolicy({companyId: companyId}, done);
        })
        //得到所有差旅标准
        it("#agencyGetAllTravelPolicy should be ok", function(done) {
            API.travelPolicy.getAllTravelPolicy({companyId: companyId})
                .tap(function(ret) {
                    assert(ret.length >= 0);
                })
                .nodeify(done);
        })
        it("#agencyGetTravelPolicies should be ok", function(done) {
            API.travelPolicy.getTravelPolicies({name: "456", companyId: companyId}, done);
        })

        //更新差旅标准信息
        it("#agencyUpdateTravelPolicy should be ok", function(done) {
            objTwo.id = id;
            objTwo.name = "修改过的456";
            objTwo.companyId = companyId;
            API.travelPolicy.updateTravelPolicy(objTwo)
                .nodeify(done);
        })
        //删除差旅标准信息
        it("#agencyDeleteTravelPolicy should be ok", function(done) {
            API.travelPolicy.deleteTravelPolicy({id: id, companyId: companyId})
                .nodeify(done);
        })
        /********代理商代企业管理差旅标准api********/
    })

})