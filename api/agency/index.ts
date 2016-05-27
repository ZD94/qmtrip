///<reference path="../_decorator.ts"/>
/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
let sequelize = require("common/model").DB;
let DBM = sequelize.models;
let API = require("common/api");
let uuid = require("node-uuid");
import _ = require('lodash');
import L = require("common/language");
import Logger = require('common/logger');
import utils = require("common/utils");
import {requireParams, clientExport} from 'common/api/helper';
import {getSession} from 'common/model';
import {Agency, AgencyUser, EAgencyStatus, AgencyError, EAgencyUserRole} from "api/_types/agency";
import {requirePermit, conditionDecorator, condition} from "../_decorator";
import { Models, EGender } from '../_types/index';
import {md5} from "../../common/utils";
import {FindResult} from "../../common/model/interface";
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
        let _agency = await DBM.Agency.findOne({where: {email: params.email}});

        if (_agency) {
            throw {code: -2, msg: '该邮箱已经注册代理商'};
        }

        if (params.mobile) {
            let agency_mobile = await DBM.Agency.findOne({where: {mobile: params.mobile}});
            if (agency_mobile) {
                throw {code: -3, msg: '该手机号已经注册代理商'};
            }
        }

        let agency = await DBM.Agency.create(params);

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
    @requireParams(['name', 'email', 'mobile', 'userName'], ['description', 'remark', 'pwd', 'sex'])
    static async registerAgency(params): Promise<Agency> {
        let email = params.email;
        let mobile = params.mobile;
        let password = params.pwd || "123456";
        let ACCOUNT_TYPE : number = 2; //账号类型，2为代理商账号

        let agency = Agency.create(params);
        let agencyUser = AgencyUser.create({name: params.userName, pwd: md5(password), status: EAgencyStatus.ACTIVE, roleId: EAgencyUserRole.OWNER, type: ACCOUNT_TYPE, email: email, mobile: mobile});

        agency.status = EAgencyStatus.ACTIVE;
        agency.createUser = agencyUser.id;
        agencyUser.agency = agency;

        await Promise.all([agency.save(), agencyUser.save()]);

        return agency;
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
    @requirePermit('user.query', 2)
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    @requireParams(['id'])
    static async getAgencyById(params: {id: string}): Promise<Agency>{
        let agency = await Models.agency.get(params.id);

        if (!agency) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        return agency;
    }

    /**
     * @method updateAgency
     *
     * 更新代理商信息
     * @param params
     * @returns {Promsie<Agency>}
     */
    @clientExport
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    @requirePermit('user.edit', 2)
    @requireParams(['id'], ['name', 'description', 'status', 'email', 'mobile', 'remark'])
    static async updateAgency(params): Promise<Agency> {
        let agency = await Models.agency.get(params.id);

        if (!agency) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        for(let key in params) {
            agency[key] = params[key];
        }

        return agency.save();
    }

    /**
     * @method listAgency
     * 查询代理商列表
     * @param params
     * @returns {Promise<string[]>}
     */
    static async listAgency(params?: any): Promise<FindResult>{
        let agencies = await Models.agency.find({attributes: ['id']});

        let ids =  agencies.map(function(agency) {
            return agency.id;
        })
        return {ids: ids, count: agencies['total']}
    }

    /**
     * @method deleteAgency
     * 删除代理商
     * @param params
     * @returns {*}
     */
    @clientExport
    @requirePermit('user.delete', 2)
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    @requireParams(['id'])
    static async deleteAgency(params: {id: string}): Promise<boolean> {
        let agency = await Models.agency.get(params.id);

        if (!agency) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        console.info('agencyId==>', agency.id);
        let agencyUsers = await Models.agencyUser.find({agencyId: agency.id});

        await agencyUsers.map(async function (user) {
            await user.destroy();
        });

        await agency.destroy();

        return true;
    }


    /**
     * @method createAgencyUser
     * 创建代理商用户
     * @param params
     * @returns {Promise<AgencyUser>}
     */
    @clientExport
    @requirePermit('user.add', 2)
    @requireParams(['email', 'name'], ['mobile', 'sex', 'avatar', 'roleId'])
    static async createAgencyUser(params: {email: string, name: string, mobile?: string, sex?: number, avatar?: string, roleId?: number}): Promise<AgencyUser> {
        let curUser = await AgencyUser.getCurrent();

        if(!curUser) {
            throw L.ERR.AGENCY_USER_NOT_EXIST;
        }

        let user = await Models.agencyUser.create(params);
        user.agency = curUser.agency;
        return user.save();
    }

    /**
     * @method getAgencyUser
     * 获取代理商用户
     * @param params
     * @returns {Promise<AgencyUser>}
     */
    @clientExport
    @requireParams(['id'])
    @requirePermit('user.query', 2)
    @conditionDecorator([{if: condition.isSameAgency('0.id')}])
    static async getAgencyUser(params: {id: string}): Promise<AgencyUser> {
        let agencyUser = await Models.agencyUser.get(params.id);

        if (!agencyUser) {
            throw L.ERR.AGENCY_USER_NOT_EXIST();
        }

        return agencyUser;
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
    @requirePermit('user.edit', 2)
    @conditionDecorator([{if: condition.isSameAgency('0.id')}])
    @requireParams(['id'], ['status', 'name', 'sex', 'mobile', 'avatar', 'roleId'])
    static async updateAgencyUser(params: {id: string, status?: number, name?: string, sex?: EGender, email?: string,
        mobile?: string, avatar?: string, roleId?: number}): Promise<AgencyUser> {
        let target = await Models.agencyUser.get(params.id);

        if(!target) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        for(let key in params) {
            target[key] = params[key];
        }
        
        let result =  await target.save();

        return result;
    }

    /**
     * @method deleteAgencyUser
     * 删除代理商
     * @param params
     * @returns {Promise<boolean>}
     */
    @clientExport
    @requirePermit("user.delete", 2)
    @conditionDecorator([{if: condition.isSameAgency('0.id')}])
    @requireParams(['id'])
    static async deleteAgencyUser(params: {id: string}): Promise<boolean> {
        let target = await Models.agencyUser.get(params.id);

        if(!target) {
            throw L.ERR.AGENCY_USER_NOT_EXIST;
        }

        let result = await target.destroy();

        return true;
    }

    /**
     * @method agencyByEmail
     *
     * 通过邮箱获取代理商信息
     * @param params.email 邮箱
     */
    @requireParams(['email'])
    static async agencyByEmail(params: {email: string}): Promise<Agency> {
        let agency = await DBM.Agency.findOne({where: params});
        return new Agency(agency)
    }

    /**
     * 分页查询代理商集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    static async listAgencyUser(params) :Promise<FindResult> {
        let agencyUsers = await DBM.AgencyUser.findAll({where: params, attributes: ['id']});
        let ids =  agencyUsers.map(function(agency) {
            return agency.id;
        })
        return {ids: ids, count: agencyUsers['total']};
    }

    /**
     * @method getAgencyUsers
     * 得到代理商用户 用于获取查看票据的代理商用户id 不需要暴露给客户端
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    static async getAgencyUsers(params: {agencyId: string}): Promise<string[]> {
        let users = await  DBM.AgencyUser.findAll({where: params, attributes: ['id']});

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
        await DBM.Agency.destroy({where: {$or: [{email: email}, {mobile: mobile}, {name: name}]}});
        await DBM.AgencyUser.destroy({where: {$or: [{email: email}, {mobile: mobile}, {name: name}]}});

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

            if(!agency || !agency.target) {
                let _agency = {name: default_agency.name, email: email, mobile: mobile, pwd: pwd || '123456', status: 1, userName: user_name, remark: '系统默认代理商'}
                agency = await API.agency.registerAgency(_agency)
            }

            let agencyId = agency.id;
            let myZome = Zone.current.fork({name: 'updateCompany', properties: {session: {accountId: agencyId, tokenId: 'tokenId'}}});

            Agency.__defaultAgencyId = agencyId;
            
            let companies = await API.company.getCompanyNoAgency();

            if(!companies || companies.length <= 0) {
                return;
            }

            await Promise.all(companies.map(async function(c) {
                return myZome.run(API.company.updateCompany.bind(this, {id: c.id, agencyId: agencyId}));
            }));

        }catch(err) {
            logger.error("初始化系统默认代理商失败...");
            logger.error(err.stack);
        }
    }
}

export = AgencyModule;