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
    var companyId = "";
    var accountId = "";
    var obj = {
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
        email: 'travelPolicy.company.test@tulingdao.com',
        mobile: '15269866999'
    }

    //创建差旅标准
    describe("API.travelPolicy before", function() {
        before(function(done) {
            var agency = {
                email: "travelPolicy.agency.test@tulingdao.com",
                userName: "travelPolicyTest代理商",
                name: 'travelPolicyTest的代理商',
                mobile: "15269866777",
                description: '企业API测试用'
            };
            API.agency.deleteAgencyByTest({email: "travelPolicy.agency.test@tulingdao.com",mobile:"15269866777"}, function(err, ret) {
                if (err) {
                    throw err;
                }
                API.agency.registerAgency(agency, function(err, ret) {
                    if (err) {
                        throw err;
                    }
                    agencyId = ret.agency.id;
                    agencyUserId = ret.agencyUser.id;
                    done();
                });
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
        describe("API.travelPolicy", function() {
            before(function(done){
                API.client.company.createCompany.call({accountId: agencyUserId}, company, function(err, ret){
                    if(err){
                        throw err;
                    }
                    assert.equal(ret.company.status, 0);
                    companyId = ret.company.id;
                    accountId = ret.company.createUser;
                    self = {accountId: accountId};
                    done();
                })
            });

            after(function(done){
                Q.all([
                        API.company.deleteCompany({companyId: companyId, userId: accountId}),
                        API.staff.deleteStaff({id: accountId})
                    ])
                    .then(function(){
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
            });
            it("#createTravelPolicy should be ok", function(done) {
                API.client.travelPolicy.createTravelPolicy.call(self, obj, function(err, result) {
                    assert.equal(err, null);
                    id = result.id;
                    //console.log(result);
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
                    //console.log(result);
    //                console.log(result.items);//item dataValues里存放的才是记录信息
                    done();
                });
            })
        //更新差旅标准信息
            it("#updateTravelPolicy should be ok", function(done) {
                obj.id = id;
                API.client.travelPolicy.updateTravelPolicy.call(self, obj, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
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
        })
})
})