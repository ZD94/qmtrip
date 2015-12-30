/**
 * Created by wyl on 15-12-11.
 */
var Agency = require('./index');
var assert = require("assert");
var uuid = require("node-uuid");
var API = require("common/api");
var Q = require('q');

describe("api/client/agency.js", function() {

    var agencyId = "0b8c75a0-ae1c-11e5-9792-93393597ad5e";
    var agencyUserId = "";
    var newUserId = "";

    console.info("init agencyId=>", agencyId);

    var agency = {
        email: "miaomiao.yu@tulingdao.com",
        userName: "喵喵",
        name: '代理商喵喵',
        mobile: "15269866801",
    };

    var accountId = "6cee7e00-aa21-11e5-a377-2fe1a7dbc5e1";
    var self = {accountId: accountId};


    describe("registerAgency", function() {

        it("registerAgency should be ok", function(done) {
            Agency.registerAgency(agency, function(err, ret) {
                if (err) {
                    throw err;
                }
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                //console.info("registerAgency agencyId=>", agencyId);
                //console.info("registerAgency agencyUserId=>", agencyUserId);
                self.accountId = agencyUserId;
                done();
            });
        });
    });

    /**
     * 更新代理商
     */
    describe("updateAgency", function() {
        it("updateAgency should be ok", function(done) {
            Agency.updateAgency.call(self, {agencyId: agencyId, description: '喵喵代理商的描述', status: '1'}, function(err, ret) {
                if (err) {
                    throw err;
                }
                done();
            });
        })
    })


    /**
     * 根据id获取代理商
     */
    describe("getAgencyById", function() {
        it("getAgencyById should be ok", function(done) {
            Agency.getAgencyById.call(self, agencyId, function(err, ret) {
                if (err) {
                    throw err;
                }
                //console.info("****************代理商****************");
                //console.info(ret);
                done();
            });
        })
    });

    /**
     * 获取当前代理商用户
     */
    describe("getCurrentAgencyUser", function() {
        it("getCurrentAgencyUser should be ok", function(done) {
            Agency.getCurrentAgencyUser.call(self, function(err, ret) {
                if (err) {
                    throw err;
                }
                //console.info("****************当前代理商用户****************");
                //console.info(ret);
                done();
            });
        })
    });

    /**
     * 创建代理商用户
     */
    describe("createAgencyUser", function() {
        it("createAgencyUser should be ok", function(done) {
            Agency.createAgencyUser.call(self, {name: '测试代理商用户', email: "test@tulingdao.com", mobile: '12345678904', agencyId: agencyId}, function(err, ret) {
                if (err) {
                    throw err;
                }
                newUserId = ret.id;
                done();
            });
        })
    });

    /**
     * 获取新建的代理商用户
     */
    describe("getAgencyUser", function() {
        it("getAgencyUser should be ok", function(done) {
            Agency.getAgencyUser.call(self, newUserId, function(err, ret) {
                if (err) {
                    throw err;
                }
                //console.info("****************新建的代理商用户****************");
                //console.info(ret);
                done();
            });
        })
    });

    //删除代理商用户
    describe("deleteAgencyUser", function() {
        it("deleteAgencyUser should be ok", function(done) {
            Agency.deleteAgencyUser.call(self, newUserId, function (err, ret) {
                if (err) {
                    throw err;
                }
            })
            done();
        })
    })

    //删除代理商
    describe("deleteAgency", function() {
        it("deleteAgency should be ok", function (done) {
            Agency.deleteAgency.call(self, agencyId, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        })
    })

    //查询代理商集合
    describe("API.agency.listAndPaginateAgencyUser", function() {
        it("API.agency.listAndPaginateAgencyUser", function(done) {
            API.agency.listAndPaginateAgencyUser({}, function(err, result) {
                assert.equal(err, null);
                done();
            });
        })
    })

})