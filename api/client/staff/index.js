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
var Logger = require("common/logger");
var logger = new Logger("staff");
var L = require("common/language");
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
    function(params, callback) {
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                var companyId = data.companyId;
                params.companyId = companyId;
                return API.staff.createStaff(params);
            }else{
                return API.staff.createStaff(params);//员工注册的时候
            }
        })
        .nodeify(callback);
});

/**
 * @method deleteStaff
 *
 * 企业删除员工
 *
 * @type {*}
 * @return {promise}
 */
staff.deleteStaff = auth.checkPermission(["user.delete"],
    function(params, callback) {
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                return API.staff.getStaff({id:params.id})
                    .then(function(target){
                        if(data.companyId != target.companyId){
                            throw L.ERR.PERMISSION_DENY;
                        }else{
                            return API.staff.deleteStaff(params);
                        }
                    })
            })
            .nodeify(callback);
    });

/**
 * @method updateStaff
 *
 * 企业修改员工
 *
 * @type {*}
 */
staff.updateStaff = auth.checkPermission(["user.edit"],//三个参数权限判断要修改
    function(params, callback) {
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
            })
            .nodeify(callback);
    });

/**
 * @method getStaff
 *
 * 企业根据id得到员工信息
 * @type {*}
 */
staff.getStaff = auth.checkPermission(["user.query"],
    function(params, callback) {
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
            })
            .nodeify(callback);
    });

//代理商根据id得到员工信息
staff.getStaffByAgency = function(params, callback){
    var staffId = params.id;
    var user_id = this.accountId;
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agencyUser.getAgencyUser({id: this.accountId})
        ])
    .spread(function(staff, agencyUser){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
            return Q.all([
                    API.company.getCompany({companyId: staff.companyId}),
                    API.agency.getAgency({agencyId: agencyUser.agencyId, userId: user_id})
            ])
                .spread(function(company, agency){
                    if(!company.agencyId){
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                    if(company.agencyId == agency.id){
                        return staff;
                    }else{
                        throw {msg:"无权限"};
                    }
                })
    }).nodeify(callback);
}

/**
 * @method getCurrentStaff
 *
 * 得到当前登录员工信息
 * @param callback
 * @returns {*}
 */
staff.getCurrentStaff = function(callback){
    var self = this;
    return API.staff.getStaff({id: self.accountId}, callback);
}

/**
 * @method listAndPaginateStaff
 *
 * 企业分页查询员工列表
 * @type {*}
 */
staff.listAndPaginateStaff = auth.checkPermission(["user.query"],
    function(params, callback) {
        var user_id = this.accountId;
        return API.staff.getStaff({id:user_id})
            .then(function(data){
                params.companyId = data.companyId;
                return API.staff.listAndPaginateStaff(params);
            })
            .nodeify(callback);
    });

/**
 * @method increaseStaffPoint
 *
 * 增加员工积分
 * @type {*|Function}
 */
staff.increaseStaffPoint = function(params, callback){
    params.accountId = this.accountId;//当前登录代理商id
    var user_id = this.accountId;
    var staffId = params.id;//加积分的员工id
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agencyUser.getAgencyUser({id: this.accountId})
        ])
        .spread(function(staff, agencyUser){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
            return Q.all([
                    API.company.getCompany({companyId: staff.companyId}),
                    API.agency.getAgency({agencyId: agencyUser.agencyId, userId: user_id})
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
        }).nodeify(callback);

    /*return API.staff.getStaff({id:id})
        .then(function(result){
            if(result && result.companyId){
                return result.companyId;
            }else{
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
        })
        .then(function(companyId){
            return API.company.getCompany({companyId: companyId})
                .then(function(company){
                    if(company && company.agencyId){
                        return company.agencyId;
                    }else{
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                })
        })
        .then(function(agencyId){
            if(agencyId == this.accountId){
                return API.staff.increaseStaffPoint(params);
            }else{
                throw {msg:"无权限"};
            }
        })
        .nodeify(callback);*/

};

/**
 * @method decreaseStaffPoint
 *
 * 减少员工积分
 * @type {*|Function}
 */
staff.decreaseStaffPoint = function(params, callback){
    params.accountId = this.accountId;//当前登录代理商id
    var user_id = this.accountId;
    var staffId = params.id;//加积分的员工id
    return Q.all([
            API.staff.getStaff({id: staffId}),
            API.agencyUser.getAgencyUser({id: this.accountId})
        ])
        .spread(function(staff, agencyUser){
            if(!staff.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
            return Q.all([
                    API.company.getCompany({companyId: staff.companyId}),
                    API.agency.getAgency({agencyId: agencyUser.agencyId, userId: user_id})
                ])
                .spread(function(company, agency){
                    if(!company.agencyId){
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                    if(company.agencyId == agency.id){
                        return API.staff.decreaseStaffPoint(params);
                    }else{
                        throw {msg:"无权限"};
                    }
                })
        }).nodeify(callback);

    /*return API.staff.getStaff({id:id})
        .then(function(result){
            if(result && result.companyId){
                return result.companyId;
            }else{
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }
        })
        .then(function(companyId){
            return API.company.getCompany({companyId: companyId})
                .then(function(company){
                    if(company && company.agencyId){
                        return company.agencyId;
                    }else{
                        throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
                    }
                })
        })
        .then(function(agencyId){
            if(agencyId == this.accountId){
                return API.staff.decreaseStaffPoint(params);
            }else{
                throw {msg:"无权限"};
            }
        })
        .nodeify(callback);*/
};


/**
 * @method listAndPaginatePointChange
 *
 * 员工分页查询自己积分记录列表
 *
 * @param {object} params
 * @param {Function} callback
 * @return {promise}
 */
staff.listAndPaginatePointChange = function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id:user_id})
        .then(function(data){
            params.companyId = data.companyId;
            return API.staff.listAndPaginatePointChange(params);
        })
        .nodeify(callback);
}

/**
 * @method importExcel
 *
 * 批量导入员工
 *
 * @param {object} params
 * @param {Function} callback
 * @return {promise}
 */
staff.beforeImportExcel = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.beforeImportExcel(params, callback);
}

/**
 * 执行导入数据
 * @param params
 * @param params.addObj 导入的数据
 * @param callback
 * @returns {*}
 */
staff.importExcelAction = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.importExcelAction(params, callback);
}

/**
 * 下载数据
 * @param params
 * @param params.objAttr 需要导出的数据
 * @param callback
 * @returns {*}
 */
staff.downloadExcle = function(params, callback){
    params.accountId = this.accountId;
    return API.staff.downloadExcle(params, callback);
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
 * @param {Function} callback
 * @return {promise} {code: 0, msg: 'success', sta: {all: 0, inNum: 0, outNum: 0};
 */
staff.statisticStaffs = function(params, callback){
    return API.staff.statisticStaffs(params, callback);
}

/**
 * @method API.staff.statisticStaffsRole
 * 统计企业管理员 普通员工 未激活人数
 * @param params
 * @param {uuid} params.companyId
 * @param callback
 * @returns {promise} {adminNum: '管理员人数', commonStaffNum: '普通员工人数', unActiveNum: '未激活人数'};
 */
staff.statisticStaffsRole = function(params, callback){
    return API.staff.statisticStaffsRole(params, callback);
}

module.exports = staff;