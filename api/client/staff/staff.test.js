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

    var agency = {
        email: "staff.agency.test@tulingdao.com",
        userName: "staffTest代理商",
        name: 'staffTest的代理商',
        mobile: "15269866802",
        description: '企业API测试用'
    };


    //创建员工
    before(function(done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile}),
                API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile})
            ])
            .spread(function(ret1, ret2, ret3, ret4, ret5){
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                agencySelf = {accountId: agencyUserId};
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                ownerSelf = {accountId: accountId};
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    after(function(done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile}),
                API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile})
            ])
            .spread(function(ret1, ret2, ret3, ret4, ret5){
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
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
        API.client.staff.increaseStaffPoint.call(agencySelf, {id: accountId, increasePoint: 2000, remark: "test差旅省钱加积分"}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            //console.log(result);
            done();
        });
    })

//减积分
    describe("decreaseStaffPoint", function(){
        before(function(done){
            API.staff.increaseStaffPoint({id: accountId, companyId: companyId, accountId: agencySelf.accountId, increasePoint: 1000}, function(err, ret){
                if(err){
                    throw err;
                }
                console.info(ret);
                assert.equal(ret, true);
                done();
            })
        })

        it("#decreaseStaffPoint should be ok", function(done) {
            API.client.staff.decreaseStaffPoint.call(agencySelf, {id: accountId, decreasePoint: 1000, remark: "test兑换礼品减积分"}, function(err, ret) {
                assert.equal(err, null);
                assert.equal(ret, true);
                done();
            });
        })
    })


//积分记录查询
    it("#listAndPaginatePointChange should be ok", function(done) {
        API.client.staff.listAndPaginatePointChange.call(ownerSelf, {staffId: id}, function(err, ret) {
            assert.equal(err, null);
            console.info(ret);
            //console.log(err);
            //console.log(result);
            done();
        });
    })
//查询积分变动
    it("#getStaffPointsChange should be ok", function(done) {
        API.client.staff.getStaffPointsChange.call({accountId: id}, {staffId: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            console.log(result);
            done();
        });
    })

//统计人数{adminNum: '管理员人数', commonStaffNum: '普通员工人数', unActiveNum: '未激活人数'};
    it("#statisticStaffsRole should be ok", function(done) {
        API.client.staff.statisticStaffsRole.call(ownerSelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            done();
        });
    })

//统计在职，离职人，本月入职数
    it("#statisticStaffs should be ok", function(done) {
        API.client.staff.statisticStaffs.call(ownerSelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            done();
        });
    })
//查询企业已有部门
    it("#getDistinctDepartment should be ok", function(done) {
        API.client.staff.getDistinctDepartment.call(ownerSelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
//            console.log(result);
            done();
        });
    })
//查询员工总数
    it("#getStaffCountByCompany should be ok", function(done) {
        API.client.staff.getStaffCountByCompany.call(ownerSelf, {companyId: companyId}, function(err, result) {
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


    describe("statStaffPointsByCompany", function(){
        var newOrderId = "";
        var consumeId = "";
        before(function (done) {
            var tripPlanOrder = {
                startPlace: '北京',
                destination: '上海',
                budget: 1000,
                startAt: '2015-12-30 11:12:12',
                consumeDetails: [{
                    startTime: '2016-12-30 11:11:11',
                    budget: 500,
                    invoiceType: 2,
                    type: 0
                }]
            }

            API.client.tripPlan.savePlanOrder.call(ownerSelf, tripPlanOrder)
                .then(function(ret) {
                    newOrderId = ret.id;
                    consumeId = ret.hotel[0].id;
                    return API.tripPlan.uploadInvoice({userId: ownerSelf.accountId, consumeId: consumeId, picture: '测试图片'});
                })
                .then(function(){
                    return API.tripPlan.commitTripPlanOrder({accountId: ownerSelf.accountId, orderId: newOrderId})
                })
                .then(function(ret){
                    return  API.client.agencyTripPlan.approveInvoice.call({accountId: agencyUserId}, {consumeId: consumeId, status: 1, expenditure: '112', remark: '审核票据测试'})
                })
                .then(function(ret){
                    assert.equal(ret, true);
                    done();
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        after(function (done) {
            API.tripPlan.deleteTripPlanOrder({orderId: newOrderId, userId: ownerSelf.accountId})
                .then(function(ret) {
                    assert.equal(ret, true);
                    done();
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        it("#statStaffPointsByCompany should be ok", function(done) {
            API.client.staff.statStaffPointsByCompany.call(ownerSelf, function(err, ret) {
                if(err){
                    throw err;
                }
                done();
            });
        })

        it("#statStaffPointsByAgency should be ok", function(done) {
            API.client.staff.statStaffPointsByAgency.call({accountId: agencyUserId}, companyId, function(err, ret) {
                if(err){
                    throw err;
                }
                assert(ret.totalPoints >= 0);
                done();
            });
        });

        //查询月度积分变动统计
        it("#listAndPagePointsChangeByMonth should be ok", function(done) {
            API.client.staff.listAndPagePointsChangeByMonth.call(ownerSelf, {}, function(err, ret) {
                if(err){
                    throw err;
                }
                assert.equal(ret.length, 6);
                done();
            });
        })

        //查询月度积分变动统计
        it("#listAndPagePointsChangeByMonth should be ok", function(done) {
            API.client.staff.listAndPagePointsChangeByMonth.call(ownerSelf, {count: 7}, function(err, ret) {
                if(err){
                    throw err;
                }
                assert.equal(ret.length, 7);
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
     fs.unlink(filePath);
     console.log("删除临时文件");
     }
     });
     }
     })*/

    /**************代理商管理企业员工*****************/
    //创建员工
    it("#agencyCreateStaff should be ok", function(done) {
        obj.companyId = companyId;
        API.client.staff.agencyCreateStaff.call(agencySelf, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
//                console.log(result);
            id = result.dataValues.id;//回调为何不能直接.id
            done();
        });
    })
    //更新员工信息
    it("#agencyUpdateStaff should be ok", function(done) {
        updateobj.id = id;
        updateobj.companyId = companyId;
        API.client.staff.agencyUpdateStaff.call(agencySelf, updateobj, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            //console.log(result);
            done();
        });
    })
    //通过id得到员工
    it("#agencyGetStaff should be ok", function(done) {
        API.client.staff.agencyGetStaff.call(agencySelf, {id:id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            //console.log(result);
            done();
        });
    })
    //查询员工集合
    it("#agencyListAndPaginateStaff should be ok", function(done) {
        API.client.staff.agencyListAndPaginateStaff.call(agencySelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
    //查询人数
    it("#agencyStatisticStaffsRole should be ok", function(done) {
        API.client.staff.agencyStatisticStaffsRole.call(agencySelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            done();
        });
    })
    //查询员工总数
    it("#agencyGetStaffCountByCompany should be ok", function(done) {
        API.client.staff.agencyGetStaffCountByCompany.call(agencySelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            console.log(result);
            done();
        });
    })
    //统计在职，离职人，本月入职数
    it("#agencyStatisticStaffs should be ok", function(done) {
        API.client.staff.agencyStatisticStaffs.call(agencySelf, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            done();
        });
    })
    //删除员工
    it("#agencyDeleteStaff should be ok", function(done) {
        API.client.staff.agencyDeleteStaff.call(agencySelf, {id: id, companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(err);
            //console.log(result);
            done();
        });
    })

    /**************代理商管理企业员工*****************/


})