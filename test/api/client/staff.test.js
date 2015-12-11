/**
 * Created by wyl on 15-12-10.
 */
var staff = require("../../../api/client/staff");
//var staffServer = require("../../../api/staff");

var assert = require("assert");

describe("api/client/staff.js", function() {

    var obj = {
        email: "yali13.wang@tulingdao.com",
        name: "wyl13",
        mobile: "18301208613"
    }

    /*describe("API.staff.createStaff", function() {
        it("API.staff.createStaff", function(done) {
            staff.createStaff(obj, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                done();
            });
        })
    })*/
    /*describe("API.staff.listAndPaginateStaff", function() {
        it("API.staff.listAndPaginateStaff", function(done) {
            staff.listAndPaginateStaff({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                console.log(result.items);//item dataValues里存放的才是记录信息
                *//*{ page: 1,
                    perPage: 6,
                    total: 1,
                    items:
                    [ { dataValues: [Object],
                        _previousDataValues: [Object],
                        _changed: {},
                        '$modelOptions': [Object],
                        '$options': [Object],
                        hasPrimaryKeys: true,
                        __eagerlyLoadedAssociations: [],
                        isNewRecord: false } ],
                        currentPageTotal: 1,
                    pages: 1 }*//*
                done();
            });
        })
    })*/
    /*describe("API.staff.updateStaff", function() {
        it("API.staff.updateStaff", function(done) {
            staff.updateStaff("cae7bfa0-9f25-11e5-ada1-dda0b01c44bc", obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    describe("API.staff.deleteStaff", function() {
        it("API.staff.deleteStaff", function(done) {
            staff.deleteStaff({id: "9f20e3c0-9f24-11e5-beab-31a51ecd9fc2"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })

})