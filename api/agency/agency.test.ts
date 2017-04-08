/**
 * Created by wyl on 15-12-11.
 */
"use strict";
var API = require("common/api");
import assert = require("assert");
import {Models} from '_types';
import {getSession} from 'common/model';

describe("api/agency", function() {
    var agencyDefault = {email: "agency.test@jingli.tech", userName: "喵喵", name: '喵喵的代理商', description: '代理商API测试用', mobile: "15269866811"};

    async function deleteAgencyByTest(){
        let agencies = await Models.agency.find({
            where: {
                $or: [{email: {$like: '%.test@jingli.tech'}}, {mobile: agencyDefault.mobile}, {name: agencyDefault.name}]
            },
            paranoid:false
        });
        await Promise.all(agencies.map(async function(agency) {
            let users = await Models.agencyUser.find({where: {agencyId: agency.id}, paranoid: false})
            await Promise.all(users.map((user)=>user.destroy({force: true})));
            await agency.destroy({force: true});
        }));
    }
    describe("registerAgency", function(){

        before(function(done){
            deleteAgencyByTest()
                .nodeify(done);
        });

        after(function(done){
            deleteAgencyByTest()
                .nodeify(done);
        });

        it("#registerAgency should be error with wrong params", function(done) {
            API.agency.registerAgency({})
                .then(function(ret) {
                    assert.equal(ret, null);
                })
                .catch(function(err) {
                    assert(err != null);
                    // assert.equal(err.code, -1);
                })
                .nodeify(done);
        });

        it("#registerAgency should be ok with correct params", function(done) {
            API.agency.registerAgency(agencyDefault)
                .then(function(ret){
                    assert.equal(ret.target.status, 1);
                })
                .nodeify(done);
        });
    });


    describe("options baesd on agencyDefault created", function() {
        var agencyId = "";
        var agencyUserId = "";

        before(function(done){
            deleteAgencyByTest()
                .then(function(){
                    return API.agency.registerAgency(agencyDefault);
                })
                .then(function(ret){
                    assert.equal(ret.target.status, 1);
                    agencyId = ret.target.id;
                    agencyUserId = ret.target.createUser;
                    var session = getSession();
                    session.accountId = agencyUserId;
                })
                .nodeify(done);
        });

        after(function(done){
            deleteAgencyByTest()
                .nodeify(done);
        });

        describe('after agencyDefault created', function() {
            it("getAgencyById should be ok", function() {
                return API.agency.getAgencyById({id: agencyId})
                    .then(function(ret) {
                        assert.equal(ret.target.id, agencyId);
                    });
            });

            it("#updateAgency should be ok", function(done) {
                API.agency.updateAgency({id: agencyId, status: '0', remark: '代理商更新测试', wrongParams: 'wrongParams'}, function(err, ret) {
                    assert.equal(ret.target.status, 0);
                    done(err);
                });
            });

            it("#listAgency should be ok", function(done) {
                API.agency.listAgency({}, function(err, ret) {
                    assert(ret.length >= 0);
                    done(err);
                });
            });

            it("createAgencyUser should be ok", function(done) {
                API.agency.createAgencyUser({name: '测试代理商用户', email: "createAgencyUser.test@jingli.tech", agencyId: agencyId})
                    .then(function(ret){
                        assert.equal(ret.status, 0);
                    })
                    .nodeify(done);
            });


            it("updateAgencyUser should be ok", function(done) {
                API.agency.updateAgencyUser({status: 1, roleId: 2, id: agencyUserId}, function(err, ret) {
                    assert.equal(ret.target.status, 1);
                    assert.equal(ret.target.roleId, 2);
                    done(err);
                });
            });

            it("getAgencyUser should be ok", function(done) {
                API.agency.getAgencyUser({id: agencyUserId}, function(err, ret) {
                    assert.equal(ret.id, agencyUserId);
                    done(err);
                })
            });

            it("getAgencyUser should be error whit wrong params", function(done) {
                var uuid = require('uuid');
                API.agency.getAgencyUser({id: uuid.v1()}, function(err, ret) {
                    assert(err != null);
                    assert.equal(err.code, 404);
                    done();
                })
            });


            it("listAgencyUser should be ok", function(done) {
                API.agency.listAgencyUser({}, function(err, ret) {
                    assert.equal(err, null);
                    assert(ret.length >= 0);
                    done(err);
                })
            });


            describe('deleteAgencyUser', function() {
                var newUserId = '';
                before(function(done) {
                    API.agency.createAgencyUser({email: 'deleteAgencyUser.test@jingli.tech', name: '测试代理商用户'}, function(err, ret) {
                        newUserId = ret.target.id;
                        done(err);
                    });
                });

                it("deleteAgencyUser should be ok", function(done) {
                    API.agency.deleteAgencyUser({id: newUserId}, function (err, ret) {
                        assert.equal(ret, true);
                        done(err);
                    });
                });

                it("deleteAgency should be ok", function (done) {
                    API.agency.deleteAgency({id: agencyId}, function (err, ret) {
                        assert.equal(err, null);
                        assert.equal(ret, true);
                        done(err);
                    })
                });
            });


            // describe('deleteAgency', function() {
            //     var newAgencyId;
            //     var newAgencyUserId;
            //     before(function(done) {
            //         var agency = {email: "agencyDelete.test@jingli.tech", userName: "喵喵", name: '喵喵的代理商', description: '代理商API测试用', mobile: '15269866821'};
            //         API.agency.registerAgency(agency, function(err, ret) {
            //             assert.equal(ret.target.email, agency.email);
            //             newAgencyId = ret.target.id;
            //             newAgencyUserId = ret.target.createUser;
            //             var session = getSession();
            //             session.accountId = newAgencyUserId;
            //             session.tokenId = 'tokenId';
            //             done(err);
            //         });
            //     });
            //
            //     after(function(done){
            //         deleteAgencyByTest()
            //             .nodeify(done);
            //     });
            //
            //     it("deleteAgency should be ok", function (done) {
            //         API.agency.deleteAgency({id: newAgencyId}, function (err, ret) {
            //             assert.equal(err, null);
            //             assert.equal(ret, true);
            //             done(err);
            //         })
            //     });
            // })

        })

    });



});