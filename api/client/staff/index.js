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
var _ = require('lodash');

/**
 * @class staff 员工信息
 */
var staff = {};

/**
 * @method createStaff
 *
 * 管理员添加员工
 *
 * @type {*}
 * @return {promise}
 */
staff.createStaff = auth.checkPermission(["user.add"],
    function(params) {
        var self = this;
        var user_id = self.accountId;
        return API.staff.getStaff({id: user_id, columns: ['companyId']})
            .then(function(staff){
                var companyId = staff.companyId;
                params.companyId = companyId;
                return API.staff.createStaff(params);
            })
    });

staff.agencyCreateStaff = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.createStaff(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method deleteStaff
 *
 * 企业删除员工
 *
 * @type {*}
 * @return {promise}
 */
staff.deleteStaff = auth.checkPermission(["user.delete"],
    function(params) {
        var user_id = this.accountId;
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
    });

staff.agencyDeleteStaff = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.deleteStaff(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method updateStaff
 *
 * 企业修改员工
 *
 * @type {*}
 */
staff.updateStaff = auth.checkPermission(["user.edit"],//三个参数权限判断要修改
    function(params) {
        var user_id = this.accountId;
        var id = params.id;
        return API.staff.getStaff({id:user_id})
            .then(function(data){
                return API.staff.getStaff({id:id})
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return API.staff.updateStaff(params);
                        }
                    })
            });
    });

staff.agencyUpdateStaff = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.updateStaff(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method getStaff
 *
 * 企业根据id得到员工信息
 * @type {*}
 */
staff.getStaff = auth.checkPermission(["user.query"],
    function(params) {
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                return API.staff.getStaff(params)
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return {staff: target};
                        }
                    })
            });
    });

staff.agencyGetStaff = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.getStaff(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

//代理商根据id得到员工信息
staff.getStaffByAgency = function(params){
    var staffId = params.id;
    var user_id = this.accountId;
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agency.getAgencyUser({id: this.accountId})
        ])
        .spread(function(staff, agencyUser){
                if(!staff.companyId){
                    throw {msg:"该员工不存在或员工所在企业不存在"};
                }
                return [
                        staff,
                        API.company.getCompany({companyId: staff.companyId}),
                        API.agency.getAgency({agencyId: agencyUser.agencyId, userId: user_id})
                ];
        })
        .spread(function(staff, company, agency){
            if(!company.agencyId){
                throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
            }
            if(company.agencyId == agency.id){
                return staff;
            }else{
                throw {msg:"无权限"};
            }
        });
}

/**
 * @method getCurrentStaff
 *
 * 得到当前登录员工信息
 * @returns {*}
 */
staff.getCurrentStaff = function(){
    var self = this;
    return API.staff.getStaff({id: self.accountId});
}

/**
 * @method listAndPaginateStaff
 *
 * 企业分页查询员工列表
 * @type {*}
 */
staff.listAndPaginateStaff = auth.checkPermission(["user.query"],
    function(params) {
        var user_id = this.accountId;
        return API.staff.getStaff({id:user_id})
            .then(function(data){
                params.companyId = data.companyId;
//                var options = {perPage : 20};
//                params.options = options;
                return API.staff.listAndPaginateStaff(params);
            });
    });

staff.agencyListAndPaginateStaff = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.listAndPaginateStaff(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * @method increaseStaffPoint
 *
 * 增加员工积分
 * @type {*|Function}
 */
staff.increaseStaffPoint = function(params){
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
staff.decreaseStaffPoint = function(params){
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
staff.listAndPaginatePointChange = function(params){
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
staff.getStaffPointsChange = function(params){
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
staff.getStaffPointsChangeByMonth = function(params) {
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
staff.getCountByDepartment = function(params){
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
staff.beforeImportExcel = function(params){
    params.accountId = this.accountId;
    return API.staff.beforeImportExcel(params);
}

/**
 * 执行导入数据
 * @param params
 * @param params.addObj 导入的数据
 * @returns {*}
 */
staff.importExcelAction = function(params){
    params.accountId = this.accountId;
    return API.staff.importExcelAction(params);
}

/**
 * 下载数据
 * @param params
 * @param params.objAttr 需要导出的数据
 * @returns {*}
 */
staff.downloadExcle = function(params){
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
staff.statisticStaffs = function(params){
    var user_id = this.accountId;
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
}

staff.agencyStatisticStaffs = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.statisticStaffs(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};


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
staff.statisticStaffsByAgency = function(params){
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
}

/**
 * 统计企业员工总数
 * @param params
 * @param {String} params.companyId
 * @returns {*}
 */
staff.getStaffCountByCompany = function(params){
    var user_id = this.accountId;
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
}

staff.agencyGetStaffCountByCompany = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.getStaffCountByCompany(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * 得到企业部门
 * @param params
 * @param {String} params.companyId
 * @returns {*}
 */
staff.getDistinctDepartment = function(params){
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
staff.statisticStaffsRole = function(params){
    var user_id = this.accountId;
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
}

staff.agencyStatisticStaffsRole = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.staff.statisticStaffsRole(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};


staff.statStaffPointsByCompany = function(){
    var self = this;
    return API.staff.getStaff({id: self.accountId, columns: ['companyId']})
        .then(function(staff){
            return API.staff.statStaffPoints({companyId: staff.companyId})
        })
}

staff.statStaffPointsByAgency = function(companyId){
    var self = this;
    if(typeof companyId != 'string'){
        throw {code: 0, msg: '参数格式不正确'};
    }
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

/*************************证件信息API begin*************************/

/**
 * @method createMailingAddress
 *
 * 创建证件信息
 *
 * @param {Object} params
 * @param {integer} params.type  证件类型（必填）
 * @param {string} params.idNo   证件号码（必填）
 * @param {uuid} params.ownerId    用户id（选填）
 * @param {Date} params.birthday  生日（选填）
 * @param {Date} params.validData 过期时间（选填）
 * @returns {*|Promise}
 */
staff.createPapers = function(params){
    params.ownerId = this.accountId;
    return API.staff.createPapers(params);
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
staff.deletePapers = function(params){
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
staff.updatePapers = function(params){
    var user_id = this.accountId;
    return API.staff.getPapersById({id: params.id})
        .then(function(ma){
            if(ma.ownerId != user_id){
                throw {code: -1, msg: '无权限'};
            }
            params.ownerId = user_id;
            return API.staff.updatePapers(params);
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
staff.getPapersById = function(params){
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
            return ma;
        });
};

/**
 * @method getCurrentUserPapers
 *
 * 根据ownerId得到证件信息
 *
 * @returns {*|Promise}
 */
staff.getCurrentUserPapers = function(){
    var user_id = this.accountId;
    return API.staff.getPapersByOwner({ownerId: user_id});
};

/*************************证件信息API end*************************/
module.exports = staff;