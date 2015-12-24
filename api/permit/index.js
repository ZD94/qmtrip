/**
 * Created by wlh on 15/12/12.
 *
 *  权限模块
 */
"use strict";

var API = require("common/api");
var Q = require("q");

var permit = module.exports = {};

var roles = {
    staff: {
        name: '普通员工',
        permission: 'user.query'
    },
    finance: {
        name: '财务人员',
        inherit: ['staff'],
        permission: ['point.query', 'point.add', 'point.delete', 'point.edit']
    },
    admin: {
        name: '管理员',
        inherit: ['staff', 'finance'],
        permission: ['user.add', 'user.delete', 'user.edit', 'company.query', 'company.edit', 'user.role']
    },
    creator: {
        name: '创建人',
        inherit: ['admin'],
        permission: []
    }
};

var agency_roles = {
    staff: {
        name: '普通员工',
        permission: ['company.query', 'user.query']
    },
    admin: {
        name: '管理员',
        inherit: ['staff'],
        permission: ['company.add', 'company.delete', 'company.edit', 'user.add', 'user.delete', 'user.edit']
    }
};

function expandRoleInherit(role){
    if(!role.inherit)
        return;
    role.inherit
        .forEach(function(parent_id){
            var parent = roles[parent_id];
            if(!parent){
                logger.error('role %s inherit from %s, which not exists!', id, parent_id);
                return;
            }
            expandRoleInherit(parent);
            for(var p in parent.permission)
                role.permission[p] = true;
        });
    delete role.inherit;
}

function updateRole(roles){
    for(var role_id in roles){
        var role = roles[role_id];
        var permissions = {};
        for(var p of role.permission)
            permissions[p] = true;
        role.permission = permissions;
    }
    for(var role_id in roles){
        expandRoleInherit(roles[role_id]);
    }
}
updateRole(roles);
updateRole(agency_roles);


/**
 * 获取账号角色
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {Function} callback
 */
function getRoleOfAccount(data) {
    var accountId = data.accountId;
    return API.staff.getStaff(data.accountId)
        .then(function(result) {
            return API.company.getCompany({companyId: result.staff.companyId});
        })
        .then(function(result) {
            var company = result.company;
            if (company.createUser == accountId) {
                return role.creator;
            }
            return role.staff;
        });
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
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 检查用户是否拥有权限
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.permission 要检查的权限
 * @param {String} params.type 权限所属 1.企业 2.代理商 默认 1.企业
 * @param {Function} callback {code: 0, msg: "ok"}, {code: -1, msg: "权限不足"};
 */
permit.checkPermission = function(params, callback) {
    var accountId = params.accountId;
    var permissions = params.permission;
    var defer = Q.defer();

    if (!permissions || !permissions.length) {
        return Q(true);
    }

    if (typeof permissions == 'string') {
        permissions = [permissions];
    }
    var type = params.type || 1;
    //如果要验证代理商权限,直接返回True
    //todo 实现代理商权限认证
    if (type == 2) {
        return Q(true);
    }

    return getRoleOfAccount({accountId: accountId})
        .then(function(role){
            for(var p of needPowers){
                if(role.permission[p] != true)
                    throw L.ERR.PERMISSION_DENY;
            }
            return true;
        })
        .nodeify(callback);
};

