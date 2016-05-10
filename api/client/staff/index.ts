/**
 * Created by wyl on 15-12-10.
 */
'use strict';

/**
 * @module API
 */

var Q = require("q");
var API = require("common/api");
var auth = require("../auth");
var L = require("common/language");
import {Staff, Credentials, PointChange} from "api/_types/staff";
import {Paginate} from 'common/paginate';

/**
 * @class staff 员工信息
 */

/**
 * @method createStaff
 *
 * 管理员添加员工
 *
 * @type {*}
 * @return {promise}
 */
export function createStaff (params) {
        var self = this;
        var user_id = self.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id: user_id, columns: ['companyId']})
                        .then(function(staff){
                            var companyId = staff.companyId;
                            params.companyId = companyId;
                            return API.staff.createStaff(params)
                                .then(function(data){
                                    return new Staff(data);
                                });
                        })
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.createStaff(params);
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })
    }

/**
 * @method deleteStaff
 *
 * 企业删除员工
 *
 * @type {*}
 * @return {promise}
 */
export function deleteStaff(params) {
        var user_id = this.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id: user_id})
                        .then(function(staff){
                            if(this.accountId == params.id){
                                throw {msg: "不可删除自身信息"};
                            }
                            return [staff, API.staff.getStaff({id:params.id})];
                        })
                        .spread(function(staff, target){
                            if(target.roleId == 0){
                                throw {msg: "企业创建人不能被删除"};
                            }
                            if(staff.roleId == target.roleId){
                                throw {msg: "不能删除统计用户"};
                            }
                            if(staff.companyId != target.companyId){
                                throw L.ERR.PERMISSION_DENY;
                            }
                            return API.staff.deleteStaff(params);
                        });
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.deleteStaff(params);
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }

/**
 * @method updateStaff
 *
 * 企业修改员工
 *
 * @type {*}
 */
export function updateStaff(params) {
        var user_id = this.accountId;
        var id = params.id;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return Q.all([
                        API.staff.getStaff({id:user_id}),
                        API.staff.getStaff({id:id})
                    ])
                        .spread(function(data, target){
                            if(data.companyId != target.companyId){
                                throw L.ERR.PERMISSION_DENY;
                            }else{
                                return API.staff.updateStaff(params)
                                    .then(function(data){
                                        return new Staff(data);
                                    })
                            }
                        })
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.updateStaff(params)
                                    .then(function(data){
                                        return new Staff(data);
                                    })
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }


/**
 * @method getStaff
 *
 * 企业根据id得到员工信息
 * @type {*}
 */
export function getStaff(params): Promise<Staff> {
        var user_id = this.accountId;
        var id = params.id;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return Q.all([
                            API.staff.getStaff({id:user_id}),
                            API.staff.getStaff({id:id})
                        ])
                        .spread(function(data, target){
                            if(data.companyId != target.companyId){
                                throw L.ERR.PERMISSION_DENY;
                            }else{
                                // return {staff: new Staff(target)};
                                return new Staff(target);
                            }
                        })
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.getStaff(params)
                                    .then(function(data){
                                        return new Staff(data);
                                    })
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }

/**
 * @method getStaffs
 *
 * 根据查询条件得到员工信息
 * @type {*}
 */
export function getStaffs(params) {
        var user_id = this.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id:user_id})
                        .then(function(sf){
                            params.companyId = sf.companyId;
                            return API.staff.getStaffs(params)
                        })
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.getStaffs(params)
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }



/**
 * @method getCurrentStaff
 *
 * 得到当前登录员工信息
 * @returns {*}
 */
export function getCurrentStaff(){
    var self = this;
    return API.staff.getStaff({id: self.accountId})
        .then(function(data){
            return new Staff(data);
        });
}

/**
 * @method listAndPaginateStaff
 *
 * 企业分页查询员工列表
 * @type {*}
 */
export function listAndPaginateStaff(params) {
        var user_id = this.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id:user_id})
                        .then(function(data){
                            params.companyId = data.companyId;
        //                var options = {perPage : 20};
        //                params.options = options;
                            return API.staff.listAndPaginateStaff(params);
                        });
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.staff.listAndPaginateStaff(params);
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }

/**
 * @method increaseStaffPoint
 *
 * 增加员工积分
 * @type {*|Function}
 */
export function increaseStaffPoint(params){
    params.accountId = this.accountId;//当前登录代理商id
    var user_id = this.accountId;
    var staffId = params.id;//加积分的员工id
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agency.getAgencyUser({id: this.accountId})
        ])
        .spread(function(staff, agencyUser){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
            params.companyId = staff.companyId;
            return Q.all([
                    API.company.getCompany({companyId: staff.companyId}),
                    API.agency.getAgency({agencyId: agencyUser.agencyId})
                ])
                .spread(function(company, agency){
                    if(!company.agencyId){
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                    if(company.agencyId == agency.id){
                        return API.staff.increaseStaffPoint(params);
                    }else{
                        throw {msg:"无权限"};
                    }
                })
        });

};

