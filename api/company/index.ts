/**
 * Created by yumiao on 15-12-9.
 */
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
let L = require("common/language");
let _ = require('lodash');
let utils = require("common/utils");
let C = require("config");
let API = require("common/api");
let Logger = require('common/logger');
let logger = new Logger('company');

import {requireParams, clientExport} from "common/api/helper";
import {Models} from "api/_types/index";
import {Company, MoneyChange} from 'api/_types/company';
import {Staff, EStaffRole} from "api/_types/staff";
import {Agency, AgencyUser, EAgencyUserRole} from "api/_types/agency";
import {Department} from "api/_types/department";
import {requirePermit, conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {md5} from "common/utils";
import { FindResult, PaginateInterface } from "common/model/interface";

class CompanyModule {
    /**
     * 创建企业
     * @param {Object} params
     * @param {UUID} params.createUser 创建人
     * @param {String} params.name 企业名称
     * @param {String} params.domainName 域名,邮箱后缀
     * @returns {Promise<Company>}
     */
    @requireParams(['createUser', 'name', 'domainName', 'mobile', 'email', 'agencyId'], ['id', 'description', 'telephone', 'remark'])
    static async createCompany(params): Promise<Company>{
        let results = await Models.company.find({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

        if (results && results.length > 0) {
            throw {code: -2, msg: '邮箱或手机号已注册企业'};
        }

        return Company.create(params).save();
    }

    /**
     * @method createCompany
     *
     * 代理商创建企业
     *
     * @param params
     * @param params.mobile 手机号
     * @param params.name 企业名字
     * @param params.email 企业邮箱
     * @param params.userName 企业创建人姓名
     * @param params.pwd 登录密码
     * @param params.remark 备注
     * @param params.description 企业描述
     * @returns {Promise<Company>}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'pwd', 'userName'], ['email', 'status', 'remark', 'description', 'isValidateMobile'])
    static async registerCompany(params: {mobile: string, name: string, email?: string,
        userName: string, pwd?: string, status?: number, remark?: string, description?: string, isValidateMobile?: boolean}): Promise<Company>{
        let session = Zone.current.get('session');
        let pwd = params.pwd;
        let agencyId = Agency.__defaultAgencyId;
        let domain = ""; //企业域名

        if(params.email){
            domain = params.email.match(/.*\@(.*)/)[1];
        }

        if(domain && domain != "" && params.email.indexOf(domain) == -1){
            throw {code: -6, msg: "邮箱格式不符合要求"};
        }

        /*let companies = await Models.company.find({where: {$or: [{email: params.email}, {mobile: params.mobile}/!*, {domain_name: domain}*!/]}});

        if(companies && companies.length > 0) {
            throw {code: -7, msg: '邮箱或手机号已经注册'};
        }*/

        if(session && session.accountId) {
            let agencyUser = await Models.agencyUser.get(session.accountId);
            if(agencyUser) {
                agencyId = agencyUser.agency.id;
            }
        }

        let staff = Staff.create({email: params.email, name: params.userName, mobile: params.mobile, roleId: EStaffRole.OWNER, pwd: md5(pwd), status: params.status, isValidateMobile: params.isValidateMobile});
        let company = Company.create(params);
        company.domainName = domain;
        company.isApproveOpen = true;
        let department = Department.create({name: "我的企业", isDefault: true});

        department.company = company;
        staff.company = company;
        staff.department = department;
        company.createUser = staff.id;
        company['agencyId'] = agencyId;

        await Promise.all([staff.save(), company.save(), department.save()]);

        return company;
    }


    /**
     * 更新企业信息
     * @param params
     * @returns {Promise<Company>}
     */
    @clientExport
    @requirePermit('company.edit', 2)
    @requireParams(['id'], ['agencyId', 'name', 'description', 'mobile', 'remark', 'status'])
    @modelNotNull('company')
    static async updateCompany(params): Promise<Company>{
        let companyId = params.id;
        let company = await Models.company.get(companyId);

        for(let key in params) {
            company[key] = params[key];
        }

        return company.save();
    }

    /**
     * 获取企业信息
     * @param {Object} params
     * @param {String} params.id 企业ID
     * @returns {Promise<Company>}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('company')
    @conditionDecorator([
        {if: condition.isMyCompany("0.id")},
        {if: condition.isCompanyAgency("0.id")}
    ])
    static getCompany(params: {id: string}): Promise<Company>{
        return Models.company.get(params.id);
    }

    /**
     * 获取企业列表
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    @requireParams([], ['where.status'])
    static async listCompany(options): Promise<FindResult>{
        let agencyUser = await AgencyUser.getCurrent();
        options.order = options.order || [['created_at', 'desc']];
        if(!options.where) {
            options.where = {};
        }
        options.where.agencyId = agencyUser.agency.id;
        let companies = await Models.company.find(options);
        let ids = companies.map((c) => c.id);
        return {ids: ids, count: companies['total']};
    }
    
    static async getCompanyNoAgency(): Promise<PaginateInterface<Company> > {
        let agencies = await Models.company.find({where: {agencyId: null}});
        return agencies;
    }

    /**
     * 删除企业
     * @param params
     * @returns {*}
     */
    @clientExport
    @requirePermit('company.delete', 2)
    @requireParams(['id'])
    @modelNotNull('company')
    static async deleteCompany(params: {id: string}): Promise<boolean>{
        let companyId = params.id;
        let company = await Models.company.get(companyId);
        await company.destroy();
        return true;
    }


    /**
     * 判断某代理商是否有权限访问某企业
     * @param params
     * @param params.userId 代理商id
     * @param params.companyId 企业id
     */
    @requireParams(['companyId','userId'])
    static async checkAgencyCompany(params){
        var c = await Models.company.get(params.companyId);
        var user = await Models.agencyUser.get(params.userId);

        if(!c || c.status == -2){
            throw L.ERR.COMPANY_NOT_EXIST();
        }

        if(c['agencyId'] != user.agency.id || (user.roleId != EAgencyUserRole.OWNER && user.roleId != EAgencyUserRole.ADMIN)) {
            throw L.ERR.PERMISSION_DENY();
        }

        return true;
    }


    /**
     * 保存资金变动记录
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    static async saveMoneyChange(params: {companyId: string, money: number, channel: number, userId: string, remark: string}): Promise<MoneyChange> {
        return MoneyChange.create(params).save();
    }

    /**
     *
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    @clientExport
    @requireParams(['id'])
    @modelNotNull('moneyChange')
    static getMoneyChange(params: {id: string}): Promise<MoneyChange> {
        return Models.moneyChange.get(params.id);
    }


    /**
     *
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    static async listMoneyChange(options): Promise<FindResult> {
        let staff = await Staff.getCurrent();
        if(!options.where) {
            options.where = {}
        }
        options.where.companyId = staff.company.id;
        let changes = await Models.moneyChange.find(options);
        let ids =  changes.map((c) => c.id);
        return {ids: ids, count: changes['total']};
    }


    /**
     * @method fundsCharge
     * 企业资金账户充值
     * @param params
     * @param params.channel 充值渠道
     * @param params.money 充值金额
     * @param params.companyId 充值企业id
     * @param params.remark 备注 可选
     * @returns {Promise}
     */
    @requireParams(['channel', 'money', 'companyId'], ['remark'])
    static fundsCharge(params: {channel: string, money: number, companyId: string, remark?: string}){
        let self: any = this;
        params['userId'] = self.accountId;
        params['type'] = 1;
        params.remark = params.remark || '充值';
        return API.company.changeMoney(params);
    }

    /**
     * @method frozenMoney
     * 冻结账户资金
     * @param params
     * @param params.channel 充值渠道
     * @param params.money 充值金额
     * @param params.companyId 充值企业id
     * @returns {Promise}
     */
    @requireParams(['money', 'companyId'], ['channel'])
    static frozenMoney(params : {channel?: string, money: number, companyId: string}){
        let self: any = this;
        params.channel = params.channel || '冻结';
        params['userId'] = self.accountId;
        params['type'] = -2;
        params['remark'] = '冻结账户资金';

        return API.company.changeMoney(params);
    }

    /**
     * @method consumeMoney
     * 消费企业账户余额
     * @param params
     * @returns {Promise}
     */
    static consumeMoney(params){
        let self: any = this;
        params.userId = self.accountId;
        params.type = -1;
        params.channel = params.channel || '消费';
        params.remark = params.remark || '账户余额消费';

        return API.company.changeMoney(params);
    }


    /**
     * 域名是否已被占用
     *
     * @param {Object} params
     * @param {String} params.domain 域名
     * @return {Promise} true|false
     */
    @requireParams(['domain'])
    static async domainIsExist(params) {
        if (C.is_allow_domain_repeat) {
            return false;
        }

        let domain = params.domain;
        let company = await Models.company.find({where: {domainName: domain}});
        return company && company.length > 0;
    }


    /**
     * 是否在域名黑名单中
     *
     * @param {Object} params 参数
     * @param {String} params.domain 域名
     * @return {Promise}
     */
    @requireParams(['domain'])
    static async isBlackDomain(params: {domain: string}) {
        var domain = params.domain.toLowerCase();
        // let black = await DBM.BlackDomain.findAll({where: params});
        // if(black && black.length > 0) {
        //     return true;
        // }
        return false;
    }

    /**
     * 测试用例删除企业，不在client调用
     * @param params
     * @returns {*}
     */
    static deleteCompanyByTest(params){
        var mobile = params.mobile;
        var email = params.email;
        return DBM.Company.findAll({where: {$or: [{mobile: mobile}, {email: email}]}})
            .then(function(companys){
                return companys.map(function(c){
                    var id = c.id;

                    return true;
                })
            })
            .then(function(){
                return DBM.Company.destroy({where: {$or: [{mobile: mobile}, {email: email}]}});
            })
            .then(function(){
                return true;
            })
    }
}

export = CompanyModule;