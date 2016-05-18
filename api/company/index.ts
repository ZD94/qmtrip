import {requirePermit} from "../_decorator";
/**
 * Created by yumiao on 15-12-9.
 */
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
let _ = require('lodash');
let utils = require("common/utils");
let Paginate = require("common/paginate").Paginate;
let C = require("config");
let API = require("common/api");
let Logger = require('common/logger');
let logger = new Logger('company');

import {requireParams, clientExport} from "common/api/helper";
import {ECompanyStatus, Company, MoneyChange} from 'api/_types/company';
import { ServiceInterface } from 'common/model';
import {EAgencyStatus} from "../_types/agency";

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
        let c = await DBM.Company.findOne({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

        if (c) {
            throw {code: -2, msg: '邮箱或手机号已注册企业'};
        }

        let _company = params;
        _company.id = _company.id || uuid.v1();
        let comp = await DBM.Company.create(_company);
        return new Company(comp);
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
    @requirePermit('company.add', 2)
    @requireParams(['mobile', 'name', 'email', 'userName'], ['pwd', 'remark', 'description'])
    static async registerCompany(params: {mobile: string, name: string, email: string, domain: string,
        userName: string, pwd?: string, remark?: string, description?: string}): Promise<Company>{
        let {accountId} = Zone.current.get('session');
        let mobile = params.mobile;
        let email = params.email;
        let userName = params.userName;
        let pwd = params.pwd || '123456';
        let agencyUser = await DBM.agency.findById(accountId);

        if(!agencyUser || agencyUser.status == EAgencyStatus.DELETE) {
            throw L.ERR.AGENCY_NOT_EXIST;
        }

        let account = await API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, type: 1});

        params['agencyId'] = agencyUser.agencyId;
        params['createUser'] = account.id;
        params['domainName'] = params.email.match(/.*\@(.*)/)[1]; //企业域名
        delete params.userName;

        let company = await API.company.createCompany(params);

        if(company.domainName && company.domainName != "" && email.indexOf(company.domainName) == -1){
            throw {code: -6, msg: "邮箱格式不符合要求"};
        }

        await DBM.staff.create({id: account.id, companyId: company.id, email: email, mobile: mobile, name: userName, roleId: 0});
        await DBM.department.create({name: "我的企业", isDefault: true, companyId: company.id});

        return new Company(company);
    }


    /**
     * 更新企业信息
     * @param params
     * @returns {Promise<Company>}
     */
    @clientExport
    // @requirePermit('company.edit', 2)
    @requireParams(['id'], ['agencyId', 'name', 'description', 'mobile', 'remark', 'status'])
    static async updateCompany(params): Promise<Company>{
        let {accountId} = Zone.current.get('session');
        let companyId = params.id;
        let company = await DBM.Company.findById(companyId, {attributes: ['createUser', 'status']});

        if(!company || company.status == -2){
            throw L.ERR.COMPANY_NOT_EXIST;
        }

        params['updatedAt'] = utils.now();

        let [rownum, rows] = await DBM.Company.update(params, {returning: true, where: {id: companyId}, fields: Object.keys(params)});

        if(!rownum || rownum == "NaN"){
            throw {code: -2, msg: '更新企业信息失败'};
        }

        return new Company(rows[0]);
    }

    /**
     * 获取企业信息
     * @param companyId
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    static async getCompany(params: {id: string}): Promise<Company>{
        let company = await DBM.Company.findById(params.id);

        if(!company || company.status == -2){
            throw L.ERR.COMPANY_NOT_EXIST;
        }

        return new Company(company);
    }

    /**
     * 获取企业列表
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['agencyId'], ['status'])
    static async listCompany(params): Promise<string[]>{
        var query = params;
        var agencyId = query.agencyId;
        var options : any = {
            where: {agencyId: agencyId, status: {$ne: -2}},
            order: [['created_at', 'desc']]
        };

        let companies = await DBM.Company.findAll(options);

        return companies.map(function(c) {
            return c.id;
        })
    }

    /**
     * 获取企业列表
     * @param options
     * @returns {*}
     */
    @clientExport
    static async pageCompany(options){
        options.where.status = {$ne: -2};
        options.order = [['created_at', 'desc']];
        let ret = await DBM.Company.findAndCount(options);
        var items = ret.rows.map(function(c) {
            return c.id;
        });
        return new Paginate(options.offset/options.limit + 1, options.limit, ret.count, items);
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
            throw L.ERR.COMPANY_NOT_EXIST;
        }

        if(c.agencyId != agency.agencyId || agency.roleId != AGENCY_ROLE.OWNER && agency.roleId != AGENCY_ROLE.ADMIN) {
            throw L.ERR.PERMISSION_DENY;
        }

        return true;
    }


    /**
     * 删除企业
     * @param params
     * @returns {*}
     */
    @clientExport
    @requirePermit('company.delete', 2)
    @requireParams(['id'])
    static async deleteCompany(params){
        var companyId = params.id;
        let company = await DBM.Company.findById(companyId);

        if(!company || company.status == ECompanyStatus.DELETE){
            throw L.ERR.COMPANY_NOT_EXIST;
        }

        let staffs = await DBM.Staff.findAll({where: {companyId: companyId}});

        await DBM.Company.update({status: ECompanyStatus.DELETE, updatedAt: utils.now()}, {where: {id: companyId}});
        await DBM.Staff.destroy({where: {companyId: companyId}});
        await staffs.map(async function(staff) {
            return await DBM.Account.destroy({where: {id: staff.id}});
        });

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
                    fundsAccountId: id,
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
                        throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
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
                        throw L.ERR.BALANCE_NOT_ENOUGH; //账户余额不足
                    }
                }else{
                    throw L.ERR.MONEY_STATUS_ERROR;
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
    static async saveMoneyChange(params: {fundsAccountId: string, money: number, channel: number, userId: string, remark: string}): Promise<MoneyChange> {
        let moneyChange = await DBM.MoneyChangeModel.create(params);
        return new MoneyChange(moneyChange);
    }

    /**
     *
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    @clientExport
    static async getMoneyChange(params: {id: string}): Promise<MoneyChange> {
        let moneyChange = await DBM.MoneyChangeModel.findById(params.id);
        return new MoneyChange(moneyChange);
    }


    /**
     *
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    static async listMoneyChange(params: {companyId: string}): Promise<string[]> {
        let {accountId} = Zone.current.get('session');
        let staff = await DBM.Staff.findById(accountId);
        params.companyId = staff.companyId;
        let moneyChange = await DBM.MoneyChangeModel.findAll({where: params});
        return moneyChange.map(function(mc) {
            return mc.id;
        })
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

                    return DBM.FundsAccounts.destroy({where: {id: id}});
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