/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var Agency = Models.Agency;
var AgencyUser = Models.AgencyUser;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var logger = new Logger("agency");
var utils = require("common/utils");
var _ = require('lodash');
var API = require("common/api");
var Paginate = require("common/paginate").Paginate;
var md5 = require("common/utils").md5;

var STATUS = {
    DELETE: -2,
    NOT_ACTIVE: 0,
    ACTIVE: 1
}

var agency = {};

agency.agencyCols = Object.keys(Agency.attributes);

agency.agencyUserCols = Object.keys(AgencyUser.attributes);

/**
 * 注册代理商，生成代理商id
 * @param params
 */
agency.registerAgency = function(params){
    var agency = params;
    var userName = params.userName;
    var agencyId = uuid.v1() || params.agencyId;
    agency.id = agencyId;
    delete agency.userName;

    var pwd = params.pwd || '123456';
    var mobile = params.mobile;
    var email = params.email;
    var account = {
        email: email,
        mobile: mobile,
        pwd: pwd,
        type: 2,
        status: params.status|0
    };

    var agencyUser = {
        agencyId: agencyId,
        name: userName,
        mobile: mobile,
        email: email,
        status: params.status|0,
        roleId: 0
    };

    return API.auth.checkAccExist({type: 2, $or: [{mobile: mobile}, {email: email}]})
        .then(function(ret){
            if(!ret){
                return API.auth.newAccount(account);
            }else{
                return ret;
            }
        })
        .then(function(account){
            var accountId = account.id;
            agency.createUser = accountId;
            agencyUser.id = accountId;

            return sequelize.transaction(function(t){
                return Promise.all([
                    Agency.create(agency, {transaction: t}),
                    AgencyUser.create(agencyUser, {transaction: t})
                ]);
            })
        })
        .spread(function(agency, agencyUser){
            return {agency: agency, agencyUser: agencyUser}
        })
        .catch(function(err){
            logger.error(err);

            return Agency.findOne({where: {$or: [{mobile: mobile}, {email: email}], status: {$ne: STATUS.DELETE}}, attributes: ['id']})
                .then(function(agency){
                    if(agency){
                        throw {code: -4, msg: '手机号或邮箱已经注册'};
                    }else{
                        throw {code: -3, msg: '注册异常'};
                    }
                })
        });
}

agency.createAgency = createAgency;
createAgency.required_params = ['id', 'name', 'email', 'userName'];
createAgency.optional_params = ['mobile', 'pwd', 'description', 'remark', 'status'];
function createAgency(params) {
    var mobile = params.mobile;
    var email = params.email;
    var _agency = params;
    _agency.id = params.id||uuid.v1();
    _agency.createUser = _agency.id;
    var userName = params.userName;
    delete agency.userName;

    var _agencyUser = {
        id: _agency.id,
        agencyId: _agency.id,
        name: userName,
        mobile: params.mobile,
        email: params.email,
        status: params.status|0,
        roleId: 0
    };

    return sequelize.transaction(function(t){
        return Promise.all([
            Agency.create(_agency, {transaction: t}),
            AgencyUser.create(_agencyUser, {transaction: t})
        ]);
    })
        .spread(function(agency, agencyUser){
            return {agency: agency, agencyUser: agencyUser}
        })
        .catch(function(err){
            logger.error(err);

            return Agency.findOne({where: {$or: [{mobile: mobile}, {email: email}], status: {$ne: STATUS.DELETE}}, attributes: ['id']})
                .then(function(agency){
                    if(agency){
                        throw {code: -4, msg: '手机号或邮箱已经注册'};
                    }else{
                        throw {code: -3, msg: '注册异常'};
                    }
                })
        });
}

/**
 * 更新代理商信息
 * @param params
 * @returns {*}
 */
