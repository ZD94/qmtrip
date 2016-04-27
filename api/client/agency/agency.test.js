/**
 * Created by wyl on 15-12-11.
 */
"use strict";
var assert = require("assert");
var API = require("common/api");

var agencyId = '';
var agencyUserId = '';

describe("api/client/agency.js", function() {


    describe("registerAgency", function() {

        var agency = {
            email: "agency.test@jingli.com",
            userName: "喵喵",
            name: '喵喵的代理商',
            description: '代理商API测试用',
            mobile: "15269866801"
        };
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
            API.client.agency.registerAgency({}, function(err, ret) {
                assert.equal(ret, null);
                assert.equal(err.code, -1);
                done();
            });
        });

        it("#registerAgency should be ok with correct params", function(done) {
            API.client.agency.registerAgency(agency, function(err, ret) {
                if (err) {
                    throw err;
                }
                
                assert.equal(ret.agency.status, 0);
                var agencyId = ret.agency.id;
                var agencyUserId = ret.agencyUser.id;
                done();
            });
        });

        // it("#createAgencyTest should be ok with correct params", function(done) {
        //     API.client.agency.createAgency(agency, function(err, ret) {
        //         if (err) {
        //             throw err;
        //         }
        //
        //         assert.equal(ret.agency.status, 0);
        //         done();
        //     });
        // });

    });


    describe("agency and agencyUser options", function() {
        var agencyId = "";
        var agencyUserId = "";

        var agency = {
            email: "agency.test@jingli.com",
            userName: "喵喵",
            name: '喵喵的代理商',
            description: '代理商API测试用',
            mobile: "15269866811"
        };
        before(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.com', mobile: agency.mobile})
            ])
                .spread(function(ret1, ret2){
                    return API.client.agency.registerAgency(agency)
                })
                .then(function(ret){
                    assert.equal(ret.agency.status, 0);
                    agencyId = ret.agency.id;
                    agencyUserId = ret.agencyUser.id;
                    done();
                })
                .catch(function(err){
                    throw err;
                })

        });

        after(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: '12345678777'}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.com', mobile: '12345678777'})
            ])
                .spread(function(ret1, ret2){
                    done();
                })
                .catch(function(err){
                    throw err;
                })
        });

        it("#updateAgency should be ok", function(done) {
            var self = {accountId: agencyUserId};
            API.client.agency.updateAgency.call(self, {agencyId: agencyId, status: '1', remark: '代理商更新测试', wrongParams: 'wrongParams'}, function(err, ret) {
                if (err) {
                    throw err;
                }
                
                assert.equal(ret.status, 1);
                done();
            })
        });


        it("getAgencyById should be ok", function(done) {
            API.client.agency.getAgencyById.call({accountId: agencyUserId}, {agencyId: agencyId}, function(err, ret) {
                if (err) {
                    throw err;
                }

                assert.equal(ret.id, agencyId);
                done();
            })
        });

        it("#listAgency should be ok", function(done) {
            API.client.agency.listAgency.call({accountId: agencyUserId}, {}, function(err, ret) {
                if (err) {
                    throw err;
                }

                done();
            })
        })


        it("createAgencyUser should be ok", function(done) {
            API.client.agency.createAgencyUser.call({accountId: agencyUserId},
                {name: '测试代理商用户', email: "agencyUser.test@jingli.com", mobile: '12345678777', agencyId: agencyId},
                function(err, ret) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(ret.status, 0);
                    done();
            });
        })


        it("updateAgencyUser should be ok", function(done) {
            API.client.agency.updateAgencyUser.call({accountId: agencyUserId}, {status: 1, roleId: 2, id: agencyUserId}, function(err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.status, 1);
                assert.equal(ret.roleId, 2);
                done();
            });
        })


        it("getCurrentAgencyUser should be ok", function(done) {
            API.client.agency.getCurrentAgencyUser.call({accountId: agencyUserId}, function(err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, agencyUserId);
                done();
            })
        });



        it("getAgencyUser should be ok", function(done) {
            API.client.agency.getAgencyUser.call({accountId: agencyUserId}, {agencyUserId: agencyUserId}, function(err, ret) {
                if (err) {
                    throw err;
                }
                assert.equal(ret.id, agencyUserId);
                done();
            })
        });


        it("API.agency.listAndPaginateAgencyUser", function(done) {
            API.client.agency.listAndPaginateAgencyUser.call({accountId: agencyUserId}, {}, function(err, ret) {
                if (err) {
                    throw err;
                }

                assert(ret.items.length >= 0);
                done();
            })
        });


        it("deleteAgency should be ok", function (done) {
            API.client.agency.deleteAgency.call({accountId: agencyUserId}, {agencyId: agencyId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

    });


    describe("deleteAgencyUser", function(){
        var _newAgencyUser = "";
        var _agencyId = "";
        var _agencyUserId = "";

        var agency = {
            email: "agency.test@jingli.com",
            userName: "喵喵",
            name: '喵喵的代理商',
            description: '代理商API测试用',
            mobile: "15269866821"
        };
        before(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.com', mobile: agency.mobile})
            ])
                .spread(function(ret1, ret2){
                    return API.client.agency.registerAgency(agency)
                })
                .then(function(ret){
                    assert.equal(ret.agency.status, 0);
                    _agencyId = ret.agency.id;
                    _agencyUserId = ret.agencyUser.id;
                })
                .then(function(){
                    return  API.client.agency.createAgencyUser.call({accountId: _agencyUserId},
                        {name: '测试代理商用户', email: "agencyUser.test@jingli.com", mobile: '12345678777', agencyId: _agencyId})
                })
                .then(function(ret){
                    assert.equal(ret.status, 0);
                    _newAgencyUser = ret.id;
                    done();
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        after(function(done){
            Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.agency.deleteAgencyByTest({email: 'agencyUser.test@jingli.com', mobile: agency.mobile})
            ])
                .spread(function(ret1, ret2){
                    done();
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        it("deleteAgencyUser should be ok", function(done) {
            API.client.agency.deleteAgencyUser.call({accountId: _agencyUserId}, {userId: _newAgencyUser}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });
    })


})