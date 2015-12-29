/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/travelPolicy.js", function() {

    var id = "";
    var companyId = "9f20e3c0-9f24-11e5-beab-31a51ecd9fc2";
    var obj = {
        name: "四级标准",
        planeLevel: "经济舱" ,
        planeDiscount: "7.5",
        trainLevel: "硬卧",
        hotelLevel: "三星级",
        hotelPrice: "300",
        companyId: companyId
    }
    /*var obj = {
        hotel_tevel: "三星级"
    }*/

    //创建差旅标准
    describe("API.travelPolicy.createTravelPolicy", function() {
        it("API.travelPolicy.createTravelPolicy", function(done) {
            API.travelPolicy.createTravelPolicy(obj, function(err, result) {
                assert.equal(err, null);
                id = result.id;
                console.log(result);
                done();
            });
        })
    })
    //查询差旅标准
    describe("API.travelPolicy.getTravelPolicy", function() {
        it("API.travelPolicy.getTravelPolicy", function(done) {
            API.travelPolicy.getTravelPolicy({id: id}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })
    //查询差旅标准集合
    describe("API.travelPolicy.listAndPaginateTravelPolicy", function() {
        it("API.travelPolicy.listAndPaginateTravelPolicy", function(done) {
            API.travelPolicy.listAndPaginateTravelPolicy({companyId: companyId}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    describe("API.travelPolicy.getAllTravelPolicy", function() {
        it("API.travelPolicy.getAllTravelPolicy", function(done) {
            API.travelPolicy.getAllTravelPolicy({companyId: companyId}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })
    //更新差旅标准信息
    describe("API.travelPolicy.updateTravelPolicy", function() {
        it("API.travelPolicy.updateTravelPolicy", function(done) {
            obj.id = id;
            API.travelPolicy.updateTravelPolicy(obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })
    //删除差旅标准信息
    describe("API.travelPolicy.deleteTravelPolicy", function() {
        it("API.travelPolicy.deleteTravelPolicy", function(done) {
            API.travelPolicy.deleteTravelPolicy({id: id}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })

})