agency.updateAgency = function(_agency){
    var agencyId = _agency.agencyId;
    var userId = _agency.userId;
    return Agency.findById(agencyId, {attributes: ['createUser']})
        .then(function(agency){
            if(!agency || agency.status ==STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            if(agency.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            _agency.updateAt = utils.now();

            return Agency.update(_agency, {returning: true, where: {id: agencyId}, fields: Object.keys(_agency)})
        })
        .spread(function(rows, agencies){
            if(!rows || rows == "NaN"){
                throw {code: -2, msg: '更新代理商信息失败'};
            }

            return agencies[0];
        })
}

/**
 * 获取代理商信息
 * @param agencyId
 * @returns {*}
 */
agency.getAgency = function(params){
    if(!params.agencyId){
        throw {code: -1, msg: '参数 agencyId 不能为空'};
    }
    var agencyId = params.agencyId;
    return Agency.findById(agencyId, {attributes: ['id', 'name', 'agencyNo', 'companyNum', 'createAt', 'createUser', 'email', 'mobile', 'remark', 'status', 'updateAt']})
        .then(function(agency){
            if(!agency || agency.status == STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            return agency;
        })
}

/**
 * 管理员获取代理商列表
 * @param params
 * @returns {*}
 */
agency.listAgency = function(params){
    if(!params.userId){
        throw {code: -1, msg: '参数userId不能为空'};
    }

    return Agency.findAll({where: {status: {$ne: STATUS.DELETE}}});
}

/**
 * 删除代理商
 * @param params
 * @returns {*}
 */
agency.deleteAgency = deleteAgency;
deleteAgency.required_params = ['agencyId', 'userId'];
function deleteAgency(params){
    var agencyId = params.agencyId;
    var userId = params.userId;

    return Promise.all([
        Agency.findById(agencyId, {attributes: ['createUser']}),
        AgencyUser.findAll({where: {agencyId: agencyId, status: {$ne: STATUS.DELETE}}, attributes: ['id']})
    ])
        .spread(function(agency, users){
            if(!agency || agency.status == STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            if(agency.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            return users;
        })
        .then(function(users){
            return sequelize.transaction(function(t){
                return Promise.all([
                    Agency.update({status: STATUS.DELETE, updateAt: utils.now()},
                        {where: {id: agencyId}, fields: ['status', 'updateAt'], transaction: t}),
                    AgencyUser.update({status: STATUS.DELETE, updateAt: utils.now()},
                        {where: {agencyId: agencyId}, fields: ['status', 'updateAt'], transaction: t})
                ])
                    .then(function(){
                        return users.map(function(user){
                            return API.auth.remove({accountId: user.id, type: 2})
                        })
                    })
            })
        })
        .then(function(){
            return true;
        })
}


/**
 * 创建代理商
 * @param data
 * @returns {*}
 */
agency.createAgencyUser = createAgencyUser;
createAgencyUser.required_params = ['email', 'mobile', 'agencyId', 'name'];
createAgencyUser.optional_params = agency.agencyUserCols;
function createAgencyUser(data){
    var _agencyUser = data;
    _agencyUser.id = data.accountId || uuid.v1();

    var accData = {email: _agencyUser.email, mobile: _agencyUser.mobile, pwd: "123456", type: 2};//初始密码暂定123456

    return API.auth.newAccount(accData)
        .then(function(account){
            _agencyUser.id = account.id;

            return AgencyUser.create(_agencyUser);
        })
}

/**
 * 删除代理商
 * @param params
 * @returns {*}
 */
agency.deleteAgencyUser = function(params){
    var userId = params.id;

    if (!userId) {
        throw {code: -1, msg: "id不能为空"};
    }

    return AgencyUser.findById(userId, {attributes: ['status', 'id']})
        .then(function(user){
            if(!user || user.status == STATUS.DELETE){
                throw {code: -2, msg: '用户不存在'};
            }

            return Promise.all([
                API.auth.remove({accountId: userId}),
                AgencyUser.update({status: STATUS.DELETE}, {where: {id: userId}, fields: ['status']})
            ])
        })
        .then(function(){
            return true;
        })
}

/**
 * 更新代理商
 * @param id
 * @param data
 * @returns {*}
 */
agency.updateAgencyUser = updateAgencyUser;
updateAgencyUser.required_params = ['id'];
updateAgencyUser.optional_params = ['name', 'sex', 'mobile', 'avatar', 'roleId', 'status'];
function updateAgencyUser(data){
    var id = data.id;

    return AgencyUser.findById(id, {attributes: ['status']})
        .then(function(user){
            if(!user || user.status == STATUS.DELETE) {
                throw L.ERR.NOT_FOUND;
            }

            var options = {};
            options.where = {id: id};
            options.returning = true;

            return AgencyUser.update(data, options);
        })
        .spread(function(rows, users){
            if(rows != 1) {
                throw {code: -2, msg: '操作失败'};
            }
            return users[0];
        })
}

/**
 * 根据id查询代理商
 * @param id
 * @param data
 * @returns {*}
 */
agency.getAgencyUser = getAgencyUser;
getAgencyUser.required_params = ['id'];
getAgencyUser.optional_params = ['columns'];
function getAgencyUser(params){
    var id = params.id;
    var options = {};

    if(params.columns){
        options.attributes = params.columns;
    }

    return AgencyUser.findById(id, options)
        .then(function(agencyUser){
            if(!agencyUser || agencyUser.status == STATUS.DELETE){
                throw {code: -2, msg: '用户不存在'};
            }

            return agencyUser;
        })
}

/**
 * 通过邮箱获取代理商信息
 * @type {agencyByEmail}
 */
agency.agencyByEmail = agencyByEmail;
agencyByEmail.required_params = ['email'];
function agencyByEmail(params) {
    params.status = {$ne: STATUS.DELETE};
    return Agency.findOne({where: params})
}

/**
 * 分页查询代理商集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 */
agency.listAndPaginateAgencyUser = function(params){
    var options = {};
    if(params.options){
        options = params.options;
        delete params.options;
    }
    var page, perPage, limit, offset;
    if (options.page && /^\d+$/.test(options.page)) {
        page = options.page;
    } else {
        page = 1;
    }
    if (options.perPage && /^\d+$/.test(options.perPage)) {
        perPage = options.perPage;
    } else {
        perPage = 6;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = params;
    return AgencyUser.findAndCountAll(options)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

/**
 * 得到代理商用户 用于获取查看票据的代理商用户id 不需要暴露给客户端
 * @param params
 * @returns {*|Promise}
 */
agency.getAgencyUsersId = function(params){
    return AgencyUser.findAll({where: params, attributes: ['id']})
        .then(function(result){
            return result;
        });
}

/**
 * 测试用例使用删除代理商和用户的操作，不在client里调用
 * @param params
 */
agency.deleteAgencyByTest = function(params){
    var email = params.email;
    var mobile = params.mobile;
    var name = params.name;
    return Promise.all([
        API.auth.remove({email: email, mobile:mobile, type: 2}),
        Agency.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}}),
        AgencyUser.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}})
    ])
        .then(function(){
            return true;
        })
}

var isInit = false;
agency.__initHttpApp = function() {
    logger.info("初始化默认代理商...");
    if(isInit) {
        return;
    }
    isInit = true;
    var default_agency = require('config/config').default_agency;
    var email = default_agency.email;
    var mobile = default_agency.mobile;
    var pwd = default_agency.pwd;
    var user_name = default_agency.user_name;

    ///初始化系统默认代理商
    Promise.all([
        API.agency.agencyByEmail({email: email}),
        API.auth.checkAccExist({type: 2, $or: [{mobile: mobile}, {email: email}]}),
        API.company.listCompany({agencyId: null})
    ])
        .spread(function(agency, ret, companys){
            if(agency || ret) {
                return [agency, ret, companys];
            }

            var _account = {
                email: email,
                mobile: mobile,
                pwd: pwd|'123456',
                status: 1,
                type: 2
            }

            return [agency, API.auth.newAccount(_account), companys];
        })
        .spread(function(agency, account, companys) {
            if(agency) {
                return [agency.id, companys];
            }

            var _agency = {
                id: account.id,
                name: default_agency.name,
                email: email,
                mobile: mobile,
                pwd: pwd|'123456',
                status: 1,
                userName: user_name,
                remark: '系统默认代理商'
            }

            return API.agency.createAgency(_agency)
                .then(function(ret) {
                    return [ret.agency.id, companys];
                })
        })
        .spread(function(agencyId, companys) {
            API.agency.__defaultAgencyId = agencyId;

            return companys.map(function(c) {
                return API.company.updateCompany({companyId: c.id, agencyId: agencyId})
            })
        })
        .catch(function(err) {
            logger.error("初始化系统默认代理商失败...");
            logger.error(err);
        })

}

module.exports = agency;