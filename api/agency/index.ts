/**
 * Created by yumiao on 15-12-9.
 */
"use strict";
import {DB} from '@jingli/database';
let API = require("@jingli/dnode-api");
import L from '@jingli/language';
import Logger from '@jingli/logger';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import {Agency, AgencyUser, EAgencyStatus, EAgencyUserRole, IAgency, IAgencyUser} from "_types/agency";
import {requirePermit, conditionDecorator, condition, modelNotNull} from "../_decorator";
import { Models, EGender, EAccountType } from '_types/index';
import {md5} from "common/utils";
import {FindResult} from "common/model/interface";
import {AgencyOperateLog} from "_types/agency/agency-operate-log";
import validator = require('validator');
let logger = new Logger("agency");

import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');

export class AgencyModule {
    /**
     * @method createAgency
     * 创建代理商
     * @param params
     * @returns {Promise<Agency>}
     */
    async createAgency(params:{name:string, email:string, pwd:string, id?:string, mobile?:string,description?:string,
        remark?:string, status?:number}):Promise<Agency> {
        let _agency = await Models.agency.find({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

        if (_agency && _agency.length > 0) {
            throw {code: -2, msg: '邮箱或手机号已经注册代理商'};
        }

        return Models.agency.create(params).save();
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
    async registerAgency(params: IAgency): Promise<Agency> {
        let email = params.email;
        let mobile = params.mobile;
        let password = params.pwd || "123456";
        let ACCOUNT_TYPE : number = 2; //账号类型，2为代理商账号

        let agency = Agency.create(params);
        let agencyUser = AgencyUser.create({name: params.userName, pwd: md5(password), status: EAgencyStatus.ACTIVE,
            roleId: EAgencyUserRole.OWNER, type: ACCOUNT_TYPE, email: email, mobile: mobile});

        agency.status = EAgencyStatus.ACTIVE;
        agency.createUser = agencyUser.id;
        agencyUser.agency = agency;
        agencyUser.isValidateEmail = true;

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
    @requireParams(['id'])
    @requirePermit('user.query', 2)
    @modelNotNull('agency')
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    getAgencyById(params: {id: string}): Promise<Agency>{
        return Models.agency.get(params.id);
    }

    /**
     * @method updateAgency
     *
     * 更新代理商信息
     * @param params
     * @returns {Promsie<Agency>}
     */
    @clientExport
    @requireParams(['id'], ['name', 'description', 'status', 'email', 'mobile', 'remark'])
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    @requirePermit('user.edit', 2)
    @modelNotNull('agency')
    async updateAgency(params: IAgency): Promise<Agency> {
        let agency = await Models.agency.get(params.id);

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
    @clientExport
    async listAgency(): Promise<FindResult>{
        let agencies = await Models.agency.find({});
        let ids =  agencies.map((agency) => agency.id);
        return {ids: ids, count: agencies['total']}
    }

    /**
     * @method deleteAgency
     * 删除代理商
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    @requirePermit('user.delete', 2)
    @conditionDecorator([{if: condition.isMyAgency('0.id')}])
    @modelNotNull('agency')
    async deleteAgency(params: {id: string}): Promise<boolean> {
        let agency = await Models.agency.get(params.id);
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
    @requireParams(['mobile', 'name'], ['email', 'sex', 'avatar', 'roleId', 'pwd'])
    async createAgencyUser(params: IAgencyUser): Promise<AgencyUser> {
        let curUser = await AgencyUser.getCurrent();

        if(!curUser) {
            throw L.ERR.AGENCY_USER_NOT_EXIST();
        }
        let mobile = params.mobile;
        if(!mobile || !validator.isMobilePhone(mobile, 'zh-CN')) {
            throw L.ERR.MOBILE_NOT_CORRECT();
        }
        if(params.email && !validator.isEmail(params.email)) {
            throw L.ERR.EMAIL_FORMAT_INVALID();
        }
        params.pwd = params.pwd || '123456';
        params.roleId = params.roleId || EAgencyUserRole.COMMON;

        let user = await Models.agencyUser.create({name: params.name, pwd: md5(params.pwd), status: EAgencyStatus.ACTIVE,
            roleId: params.roleId, type: EAccountType.AGENCY, email: params.email, mobile: params.mobile});
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
    @modelNotNull('agencyUser')
    @conditionDecorator([{if: condition.isSameAgency('0.id')}])
    getAgencyUser(params: {id: string}): Promise<AgencyUser> {
        return Models.agencyUser.get(params.id);
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
    @modelNotNull('agencyUser')
    async updateAgencyUser(params: {id: string, status?: number, name?: string, sex?: EGender, email?: string,
        mobile?: string, avatar?: string, roleId?: number}): Promise<AgencyUser> {
        let target = await Models.agencyUser.get(params.id);
        for(let key in params) {
            target[key] = params[key];
        }
        return await target.save();;
    }

    /**
     * @method deleteAgencyUser
     * 删除代理商
     * @param params
     * @returns {Promise<boolean>}
     */
    @clientExport
    @requireParams(['id'])
    @requirePermit("user.delete", 2)
    @conditionDecorator([{if: condition.isSameAgency('0.id')}])
    @modelNotNull('agencyUser')
    async deleteAgencyUser(params: {id: string}): Promise<boolean> {
        let target = await Models.agencyUser.get(params.id);
        await target.destroy();
        return true;
    }

    /**
     * @method agencyByEmail
     *
     * 通过邮箱获取代理商信息
     * @param params.email 邮箱
     */
    @requireParams(['email'])
    async agencyByEmail(params: {email: string}): Promise<Agency> {
        let agencies = await Models.agency.find({where: params});
        return agencies[0];
    }

    /**
     * 分页查询代理商集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    async listAgencyUser(options: {where: {[key: string]: any}, perPage?: number, page?: number}) :Promise<FindResult> {
        let curUser = await AgencyUser.getCurrent();
        if(!options.where) {
            options.where = {}
        }
        options.where.agencyId = curUser.agency.id;
        let agencyUsers = await Models.agencyUser.find(options);
        let ids =  agencyUsers.map((user) => user.id);
        return {ids: ids, count: agencyUsers['total']};
    }


    /**
     * 测试用例使用删除代理商和用户的操作，不在client里调用
     * @param params
     */
    async deleteAgencyByTest(params: IAgency) {
        let email = params.email;
        let mobile = params.mobile;
        let name = params.name;

        await API.auth.removeByTest({email: email, mobile: mobile, type: 2});
        await DB.models.Agency.destroy({where: {$or: [{email: email}, {mobile: mobile}, {name: name}]}});
        await DB.models.AgencyUser.destroy({where: {name: name}});

        return true;
    }


    async __initOnce() {
        logger.info("init default agency...");
        let default_agency = require('@jingli/config').default_agency;
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

            Agency.__defaultAgencyId = agencyId;
            
            let companies = await API.company.getCompanyNoAgency();

            if(!companies || companies.length <= 0) {
                return;
            }

            await CLSNS.runAndReturn(() => {
                CLSNS.set('accountId', agencyId);
                CLSNS.set('tokenId', 'tokenId');
                return Promise.all(companies.map(function(c: any) {
                    return API.company.updateCompany({id: c.id, agencyId: agencyId});
                }));
            })
        }catch(err) {
            logger.error("初始化系统默认代理商失败...");
            logger.error(err.stack);
        }
    }

    @clientExport
    async getAgencyOperateLogs(options: any) :Promise<FindResult> {
        options.where = options.where || {};
        options.order = options.order || [["created_at", "desc"]];
        let agencyUser = await AgencyUser.getCurrent();
        let agency = agencyUser.agency;
        options.where.agencyId = agency.id;
        let pager = await Models.agencyOperateLog.find(options);
        let ids = pager.map( (v) => {
            return v.id;
        });
        return {ids: ids, count:pager.total}
    }

    @clientExport
    async getAgencyOperateLog(params: {id: string}): Promise<AgencyOperateLog|null> {
        let agencyUser = await AgencyUser.getCurrent();
        let {id} = params;
        let log = await Models.agencyOperateLog.get(id);
        if (log.agencyId != agencyUser.agency.id) {
            return null;
        }
        return log;
    }
}

export default new AgencyModule();