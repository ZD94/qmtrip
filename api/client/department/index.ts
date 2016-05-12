/**
 * Created by wyl on 11-01-20.
 */
'use strict';

/**
 * @module API
 */
var API = require("common/api");
var L = require("common/language");
import {Department} from "api/_types/department";
import {validateApi} from 'common/api/helper';
var sequelize = require("common/model").importModel("../../department/models");
var departmentModel = sequelize.models.Department;
export const departmentCols = Object.keys(departmentModel.attributes);
/**
 * @class department 部门
 */

/**
 * @method createDepartment
 *
 * 企业创建部门
 *
 * @param params
 * @returns {*|Promise}
 */
export function createDepartment (params): Promise<Department>{
        var user_id = this.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id: user_id})
                        .then(function(data){
                            if(data.code){
                                throw {code: -1, msg: '无权限'};
                            }
                            params.companyId = data.companyId;//只允许添加该企业下的部门
                            return API.department.createDepartment(params)
                        });
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.department.createDepartment(params)
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })
        
    }

/**
 * @method deleteDepartment
 * 企业删除部门
 * @param params
 * @returns {*|Promise}
 */
export function deleteDepartment(params): Promise<any>{
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.department.deleteDepartment(params);
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        delete params.companyId;
                        if(result){
                            return API.department.deleteDepartment(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}

/**
 * @method updateDepartment
 * 企业更新部门
 * @param id
 * @param params
 * @returns {*|Promise}
 */
export function updateDepartment(params): Promise<Department>{
    var user_id = this.accountId;
    var company_id;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
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
                        return API.department.updateDepartment(params)
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.updateDepartment(params)
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}


/**
 * @method getDepartment
 * 企业根据id查询部门
 * @param id
 * @returns {*|Promise}
 */
export function getDepartment(params: {id?: string, companyId?: string}): Promise<Department>{
    var id = params.id;
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        var companyId = data.companyId;
                        if(!id){
                            return API.department.getDefaultDepartment({companyId:companyId});
                        }
                        return API.department.getDepartment({id:id})
                            .then(function(tp){
                                if(!tp){
                                    throw {code: -1, msg: '查询结果不存在'};
                                }
                                if(tp.companyId != companyId){
                                    throw {code: -1, msg: '无权限'};
                                }
                                return tp;
                            });
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getDepartment({id:id});
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

};

/**
 * 根据条件得到企业所有部门
 * @param params
 * @returns {*|Promise}
 */
export function getDepartments(params){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        params.companyId = data.companyId;
                        return API.department.getDepartments(params);
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getDepartments({companyId: params.companyId});
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

};


/**
 * @method getFirstClassDepartments
 * 查询企业一级部门
 * @param params
 * @param params.companyId 企业Id
 * @returns {*|Promise}
 */
export function getFirstClassDepartments(params: {companyId?: string}){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            params.companyId = data.companyId;//只允许查询该企业下的部门
                            return API.department.getFirstClassDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getFirstClassDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}


/**
 * @method getChildDepartments
 * 查询部门直接子级部门
 * @param params
 * @param params.parentId 父级Id
 * @returns {*|Promise}
 */
export function getChildDepartments(params: {companyId?: string, parentId: string}){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            params.companyId = data.companyId;//只允许查询该企业下的部门
                            return API.department.getChildDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getChildDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })
}

/**
 * @method createDepartment
 * 查询企业全部部门结构
 * @param params
 * @param params。companyId 企业id
 * @returns {*|Promise}
 */
export function getDepartmentStructure (params){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data.code){
                            throw {code: -1, msg: '无权限'};
                        }
                        params.companyId = data.companyId;//只允许添加该企业下的部门
                        return API.department.getDepartmentStructure(params);
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getDepartmentStructure(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}

/**
 * 根据企业id得到企业所有部门
 * @param params
 * @returns {*|Promise}
 */
export function getAllDepartment(params: {companyId?: string}){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        return API.department.getAllDepartment({companyId: data.companyId});
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getAllDepartment({companyId: params.companyId});
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

};


/**
 * @method getAllChildDepartments
 * 查询部门所有子级部门
 * @param params
 * @param params.parentId 父级Id
 * @returns {*|Promise}
 */
export function getAllChildDepartments(params: {companyId?: string, parentId: string}){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            params.companyId = data.companyId;//只允许查询该企业下的部门
                            return API.department.getAllChildDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getAllChildDepartments(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}


/**
 * @method getAllChildDepartmentsId
 * 查询部门所有子级部门id数组
 * @param params
 * @param params.parentId 父级Id
 * @returns {*|Promise}
 */
export function getAllChildDepartmentsId(params: {companyId?: string, parentId: string}){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            params.companyId = data.companyId;//只允许查询该企业下的部门
                            return API.department.getAllChildDepartmentsId(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.department.getAllChildDepartmentsId(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}

