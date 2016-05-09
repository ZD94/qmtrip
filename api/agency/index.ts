/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
let sequelize = require("common/model").importModel("./models");
let Models = sequelize.models;
let AgencyModel = Models.Agency;
let AgencyUserModel = Models.AgencyUser;
let API = require("common/api");
let uuid = require("node-uuid");
import _ = require('lodash');
import L = require("common/language");
import Logger = require('common/logger');
import utils = require("common/utils");
import {validateApi} from 'common/api/helper';
import {Paginate} from 'common/paginate';
import {Agency, AgencyUser, AGENCY_STATUS} from "api/_types/agency";
import { ServiceInterface } from '../_types/index';

let logger = new Logger("agency");
let agency : any = {};

agency.agencyCols = Object.keys(AgencyModel.attributes);
agency.agencyUserCols = Object.keys(AgencyUserModel.attributes);


export class AgencyService implements ServiceInterface<Agency>{
    async create(obj: Object): Promise<Agency>{
        return API.agency.create(obj);
    }
    async get(id: string): Promise<Agency>{
        return API.agency.getAgency({agencyId: id});
    }
    async find(where: any): Promise<Agency[]>{
        return API.agency.listAgency(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields['agencyId'] = id;
        return API.agency.updateAgency(fields);
    }
    async destroy(id: string): Promise<any> {

        return API.agency.deleteAgency({agencyId: id});
    }
}
export class AgencyUserService implements ServiceInterface<AgencyUser>{
    async create(obj: Object): Promise<AgencyUser>{
        return API.agency.createAgencyUser(obj);
    }
    async get(id: string): Promise<AgencyUser>{
        return API.agency.getAgencyUser(id);
    }
    async find(where: any): Promise<AgencyUser[]>{
        return API.agency.listAndPaginateAgencyUser(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields['id'] = id;
        return API.agency.updateAgencyUser(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.agency.deleteAgencyUser({id: id});
    }
}

// /**
//  * 注册代理商，生成代理商id
//  * @param params
//  */
// agency.createAgency = function(params){
//     let agency = new Agency(params);
//     let agencyId = uuid.v1() || params.agencyId;
//     agency.id = agencyId;
//     let pwd = params.pwd || '123456';
//     let mobile = params.mobile;
//     let email = params.email;
//     let account = {email: email, mobile: mobile, pwd: pwd, type: 2, status: params.status || AGENCY_STATUS.UN_ACTIVE};
//     let agencyUser  = new AgencyUser({agencyId: agencyId, name: params.userName, mobile: mobile, email: email, 
//         status: params.status || AGENCY_STATUS.UN_ACTIVE, roleId: 0});
//
//     return API.auth.checkAccExist({type: 2, $or: [{mobile: mobile}, {email: email}]})
//         .then(function(ret){
//             if(!ret){
//                 return API.auth.newAccount(account);
//             }else{
//                 return ret;
//             }
//         })
//         .then(function(account){
//             var accountId = account.id;
//             agency.createUser = accountId;
//             agencyUser.id = accountId;
//
//             return sequelize.transaction(function(t){
//                 return Promise.all([
//                     AgencyModel.create(agency, {transaction: t}),
//                     AgencyUserModel.create(agencyUser, {transaction: t})
//                 ]);
//             })
//         })
//         .spread(function(agency, agencyUser){
//             return {agency: agency, agencyUser: agencyUser}
//         })
//         .catch(function(err){
//             logger.error(err);
//
//             return AgencyModel.findOne({where: {$or: [{mobile: mobile}, {email: email}], status: {$ne: AGENCY_STATUS.DELETE}}, attributes: ['id']})
//                 .then(function(agency){
//                     if(agency){
//                         throw {code: -4, msg: '手机号或邮箱已经注册'};
//                     }else{
//                         throw {code: -3, msg: '注册异常'};
//                     }
//                 })
//         });
// }

/**
 * 创建代理商
 * @param params
 * @returns {Agency}
 */
agency.create = async function(params: {name: string, email: string, pwd: string, id?: string, mobile?: string, 
    description?: string, remark?: string, status?: number}): Promise<Agency> {
    let _agency = await AgencyModel.findOne({where: {email: params.email}});
    
    if(_agency) {
        throw {code: -2, msg: '该邮箱已经注册代理商'};
    }
    
    if(params.mobile) {
        let agency_mobile = await AgencyModel.findOne({where: {mobile: params.mobile}});
        if(agency_mobile) {
            throw {code: -3, msg: '该手机号已经注册代理商'};
        }
    }
    
    let agency = await AgencyModel.create(params);
    return new Agency(agency);
};

agency.createAgency = createAgency;
validateApi(createAgency, ['name', 'email', 'userName'], ['id', 'mobile', 'pwd', 'description', 'remark', 'status']);
function createAgency(params) {
    var mobile = params.mobile;
    var email = params.email;
    var _agency = _.clone(params);
    _agency.id = params.id || uuid.v1();
    _agency.createUser = _agency.id;
    var userName = params.userName;
    var _agencyUser = {id: _agency.id, agencyId: _agency.id, name: userName, mobile: params.mobile, email: params.email,
        status: params.status || AGENCY_STATUS.UN_ACTIVE, roleId: 0};

    return sequelize.transaction(function(t){
        return Promise.all([
            AgencyModel.create(_agency, {transaction: t}),
            AgencyUserModel.create(_agencyUser, {transaction: t})
        ]);
    })
        .spread(function(agency, agencyUser){
            return {agency: agency, agencyUser: agencyUser}
        })
        .catch(function(err){
            logger.error(err);

            return AgencyModel.findOne({where: {$or: [{mobile: mobile}, {email: email}], status: {$ne: AGENCY_STATUS.DELETE}}, attributes: ['id']})
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
    return AgencyModel.findById(agencyId, {attributes: ['createUser']})
        .then(function(agency){
            if(!agency || agency.status ==AGENCY_STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            if(agency.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            _agency.updateAt = utils.now();

            return AgencyModel.update(_agency, {returning: true, where: {id: agencyId}, fields: Object.keys(_agency)})
        })
        .spread(function(rows, agencies){
            if(!rows || rows == "NaN"){
                throw {code: -2, msg: '更新代理商信息失败'};
            }

            return new Agency(agencies[0]);
        })
}

/**
 * 获取代理商信息
 * @param agencyId
 * @returns {*}
 */
agency.getAgency = getAgency;
validateApi(getAgency, ['agencyId']);
function getAgency(params){
    var agencyId = params.agencyId;
    return AgencyModel.findById(agencyId, {attributes: ['id', 'name', 'agencyNo', 'companyNum', 'createAt', 'createUser', 'email', 'mobile', 'remark', 'status', 'updateAt']})
        .then(function(agency){
            if(!agency || agency.status == AGENCY_STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            return new Agency(agency);
        })
}

/**
 * 管理员获取代理商列表
 * @param params
 * @returns {*}
 */
agency.listAgency = function(params){
    return AgencyModel.findAll({where: {status: {$ne: AGENCY_STATUS.DELETE}}, attributes: ['id']});
}

/**
 * 删除代理商
 * @param params
 * @returns {*}
 */
agency.deleteAgency = deleteAgency;
validateApi(deleteAgency, ['agencyId'], ['userId']);
function deleteAgency(params){
    var agencyId = params.agencyId;
    var userId = params.userId;

    return Promise.all([
        AgencyModel.findById(agencyId, {attributes: ['createUser']}),
        AgencyUserModel.findAll({where: {agencyId: agencyId, status: {$ne: AGENCY_STATUS.DELETE}}, attributes: ['id']})
    ])
        .spread(function(agency, users: any){
            if(!agency || agency.status == AGENCY_STATUS.DELETE){
                throw L.ERR.AGENCY_NOT_EXIST;
            }

            if(agency.createUser != userId){
                throw L.ERR.PERMISSION_DENY;
            }

            return users;
        })
        .then(function(users: any){
            return sequelize.transaction(function(t){
                return Promise.all([
                    AgencyModel.update({status: AGENCY_STATUS.DELETE, updateAt: utils.now()},
                        {where: {id: agencyId}, fields: ['status', 'updateAt'], transaction: t}),
                    AgencyUserModel.update({status: AGENCY_STATUS.DELETE, updateAt: utils.now()},
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
validateApi(createAgencyUser, ['email', 'mobile', 'agencyId', 'name'], agency.agencyUserCols);
async function createAgencyUser(params){
    params.id = params.id ? params.id : uuid.v1();
    
    let _agencyUser = await AgencyUserModel.findOne({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

    if(_agencyUser) {
        throw {code: -2, msg: '邮箱或手机号已经注册代理商'};
    }

    let agencyUser = await AgencyUserModel.create(params);
    return new AgencyUser(agencyUser);
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

    return AgencyUserModel.findById(userId, {attributes: ['status', 'id']})
        .then(function(user){
            if(!user || user.status == AGENCY_STATUS.DELETE){
                throw {code: -2, msg: '用户不存在'};
            }

            return Promise.all([
                API.auth.remove({accountId: userId}),
                AgencyUserModel.update({status: AGENCY_STATUS.DELETE}, {where: {id: userId}, fields: ['status']})
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
validateApi(updateAgencyUser, ['id'], ['name', 'sex', 'mobile', 'avatar', 'roleId', 'status']);
function updateAgencyUser(data){
    var id = data.id;

    return AgencyUserModel.findById(id, {attributes: ['status']})
        .then(function(user){
            if(!user || user.status == AGENCY_STATUS.DELETE) {
                throw L.ERR.NOT_FOUND;
            }

            var options : any = {};
            options.where = {id: id};
            options.returning = true;

            return AgencyUserModel.update(data, options);
        })
        .spread(function(rows, users){
            if(rows != 1) {
                throw {code: -2, msg: '操作失败'};
            }
            return new AgencyUser(users[0]);
        })
}

/**
 * 获取代理商用户
 * @param params
 * @returns {*}
 */
agency.getAgencyUser = getAgencyUser;
async function getAgencyUser(params){
    let id = params.id;
    let options : any = {};

    if(params.columns){
        options.attributes = params.columns;
    }

    let agencyUser = await AgencyUserModel.findById(id, options);

    if(!agencyUser || agencyUser.status === AGENCY_STATUS.DELETE){
        throw {code: -2, msg: '用户不存在'};
    }

    return new AgencyUser(agencyUser);
}

/**
 * 通过邮箱获取代理商信息
 * @type {agencyByEmail}
 */
agency.agencyByEmail = agencyByEmail;
validateApi(agencyByEmail, ['email'])
function agencyByEmail(params) {
    params.status = {$ne: AGENCY_STATUS.DELETE};
    return AgencyModel.findOne({where: params})
}

/**
 * 分页查询代理商集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 */
agency.listAndPaginateAgencyUser = function(params){
    var options : any = {};
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
    return AgencyUserModel.findAndCountAll(options)
        .then(function(result){
            var data = result.rows.map(function(user) {
                return user.id;
            })
            return new Paginate(page, perPage, result.count, data);
        });
}

/**
 * 得到代理商用户 用于获取查看票据的代理商用户id 不需要暴露给客户端
 * @param params
 * @returns {*|Promise}
 */
agency.getAgencyUsersId = function(params){
    return AgencyUserModel.findAll({where: params, attributes: ['id']})
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
        AgencyModel.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}}),
        AgencyUserModel.destroy({where: {$or: [{email:email}, {mobile:mobile}, {name: name}]}})
    ])
        .then(function(){
            return true;
        })
}

var isInit = false;
agency.__initOnce = function() {
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
                pwd: pwd||'123456',
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
                pwd: pwd||'123456',
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