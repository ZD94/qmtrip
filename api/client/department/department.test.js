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
    var agencySelf = {};
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
        userName: "departmentTest代理商User",
        name: 'departmentTest的代理商',
        mobile: "15269866777",
        description: '企业API测试用'
    };

    //创建部门
    before(function (done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function (ret1, ret2, ret3) {
                return API.agency.createAgency(agency);
            })
            .then(function (ret) {
                agencyUserId = ret.agencyUser.id;
                agencySelf = {accountId: ret.agencyUser.id};
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function (company) {
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                self = {accountId: accountId};
                done();
            })
            .catch(function (err) {
                console.info(err);
                throw err;
            })
            .done();
    });

    after(function (done) {
        Q.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function (ret1, ret2, ret3) {
                done();
            })
            .catch(function (err) {
                console.info(err);
                throw err;
            })
            .done();
    });
    //创建默认部门
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        API.client.department.createDepartment.call(self, {name: "我的企业1", isDefault: true}, function (err, result) {
            assert.equal(err, null);
            parentId_f = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        API.client.department.createDepartment.call(self, {name: "我的企业2", isDefault: true}, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    //创建部门
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId_f;
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            id = result.id;
            parentId = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售一部";
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售二部";
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId;
        obj.name = "销售三部";
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            id = result.id;
            parentId2 = result.id;
//            console.log(result);
            done();
        });
    })

    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId2;
        obj.name = "销售三(1)部";
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    it("#createDepartment should be ok", function (done) {
        obj.companyId = companyId;
        obj.parentId = parentId2;
        obj.name = "销售三(2)部";
        API.client.department.createDepartment.call(self, obj, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//根据id查询部门
    it("#getDepartment should be ok", function (done) {
        API.client.department.getDepartment.call(self, {id: id}, function (err, result) {
            assert.equal(err, null);
            done();
        });
    })

    //根据企业id查询所有部门
    it("#getAllDepartment should be ok", function (done) {
        API.client.department.getAllDepartment.call(self, {companyId: companyId}, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
//查询默认部门
    it("#getDefaultDepartment should be ok", function (done) {
        API.client.department.getDepartment.call(self, {id: null}, function (err, result) {
            assert.equal(err, null);
            done();
        });
    })
//查询一级部门集合
    it("#getFirstClassDepartments should be ok", function (done) {
        API.client.department.getFirstClassDepartments.call(self, {companyId: companyId}, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//查询直接子级部门集合
    it("#getChildDepartments should be ok", function (done) {
        API.client.department.getChildDepartments.call(self, {parentId: parentId}, function (err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
//查询所有子级部门集合
    it("#getAllChildDepartments should be ok", function (done) {
        API.client.department.getAllChildDepartments.call(self, {parentId: parentId_f}, function (err, result) {
            assert.equal(err, null);
//                console.log(result);
            done();
        });
    })

//根据条件查询部门集合
        it("#getDepartments should be ok", function (done) {
            API.client.department.getDepartments.call(self, {parentId: parentId_f}, function (err, result) {
                assert.equal(err, null);
//                console.log(result);
                done();
            });
        })
//查询所有子级部门id集合
        it("#getAllChildDepartmentsid should be ok", function (done) {
            API.client.department.getAllChildDepartmentsId.call(self, {parentId: parentId_f}, function (err, result) {
                assert.equal(err, null);
//            console.info("parentId_f:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })

        it("#getAllChildDepartmentsid should be ok", function (done) {
            API.client.department.getAllChildDepartmentsId.call(self, {parentId: parentId}, function (err, result) {
                assert.equal(err, null);
//            console.info("parentId:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })

        it("#getDepartmentStructure should be ok", function (done) {
            API.client.department.getDepartmentStructure.call(self, {companyId: companyId}, function (err, result) {
                assert.equal(err, null);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
//更新部门信息
        it("#updateDepartment should be ok", function (done) {
            obj.id = id;
            delete obj.name;
            delete obj.parentId;
            API.client.department.updateDepartment.call(self, obj, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })


        /************************代理商管理企业部门**********************/
        //创建默认部门
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            API.client.department.createDepartment.call(agencySelf, {
                name: "agency我的企业1",
                isDefault: true,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                parentId_f = result.id;
                //console.log(result);
                done();
            });
        })
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            API.client.department.createDepartment.call(agencySelf, {
                name: "agency我的企业2",
                isDefault: true,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
        //创建部门
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId_f;
            obj.name = "agency销售部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                id = result.id;
                parentId = result.id;
                //console.log(result);
                done();
            });
        })
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId;
            obj.name = "agency销售一部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                id = result.id;
                //console.log(result);
                done();
            });
        })
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId;
            obj.name = "agency销售二部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                id = result.id;
                //console.log(result);
                done();
            });
        })
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId;
            obj.name = "agency销售三部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                id = result.id;
                parentId2 = result.id;
                done();
            });
        })

        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId2;
            obj.name = "agency销售三(1)部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
        it("#agencyCreateDepartment should be ok", function (done) {
            obj.companyId = companyId;
            obj.parentId = parentId2;
            obj.name = "agency销售三(2)部";
            if (obj.id) {
                delete obj.id;
            }
            API.client.department.createDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
//根据id查询部门
        it("#agencyGetDepartment should be ok", function (done) {
            API.client.department.getDepartment.call(agencySelf, {
                id: id,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
//根据企业id查询所有部门
        it("#agencyGetAllDepartment should be ok", function (done) {
            API.client.department.getAllDepartment.call(agencySelf, {companyId: companyId}, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
//查询默认部门
        it("#agencyGetDefaultDepartment should be ok", function (done) {
            API.client.department.getDepartment.call(agencySelf, {
                id: null,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
//查询一级部门集合
        it("#agencyGetFirstClassDepartments should be ok", function (done) {
            API.client.department.getFirstClassDepartments.call(agencySelf, {companyId: companyId}, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
//查询直接子级部门集合
        it("#agencyGetChildDepartments should be ok", function (done) {
            API.client.department.getChildDepartments.call(agencySelf, {
                parentId: parentId,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
//查询所有子级部门集合
        it("#agencyGetAllChildDepartments should be ok", function (done) {
            API.client.department.getAllChildDepartments.call(agencySelf, {
                parentId: parentId_f,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
//                console.log(result);
                done();
            });
        })
//查询所有子级部门id集合
        it("#agencyGetAllChildDepartmentsid should be ok", function (done) {
            API.client.department.getAllChildDepartmentsId.call(agencySelf, {
                parentId: parentId_f,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
//            console.info("parentId_f:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })

        it("#agencyGetAllChildDepartmentsid should be ok", function (done) {
            API.client.department.getAllChildDepartmentsId.call(agencySelf, {
                parentId: parentId,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
//            console.info("parentId:",result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })

        it("#agencyGetDepartmentStructure should be ok", function (done) {
            API.client.department.getDepartmentStructure.call(agencySelf, {companyId: companyId}, function (err, result) {
                assert.equal(err, null);
//                console.log(result.items);//item dataValues里存放的才是记录信息
                done();
            });
        })
//更新部门信息
        it("#agencyUpdateDepartment should be ok", function (done) {
            obj.id = id;
            obj.companyId = companyId;
            delete obj.parentId;
            delete obj.name;
            API.client.department.updateDepartment.call(agencySelf, obj, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })

        /************************代理商管理企业部门**********************/

//删除部门信息
        it("#agencyDeleteDepartment should be ok", function (done) {
            API.client.department.deleteDepartment.call(agencySelf, {
                id: id,
                companyId: companyId
            }, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
//删除企业所有部门
        it("#deleteDepartmentByTest should be ok", function (done) {
            API.department.deleteDepartmentByTest({companyId: companyId}, function (err, result) {
                assert.equal(err, null);
                //console.log(result);
                done();
            });
        })
    })