/**
 * Created by wyl on 15-12-10.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/staff.js", function() {

    var obj = {
        email: "yali188.wang@tulingdao.com",
        name: "wyl163",
        mobile: "18301208613",
        companyId: '9f20e3c0-9f24-11e5-beab-31a51ecd9fc2'
    }

    //创建员工
    /*describe("API.staff.createStaff", function() {
        it("API.staff.createStaff", function(done) {
            API.client.staff.createStaff(obj, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.code, 0);
                console.log(result);
                done();
            });
        })
    })*/
    //查询员工集合
    /*describe("API.staff.listAndPaginateStaff", function() {
        it("API.staff.listAndPaginateStaff", function(done) {
            API.client.staff.listAndPaginateStaff({}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
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
    //更新员工信息
    /*describe("API.staff.updateStaff", function() {
        it("API.staff.updateStaff", function(done) {
            API.client.staff.updateStaff("cae7bfa0-9f25-11e5-ada1-dda0b01c44bc", obj, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //删除员工信息
    /*describe("API.staff.deleteStaff", function() {
        it("API.staff.deleteStaff", function(done) {
            API.client.staff.deleteStaff({id: "9f20e3c0-9f24-11e5-beab-31a51ecd9fc2"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //通过id得到员工
    /*describe("API.staff.getStaff", function() {
        it("API.staff.getStaff", function(done) {
            API.client.staff.getStaff("ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6", function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //加积分
    /*describe("API.staff.increaseStaffPoint", function() {
        it("API.staff.increaseStaffPoint", function(done) {
            API.client.staff.increaseStaffPoint({id: "ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6", increasePoint: 1000, remark: "差旅省钱加积分"}, function(err, result) {
                assert.equal(err, null);
                console.log(result);
                done();
            });
        })
    })*/
    //减积分
    /*describe("API.staff.decreaseStaffPoint", function() {
        it("API.staff.decreaseStaffPoint", function(done) {
            API.client.staff.decreaseStaffPoint({id: "ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6", decreasePoint: 1000, remark: "兑换礼品减积分"}, function(err, result) {
                assert.equal(err, null);
                console.log(err);
                console.log(result);
                done();
            });
        })
    })*/
    //积分记录查询
    /*describe("API.staff.listAndPaginatePointChange", function() {
        it("API.staff.listAndPaginatePointChange", function(done) {
            API.client.staff.listAndPaginatePointChange({staffId: "ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6"}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                console.log(err);
                console.log(result);
                done();
            });
        })
    })*/

    //导入员工
    //describe("API.staff.importExcel", function() {
    //    it("API.staff.importExcel", function(done) {
    //        API.client.staff.importExcel({}, function(err, result) {//查询条件此处用staffId或者staff_id均可
    //            assert.equal(err, null);
    //            console.log(err);
    //            console.log(result);
    //            done();
    //        });
    //    })
    //})

    //导入上传结合测试
    /*return staffServer.importExcel({accountId: user_id, md5key: md5key})
     .then(function(result){
     if(result){
     fs.exists(filePath, function (exists) {
     if(exists){
     fs.unlinkSync(filePath);
     console.log("删除临时文件");
     }
     });
     }
     })*/


})