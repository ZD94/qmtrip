import {Models} from "../_types/index";
/**
 * Created by yumiao on 15-12-9.
 */
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
let _ = require('lodash');
let utils = require("common/utils");
let C = require("config");
let API = require("common/api");
let Logger = require('common/logger');
let logger = new Logger('company');

import {requireParams, clientExport} from "common/api/helper";
import {ECompanyStatus, Company, MoneyChange} from 'api/_types/company';
import {EAgencyStatus, Agency, AgencyUser} from "../_types/agency";
import {requirePermit, conditionDecorator, condition, modelNotNull} from "../_decorator";
import {Staff, EStaffRole} from "../_types/staff";
import {Department} from "../_types/department";
import {md5} from "common/utils";

let AGENCY_ROLE = {OWNER: 0, COMMON: 1, ADMIN: 2};
let companyCols = Company['$fieldnames'];
// let fundsAccountCols = Object.keys(DBM.FundsAccounts.attributes);

class CompanyModule {
    /**
     * 域名是否已被占用
     *
     * @param {Object} params
     * @param {String} params.domain 域名
     * @return {Promise} true|false
     */
    static domainIsExist(params) {
        var domain = params.domain;
        if (!domain) {
            throw {code: -1, msg: "domain not exist!"};
        }

        if (C.is_allow_domain_repeat) {
            return new Promise(function(resolve) {
                resolve(false);
            })
        }

        return DBM.Company.findOne({where: {domainName: domain}})
            .then(function(company) {
                if (company) {
                    return true;
                } else {
                    return false;
                }
            })
    }