/**
 * @method decreaseStaffPoint
 *
 * 减少员工积分
 * @type {*|Function}
 */
export function decreaseStaffPoint(params){
    params.accountId = this.accountId;//当前登录代理商id
    var user_id = this.accountId;
    var staffId = params.id;//加积分的员工id
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agency.getAgencyUser({id: this.accountId})
        ])
        .spread(function(staff, agencyUser){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
            params.companyId = staff.companyId;
            return Q.all([
                    API.company.getCompany({companyId: staff.companyId}),
                    API.agency.getAgency({agencyId: agencyUser.agencyId})
                ]);
        })
        .spread(function(company, agency){
            if(!company.agencyId){
                throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
            }
            if(company.agencyId == agency.id){
                return API.staff.decreaseStaffPoint(params);
            }else{
                throw {msg:"无权限"};
            }
        });

};


/**
 * @method listAndPaginatePointChange
 *
 * 员工分页查询自己积分记录列表
 *
 * @param {object} params
 * @return {promise}
 */
export function listAndPaginatePointChange(params){
    var user_id = this.accountId;
    params.staffId = user_id;
    return API.staff.listAndPaginatePointChange(params);
}
/**
 * @method getStaffPointsChange
 * 查询员工某时间段内积分变动
 * @param params
 * @param params.staffId  员工id
 * @param params.startTime  开始时间
 * @param params.endTime  结束时间
 * @returns {promise|*}
 */
export function getStaffPointsChange(params){
    var staffId = this.accountId;
    params.staffId = staffId;
    return API.staff.getStaffPointsChange(params);
}

/**
 * @method getStaffPointsChangeByMonth
 * 获取企业或员工月度积分变动统计(增加、消费、积分余额)
 * @param params.staffId //可选参数，如果不写则查询当前企业所有员工的积分统计
 * @param params
 * @returns {*}
 */
export function getStaffPointsChangeByMonth(params) {
    var self = this;
    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function(staff){
            return staff.companyId;
        })
        .then(function(companyId){
            params.companyId = companyId;
            var count = params.count;
            typeof count == 'number' ? "" : count = 6;
            params.count = count;
            return API.staff.getStaffPointsChangeByMonth(params);
        })
}

/**
 * 根据部门id查询部门下员工数
 * @param params
 * @param .departmentId 部门id
 * @returns {*}
 */
export function getCountByDepartment(params){
    return API.staff.getCountByDepartment(params);
}

/**
 * @method importExcel
 *
 * 批量导入员工
 *
 * @param {object} params
 * @return {promise}
 */
export function beforeImportExcel(params){
    params.accountId = this.accountId;
    return API.staff.beforeImportExcel(params);
}

/**
 * 执行导入数据
 * @param params
 * @param params.addObj 导入的数据
 * @returns {*}
 */
export function importExcelAction(params){
    params.accountId = this.accountId;
    return API.staff.importExcelAction(params);
}

/**
 * 下载数据
 * @param params
 * @param params.objAttr 需要导出的数据
 * @returns {*}
 */
export function downloadExcle(params){
    params.accountId = this.accountId;
    return API.staff.downloadExcle(params);
}

/**
 * @method API.staff.statisticStaffs
 *
 * 统计时间段内企业员工数量（在职 入职 离职）
 *
 * @param {object} params
 * @param {String} params.companyId
 * @param {String} params.startTime
 * @param {String} params.endTime
 * @return {promise} true||error
 */
export function statisticStaffs(params){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            var companyId = data.companyId;
                            params.companyId = companyId;
                            return API.staff.statisticStaffs(params);
                        }else{
                            throw {msg:"无权限"};
                        }
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.staff.statisticStaffs(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}



/**
 * @method API.staff.statisticStaffs
 *
 * 代理商统计时间段内企业员工数量（在职 入职 离职）
 *
 * @param {object} params
 * @param {String} params.companyId
 * @param {String} params.startTime
 * @param {String} params.endTime
 * @return {promise} true||error
 */
/*export function statisticStaffsByAgency(params){
    var user_id = this.accountId;
    if(!params.companyId){
        throw {code: -1, msg: "企业ID不能为空"};
    }
    return Q.all([
        API.agency.getAgencyUser({id: user_id}),
        API.company.getCompany({companyId: params.companyId})
        ])
    .spread(function(user, company){
        if(user.agencyId != company.agencyId){
            throw {code: -2, msg: '权限不足'};
        }
        return API.staff.statisticStaffs(params);
    })
}*/

/**
 * 统计企业员工总数
 * @param params
 * @param {String} params.companyId
 * @returns {*}
 */
export function getStaffCountByCompany(params){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data){
                            var companyId = data.companyId;
                            params.companyId = companyId;
                            return API.staff.getStaffCountByCompany(params);
                        }else{
                            throw {msg:"无权限"};
                        }
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.staff.getStaffCountByCompany(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}


/**
 * 得到企业部门
 * @param params
 * @param {String} params.companyId
 * @returns {*}
 */
