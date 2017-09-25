/**
 * Created by wyl on 15-12-12.
 */
var API = require('@jingli/dnode-api');

var assert = require("assert");
var Q = require("q");
import { getSession } from "@jingli/dnode-api";

var id = "";
var parentId_f = "";
var companyId = "";
var agencyId = "";
var accountId = "";
var obj = {
    name: "销售部一部"
}
var company = {
    name: 'departmentTest的企业',
    userName: 'departmentTest企业',
    domain: 'tulingdao.com',
    description: '企业API测试用',
    email: 'department.company.test@tulingdao.com',
    mobile: '15269866999'
}

var agency = {
    email: "dp.agtest@tulingdao.com",
    userName: "dp代理商User",
    name: 'dp的代理商',
    mobile: "15269866777",
    description: '企业API测试用'
};


describe("api/department.js", function() {

    describe("department/staffHandle", function() {
        //创建部门
        before(function (done) {
            Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
                .spread(function (ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function (ret) {
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function (company) {
                    assert.equal(company.status, 0);
                    companyId = company.id;
                    accountId = company.createUser;
                    var session = getSession();
                    session.accountId = accountId;
                })
                .nodeify(done);
        });

        after(function (done) {
            Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
                .spread(function (ret1, ret2, ret3) {
                })
                .nodeify(done);
        });
        //创建默认部门
        it("#createDepartment should be ok", function (done) {
            obj.companyId = companyId;
            API.department.createDepartment(obj, function (err, result) {
                assert.equal(err, null);
                parentId_f = result.id;
                id = result.id;
                done(err);
            });
        })
//根据id查询部门
        it("#getDepartment should be ok", function (done) {
            API.department.getDepartment({id: id}, done);
        })

        //根据企业id查询所有部门
        it("#getAllDepartment should be ok", function (done) {
            API.department.getAllDepartment({companyId: companyId}, done);
        })

//查询默认部门
        it("#getDefaultDepartment should be ok", function (done) {
            API.department.getDefaultDepartment({companyId: companyId}, done);
        })
//查询一级部门集合
        it("#getFirstClassDepartments should be ok", function (done) {
            API.department.getFirstClassDepartments({companyId: companyId}, done);
        })
//查询直接子级部门集合
        it("#getChildDepartments should be ok", function (done) {
            API.department.getChildDepartments({parentId: parentId_f}, done);
        })
//查询所有子级部门集合
        it("#getAllChildDepartments should be ok", function (done) {
            API.department.getAllChildDepartments({parentId: parentId_f},done);
        })

//根据条件查询部门集合
        it("#getDepartments should be ok", function (done) {
            API.department.getDepartments({ where: {companyId: companyId}}, done);
        })

//更新部门信息
        it("#updateDepartment should be ok", function (done) {
            obj.id = id;
            obj.name = "123test";
            API.department.updateDepartment(obj, done);
        })

//删除企业所有部门
        it("#deleteDepartmentByTest should be ok", function (done) {
            API.department.deleteDepartmentByTest({companyId: companyId}, done);
        })

    })

    describe("department/agencyHandle", function() {

        //创建部门
        before(function (done) {
            Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
                .spread(function (ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function (ret) {
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function (company) {
                    assert.equal(company.status, 0);
                    companyId = company.id;
                })
                .nodeify(done);
        });

        after(function (done) {
            Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
                .spread(function (ret1, ret2, ret3) {
                })
                .nodeify(done);
        });
        //创建默认部门
        it("#agencyCreateDepartment should be ok", function (done) {
            if(obj.id){
                delete obj.id;
            }
            obj.companyId = companyId;
            API.department.createDepartment(obj, function (err, result) {
                assert.equal(err, null);
                parentId_f = result.id;
                id = result.id;
                done(err);
            });
        })
//根据id查询部门
        it("#agencyGetDepartment should be ok", function (done) {
            API.department.getDepartment({id: id}, done);
        })

        //根据企业id查询所有部门
        it("#agencyGetAllDepartment should be ok", function (done) {
            API.department.getAllDepartment({companyId: companyId}, done);
        })

//查询默认部门
        it("#agencyGetDefaultDepartment should be ok", function (done) {
            API.department.getDefaultDepartment({companyId: companyId}, done);
        })
//查询一级部门集合
        it("#agencyGetFirstClassDepartments should be ok", function (done) {
            API.department.getFirstClassDepartments({companyId: companyId}, done);
        })
//查询直接子级部门集合
        it("#agencyGetChildDepartments should be ok", function (done) {
            API.department.getChildDepartments({parentId: parentId_f}, done);
        })
//查询所有子级部门集合
        it("#agencyGetAllChildDepartments should be ok", function (done) {
            API.department.getAllChildDepartments({parentId: parentId_f},done);
        })

//根据条件查询部门集合
        it("#agencyGetDepartments should be ok", function (done) {
            API.department.getDepartments({ whre: {companyId: companyId}}, done);
        })

//更新部门信息
        it("#agencyUpdateDepartment should be ok", function (done) {
            obj.id = id;
            obj.name = "123test";
            API.department.updateDepartment(obj, done);
        })

//删除企业所有部门
        it("#agencyDeleteDepartmentByTest should be ok", function (done) {
            API.department.deleteDepartmentByTest({companyId: companyId}, done);
        })

    })

    })