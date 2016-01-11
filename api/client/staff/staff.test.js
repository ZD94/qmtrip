/**
 * Created by wyl on 15-12-10.
 */
var API = require('common/api');
var Q = require("q");
var assert = require("assert");

describe("api/client/staff.js", function() {

    var id = "";
    var companyId = "";
    var accountId = "";
    var agencyId = "";
    var agencyUserId = "";
    var ownerSelf = {};
    var agencySelf = {};
    var obj = {
        email: "xiaoyu.wang@tulingdao.com",
        name: "wyll",
        mobile: "18345433986"
    }

    var updateobj = {
        email: "sss@tulingdao.com",
        name: "wyll",
        mobile: "18345433986"
    }

    var company = {
        name: 'staffTest的企业',
        userName: 'staffTest企业',
        domain: 'tulingdao.com',
        description: '企业API测试用',
        mobile:  '15269866812',
        email: 'staff.company.test@tulingdao.com'
    }


    //创建员工
    describe("API.staff", function() {
        before(function(done) {
            var agency = {
                email: "staff.agency.test@tulingdao.com",
                userName: "staffTest代理商",
                name: 'staffTest的代理商',
                mobile: "15269866802",
                description: '企业API测试用'
            };


            API.agency.deleteAgencyByTest({email: "staff.agency.test@tulingdao.com",mobile:"15269866802"}, function(err, ret) {
                if (err) {
                    throw err;
                }
                API.agency.registerAgency(agency, function(err, ret) {
                    if (err) {
                        throw err;
                    }
                    agencyId = ret.agency.id;
                    agencyUserId = ret.agencyUser.id;
                    agencySelf = {accountId: agencyUserId};
                    done();
                });
            })

        });

        after(function(done) {
            API.agency.deleteAgency({agencyId: agencyId, userId: agencyUserId}, function (err, ret) {
                if (err) {
                    throw err;
                }
                done();
            })
        });

        describe("API.staff", function(){

            before(function(done){
                API.staff.deleteAllStaffByTest({email:"staff.company.test@tulingdao.com", mobile:"15269866812"}, function(err, ret){
                    if(err){
                        throw err;
                    }
                    API.client.company.createCompany.call({accountId: agencyUserId}, company, function(err, ret){
                        if(err){
                            throw err;
                        }
                        assert.equal(ret.company.status, 0);
                        companyId = ret.company.id;
                        accountId = ret.company.createUser;
                        ownerSelf = {accountId: accountId};
                        done();
                    })
                })

            });

            after(function(done){
                Q.all([
                        API.company.deleteCompany({companyId: companyId, userId: accountId}),
                        API.staff.deleteStaff({id: accountId})
                    ])
                    .then(function(){
                        done();
                    })
                    .catch(function(err){
                        throw err;
                    })
            });

        it("#createStaff should be ok", function(done) {
            obj.companyId = companyId;
            API.client.staff.createStaff.call(ownerSelf, obj, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
//                console.log(result);
                id = result.dataValues.id;//回调为何不能直接.id
                done();
            });
        })
    //查询员工集合
        it("#listAndPaginateStaff should be ok", function(done) {
            API.client.staff.listAndPaginateStaff.call(ownerSelf, {}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })

    //更新员工信息
        it("#updateStaff should be ok", function(done) {
            updateobj.id = id;
            API.client.staff.updateStaff.call(ownerSelf, updateobj, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    //通过id得到员工
        it("#getStaff should be ok", function(done) {
            API.client.staff.getStaff.call(ownerSelf, {id:id}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    //加积分
        it("#increaseStaffPoint should be ok", function(done) {
            API.client.staff.increaseStaffPoint.call(agencySelf, {id: id, increasePoint: 1000, remark: "差旅省钱加积分"}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    //减积分
        it("#decreaseStaffPoint should be ok", function(done) {
            API.client.staff.decreaseStaffPoint.call(agencySelf, {id: id, decreasePoint: 1000, remark: "兑换礼品减积分"}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
    //积分记录查询
        it("#listAndPaginatePointChange should be ok", function(done) {
            API.client.staff.listAndPaginatePointChange.call(ownerSelf, {staffId: id}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })

    //查询人数
        it("#statisticStaffsRole should be ok", function(done) {
            API.client.staff.statisticStaffsRole.call(ownerSelf, {companyId: companyId}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                //console.log(err);
                console.log(result);
                done();
            });
        })
    //查询员工总数
        it("#getStaffCountByCompany should be ok", function(done) {
            API.client.staff.getStaffCountByCompany.call(ownerSelf, {companyId: companyId}, function(err, result) {//查询条件此处用staffId或者staff_id均可
                assert.equal(err, null);
                //console.log(err);
                console.log(result);
                done();
            });
        })

    //删除员工信息
        it("#deleteStaff should be ok", function(done) {
            API.client.staff.deleteStaff.call(ownerSelf, {id: id}, function(err, result) {
                assert.equal(err, null);
                //console.log(err);
                //console.log(result);
                done();
            });
        })
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