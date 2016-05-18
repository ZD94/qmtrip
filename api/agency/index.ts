/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
let sequelize = require("common/model").DB;
let Models = sequelize.models;
let API = require("common/api");
let uuid = require("node-uuid");
import _ = require('lodash');
import L = require("common/language");
import Logger = require('common/logger');
import utils = require("common/utils");
import {requireParams, clientExport} from 'common/api/helper';
import {Paginate} from 'common/paginate';
import {Agency, AgencyUser, EAgencyStatus, AgencyError} from "api/_types/agency";
import { ServiceInterface } from 'common/model';
import {requirePermit} from "../_decorator";
import async = Q.async;
let logger = new Logger("agency");

let agencyCols = Agency['$fieldnames'];
let agencyUserCols = AgencyUser['$fieldnames'];

class AgencyModule {
    /**
     * @method createAgency
     * 创建代理商
     * @param params
     * @returns {Promise<Agency>}
     */
    static async createAgency(params:{name:string, email:string, pwd:string, id?:string, mobile?:string,description?:string, remark?:string, status?:number}):Promise<Agency> {
        let _agency = await Models.Agency.findOne({where: {email: params.email}});

        if (_agency) {
            throw {code: -2, msg: '该邮箱已经注册代理商'};
        }

        if (params.mobile) {
            let agency_mobile = await Models.Agency.findOne({where: {mobile: params.mobile}});
            if (agency_mobile) {
                throw {code: -3, msg: '该手机号已经注册代理商'};
            }
        }

        let agency = await Models.Agency.create(params);

        return new Agency(agency);
    };


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
     * @param {string} params.pwd 密码 选
     * 填，如果手机号和邮箱在全麦注册过，则密码还是以前的密码
     * @returns {Promise<Agency>}
     */
    @clientExport
    @requireParams(['name', 'email', 'mobile', 'userName'], ['description', 'remark', 'pwd'])
    static async registerAgency(params):Promise<Agency> {
        let email = params.email;
        let mobile = params.mobile;
        let password = params.pwd || "123456";
        let ACCOUNT_TYPE : number = 2; //账号类型，2为代理商账号
        let account = await API.auth.checkAccExist({type: ACCOUNT_TYPE, $or: [{mobile: mobile}, {email: email}]});

        if(!account) {
            let _account : any = {email: email, mobile: mobile, pwd: password, type: ACCOUNT_TYPE};
            account = await API.auth.newAccount(_account);
        }

        params.id = account.id;
        params.createUser = account.id;

        let agency = await Models.agency.create(params);
        let _agencyUser: any = _.pick(params, ['email', 'mobile', 'sex', 'avatar']);
        _agencyUser.id = account.id;
        _agencyUser.agencyId = agency.id;
        _agencyUser.roleId = 0;
        _agencyUser.name = params.userName;

        await Models.agency.createAgencyUser(_agencyUser);

        return new Agency(agency);
    }

