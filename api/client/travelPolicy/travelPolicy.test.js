/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");
var Q = require("q");

describe("api/client/travelPolicy.js", function() {

    var id = "";
    var agencyId = "";
    var agencyUserId = "";
    var self = {};
    var agencySelf = {};
    var companyId = "";
    var accountId = "";
    var obj= {
        name: "四级标准",
        planeLevel: "经济舱" ,
        planeDiscount: "7.5",
        trainLevel: "硬卧",
        hotelLevel: "三星级",
        hotelPrice: "300",
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
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function(ret1, ret2, ret3){
                return API.agency.createAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                agencySelf = {accountId: agencyUserId};
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                self = {accountId: accountId};
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    after(function(done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
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
        API.client.travelPolicy.createTravelPolicy.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            console.info("result=>",result);
            done();
        });
    })
//查询差旅标准
    it("#getTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.getTravelPolicy.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//查询差旅标准集合
    it("#listAndPaginateTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.listAndPaginateTravelPolicy.call(self, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
    it("#getAllTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.getAllTravelPolicy.call(self, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
//            console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//更新差旅标准信息
    it("#updateTravelPolicy should be ok", function(done) {
        obj.id = id;
        API.client.travelPolicy.updateTravelPolicy.call(self, obj, function(err, result) {
            assert.equal(err, null);
            console.info("updateResult=>", result);
            done();
        });
    })
//得到企业最新差旅标准
    it("#getLatestTravelPolicy should be ok", function(done) {
        obj.id = id;
        API.client.travelPolicy.getLatestTravelPolicy.call(self, {}, function(err, result) {
            assert.equal(err, null);
//            console.log(result);
            done();
        });
    })
//删除差旅标准信息
    it("#deleteTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.deleteTravelPolicy.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    //企业没有设置差旅标准的情况下得到系统默认差旅标准
    it("#getLatestTravelPolicy get default travelPolicy should be ok", function(done) {
        obj.id = id;
        API.client.travelPolicy.getLatestTravelPolicy.call(self, {}, function(err, result) {
            assert.equal(err, null);
            done();
        });
    })


    /********代理商代企业管理差旅标准api********/
    //创建差旅标准
    it("#agencyCreateTravelPolicy should be ok", function(done) {
        obj.companyId = companyId;
        API.client.travelPolicy.createTravelPolicy.call(agencySelf, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
//查询差旅标准
    it("#agencyGetTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.getTravelPolicy.call(agencySelf, {id: id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//查询差旅标准集合
    it("#agencyListAndPaginateTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.listAndPaginateTravelPolicy.call(agencySelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
    //得到所有差旅标准
    it("#agencyGetAllTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.getAllTravelPolicy.call(agencySelf, {companyId: companyId}, function(err, ret) {
            assert.equal(err, null);
            assert(ret.length >= 0);
            done();
        });
    })
//更新差旅标准信息
    it("#agencyUpdateTravelPolicy should be ok", function(done) {
        obj.id = id;
        obj.companyId = companyId;
        API.client.travelPolicy.updateTravelPolicy.call(agencySelf, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//删除差旅标准信息
    it("#agencyDeleteTravelPolicy should be ok", function(done) {
        API.client.travelPolicy.deleteTravelPolicy.call(agencySelf, {id: id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    /********代理商代企业管理差旅标准api********/
})