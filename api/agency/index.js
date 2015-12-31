/**
 * Created by yumiao on 15-12-9.
 */
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
var getColsFromParams = utils.getColsFromParams;
var checkAndGetParams = utils.checkAndGetParams;
var API = require("common/api");
var Paginate = require("common/paginate").Paginate;
var errorHandle = require("common/errorHandle");
var md5 = require("common/utils").md5;

var agency = {};


/**
 * 注册代理商，生成代理商id
 * @param params
 * @param callback
 */
agency.registerAgency = function(params, callback){
    var agency = checkAndGetParams(['name', 'email', 'mobile', 'userName'], [], params, true);
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
                ])
            })
        })
        .spread(function(agency, agencyUser){
            return {code: 0, msg: '注册成功', agency: agency, agencyUser: agencyUser}
        })
        .catch(function(err){
            logger.error(err);
            return Agency.findOne({where: {$or: [{mobile: mobile}, {email: email}]}, attributes: ['id']})
                .then(function(agency){
                    if(agency){
                        throw {code: -4, msg: '手机号或邮箱已经注册'};
                    }else{
                        throw {code: -3, msg: '注册异常'};
                    }
                })
        })
        .nodeify(callback);
}

/**
 * 更新代理商信息
 * @param params
 * @param callback
 * @returns {*}
 */
agency.updateAgency = function(params, callback){
    var defer = Q.defer();
    var _agency = checkAndGetParams(['agencyId', 'userId'],
        ['name', 'description', 'status', 'address', 'email', 'telephone', 'mobile', 'company_num', 'remark'], params);
    var agencyId = params.agencyId;
    var userId = params.userId;
    return Agency.findById(agencyId, {attributes: ['createUser']})
        .then(function(agency){
            if(!agency || agency.status == -2){
                defer.reject(L.ERR.AGENCY_NOT_EXIST);
                return defer.promise;
            }
            if(agency.createUser != userId){
                defer.reject(L.ERR.PERMISSION_DENY);
                return defer.promise;
            }
            _agency.updateAt = utils.now();
            var cols = getColsFromParams(_agency);
            return Agency.update(_agency, {returning: true, where: {id: agencyId}, fields: cols})
                .spread(function(rows, agencies){
                    if(!rows || rows == "NaN"){
                        defer.reject({code: -2, msg: '更新代理商信息失败'});
                        return defer.promise;
                    }
                    return agencies[0];
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 获取代理商信息
 * @param agencyId
 * @param callback
 * @returns {*}
 */
agency.getAgency = function(params, callback){
    return checkParams(['agencyId', 'userId'], params)
        .then(function(){
            var agencyId = params.agencyId;
            var userId = params.userId;
            return Agency.findById(agencyId, {attributes: ['id', 'name', 'agencyNo', 'companyNum', 'createAt', 'createUser', 'email', 'mobile', 'remark', 'status', 'updateAt']})
                .then(function(agency){
                    if(!agency || agency.status == -2){
                        throw {code: -2, msg: '没有代理商'};
                    }
                    return agency;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 获取代理商列表
 * @param params
 * @param callback
 * @returns {*}
 */
agency.listAgency = function(params, callback){
    return checkParams(['userId'], params)
        .then(function(){
            //var agencyId = params.agencyId;
            var userId = params.userId;
            delete params.userId;
            return Agency.findAll({where: params})
                .then(function(ret){
                    return ret;
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 删除代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.deleteAgency = function(params, callback){
    return checkParams(['agencyId', 'userId'], params)
        .then(function(){
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

                    return sequelize.transaction(function(t){
                        return Q.all([
                            Agency.update({status: -2, updateAt: utils.now()},
                                {where: {id: agencyId}, fields: ['status', 'updateAt'], transaction: t}),
                            AgencyUser.update({status: -2, updateAt: utils.now()},
                                {where: {agencyId: agencyId}, fields: ['status', 'updateAt'], transaction: t})
                        ])
                    })
                        .then(function(){
                            return users.map(function(user){
                                return API.auth.remove({accountId: user.id})
                            })
                        })
                })
                .then(function(){
                    return {code: 0, msg: '删除成功'};
                })
        })
        .catch(errorHandle)
        .nodeify(callback);
}


///检查参数是否存在,
function checkParams(checkArray, params, callback){
    var defer = Q.defer();
    for(var key in checkArray){
        var name = checkArray[key];
        if(!params[name] && params[name] !== false && params[name] !== 0){
            defer.reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            return defer.promise.nodeify(callback);
        }
    }
    defer.resolve({code: 0});
    return defer.promise.nodeify(callback);
}


/************************** 代理商用户 **************************/

/**
 * 创建代理商
 * @param data
 * @param callback
 * @returns {*}
 */
agency.createAgencyUser = function(data, callback){
    var defer = Q.defer();
    var accountId = data.accountId;
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }
    if (!data.email) {
        defer.reject({code: -1, msg: "邮箱不能为空"});
        return defer.promise.nodeify(callback);
    }
    if (!data.mobile) {
        defer.reject({code: -2, msg: "手机号不能为空"});
        return defer.promise.nodeify(callback);
    }
    if (!data.name) {
        defer.reject({code: -3, msg: "姓名不能为空"});
        return defer.promise.nodeify(callback);
    }
    if(!data.agencyId){
        defer.reject({code: -4, msg: "代理商不能为空"});
        return defer.promise.nodeify(callback);
    }
    return Q()
        .then(function() {
            if (accountId) {
                data.id = accountId;
                return data;
            }
            var accData = {email: data.email, mobile: data.mobile, pwd: "123456", type: 2};//初始密码暂定123456
            return API.auth.newAccount(accData)
                .then(function(account){
                    data.id = account.id;
                    return data;
                });
        })
        .then(function(agencyUser) {
            return AgencyUser.create(agencyUser);
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 删除代理商
 * @param params
 * @param callback
 * @returns {*}
 */
agency.deleteAgencyUser = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return AgencyUser.findById(id, {attributes: ['status', 'id']})
        .then(function(user){
            if(!user || user.status == -2){
                throw {code: -2, msg: '用户不存在'};
            }
            return Q.all([
                API.auth.remove({accountId: id}),
                AgencyUser.update({status: -2}, {where: {id: id}, fields: ['status']})
            ])
        })
        .then(function(){
            return {code: 0, msg: '删除用户成功'};
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 更新代理商
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
agency.updateAgencyUser = function(data, callback){
    var defer = Q.defer();
    var id = data.id;
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    delete data.id;
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return AgencyUser.update(data, options)
        .spread(function(rows, users){
            return users[0];
        })
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 根据id查询代理商
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
agency.getAgencyUser = function(params, callback){
    var defer = Q.defer();
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
        .catch(errorHandle)
        .nodeify(callback);
}

/**
 * 分页查询代理商集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
agency.listAndPaginateAgencyUser = function(params, callback){
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
        })
        .catch(errorHandle)
        .nodeify(callback);
}


module.exports = agency;