/**
 * Created by wyl on 15-12-11.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/agency.js", function() {

    var obj = {
        email: "mingming.wang@tulingdao.com",
        name: "wlj",
        mobile: "13121538754",
        agencyId: "aef7f968-9fe9-11e5-a67e-ad403d808899"
    }
    var id = "";
    /*describe("API.agency.createAgency", function() {
        it("API.agency.createAgency", function(done) {
            API.client.agency.createAgency({}, function(err, result) {
                assert.equal(err, null);
                done();
            });
        })
    })*/

    //创建代理商用户
    describe("API.agency.createAgencyUser", function() {
         it("API.agency.createAgencyUser", function(done) {
             API.agency.createAgencyUser(obj, function(err, result) {
                 assert.equal(err, null);
                 //console.log(result);
                 id = result.id;
                 done();
            });
         })
     })
    //查询代理商
    describe("API.agency.getAgencyUser", function() {
        it("API.agency.getAgencyUser", function(done) {
            API.agency.getAgencyUser({id: id}, function(err, result) {
                assert.equal(err, null);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })

    //查询代理商集合
    describe("API.agency.listAndPaginateAgencyUser", function() {
        it("API.agency.listAndPaginateAgencyUser", function(done) {
            API.agency.listAndPaginateAgencyUser({}, function(err, result) {
                assert.equal(err, null);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    //更新代理商信息
    describe("API.agency.updateAgencyUser", function() {
         it("API.agency.updateAgencyUser", function(done) {
             obj.id = id;
             API.agency.updateAgencyUser(obj, function(err, result) {
                 assert.equal(err, null);
                 //console.log(result);
                 done();
             });
         })
     })
    //删除代理商信息
    describe("API.agency.deleteAgencyUser", function() {
         it("API.agency.deleteAgencyUser", function(done) {
             API.agency.deleteAgencyUser({id: id}, function(err, result) {
                 assert.equal(err, null);
                 //console.log(result);
                 done();
             });
         })
     })

})