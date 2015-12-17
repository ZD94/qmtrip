/**
 * Created by wlh on 15/12/12.
 *
 *  权限模块
 */

var services = {};
var API = require("../../common/api");
var db = require("common/model").importModel("./models");
var Q = require("q");

var STAFF_POWER = 1;   //员工权限 1
var MANAGER_POWER = 2; //管理员权限 2
var OWNER_POWER = 0;   //企业拥有者权限
var FINANCE_POWER = 3; //财务权限 3


/**
 * 获取权限列表
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {Function} callback
 */
services.getPowerList = function(data, callback) {
    var accountId = data.accountId;
    var roles = [];
    return API.staff.getStaff(accountId)
        .then(function(result) {
            var staff = result.staff;
            return API.company.getCompany({companyId: staff.companyId, userId: accountId})
                .then(function(result) {
                    var company = result.company;
                    if (company.createUser == accountId) {
                        roles.push(OWNER_POWER);
                    }
                    if (!staff.roleId) {
                        staff.roleId = STAFF_POWER;
                    }
                    roles.push(staff.roleId);
                    return roles;
                })
        })
        .then(function(roles) {
            //通过角色获取权限
            var promises = [];
            for(var i= 0, ii=roles.length; i<ii; i++) {
                promises.push(_getRolePowerList(roles[i]));
            }
            return Q.all(promises);
        })
        .then(function(result) {
            console.info(result);
            //合并权限,去除重复权限
            var powerList = [];
            for(var i= 0, ii=result.length; i<ii; i++) {
                var item = result[i];
                for(var j = 0, jj=item.length; j<jj; j++) {
                    var power = item[j];
                    if (powerList.indexOf(power) < 0) {
                        powerList.push(power);
                    }
                }
            }
            return powerList;
        })
        .then(function(powers) {
            return {code: 0, data: {"accountId": accountId, powers: powers}};
        })
        .nodeify(callback);
}

/**
 * 获取角色所拥有的权限
 *
 * @param {Object} params
 * @param {integer} params.role 角色ID
 * @param {Function} callback
 */
function _getRolePowerList(role, callback) {
    return db.models["Role"].findOne({role: role, type: 1})
        .then(function(result) {
            return result.powers.split(/,/g);
        }).nodeify(callback);
}

/**
 * 检查用户是否拥有权限
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.powers 要检查的权限
 * @param {String} params.type 权限所属 1.企业 2.代理商 默认 1.企业
 * @param {Function} callback {code: 0, msg: "ok"}, {code: -1, msg: "权限不足"};
 */
services.checkPower = function(params, callback) {
    var accountId = params.accountId;
    var needPowers = params.powers;
    var defer = Q.defer();

    if (!needPowers || !needPowers.length) {
        defer.resolve({code: 0, msg: "OK"});
        return defer.promise.nodeify(callback);
    }

    if (typeof needPowers == 'string') {
        needPowers = [needPowers];
    }
    var type = params.type || 1;
    //如果要验证代理商权限,直接返回True
    //todo 实现代理商权限认证
    if (type == 2) {
        defer.resolve({code: 0, msg: "OK"});
        return defer.promise.nodeify(callback);
    }

    return services.getPowerList({accountId: accountId})
        .then(function(result) {
            var powers = result.data.powers;
            result = true;

            for(var i= 0, ii=needPowers.length; i<ii; i++) {
                var needPower = needPowers[i];
                if (powers.indexOf(needPower) < 0) {
                    result = false;
                    break;
                }
            }

            if (result) {
                return {code: 0, msg: "OK"};
            } else {
                return {code: -1, msg: "权限不足"};
            }
        })
        .nodeify(callback);
}

module.exports = services;