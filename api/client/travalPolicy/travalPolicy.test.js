/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/travalPolicy.js", function() {

    /*var obj = {
        name: "四级标准",
        planeLevel: "经济务舱" ,
        planeDiscount: "7.5",
        trainLevel: "硬卧",
        hotelTevel: "三星级",
        hotelPrice: "300"
    }*/
    var obj = {
        hotel_tevel: "三星级"
    }

    //创建差旅标准
    /*describe("API.travalPolicy.createTravalPolicy", function() {
        it("API.travalPolicy.createTravalPolicy", function(done) {
            API.client.travalPolicy.createTravalPolicy(obj, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                console.log(result);
                done();
            });
        })
    })*/
    //查询差旅标准集合
   /* describe("API.travalPolicy.listAndPaginateTravalPolicy", function() {
        it("API.travalPolicy.listAndPaginateTravalPolicy", function(done) {
            API.client.travalPolicy.listAndPaginateTravalPolicy(obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })*/
    describe("API.travalPolicy.getAllTravalPolicy", function() {
        it("API.travalPolicy.getAllTravalPolicy", function(done) {
            API.client.travalPolicy.getAllTravalPolicy({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    //更新差旅标准信息
    /*describe("API.travalPolicy.updateTravalPolicy", function() {
        it("API.travalPolicy.updateTravalPolicy", function(done) {
            API.client.travalPolicy.updateTravalPolicy("a955ec90-a0ba-11e5-8ce8-73ddefed0683", obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //删除差旅标准信息
    /*describe("API.travalPolicy.deleteTravalPolicy", function() {
        it("API.travalPolicy.deleteTravalPolicy", function(done) {
            API.client.travalPolicy.deleteTravalPolicy({id: "2ef4bb20-a0ba-11e5-a4f1-f32d5bc60ca2"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/

})