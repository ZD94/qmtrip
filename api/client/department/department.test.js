/**
 * Created by wyl on 15-12-12.
 */
var API = require('common/api');

var assert = require("assert");
var Q = require("q");

describe("api/client/department.js", function() {

    var id = "";
    var parentId_f = "";
    var parentId = "";
    var parentId2 = "";
    var agencyUserId = "";
    var self = {};
    var companyId = "";
    var accountId = "";
    var obj = {
        name: "销售部"
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
        email: "department.agency.test@tulingdao.com",
        userName: "departmentTest代理商",
        name: 'departmentTest的代理商',
        mobile: "15269866777",
        description: '企业API测试用'
    };

    //创建部门
    before(function(done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function(ret1, ret2, ret3){
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                self = {accountId: accountId};
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
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function(ret1, ret2, ret3){
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });
    //创建默认部门
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        API.client.department.createDepartment.call(self, {name: "我的企业1", isDefault: true}, function(err, result) {
            assert.equal(err, null);
            parentId_f = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        API.client.department.createDepartment.call(self, {name: "我的企业2", isDefault: true}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    //创建部门
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId_f;
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            parentId = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售一部";
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售二部";
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售三部";
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            parentId2 = result.id;
            //console.log(result);
            done();
        });
    })

    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId2;
        obj.name = "销售三(1)部";
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function(done) {
        obj.companyId = companyId;
        obj.parentId = parentId2;
        obj.name = "销售三(2)部";
        API.client.department.createDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//根据id查询部门
    it("#getDepartment should be ok", function(done) {
        API.client.department.getDepartment.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//查询默认部门
    it("#getDefaultDepartment should be ok", function(done) {
        API.client.department.getDepartment.call(self, {id: null}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//查询一级部门集合
    it("#getFirstClassDepartments should be ok", function(done) {
        API.client.department.getFirstClassDepartments.call(self, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//查询直接子级部门集合
    it("#getChildDepartments should be ok", function(done) {
        API.client.department.getChildDepartments.call(self, {parentId: parentId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//查询所有子级部门集合
    it("#getAllChildDepartments should be ok", function(done) {
        API.client.department.getAllChildDepartments.call(self, {parentId: parentId_f}, function(err, result) {
            assert.equal(err, null);
                console.log(result);
            done();
        });
    })
//查询所有子级部门id集合
    it("#getAllChildDepartmentsid should be ok", function(done) {
        API.client.department.getAllChildDepartmentsId.call(self, {parentId: parentId_f}, function(err, result) {
            assert.equal(err, null);
            console.info("parentId_f:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })

    it("#getAllChildDepartmentsid should be ok", function(done) {
        API.client.department.getAllChildDepartmentsId.call(self, {parentId: parentId}, function(err, result) {
            assert.equal(err, null);
            console.info("parentId:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })

    it("#getDepartmentStructure should be ok", function(done) {
        API.client.department.getDepartmentStructure.call(self, {companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            console.info("getDepartmentStructure:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//更新部门信息
    it("#updateDepartment should be ok", function(done) {
        obj.id = id;
        API.client.department.updateDepartment.call(self, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })

//删除部门信息
    it("#deleteDepartment should be ok", function(done) {
        API.client.department.deleteDepartment.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//删除企业所有部门
    it("#deleteDepartmentByTest should be ok", function(done) {
        API.department.deleteDepartmentByTest({companyId: companyId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
})