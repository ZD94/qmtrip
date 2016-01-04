/**
 * Created by wyl on 15-12-10.
 */
var API = require('common/api');

var assert = require("assert");

describe("api/client/staff.js", function() {

    var id = "0387c260-addb-11e5-abe2-3fab33762bb5";
    var obj = {
        email: "xiaoyu.wang@tulingdao.com",
        name: "wyll",
        mobile: "18345433986",
        companyId: '9f20e3c0-9f24-11e5-beab-31a51ecd9fc2'
    }

    var updateobj = {
        id:"e68e5ef0-9f23-11e5-82c0-0772ae4fad14",
        email: "yali.wang@tulingdao.com",
        name: "wyll",
        mobile: "18345433986",
        companyId: '9f20e3c0-9f24-11e5-beab-31a51ecd9fc2'
    }


    //创建员工
    describe("API.staff.createStaff", function() {
        it("API.staff.createStaff", function(done) {
            API.staff.createStaff(obj, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                id = result.id;
                done();
            });
        })
    })
    //查询员工集合
    describe("API.staff.listAndPaginateStaff", function() {
        it("API.staff.listAndPaginateStaff", function(done) {
            API.staff.listAndPaginateStaff({}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
    })

    //更新员工信息
    describe("API.staff.updateStaff", function() {
        it("API.staff.updateStaff", function(done) {
            API.staff.updateStaff(updateobj, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })
    //通过id得到员工
    describe("API.staff.getStaff", function() {
        it("API.staff.getStaff", function(done) {
            API.staff.getStaff({id:id}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })
    //加积分
    describe("API.staff.increaseStaffPoint", function() {
        it("API.staff.increaseStaffPoint", function(done) {
            API.staff.increaseStaffPoint({id: id, increasePoint: 1000, remark: "差旅省钱加积分"}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })
    //减积分
    describe("API.staff.decreaseStaffPoint", function() {
        it("API.staff.decreaseStaffPoint", function(done) {
            API.staff.decreaseStaffPoint({id: id, decreasePoint: 1000, remark: "兑换礼品减积分"}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })
    //积分记录查询
    describe("API.staff.listAndPaginatePointChange", function() {
        it("API.staff.listAndPaginatePointChange", function(done) {
            API.staff.listAndPaginatePointChange({staffId: id}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })

    //查询人数
    describe("API.staff.statisticStaffsRole", function() {
        it("API.staff.statisticStaffsRole", function(done) {
            API.staff.statisticStaffsRole({companyId: '9f20e3c0-9f24-11e5-beab-31a51ecd9fc2'}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                //console.log(err);
                console.log(result);
                done();
            });
        })
    })

    //删除员工信息
    describe("API.staff.deleteStaff", function() {
        it("API.staff.deleteStaff", function(done) {
            API.staff.deleteStaff({id: id}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    })

    //导入员工
    //describe("API.staff.importExcel", function() {
    //    it("API.staff.importExcel", function(done) {
    //        API.staff.importExcel({}, function(err, result) {//查询条件此处用staffId或者staff_id均可
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