    /**
     * @method getAgencyById
     *
     * 获取代理商信息
     *
     * @param {object} params
     * @param params.agencyId 代理商id
     * @returns {Promise<Agency>}
     */
    @clientExport
    @requireParams(['id'])
    static async getAgencyById(params: {id: string}): Promise<Agency>{
        let {accountId} = Zone.current.get('session');
        let agencyId = params.id;
        let user = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});

        if(user.agencyId != agencyId){
            throw L.ERR.PERMISSION_DENY;
        }

        let agency = await Models.agency.findById({id: agencyId});

        if (!agency || agency.status == EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        return new Agency(agency);
    }

    /**
     * @method updateAgency
     * 更新代理商信息
     * @param params
     * @returns {Promsie<Agency>}
     */
    @clientExport
    @requireParams(['id'], ['name', 'description', 'status', 'address', 'email', 'telephone', 'mobile', 'company_num', 'remark'])
    static async updateAgency(_agency): Promise<Agency> {
        let {accountId} = Zone.current.get('session');
        let agencyId = _agency.id;
        let agency = await Models.Agency.findById(agencyId, {attributes: ['createUser']});

        if (!agency || agency.status == EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        if (agency.createUser != accountId) {
            throw L.ERR.PERMISSION_DENY;
        }

        _agency.updatedAt = utils.now();

        let [rows, agencies] = await Models.Agency.update(_agency, {returning: true, where: {id: agencyId}, fields: Object.keys(_agency)});

        if (!rows || rows == "NaN") {
            throw {code: -2, msg: '更新代理商信息失败'};
        }

        return new Agency(agencies[0]);
    }

    /**
     * @method listAgency
     * 查询代理商列表
     * @param params
     * @returns {Promise<string[]>}
     */
    static async listAgency(params?: any): Promise<string[]>{
        let agencies = await Models.Agency.findAll({where: {status: {$ne: EAgencyStatus.DELETE}}, attributes: ['id']});

        return agencies.map(function(agency) {
            return agency.id;
        })
    }

    /**
     * @method deleteAgency
     * 删除代理商
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    static async deleteAgency(params): Promise<boolean> {
        let {accountId} = Zone.current.get('session');
        let agencyId = params.id;
        let selfUser = await Models.agencyUser.findById(accountId, {attributes: ['createUser', 'status']})
        let agency = await Models.Agency.findById(agencyId, {attributes: ['createUser', 'status']});

        if (!agency || agency.status == EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        if(selfUser.id != agency.createUser) {
            throw L.ERR.PERMISSION_DENY;
        }

        let agencyUsers = await Models.AgencyUser.findAll({where: {agencyId: agencyId, status: {$ne: EAgencyStatus.DELETE}}, attributes: ['id']});

        await Models.Agency.update({status: EAgencyStatus.DELETE, updatedAt: utils.now()}, {where: {id: agencyId}, fields: ['status', 'updatedAt']});
        await Models.AgencyUser.update({status: EAgencyStatus.DELETE, updatedAt: utils.now()}, {where: {agencyId: agencyId}, fields: ['status', 'updatedAt']});

        await agencyUsers.map(async function (user) {
            await Models.Accounts.destroy({where: {id: user.id}});
        });

        return true;
    }


    /**
     * @method createAgencyUser
     * 创建代理商用户
     * @param params
     * @returns {Promise<AgencyUser>}
     */
    @clientExport
    @requirePermit("user.add", 2)
    @requireParams(['email', 'name'], ['mobile', 'sex', 'avatar', 'roleId'])
    static async createAgencyUser(params: {email: string, name: string, mobile?: string, sex?: number, avatar?: string, roleId?: number}): Promise<AgencyUser> {
        let {accountId} = Zone.current.get('session');
        let curUser = await Models.AgencyUser.findById(accountId, {attributes: ['agencyId']});
        let agencyId = curUser.agencyId;
        params['agencyId'] = agencyId;

        if(!curUser || curUser.status === EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_USRE_NOT_EXIST;
        }

        let _agencyUser = await Models.AgencyUser.findOne({where: {agencyId: agencyId, $or: [{email: params.email}, {mobile: params.mobile}]}});

        if (_agencyUser) {
            throw {code: -2, msg: '邮箱或手机号已经注册代理商'};
        }

        let agencyUser = await Models.AgencyUser.create(params);
        return new AgencyUser(agencyUser);
    }

    /**
     * @method updateAgencyUser
     *
     * 更新代理商用户
     * @param {Object} params
     * @param {string} params.id 需要修改的代理商用户id
     * @param {number} params.status 代理商用户状态
     * @param {string} params.name 代理商名称
     * @param {string} params.mobile 代理商用户手机号
     * @returns {Promise<AgencyUser>}
     */
    @clientExport
    @requirePermit("user.edit", 2)
    @requireParams(['id'], ['status', 'name', 'sex', 'mobile', 'avatar', 'roleId'])
    static async updateAgencyUser(params: {id: string, status?: number, name?: string, sex?: string, email?: string, mobile?: string, avatar?: string, roleId?: string}) {
        let {accountId} = Zone.current.get('session');
        let user = await Models.agency.findById({id: accountId, columns: ['agencyId']});
        let target = await Models.agency.findById({id: params.id, columns: ['agencyId', 'status']});

        if(target.status === EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        if(user.agencyId != target.agencyId){
            throw L.ERR.PERMISSION_DENY;
        }

        target.status = params.status;
        target.name = params.name;
        target.sex = params.sex;
        target.mobile = params.mobile;
        target.avatar = params.avatar;
        target.roleId = params.roleId;

        let result = await target.save();

        return new AgencyUser(target);
    }

    /**
     * @method deleteAgencyUser
     * 删除代理商
     * @param params
     * @returns {Promise<boolean>}
     */
    @clientExport
    @requirePermit("user.delete", 2)
    @requireParams(['id'])
    static async deleteAgencyUser(params: {id: string}): Promise<boolean> {
        let {accountId} = Zone.current.get('session');
        let id = params.id;
        let curUser = await Models.AgencyUser.findById(accountId, {attributes: ['agencyId']});
        let target = await Models.AgencyUser.findById(params.id);

        if(!target || target.status == EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_USRE_NOT_EXIST;
        }

        if(target.agencyId != curUser.agencyId) {
            throw L.ERR.PERMISSION_DENY;
        }

        await Models.AgencyUser.update({status: EAgencyStatus.DELETE, updatedAt: utils.now()}, {where: {id: id}, fields: ['status', 'updatedAt']})
        await Models.Accounts.destroy({where: {id: id}});

        return true;
    }

    /**
     * @method getAgencyUser
     * 获取代理商用户
     * @param params
     * @returns {Promise<AgencyUser>}
     */
    @clientExport
    @requirePermit('user.query', 2)
    @requireParams(['id'])
    static async getAgencyUser(params: {id: string}): Promise<AgencyUser> {
        let {accountId} = Zone.current.get('session');
        let curUser = await Models.AgencyUser.findById(accountId, {attributes: ['agencyId']});
        let agencyUser = await Models.AgencyUser.findById(params.id);

        if (!agencyUser || agencyUser.status === EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_USRE_NOT_EXIST;
        }

        if(agencyUser.agencyId != curUser.agencyId) {
            throw L.ERR.PERMISSION_DENY;
        }

        return new AgencyUser(agencyUser);
    }

    /**
     * @method agencyByEmail
     *
     * 通过邮箱获取代理商信息
     * @param params.email 邮箱
     */
    @requireParams(['email'])
    static async agencyByEmail(params: {email: string}): Promise<Agency> {
        let agency = await Models.Agency.findOne({where: params});
        return new Agency(agency)
    }

    /**
     * 分页查询代理商集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    static listAndPaginateAgencyUser(params) {
        let options:any = {};
        if (params.options) {
            options = params.options;
            delete params.options;
        }
        let page, perPage, limit, offset;
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
            options.order = [["created_at", "desc"]]
        }
        options.limit = limit;
        options.offset = offset;
        options.where = params;
        return Models.AgencyUser.findAndCountAll(options)
            .then(function (result) {
                let data = result.rows.map(function (user) {
                    return user.id;
                });
                return new Paginate(page, perPage, result.count, data);
            });
    }

    /**
     * @method getAgencyUsers
     * 得到代理商用户 用于获取查看票据的代理商用户id 不需要暴露给客户端
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    static async getAgencyUsers(params: {agencyId: string}): Promise<string[]> {
        params['status'] = {$ne: EAgencyStatus.DELETE};
        let users = await  Models.AgencyUser.findAll({where: params, attributes: ['id']});

        return users.map(function(user) {
            return user.id;
        })
    }

    /**
     * 测试用例使用删除代理商和用户的操作，不在client里调用
     * @param params
     */
    static async deleteAgencyByTest(params) {
        let email = params.email;
        let mobile = params.mobile;
        let name = params.name;

        await API.auth.remove({email: email, mobile: mobile, type: 2});
        await Models.Agency.destroy({where: {$or: [{email: email}, {mobile: mobile}, {name: name}]}});
        await Models.AgencyUser.destroy({where: {$or: [{email: email}, {mobile: mobile}, {name: name}]}});

        return true;
    }


    static async __initOnce() {
        logger.info("init default agency...");
        let default_agency = require('config/config').default_agency;
        let email = default_agency.email;
        let mobile = default_agency.mobile;
        let pwd = default_agency.pwd;
        let user_name = default_agency.user_name;

        try {
            let agency = await API.agency.agencyByEmail({email: email});

            if(!agency || agency.status == EAgencyStatus.DELETE) {
                let _agency = {name: default_agency.name, email: email, mobile: mobile, pwd: pwd || '123456', status: 1, userName: user_name, remark: '系统默认代理商'}
                agency = await API.agency.registerAgency(_agency)
            }

            let agencyId = agency.id;
            API.agency.__defaultAgencyId = agencyId;
            let companies = await API.company.listCompany({agencyId: null});

            if(!companies || companies.length <= 0) {
                return;
            }

            await Promise.all(companies.map(async function(c) {
                let myZome = Zone.current.fork({name: 'updateCompany', properties: {session: {accountId: agencyId}}});
                return myZome.run(API.company.updateCompany.bind(this, {id: c, agencyId: agencyId}));

            }));
        }catch(err) {
            logger.error("初始化系统默认代理商失败...");
            logger.error(err);
        }
    }
}

export = AgencyModule;