/**
 * Created by wlh on 15/12/12.
 *
 *  权限模块
 */
"use strict";
import { EAccountType, Models } from '_types/index';

import L from '@jingli/language';

const ROLE_ID = {
    OWNER: 0,
    STAFF: 1,
    ADMIN: 2
};

// var permit = module.exports = {};

class Role {
    name: string
    permission: string| string[]

    constructor(obj: any) {
        this.name = obj.name;
        this.permission = obj.permission;
    }
}

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
        permission: [
            'user.query', 'user.add', 'user.delete', 'user.edit', 'user.role',
            'company.query', 'company.edit',
            'department.add','department.delete','department.update','department.query',
            'travelPolicy.add', 'travelPolicy.delete', 'travelPolicy.update', 'travelPolicy.query'
        ]
    },
    owner: {
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
        permission: [
            'company.query', 'company.add', 'company.delete', 'company.edit',
            'department.add','department.delete','department.update','department.query',
            'user.add', 'user.query', 'user.delete', 'user.edit',
            "staff.increaseStaffPoint", "staff.decreaseStaffPoint",
            "tripPlan.approveInvoice"
        ]
    }
};

function expandRoleInherit(role){
    if(!role.inherit)
        return;
    role.inherit
        .forEach(function(parent_id){
            var parent = roles[parent_id];
            if(!parent){
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
 */
async function getRoleOfAccount(data) : Promise<Role>{
    var accountId = data.accountId;
    var s: any = {}
    var staff = await Models.staff.get(accountId);
    if (staff.company.createUser == accountId) {
        return new Role(roles.owner);
    }else if(s.roleId == ROLE_ID.ADMIN){
        return new Role(roles.admin);
    }
    return new Role(roles.staff);
}

/**
 * 获取代理商角色权限
 *
 * @param {Object}    params
 * @param {uuid}      params.accountId
 */
async function getRoleOfAgency(params){
    var accountId = params.accountId;
    var u: any = {};
    var user = await Models.agencyUser.get(accountId);
    if(user.agency.createUser == accountId){
        return agency_roles.admin;
    }else if(u.roleId == ROLE_ID.ADMIN){
        return agency_roles.admin;
    }
    return agency_roles.staff;
}

function getRoleList(roles){
    Object.keys(roles)
        .map(function(id){
            return {id:id, name:roles[id].name};
        });
}
export function listRoles( params, callback) {
    var type = params.type || 1;
    var list;
    switch(type){
        case 1:
            list = getRoleList(roles);
            break;
        case 2:
            list = getRoleList(agency_roles);
            break;
        default:
            throw L.ERR.NOT_FOUND();
    }
    return Promise.resolve(list);
};

/**
 * 检查用户是否拥有权限
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.permission 要检查的权限
 * @param {String} params.type 权限所属 1.企业 2.代理商 默认 1.企业
 */
export async function checkPermission(params): Promise<boolean> {
    var accountId = params.accountId;
    var permissions = params.permission;

    if (!permissions || !permissions.length) {
        return true;
    }

    if (typeof permissions == 'string') {
        permissions = [permissions];
    }
    var type = params.type || EAccountType.STAFF;
    //如果要验证代理商权限,直接返回True
    //todo 实现代理商权限认证
    var role;
    if (type == EAccountType.AGENCY) {
        role = await getRoleOfAgency({accountId: accountId});
    } else {
        role = await getRoleOfAccount({accountId: accountId});
    }
    if(role == undefined)
        throw L.ERR.NOT_FOUND();
    for(var p of permissions){
        if(role.permission[p] != true)
            throw L.ERR.PERMISSION_DENY();
    }
    return true;
};