    /**
     * 是否在域名黑名单中
     *
     * @param {Object} params 参数
     * @param {String} params.domain 域名
     * @return {Promise}
     */
    static isBlackDomain(params) {
        var domain = params.domain;

        if (!domain) {
            throw {code: -1, msg: "域名不存在或不合法"};
        }
        domain = domain.toLowerCase();

        return DBM.BlackDomain.findOne({where: {domain: domain}})
            .then(function(result) {
                if (result) {
                    return true;
                }
                return false;
            })
    }


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
        let c = await Models.company.find({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

        if (c) {
            throw {code: -2, msg: '邮箱或手机号已注册企业'};
        }

        return Models.company.create(params).save();
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
     * @param params.pwd 登陆密码
     * @param params.remark 备注
     * @param params.description 企业描述
     * @returns {Promise<Company>}
     */
    @clientExport
    @requireParams(['mobile', 'name', 'email', 'userName'], ['pwd', 'remark', 'description'])
    static async registerCompany(params: {mobile: string, name: string, email: string, domain: string,
        userName: string, pwd?: string, remark?: string, description?: string}): Promise<Company>{
        let session = Zone.current.get('session');
        let pwd = params.pwd || '123456';
        let agencyId = Agency.__defaultAgencyId;
        let domain = params.email.match(/.*\@(.*)/)[1]; //企业域名

        if(domain && domain != "" && params.email.indexOf(domain) == -1){
            throw {code: -6, msg: "邮箱格式不符合要求"};
        }

        params['domainName'] = domain;

        if(session) {
            let agencyUser = await Models.agencyUser.get(session.accountId);

            if(!agencyUser) {
                throw L.ERR.AGENCY_NOT_EXIST();
            }

            agencyId = agencyUser.agency.id;
        }

        let staff = Staff.create({email: params.email, name: params.userName, mobile: params.mobile, roleId: EStaffRole.OWNER, pwd: md5(pwd)});
        let company = Company.create(params);
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
    static async updateCompany(params): Promise<Company>{
        let companyId = params.id;
        let company = await Models.company.get(companyId);

        if(!company){
            throw L.ERR.COMPANY_NOT_EXIST();
        }

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
    @requireParams([], ['status'])
    static async listCompany(params): Promise<string[]>{
        let agencyUser = await AgencyUser.getCurrent();
        var options : any = {where: {agencyId: agencyUser.agency.id}, order: [['created_at', 'desc']]};

        for(let key in params) {
            options.where[key] = params[key];
        }

        let companies = await Models.company.find(options);

        return companies.map((c) => c.id);
    }
    
    static async getCompanyNoAgency() {
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
    static async deleteCompany(params): Promise<boolean>{
        let companyId = params.id;
        let company = await Models.company.get(companyId);

        if(!company){
            throw L.ERR.COMPANY_NOT_EXIST();
        }

        let staffs = await Models.staff.find({where: {companyId: companyId}});

        await company.destroy();
        await Promise.all(staffs.map((staff) => staff.destroy()));

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
        var userId = params.userId;
        var companyId = params.companyId;
        var c = await DBM.Company.findById(companyId, {attributes: ['agencyId', 'status']});
        var agency = await API.agency.getAgencyUser({id: userId}, {attributes: ['agencyId', 'status', 'roleId']});

        if(!c || c.status == -2){
            throw L.ERR.COMPANY_NOT_EXIST();
        }

        if(c.agencyId != agency.agencyId || (agency.roleId != AGENCY_ROLE.OWNER && agency.roleId != AGENCY_ROLE.ADMIN)) {
            throw L.ERR.PERMISSION_DENY();
        }

        return true;
    }


    /**
     * 企业资金账户金额变动
     * @param params
     * @param params.type -2: 冻结账户资金 -1： 账户余额减少 1：账户余额增加 2：解除账户冻结金额
     * @returns {*}
     */
    @requireParams(['money', 'channel', 'userId', 'type', 'companyId', 'remark'])
    static changeMoney(params){
        var id = params.companyId;
        return DBM.FundsAccounts.findById(id)
            .then(function(funds){
                if(!funds || funds.status == -2){
                    throw {code: -2, msg: '企业资金账户不存在'};
                }

                var id = funds.id;
                var money : number = params.money;
                var userId = params.userId;
                var type = params.type;
                var fundsUpdates : any = {
                    updatedAt: utils.now()
                };

                var moneyChange = {
                    companyId: id,
                    status: type,
                    money: money,
                    channel: params.channel,
                    userId: userId,
                    remark: params.remark
                }

                var income = funds.income;
                var frozen = funds.frozen;

                if(type == 1){
                    if(money <= 0){
                        throw {code: -5, msg: '充值金额不正确'};
                    }
                    fundsUpdates.income = income + money;
                }else if(type == -1){
                    var consume = funds.consume;
                    var balance : number = funds.balance;
                    fundsUpdates.consume = parseFloat(consume) + money;
                    var balance : number = balance - money; //账户余额
                    if(balance < 0){
                        throw L.ERR.BALANCE_NOT_ENOUGH(); //账户余额不足
                    }
                }else if(type == 2){
                    if(parseFloat(frozen) < money){
                        throw {code: -4, msg: '账户冻结金额不能小于解除冻结的金额'};
                    }
                    fundsUpdates.frozen = parseFloat(frozen) - money;
                }else if(type == -2){
                    var balance : number = funds.balance;
                    fundsUpdates.frozen = parseFloat(frozen) + money;
                    balance = balance - money; //账户余额
                    if(balance < 0){
                        throw L.ERR.BALANCE_NOT_ENOUGH(); //账户余额不足
                    }
                }else{
                    throw L.ERR.MONEY_STATUS_ERROR();
                }

                return sequelize.transaction(function(t){
                    return Promise.all([
                        DBM.FundsAccounts.update(fundsUpdates, {returning: true, where: {id: id}, fields: Object.keys(fundsUpdates), transaction: t}),
                        DBM.MoneyChangeModel.create(moneyChange, {transaction: t})
                    ])
                        .spread(function(update, create){
                            return update;
                        })
                })
            })
            .spread(function(rownum, rows){
                if(rownum != 1){
                    throw {code: -3, msg: '充值失败'};
                }
                return rows[0];
            });
    }

    /**
     * 保存资金变动记录
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    static async saveMoneyChange(params: {companyId: string, money: number, channel: number, userId: string, remark: string}): Promise<MoneyChange> {
        return Models.moneyChange.create(params).save();
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
    static async listMoneyChange(params: any): Promise<string[]> {
        let staff = await Staff.getCurrent();
        params['companyId'] = staff.company.id;
        let changes = await Models.moneyChange.find({where: params});

        return changes.map((c) => c.id);
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