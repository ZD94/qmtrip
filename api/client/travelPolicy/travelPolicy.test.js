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
        name: '喵喵的企业',
        userName: '喵喵',
        domain: 'tulingdao.com',
        description: '企业API测试用',
        email: 'unique.test@tulingdao.com',
        mobile: '15269866802'
    }

    //创建差旅标准
    describe("API.travelPolicy", function() {
        before(function(done) {
            var agency = {
                email: "unique.test@tulingdao.com",
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
        describe("API.travelPolicy", function() {
            before(function(done){
                company.mobile = '15269866812';
                company.email = 'company2.test@tulingdao.com';
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
            it("API.travelPolicy.createTravelPolicy", function(done) {
                API.client.travelPolicy.createTravelPolicy.call(self, obj, function(err, result) {
                    assert.equal(err, null);
                    id = result.id;
                    //console.log(result);
                    done();
                });
            })
        //查询差旅标准
            it("API.travelPolicy.getTravelPolicy", function(done) {
                API.client.travelPolicy.getTravelPolicy.call(self, {id: id}, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
                    done();
                });
            })
        //查询差旅标准集合
            it("API.travelPolicy.listAndPaginateTravelPolicy", function(done) {
                API.client.travelPolicy.listAndPaginateTravelPolicy.call(self, {companyId: companyId}, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
    //                console.log(result.items);//item dataValues里存放的才是记录信息
                    done();
                });
            })
            it("API.travelPolicy.getAllTravelPolicy", function(done) {
                API.client.travelPolicy.getAllTravelPolicy.call(self, {companyId: companyId}, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
    //                console.log(result.items);//item dataValues里存放的才是记录信息
                    done();
                });
            })
        //更新差旅标准信息
            it("API.travelPolicy.updateTravelPolicy", function(done) {
                obj.id = id;
                API.client.travelPolicy.updateTravelPolicy.call(self, obj, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
                    done();
                });
            })
        //删除差旅标准信息
            it("API.travelPolicy.deleteTravelPolicy", function(done) {
                API.client.travelPolicy.deleteTravelPolicy.call(self, {id: id}, function(err, result) {
                    assert.equal(err, null);
                    //console.log(result);
                    done();
                });
            })
        })
})
})