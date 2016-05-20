/**
 * Created by wyl on 15-12-11.
 */
"use strict";
var assert = require("assert");
var API = require("common/api");

var getSession = require('common/model').getSession;

var agencyId = '';
var agencyUserId = '';
describe("api/agency", function() {

    describe("registerAgency", function() {
        var agency = {email: "agency.test@jingli.tech", userName: "喵喵", name: '喵喵的代理商', description: '代理商API测试用', mobile: "15269866801"};

        before(function(done){
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        after(function(done){
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        it("#registerAgency should be error with wrong params", function(done) {
            API.agency.registerAgency({}, function(err, ret) {
                assert.equal(ret, null);
                assert(err != null);
                // assert.equal(err.code, -1);
                done();
            })
        });

        it("#registerAgency should be ok with correct params", function(done) {
            API.agency.registerAgency(agency, function(err, ret) {
                assert.equal(err, null);
                assert.equal(ret.target.status, 1);
                var agencyId = ret.target.id;
                var agencyUserId = ret.target.createUser;
                done();
            });
        });


    });

    describe("options baesd on agency created", function() {
        var agencyId = "";
        var agencyUserId = "";
        var agency = {email: "agency.test@jingli.tech", userName: "喵喵", name: '喵喵的代理商', description: '代理商API测试用', mobile: "15269866811"};

        before(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.tech', mobile: agency.mobile})
            ])
                .spread(function(ret1, ret2){
                    return API.agency.registerAgency(agency)
                })
                .then(function(ret){
                    assert.equal(ret.target.status, 1);
                    agencyId = ret.target.id;
                    agencyUserId = ret.target.createUser;
                    var session = getSession();
                    session.accountId = agencyUserId;
                    session.tokenId = tokenId;
                    done();
                })
                .catch(function(err){
                    throw err;
                })

        });

        after(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: '12345678777'}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.tech', mobile: '12345678777'})
            ])
                .spread(function(ret1, ret2){
                    done();
                })
                .catch(function(err){
                    throw err;
                })
        });

        describe('after agency created', function() {
            it("getAgencyById should be ok", function(done) {
                API.agency.getAgencyById.bind(this, {id: agencyId}, function(err, ret) {
                    assert.equal(err, null);
                    assert.equal(ret.target.id, agencyId);
                    done();
                });
            });

            it("#updateAgency should be ok", function(done) {
                var self = {accountId: agencyUserId};
                API.agency.updateAgency.bind(this, {id: agencyId, status: '0', remark: '代理商更新测试', wrongParams: 'wrongParams'}, function(err, ret) {
                    assert.equal(err, null);
                    assert.equal(ret.target.status, 0);
                    done();
                });
            });

            it("#listAgency should be ok", function(done) {
                API.agency.listAgency.bind(this, {}, function(err, ret) {
                    assert.equal(err, null);
                    assert(ret.length >= 0);
                    done();
                });
            });

            it("createAgencyUser should be ok", function(done) {
                API.agency.createAgencyUser.bind(this, {name: '测试代理商用户', email: "agencyUser.test@jingli.tech", mobile: '12345678777', agencyId: agencyId}, function(err, ret) {
                    assert.equal(err, null);
                    assert.equal(ret.status, 0);
                    done();
                });
            });


            it("updateAgencyUser should be ok", function(done) {
                API.agency.updateAgencyUser.bind(this, {status: 1, roleId: 2, id: agencyUserId}, function(err, ret) {
                    assert.equal(err, null);
                    assert.equal(ret.status, 1);
                    assert.equal(ret.roleId, 2);
                    done();
                });
            })

            it("getAgencyUser should be ok", function(done) {
                API.agency.getAgencyUser.bind(this, {id: agencyUserId}, function(err, ret) {
                    assert.equal(err, null);
                    assert.equal(ret.id, agencyUserId);
                    done();
                })
            });

            it("getAgencyUser should be error whit wrong params", function(done) {
                var uuid = require('uuid');
                API.agency.getAgencyUser.bind(this, {id: uuid.v1()}, function(err, ret) {
                    assert.equal(ret, null);
                    assert.equal(err.code, -141);
                    done();
                })
            });


            it("listAgencyUser", function(done) {
                API.agency.listAgencyUser( {}, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    done();
                })
            });


            describe('deleteAgencyUser', function() {
                var newUserId = '';
                before(function(done) {
                    API.agency.createAgencyUser.bind(this, {email: 'deleteAgencyUser.test@jingli.tech', name: '测试代理商用户'}, function(err, ret) {
                        assert.equal(err, null);
                        newUserId = ret.target.id;
                        done();
                    });
                });

                it("deleteAgencyUser should be ok", function(done) {
                    API.agency.deleteAgencyUser.bind(this, {id: agencyUserId}, function (err, ret) {
                        assert.equal(err, null);
                        assert.equal(ret, true);
                        done();
                    });
                });
            });

            describe('deleteAgency', function() {
                var newAgencyId;
                before(function(done) {
                    var agency = {email: "agency.delete@jingli.tech", userName: "喵喵", name: '喵喵的代理商', description: '代理商API测试用', mobile: '15269866821'};
                    API.agency.registerAgency.bind(this, agency, function(err, ret) {
                        assert.equal(ret.target.email, agency.email);
                        newAgencyId = ret.target.id;
                        var newAgencyUserId = ret.target.createUser;
                        var session = getSession();
                        session.accountId = newAgencyUserId;
                        done();
                    });
                });

                it("deleteAgency should be ok", function (done) {
                    API.agency.deleteAgency.bind(this, {id: newAgencyId}, function (err, ret) {
                        assert.equal(err, null);
                        assert.equal(ret, true);
                        done();
                    })
                });
            })


        })

    });



});