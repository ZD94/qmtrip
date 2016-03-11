/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
/**
 * @module API
 */

var Q = require("q");
var API = require('common/api');
var utils = require("common/utils");
var L = require("common/language");
var _ = require('lodash');
var checkAgencyPermission = require('../auth').checkAgencyPermission;

/**
 * @class agency 代理商
 */
var agency = {}


/**
 * @method registerAgency
 *
 * 注册代理商
 *
 * @param {Object} params 参数
 * @param {string} params.name 代理商名称 必填
 * @param {string} params.userName 用户姓名 必填
 * @param {string} params.mobile 手机号 必填
 * @param {string} params.email 邮箱 必填
 * @param {string} params.pwd 密码 选填，如果手机号和邮箱在全麦注册过，则密码还是以前的密码
 * @returns {Promise} true||error
 */
agency.registerAgency = registerAgency;
registerAgency.required_params = ['name', 'email', 'mobile', 'userName'];
registerAgency.optional_params = ['description', 'remark', 'pwd'];
function registerAgency(params){
    var email = params.email;
    var mobile = params.mobile;
    return API.auth.checkAccExist({type: 2, $or: [{mobile: mobile}, {email: email}]})
        .then(function(ret){
            if(!ret){
                var _account = {
                    email: email,
                    mobile: mobile,
                    pwd: params.pwd|'123456',
                    type: 2
                }
                return API.auth.newAccount(_account);
            }else{
                return ret;
            }
        })
        .then(function(account) {
            params.id = account.id;
            return API.agency.createAgency(params)
        })
}

/**
 * @method updateAgency
 *
 * 更新代理商信息
 * @param params
 * @returns {*}
 */
agency.updateAgency = updateAgency;
updateAgency.required_params = ['agencyId'];
updateAgency.optional_params = ['name', 'description', 'status', 'address', 'email', 'telephone', 'mobile', 'company_num', 'remark'];
function updateAgency(params){
    var self = this;
    params.userId = self.accountId;
    return API.agency.updateAgency(params);
}

/**
 * 获取代理商信息
 * @param agencyId
 * @returns {*}
 */
agency.getAgencyById = function(agencyId){
    var self = this;
    return API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']})
        .then(function(user){
            if(user.agencyId != agencyId){
                throw L.ERR.PERMISSION_DENY;
            }
            return API.agency.getAgency({agencyId: agencyId});
        })

}

/**
 * 根据查询条件获取代理商列表
 * @param params
 * @returns {*}
 */
agency.listAgency = function(){
    var self = this;
    return API.agency.listAgency({userId: self.accountId});
}

/**
 * 删除代理商信息
 * @param agencyId
 * @returns {*}
 */
agency.deleteAgency = function(agencyId){
    var self = this;
    var params = {
        agencyId: agencyId,
        userId: self.accountId
    }
    return API.agency.deleteAgency(params);
}

/**************** 代理商用户相关 ****************/

agency.createAgencyUser = checkAgencyPermission("user.add",
    function(agencyUser){
    var self = this;
    return API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']})
        .then(function(user){
            agencyUser.agencyId = user.agencyId;
            return API.agency.createAgencyUser(agencyUser)
        })
});

/**
 * 获取当前代理商用户
 * @returns {*}
 */
agency.getCurrentAgencyUser = function(){
    var self = this;
    var accountId = self.accountId;
    return API.agency.getAgencyUser({id: accountId})
}

/**
 * 删除代理商用户
 * @param userId
 * @returns {*}
 */
agency.deleteAgencyUser = checkAgencyPermission("user.delete",
    function(agencyUserId){
        var self = this;
        var accountId = self.accountId;

        return Q.all([
            API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
            API.agency.getAgencyUser({id:agencyUserId, columns: ['agencyId']})
        ])
            .spread(function(user, target){
                if(user.agencyId != target.agencyId){
                    throw L.ERR.PERMISSION_DENY;
                }

                return API.agency.deleteAgencyUser({id: agencyUserId});
            })
    });

/**
 * 更新代理商用户
 * @param params
 * @returns {*}
 */
agency.updateAgencyUser = checkAgencyPermission("user.edit", updateAgencyUser);
updateAgencyUser.required_params = ['id'];
updateAgencyUser.optional_params = ['status', 'name', 'sex', 'email', 'mobile', 'avatar', 'roleId'];

function updateAgencyUser(params) {
    var self = this;
    var accountId = self.accountId;
    var id = params.id;

    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
        API.agency.getAgencyUser({id: id, columns: ['agencyId']})
    ])
    .spread(function(user, target){
            if(user.agencyId != target.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }

            return API.agency.updateAgencyUser(params);
        })
}

/**
 * 获取代理商用户
 * @param params
 * @returns {*}
 */
agency.getAgencyUser = function(agencyUserId){
    var self = this;
    var accountId = self.accountId;
    if(!agencyUserId){
        throw {code: -1, msg: '用户id不能为空'};
    }
    return Q.all([
        API.agency.getAgencyUser({id: accountId, columns: ['agencyId']}),
        API.agency.getAgencyUser({id: agencyUserId})
    ])
    .spread(function(user, agencyUser){
            if(user.agencyId != agencyUser.agencyId){
                throw L.ERR.PERMISSION_DENY;
            }

            return agencyUser;
        })
}

/**
 * 获取代理商用户
 * @param params
 * @returns {*}
 */

agency.getAgencyUserByCompany = getAgencyUserByCompany;
getAgencyUserByCompany.required_params = ['agencyUserId'];
function getAgencyUserByCompany(params){
    var agencyUserId = params.agencyUserId;

    return API.agency.getAgencyUser({id: agencyUserId, columns: ['name']})
        .then(function(agencyUser){
            console.info(agencyUser);
            return agencyUser;
        })
}

agency.listAndPaginateAgencyUser = function(params) {
    var self = this;
    var user_id = self.accountId;

    return API.agency.getAgencyUser({id:user_id, columns: ['agencyId']})
        .then(function(data){
            params.agencyId = data.agencyId;

            return API.agency.listAndPaginateAgencyUser(params);
        });
}

module.exports = agency;