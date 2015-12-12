/**
 * Created by wyl on 15-12-11.
 */
var agencyUser = require("../../../api/client/agencyUser");
//var staffServer = require("../../../api/staff");

var assert = require("assert");

describe("api/client/agencyUser.js", function() {

    var obj = {
        email: "lijun6.wang@tulingdao.com",
        name: "wlj",
        mobile: "13121534026"
    }

    //创建代理商
    /*describe("API.agencyUser.createAgency", function() {
        it("API.agencyUser.createAgency", function(done) {
            agencyUser.createAgency(obj, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                done();
            });
        })
    })*/
    //查询代理商集合
    /*describe("API.agencyUser.listAndPaginateAgency", function() {
        it("API.agencyUser.listAndPaginateAgency", function(done) {
            agencyUser.listAndPaginateAgency({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })*/
    //更新代理商信息
    /*describe("API.agencyUser.updateAgency", function() {
        it("API.agencyUser.updateAgency", function(done) {
            agencyUser.updateAgency("b3204120-9fe9-11e5-bfd2-414faa65c25d", obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //删除代理商信息
    describe("API.agencyUser.deleteAgency", function() {
        it("API.agencyUser.deleteAgency", function(done) {
            agencyUser.deleteAgency({id: "b3204120-9fe9-11e5-bfd2-414faa65c25d"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })

})