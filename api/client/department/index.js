/**
 * Created by wyl on 11-01-20.
 */
'use strict';

/**
 * @module API
 */
var API = require("common/api");
var auth = require("../auth");
/**
 * @class department 部门
 */
var department = {};

/**
 * @method createDepartment
 *
 * 企业创建部门
 *
 * @param params
 * @returns {*|Promise}
 */
department.createDepartment = auth.checkPermission(["department.add"],
    function(params){
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                if(data.code){
                    throw {code: -1, msg: '无权限'};
                }
                params.companyId = data.companyId;//只允许添加该企业下的部门
                return API.department.createDepartment(params);
            });
    });

department.agencyCreateDepartment = function(params){
        var user_id = this.accountId;
        if(!params.companyId){
            throw {code:-1, msg:"companyId不能为空"};
        }
        return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
            .then(function(result){
                if(result){
                    return API.department.createDepartment(params);
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            })
};

/**
 * @method createDepartment
 * 查询企业全部部门结构
 * @param params
 * @param params。companyId 企业id
 * @returns {*|Promise}
 */
department.getDepartmentStructure = auth.checkPermission(["department.query"],
    function(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data.code){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = data.companyId;//只允许添加该企业下的部门
            return API.department.getDepartmentStructure(params);
        });
});

department.agencyGetDepartmentStructure = function(params){
        var user_id = this.accountId;
        if(!params.companyId){
            throw {code:-1, msg:"companyId不能为空"};
        }
        return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
            .then(function(result){
                if(result){
                    return API.department.getDepartmentStructure(params);
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            })
    };

/**
 * @method deleteDepartment
 * 企业删除部门
 * @param params
 * @returns {*|Promise}
 */
department.deleteDepartment = auth.checkPermission(["department.delete"],
    function(params){
        return API.department.deleteDepartment(params);
});

department.agencyDeleteDepartment = function(params){
        var user_id = this.accountId;
        if(!params.companyId){
            throw {code:-1, msg:"companyId不能为空"};
        }
        return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
            .then(function(result){
                delete params.companyId;
                if(result){
                    return API.department.deleteDepartment(params);
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            })
    };

/**
 * @method updateDepartment
 * 企业更新部门
 * @param id
 * @param params
 * @returns {*|Promise}
 */
department.updateDepartment = auth.checkPermission(["department.update"],
    function(params){
        var user_id = this.accountId;
        var company_id;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                company_id = data.companyId;
                return API.department.getDepartment({id: params.id});
            })
            .then(function(tp){
                if(tp.companyId != company_id){
                    throw {code: -1, msg: '无权限'};
                }
                params.companyId = company_id;
                return API.department.updateDepartment(params);
            });
    });

department.agencyUpdateDepartment = function(params){
        var user_id = this.accountId;
        if(!params.companyId){
            throw {code:-1, msg:"companyId不能为空"};
        }
        return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
            .then(function(result){
                if(result){
                    return API.department.updateDepartment(params);
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            })
    };

/**
 * @method getDepartment
 * 企业根据id查询部门
 * @param id
 * @returns {*|Promise}
 */
department.getDepartment = function(params){
    var id = params.id;
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(!id){
                return API.department.getDefaultDepartment({companyId:data.companyId});
            }
            return API.department.getDepartment({id:id})
                .then(function(tp){
                    if(!tp){
                        throw {code: -1, msg: '查询结果不存在'};
                    }
                    if(tp.companyId != data.companyId){
                        throw {code: -1, msg: '无权限'};
                    }
                    return tp;
                });
        });
};

department.agencyGetDepartment = function(params){
    var id = params.id;
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getDepartment({id:id});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * 根据企业id得到企业所有部门
 * @param params
 * @returns {*|Promise}
 */
department.getAllDepartment = function(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            return API.department.getAllDepartment({companyId: data.companyId});
        });
};

department.agencyGetAllDepartment = function(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getAllDepartment({companyId: params.companyId});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method getFirstClassDepartments
 * 查询企业一级部门
 * @param params
 * @param params.companyId 企业Id
 * @param callback
 * @returns {*|Promise}
 */
department.getFirstClassDepartments = auth.checkPermission(["department.query"],
    function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的部门
                return API.department.getFirstClassDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
        .nodeify(callback);
});

department.agencyGetFirstClassDepartments = function(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getFirstClassDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method getChildDepartments
 * 查询部门直接子级部门
 * @param params
 * @param params.parentId 父级Id
 * @param callback
 * @returns {*|Promise}
 */
department.getChildDepartments = auth.checkPermission(["department.query"],
    function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的部门
                return API.department.getChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
        .nodeify(callback);
});

department.agencyGetChildDepartments = function(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method getAllChildDepartments
 * 查询部门所有子级部门
 * @param params
 * @param params.parentId 父级Id
 * @param callback
 * @returns {*|Promise}
 */
department.getAllChildDepartments = auth.checkPermission(["department.query"],
    function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的部门
                return API.department.getAllChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
        .nodeify(callback);
});

department.agencyGetAllChildDepartments = function(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getAllChildDepartments(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method getAllChildDepartmentsId
 * 查询部门所有子级部门id数组
 * @param params
 * @param params.parentId 父级Id
 * @param callback
 * @returns {*|Promise}
 */
department.getAllChildDepartmentsId = auth.checkPermission(["department.query"],
    function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的部门
                return API.department.getAllChildDepartmentsId(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
        .nodeify(callback);
});

department.agencyGetAllChildDepartmentsId = function(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code:-1, msg:"companyId不能为空"};
    }
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.department.getAllChildDepartmentsId(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

module.exports = department;