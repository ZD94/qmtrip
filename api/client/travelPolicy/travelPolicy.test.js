/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/travelPolicy.js", function() {

    /*var obj = {
        name: "四级标准",
        planeLevel: "经济务舱" ,
        planeDiscount: "7.5",
        trainLevel: "硬卧",
        hotelLevel: "三星级",
        hotelPrice: "300"
    }*/
    var obj = {
        hotel_tevel: "三星级"
    }

    //创建差旅标准
    /*describe("API.travelPolicy.createTravelPolicy", function() {
        it("API.travelPolicy.createTravelPolicy", function(done) {
            API.client.travelPolicy.createTravelPolicy(obj, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                console.log(result);
                done();
            });
        })
    })*/
    //查询差旅标准集合
   /* describe("API.travelPolicy.listAndPaginateTravelPolicy", function() {
        it("API.travelPolicy.listAndPaginateTravelPolicy", function(done) {
            API.client.travelPolicy.listAndPaginateTravelPolicy(obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })*/
    describe("API.travelPolicy.getAllTravelPolicy", function() {
        it("API.travelPolicy.getAllTravelPolicy", function(done) {
            API.client.travelPolicy.getAllTravelPolicy({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    //更新差旅标准信息
    /*describe("API.travelPolicy.updateTravelPolicy", function() {
        it("API.travelPolicy.updateTravelPolicy", function(done) {
            API.client.travelPolicy.updateTravelPolicy("a955ec90-a0ba-11e5-8ce8-73ddefed0683", obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //删除差旅标准信息
    /*describe("API.travelPolicy.deleteTravelPolicy", function() {
        it("API.travelPolicy.deleteTravelPolicy", function(done) {
            API.client.travelPolicy.deleteTravelPolicy({id: "2ef4bb20-a0ba-11e5-a4f1-f32d5bc60ca2"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/

})