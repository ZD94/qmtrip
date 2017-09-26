/**
 * Created by wyl on 15-12-10.
 */
var API = require('@jingli/dnode-api');
var Q = require("q");
var assert = require("assert");

var getSession = require('@jingli/dnode-api').getSession;


var id = "";
var companyId = "";
var accountId = "";
var agencyId = "";
var agencyUserId = "";
var obj = {
    email: "xiaoyu123.wang@tulingdao.com",
    name: "wyll",
    mobile: "18345433986"
}

var updateobj = {
    email: "wxy123@tulingdao.com",
    name: "wyll",
    mobile: "18345433986"
}

var company = {
    name: 'staffTest的企业',
    userName: 'staffTest企业',
    domain: 'tulingdao.com',
    description: '企业API测试用',
    mobile:  '15269866812',
    email: 'cp.teststaff@tulingdao.com'
}

var agency = {
    email: "ag.teststaff@tulingdao.com",
    userName: "staffTest代理商",
    name: 'staffTest的代理商',
    mobile: "15269866802",
    description: '企业API测试用'
};

describe("api/staff.js", function() {

    describe("staff/staffHandel", function() {
        before(function(done) {
            Q.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile, name: updateobj.name}),
                    API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile, name: obj.name})
                ])
                .spread(function(ret1, ret2, ret3, ret4, ret5){
                    return API.agency.registerAgency(agency);
                })
                .then(function(ret){

                    agencyId = ret.id;
                    agencyUserId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyUserId;
                    return API.company.registerCompany(company);

                })
                .then(function(company){

                    assert.equal(company.status, 0);
                    companyId = company.id;
                    accountId = company.createUser;
                    var session = getSession();
                    session.accountId = accountId;

                })
                .catch(function(err){
                    console.info(err);
                    throw err;
                })
                .nodeify(done);
        });

        after(function(done) {
            Q.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile, name: updateobj.name}),
                    API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile, name: obj.name})
                ])
                .spread(function(ret1, ret2, ret3, ret4, ret5){
                })
                .catch(function(err){
                    console.info(err);
                    throw err;
                })
                .nodeify(done);
        });

        //创建员工
        it("#createStaff should be ok", function(done) {
            obj.companyId = companyId;
            API.staff.createStaff(obj, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询员工集合
        it("#listAndPaginateStaff should be ok", function(done) {
            API.staff.listAndPaginateStaff({companyId: companyId}, done);
        })

        //根据条件查询员工集合
        it("#getStaffs should be ok", function(done) {
            API.staff.getStaffs({where: {companyId: companyId}}, done);
        })

        //更新员工信息
        it("#updateStaff should be ok", function(done) {
            updateobj.id = id;
            API.staff.updateStaff(updateobj, done);
        })
        //通过id得到员工
        it("#getStaff should be ok", function(done) {
            API.staff.getStaff({id:id}, done);
        })

        //删除员工信息
        it("#deleteStaff should be ok", function(done) {
            API.staff.deleteStaff({id: id}, done);
        })

    })


    describe("agency/staffHandel", function() {
        before(function(done) {
            Q.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile, name: updateobj.name}),
                    API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile, name: obj.name})
                ])
                .spread(function(ret1, ret2, ret3, ret4, ret5){
                    return API.agency.registerAgency(agency);
                })
                .then(function(ret){

                    agencyId = ret.id;
                    agencyUserId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyUserId;
                    return API.company.registerCompany(company);

                })
                .then(function(company){

                    assert.equal(company.status, 0);
                    companyId = company.id;

                })
                .catch(function(err){
                    console.info(err);
                    throw err;
                })
                .nodeify(done);
        });

        after(function(done) {
            Q.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name}),
                    API.staff.deleteAllStaffByTest({email: updateobj.email, mobile: updateobj.mobile, name: updateobj.name}),
                    API.staff.deleteAllStaffByTest({email: obj.email, mobile: obj.mobile, name: obj.name})
                ])
                .spread(function(ret1, ret2, ret3, ret4, ret5){
                })
                .catch(function(err){
                    console.info(err);
                    throw err;
                })
                .nodeify(done);
        });

        //创建员工
        it("#AgencyCreateStaff should be ok", function(done) {
            if(obj.id){
                delete obj.id;
            }
            obj.companyId = companyId;
            API.staff.createStaff(obj, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询员工集合
        it("#AgencyListAndPaginateStaff should be ok", function(done) {
            API.staff.listAndPaginateStaff({companyId: companyId}, done);
        })

        //根据条件查询员工集合
        it("#AgencyGetStaffs should be ok", function(done) {
            API.staff.getStaffs({ where: {name: "123", companyId: companyId}}, done);
        })

        //更新员工信息
        it("#AgencyUpdateStaff should be ok", function(done) {
            updateobj.id = id;
            updateobj.companyId = companyId;
            API.staff.updateStaff(updateobj, done);
        })
        //通过id得到员工
        it("#AgencyGetStaff should be ok", function(done) {
            API.staff.getStaff({id:id, companyId: companyId}, done);
        })

        //删除员工信息
        it("#AgencyDeleteStaff should be ok", function(done) {
            API.staff.deleteStaff({id: id, companyId: companyId}, done);
        })

    })

})