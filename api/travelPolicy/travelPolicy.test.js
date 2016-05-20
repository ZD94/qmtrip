/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/travelPolicy.js", function() {

    var id = "";
    var agencyId = "";
    var agencyUserId = "";
    var self = {};
    var agencySelf = {};
    var companyId = "";
    var accountId = "";
    var zoneAgency = Zone.current.fork({name: 'api/travelPolicy', properties: {session: {accountId: agencyUserId}}});
    var zoneSelf = Zone.current.fork({name: 'api/travelPolicy', properties: {session: {accountId: accountId}}});
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

    //创建差旅标准
    before(function(done) {
        Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
            ])
            .spread(function(ret1, ret2, ret3){
                return API.client.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.id;
                agencyUserId = ret.createUser;
                agencySelf = {accountId: agencyUserId};
                zoneAgency = Zone.current.fork({name: 'api/travelPolicy', properties: {session: {accountId: agencyUserId, tokenId: "tokenId"}}});
                return zoneAgency.run(API.client.company.registerCompany.bind(this,company));
            })
            .then(function(company){
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                self = {accountId: accountId};
                zoneSelf = Zone.current.fork({name: 'api/travelPolicy', properties: {session: {accountId: accountId, tokenId: "tokenId"}}});
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    after(function(done) {
        Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
            ])
            .spread(function(ret1, ret2, ret3){
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });
    it("#createTravelPolicy should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.createTravelPolicy.bind(this, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            done();
        }));
    })
//查询差旅标准
    it("#getTravelPolicyaaa should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.getTravelPolicy.bind(this, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        }));
    })
//查询差旅标准集合
    it("#listAndPaginateTravelPolicy should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.listAndPaginateTravelPolicy.bind(this, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        }));
    })
    it("#getAllTravelPolicy should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.getAllTravelPolicy.bind(this, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
//            console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        }));
    })
    it("#getTravelPolicies should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.getTravelPolicies.bind(this, {name: "456"}, function(err, result) {
//                console.log(result.items);//item dataValues里存放的才是记录信息
            assert.equal(err, null);
            done();
        }));
    })
//更新差旅标准信息
    it("#updateTravelPolicy should be ok", function(done) {
        obj.id = id;
        obj.name = "修改过的";
        zoneSelf.run(API.client.travelPolicy.updateTravelPolicy.bind(this, obj, function(err, result) {
            assert.equal(err, null);
            done();
        }));
    })
//得到企业最新差旅标准
    /*it("#getLatestTravelPolicy should be ok", function(done) {
        obj.id = id;
        zoneSelf.run(API.client.travelPolicy.getLatestTravelPolicy.bind(this, {}, function(err, result) {
            assert.equal(err, null);
//            console.log(result);
            done();
        }));
    })*/
//删除差旅标准信息
    it("#deleteTravelPolicy should be ok", function(done) {
        zoneSelf.run(API.client.travelPolicy.deleteTravelPolicy.bind(this, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        }));
    })
    //企业没有设置差旅标准的情况下得到系统默认差旅标准
    /*it("#getLatestTravelPolicy get default travelPolicy should be ok", function(done) {
        obj.id = id;
        zoneSelf.run(API.client.travelPolicy.getLatestTravelPolicy.bind(this, {}, function(err, result) {
            assert.equal(err, null);
            done();
        }));
    })*/


    /********代理商代企业管理差旅标准api********/
    //创建差旅标准
    /*it("#agencyCreateTravelPolicy should be ok", function(done) {
        obj.companyId = companyId;
        zoneAgency.run(API.client.travelPolicy.createTravelPolicy.bind(this, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        }));
    })
//查询差旅标准
    it("#agencyGetTravelPolicy should be ok", function(done) {
        zoneAgency.run(API.client.travelPolicy.getTravelPolicy.bind(this, {id: id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        }));
    })
//查询差旅标准集合
    it("#agencyListAndPaginateTravelPolicy should be ok", function(done) {
        zoneAgency.run(API.client.travelPolicy.listAndPaginateTravelPolicy.bind(this, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        }));
    })
    //得到所有差旅标准
    it("#agencyGetAllTravelPolicy should be ok", function(done) {
        zoneAgency.run(API.client.travelPolicy.getAllTravelPolicy.bind(this, {companyId: companyId}, function(err, ret) {
            assert.equal(err, null);
            assert(ret.length >= 0);
            done();
        }));
    })
//更新差旅标准信息
    it("#agencyUpdateTravelPolicy should be ok", function(done) {
        obj.id = id;
        obj.companyId = companyId;
        zoneAgency.run(API.client.travelPolicy.updateTravelPolicy.bind(this, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        }));
    })
//删除差旅标准信息
    it("#agencyDeleteTravelPolicy should be ok", function(done) {
        zoneAgency.run(API.client.travelPolicy.deleteTravelPolicy.bind(this, {id: id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        }));
    })*/
    /********代理商代企业管理差旅标准api********/
})