export function getDistinctDepartment(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                var companyId = data.companyId;
                params.companyId = companyId;
                return API.staff.getDistinctDepartment(params);
            }else{
                throw {msg:"无权限"};
            }
        });
}

/**
 * @method API.staff.statisticStaffsRole
 * 统计企业管理员 普通员工 未激活人数
 * @param params
 * @param {uuid} params.companyId
 * @returns {promise} {adminNum: '管理员人数', commonStaffNum: '普通员工人数', unActiveNum: '未激活人数'};
 */
export function statisticStaffsRole(params){
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id, columns: ['companyId']})
                    .then(function(data){
                        if(data){
                            var companyId = data.companyId;
                            params.companyId = companyId;
                            return API.staff.statisticStaffsRole(params);
                        }else{
                            throw {msg:"无权限"};
                        }
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.staff.statisticStaffsRole(params);
                        }else{
                            throw {msg: '无权限'};
                        }
                    })
            }
        })

}

export function statStaffPoints(params){
    var self = this;
    var user_id = self.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
                    .then(function(staff){
                        return API.staff.statStaffPoints({companyId: staff.companyId})
                    })
            }else{
                var companyId = params.companyId;
                return Q.all([
                        API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']}),
                        API.company.getCompany({companyId: companyId, columns: ['agencyId']})
                    ])
                    .spread(function(u, c){
                        if(u.agencyId != c.agencyId){
                            throw L.ERR.PERMISSION_DENY;
                        }
                        return API.staff.statStaffPoints({companyId: companyId});
                    })
            }
        })

}

/*************************证件信息API begin*************************/

/**
 * @method createPapers
 *
 * 创建证件信息
 *
 * @param {Object} params
 * @param {integer} params.type  证件类型 0表示身份证，1表示护照（必填）
 * @param {string} params.idNo   证件号码（必填）
 * @param {uuid} params.ownerId    用户id（选填）
 * @param {Date} params.birthday  生日（选填）
 * @param {Date} params.validData 过期时间（选填）
 * @returns {*|Promise}
 */
export function createPapers(params): Promise<Credentials>{
    params.ownerId = this.accountId;
    return API.staff.createPapers(params)
        .then(function(data){
            return new Credentials(data);
        })
};


/**
 * @method deletePapers
 *
 * 删除证件信息
 *
 * @param params
 * @param {uuid} params.id    删除记录id（必填）
 * @returns {*|Promise}
 */
export function deletePapers (params){
    params.ownerId = this.accountId;
    return API.staff.deletePapers(params);
};

/**
 * @method updatePapers
 *
 * 更新证件信息
 *
 * @param {Object} params
 * @param {uuid} params.id    修改记录id（必填）
 * @param {integer} params.type  证件类型（选填）
 * @param {string} params.idNo   证件号码（选填）
 * @param {uuid} params.ownerId    用户id（选填）
 * @param {Date} params.birthday  生日（选填）
 * @param {Date} params.validData 过期时间（选填）
 * @returns {*|Promise}
 */
export function updatePapers (params): Promise<Credentials>{
    var user_id = this.accountId;
    return API.staff.getPapersById({id: params.id})
        .then(function(ma){
            if(ma.ownerId != user_id){
                throw {code: -1, msg: '无权限'};
            }
            params.ownerId = user_id;
            return API.staff.updatePapers(params)
                .then(function(data){
                    return new Credentials(data);
                })
        });
};

/**
 * @method getPapersById
 *
 * 根据id查询证件信息
 *
 * @param {Object} params
 * @param {uuid} params.id    查询记录id（必填）
 * @param {Array<String>} params.attributes    查询列（选填）
 * @returns {*|Promise}
 */
export function getPapersById(params): Promise<Credentials>{
    var id = params.id;
    var user_id = this.accountId;
    return API.staff.getPapersById({id:id})
        .then(function(ma){
            if(!ma){
                throw {code: -1, msg: '查询结果不存在'};
            }

            if(ma.ownerId && ma.ownerId != user_id){
                throw {code: -1, msg: '无权限'};
            }
            return new Credentials(ma);
        });
};


/**
 * @method getOnesPapersByType
 *
 * 根据类型查询证件信息
 *
 * @param {Object} params
 * @param {uuid} params.ownerId    用户id（查当前登录用户可不填）
 * @param {uuid} params.type    证件类型（必填）
 * @param {Array<String>} params.attributes    查询列（选填）
 * @returns {*|Promise}
 */
export function getOnesPapersByType(params): Promise<Credentials>{
    var user_id = this.accountId;
    params.ownerId = user_id;
    return API.staff.getOnesPapersByType(params)
        .then(function(ma){
            if(!ma){
                throw {code: -1, msg: '查询结果不存在'};
            }
            return new Credentials(ma);
        });
};

/**
 * @method getCurrentUserPapers
 *
 * 根据ownerId得到证件信息
 *
 * @returns {*|Promise}
 */
export function getCurrentUserPapers(): Promise<Credentials[]>{
    var user_id = this.accountId;
    return API.staff.getPapersByOwner({ownerId: user_id});
};

/*************************证件信息API end*************************/