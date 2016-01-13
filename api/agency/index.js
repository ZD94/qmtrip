/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
var Q = require('q');
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var Agency = Models.Agency;
var AgencyUser = Models.AgencyUser;
var uuid = require("node-uuid");
var L = require("common/language");
var Logger = require('common/logger');
var logger = new Logger("agency");
var utils = require("common/utils");
var checkAndGetParams = utils.checkAndGetParams;
var API = require("common/api");
var Paginate = require("common/paginate").Paginate;
var md5 = require("common/utils").md5;

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
    var pwd = params.pwd || md5('123456');
    var mobile = params.mobile;
    var email = params.email;
    var account = {email: email, mobile: mobile, pwd: pwd, type: 2};
    var agencyUser = {
        agencyId: agencyId,
        name: userName,
        mobile: mobile,
        email: email
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
                return Q.all([
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
            return Agency.findOne({where: {$or: [{mobile: mobile}, {email: email}], status: {$ne: -2}}, attributes: ['id']})
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
            if(!agency || agency.status == -2){
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
    var params = checkAndGetParams(['agencyId', 'userId'], [], params);
    var agencyId = params.agencyId;
    var userId = params.userId;
    return Agency.findById(agencyId, {attributes: ['id', 'name', 'agencyNo', 'companyNum', 'createAt', 'createUser', 'email', 'mobile', 'remark', 'status', 'updateAt']})
        .then(function(agency){
            if(!agency || agency.status == -2){
                throw L.ERR.AGENCY_NOT_EXIST;
            }
            return agency;
        })
}

/**
 * 获取代理商列表
 * @param params
 * @returns {*}
 */
agency.listAgency = function(params){
    if(!params.userId){
        throw {code: -1, msg: '参数userId不能为空'};
    }
    var userId = params.userId;
    delete params.userId;
    return Agency.findAll({where: params});
}

/**
 * 删除代理商
 * @param params
 * @returns {*}
 */
agency.deleteAgency = function(params){
    var params = checkAndGetParams(['agencyId', 'userId'], [], params);
    var agencyId = params.agencyId;
    var userId = params.userId;
    return Q.all([
        Agency.findById(agencyId, {attributes: ['createUser']}),
        AgencyUser.findAll({where: {agencyId: agencyId, status: {$ne: -2}}, attributes: ['id']})
    ])
        .spread(function(agency, users){
            if(!agency || agency.status == -2){
                throw L.ERR.AGENCY_NOT_EXIST;
            }
            if(agency.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }
            return users;
        })
        .then(function(users){
            return sequelize.transaction(function(t){
                return Q.all([
                    Agency.update({status: -2, updateAt: utils.now()},
                        {where: {id: agencyId}, fields: ['status', 'updateAt'], transaction: t}),
                    AgencyUser.update({status: -2, updateAt: utils.now()},
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
agency.createAgencyUser = function(data){
    var _agencyUser = checkAndGetParams(['email', 'mobile', 'agencyId', 'name'], this.agencyUserCols, data);
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
            if(!user || user.status == -2){
                throw {code: -2, msg: '用户不存在'};
            }
            return Q.all([
                API.auth.remove({accountId: userId}),
                AgencyUser.update({status: -2}, {where: {id: userId}, fields: ['status']})
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
agency.updateAgencyUser = function(data){
    var id = data.id;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    delete data.id;
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return AgencyUser.update(data, options)
        .spread(function(rows, users){
            return users[0];
        })
}

/**
 * 根据id查询代理商
 * @param id
 * @param data
 * @returns {*}
 */
agency.getAgencyUser = function(params){
    var id = params.id;
    if(!id){
        throw {code: -1, msg: "id不能为空"}
    }
    var options = {};
    if(params.columns){
        options.attributes = params.columns;
    }
    return AgencyUser.findById(id, options)
        .then(function(agencyUser){
            if(!agencyUser || agencyUser.status == -2){
                throw {code: -2, msg: '用户不存在'};
            }
            return agencyUser;
        })
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
 * 测试用例使用删除代理商和用户的操作，不在client里调用
 * @param params
 */
agency.deleteAgencyByTest = function(params){
    var email = params.email;
    var mobile = params.mobile;
    var name = params.name;
    return Q.all([
        API.auth.remove({email: email, mobile:mobile, type: 2}),
        Agency.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}}),
        AgencyUser.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}})
    ])
        .then(function(){
            return true;
        })
}


module.exports = agency;