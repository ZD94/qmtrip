/**
 * Created by wyl on 15-12-11.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/agency.js", function() {

    var obj = {
        email: "lijun6.wang@tulingdao.com",
        name: "wlj",
        mobile: "13121534026"
    }

    //创建代理商
    /*describe("API.agency.createAgencyUser", function() {
     it("API.agency.createAgencyUser", function(done) {
     API.client.agency.createAgencyUser(obj, function(err, result) {
     assert.equal(err, null);
     assert.equal(result.code, 0);
     done();
     });
     })
     })*/
    //查询代理商集合
    describe("API.agency.listAndPaginateAgencyUser", function() {
        it("API.agency.listAndPaginateAgencyUser", function(done) {
            API.client.agency.listAndPaginateAgencyUser({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    //更新代理商信息
    /*describe("API.agency.updateAgencyUser", function() {
     it("API.agency.updateAgencyUser", function(done) {
     API.client.agency.updateAgencyUser("b3204120-9fe9-11e5-bfd2-414faa65c25d", obj, function(err, result) {
     assert.equal(err, null);
     console.log(result);
     done();
     });
     })
     })*/
    //删除代理商信息
    /*describe("API.agency.deleteAgencyUser", function() {
     it("API.agency.deleteAgencyUser", function(done) {
     API.client.agency.deleteAgencyUser({id: "b3204120-9fe9-11e5-bfd2-414faa65c25d"}, function(err, result) {
     assert.equal(err, null);
     console.log(result);
     done();
     });
     })
     })*/

})