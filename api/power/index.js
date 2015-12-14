/**
 * Created by wlh on 15/12/12.
 *
 *  权限模块
 */

var services = {};

var STAFF_POWER = [];   //员工权限 1
var MANAGER_POWER = []; //管理员权限 2
//var OWNER_POWER = [];   //企业拥有者权限
var FINANCE_POWER = []; //财务权限 3

/**
 * 获取账号所拥有的权限
 *
 * @param {Object} params
 * @param {integer} params.role 角色ID
 * @param {Function} callback
 */
services.getPowerList = function(params, callback) {

}

/**
 * 检查用户是否拥有权限
 *
 * @param {Object} params
 * @param {UUID} params.role 角色ID
 * @param {String} params.power 要检查的权限
 * @param {Function} callback {code: 0, msg: "ok"}, {code: -1, msg: "权限不足"};
 */
services.checkPower = function(params, callback) {

}

module.exports = services;