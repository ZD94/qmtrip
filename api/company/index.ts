/**
 * Created by yumiao on 15-12-9.
 */
let sequelize = require("common/model").importModel("./models");
let Models = sequelize.models;
let uuid = require("node-uuid");
let L = require("common/language");
let _ = require('lodash');
let utils = require("common/utils");
let Paginate = require("common/paginate").Paginate;
let C = require("config");
let API = require("common/api");

import {requireParams} from "common/api/helper";
import {ECompanyStatus, Company, MoneyChange} from 'api/_types/company';
import { ServiceInterface } from 'common/model';

let AGENCY_ROLE = {OWNER: 0, COMMON: 1, ADMIN: 2};
let companyCols = Object.keys(Models.Company.attributes);
let fundsAccountCols = Object.keys(Models.FundsAccounts.attributes);


class CompanyService implements ServiceInterface<Company>{
    async create(obj: Object): Promise<Company>{
        return API.company.createCompany(obj);
    }
    async get(id: string): Promise<Company>{
        return API.company.getCompany(id);
    }
    async find(where: any): Promise<Company[]>{
        return API.company.listCompany(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields['companyId'] = id;
        return API.company.updateCompany(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.company.deleteCompany({companyId: id});
    }
}

class MoneyChangeService implements ServiceInterface<MoneyChange>{
    async create(obj: Object): Promise<MoneyChange>{
        return API.company.saveMoneyChange(obj);
    }
    async get(id: string): Promise<MoneyChange>{
        return API.company.getMoneyChange(id);
    }
    async find(where: any): Promise<MoneyChange[]>{
        return API.company.findMoneyChange(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        throw {code: -2, msg: '不能更新记录'};
    }
    async destroy(id: string): Promise<any> {
        throw {code: -2, msg: '不能删除记录'};
    }
}


class CompanyModule {
    static CompanyService = CompanyService;
    static MoneyChangeService = MoneyChangeService;

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

        return Models.Company.findOne({where: {domainName: domain}})
            .then(function(company) {
                if (company) {
                    return true;
                } else {
                    return false;
                }
            })
    }


    /**
     * 创建企业
     * @param {Object} params
     * @param {UUID} params.createUser 创建人
     * @param {String} params.name 企业名称
     * @param {String} params.domainName 域名,邮箱后缀
     * @returns {Promise}
     */
    @requireParams(['createUser', 'name', 'domainName', 'mobile', 'email', 'agencyId'], ['id', 'description', 'telephone', 'remark'])
    static createCompany(params){
        let _company = params;
        _company.id = _company.id || uuid.v1();
        let funds = { id: _company.id, createdAt: utils.now()};

        return sequelize.transaction(function(t){
            return Promise.all([
                Models.Company.create(_company, {transaction: t}),
                Models.FundsAccounts.create(funds, {transaction: t})
            ])
        })
            .spread(function(c, f){
                return new Company(c);
                //c = c.toJSON();
                //return _.assign(c, {balance: f.balance, staffReward: f.staffReward});
            });
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

        return Models.BlackDomain.findOne({where: {domain: domain}})
            .then(function(result) {
                if (result) {
                    return true;
                }
                return false;
            })
    }

    /**
     * 更新企业信息
     * @param params
     * @returns {*}
     */
    static async updateCompany(params){
        let companyId = params.companyId;
        let company = await Models.Company.findById(companyId, {attributes: ['createUser', 'status']});

        if(!company || company.status == -2){
            throw L.ERR.COMPANY_NOT_EXIST;
        }

        delete params.companyId;
        params['updatedAt'] = utils.now();

        let [rownum, rows] = await Models.Company.update(params, {returning: true, where: {id: companyId}, fields: Object.keys(params)});
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
    @requireParams(['companyId'])
    static async getCompany(params){
        let companyId = params.companyId;
        let company = await Models.Company.findById(companyId);

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
    @requireParams(['agencyId'], ['columns'])
    static listCompany(params){
        var query = params;
        var agencyId = query.agencyId;
        var options : any = {
            where: {agencyId: agencyId, status: {$ne: -2}},
            order: [['created_at', 'desc']]
        };

        if(query.columns){
            options.attributes =  query.columns;
            delete query.columns;
        }

        return Models.Company.findAll(options);
    }

    /**
     * 获取企业列表
     * @param options
     * @returns {*}
     */
    static async pageCompany(options){
        options.where.status = {$ne: -2};
        options.order = [['created_at', 'desc']];
        let ret = await Models.Company.findAndCount(options);
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
        var c = await Models.Company.findById(companyId, {attributes: ['agencyId', 'status']});
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
    @requireParams(['companyId'], ['userId'])
    static deleteCompany(params){
        var companyId = params.companyId;

        return Models.Company.findById(companyId, {attributes: ['createUser']})
            .then(function(company){
                if(!company || company.status == -2){
                    throw L.ERR.COMPANY_NOT_EXIST;
                }

                // if(company.createUser != userId){
                //     throw L.ERR.PERMISSION_DENY;
                // }
            })
            .then(function(){
                return sequelize.transaction(function(t){
                    return Promise.all([
                        Models.Company.update({status: -2, updatedAt: utils.now()}, {where: {id: companyId}, fields: ['status', 'updatedAt'], transaction: t}),
                        Models.FundsAccounts.update({status: -2, updatedAt: utils.now()}, {where: {id: companyId}, fields: ['status', 'updatedAt'], transaction: t})
                    ])
                })
            })
            .then(function(){
                return true;
            });
    }

    /**
     * 获取企业资金账户信息
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'])
    static getCompanyFundsAccount(params){
        var companyId = params.companyId;

        return Models.FundsAccounts.findById(companyId, {
            attributes: ['id', 'balance', 'income', 'consume', 'frozen', 'isSetPwd','staffReward', 'status', 'createdAt', 'updatedAt']
        })
            .then(function(funds){
                if(!funds || funds.status == -2){
                    throw {code: -4, msg: '企业资金账户不存在'};
                }

                return funds.toJSON();
            });
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
        return Models.FundsAccounts.findById(id)
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
                        Models.FundsAccounts.update(fundsUpdates, {returning: true, where: {id: id}, fields: Object.keys(fundsUpdates), transaction: t}),
                        Models.MoneyChangeModel.create(moneyChange, {transaction: t})
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
        let moneyChange = await Models.MoneyChangeModel.create(params);
        return new MoneyChange(moneyChange);
    }

    /**
     *
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    static async getMoneyChange(params: {id: string}): Promise<MoneyChange> {
        let moneyChange = await Models.MoneyChangeModel.findById(params.id);
        return new MoneyChange(moneyChange);
    }


    /**
     *
     * @param params
     * @returns {Promise<string[]>}
     */
    static async listMoneyChange(params: {fundsAccountId: string}): Promise<string[]> {
        let moneyChange = await Models.MoneyChangeModel.findAll({where: params});
        return moneyChange.map(function(mc) {
            return mc.id;
        })
    }

    /**
     * 测试用例删除企业，不在client调用
     * @param params
     * @returns {*}
     */
    static deleteCompanyByTest(params){
        var mobile = params.mobile;
        var email = params.email;
        return Models.Company.findAll({where: {$or: [{mobile: mobile}, {email: email}]}})
            .then(function(companys){
                return companys.map(function(c){
                    var id = c.id;

                    return Models.FundsAccounts.destroy({where: {id: id}});
                })
            })
            .then(function(){
                return Models.Company.destroy({where: {$or: [{mobile: mobile}, {email: email}]}});
            })
            .then(function(){
                return true;
            })
    }
}

export = CompanyModule;