/**
 * Created by yumiao on 15-12-9.
 */
'use strict';
import L = require("common/language");
import Logger = require('common/logger');
import {validateApi} from "common/api/helper";
import {Company, ECompanyStatus} from "api/_types/company";

let API = require('common/api');
let uuid = require("node-uuid");
let logger = new Logger('client/company');

/**
 * @class company
 * 企业模块
 */

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
validateApi(createCompany, ['mobile', 'name', 'email', 'userName'], ['pwd', 'remark', 'description']);
export async function createCompany(params: {mobile: string, name: string, email: string, userName: string, pwd?: string,
    remark?: string, description?: string}){
    let self = this;
    let accountId = self.accountId;
    let mobile = params.mobile;
    let email = params.email;
    let userName = params.userName;
    let pwd = params.pwd || '123456';

    let agencyUser = await API.agency.getAgencyUser({id: accountId});
    let account = await API.auth.newAccount({mobile: mobile, email: email, pwd: pwd, type: 1});

    params['agencyId'] = agencyUser.agencyId;
    params['createUser'] = account.id;
    params['domainName'] = params.email.match(/.*\@(.*)/)[1]; //企业域名

    let company = await API.company.createCompany(params);
    console.info(new Company(company));

    if(company.domainName && company.domainName != "" && email.indexOf(company.domainName) == -1){
        throw {code: -6, msg: "邮箱格式不符合要求"};
    }

    await API.staff.create({id: account.id, companyId: company.id, email: email, mobile: mobile, name: userName, roleId: 0});
    await API.department.createDepartment({name: "我的企业", isDefault: true, companyId: company.id});

    return new Company(company);
}

/**
 * @method updateCompany
 * 更新企业信息(企业创建者)
 * @param params
 * @returns {Promise<Company>}
 */
export async function updateCompany(params){
    let self = this;
    let accountId = self.accountId;
    params.userId = accountId;
    await API.permit.checkPermission({accountId: accountId, permission: "company.edit"});    //检查权限
    let staff = await API.staff.getStaff({id: accountId, columns: ['companyId']});
    params.companyId = staff.companyId;
    return API.company.updateCompany(params);
}

/**
 * @method getCompanyById
 * 获取企业信息
 * @param params.companyId
 * @returns {Promise<Company>}
 */
validateApi(getCompanyById, ['companyId']);
export function getCompanyById(params: {companyId: string}){
    let self = this;
    params['userId'] = self.accountId;

    return API.company.getCompany(params);
}

/**
 * @method getCompanyListByAgency
 * 代理商获取企业列表
 * @param params
 * @param params.page 页数
 * @param params.perPage 每页记录数目
 * @returns {Promise<Paginate>}
 */
export async function getCompanyListByAgency(params){
    let self = this;
    let accountId = self.accountId;
    await API.permit.checkPermission({accountId: accountId, permission: "company.query", type: 2});    //检查权限
    let page = params.page;
    let perPage = params.perPage;
    typeof page == 'number' ? "" : page = 1;
    typeof perPage == 'number' ? "" : perPage = 10;
    let agencyUser = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
    return API.company.pageCompany({where: {agencyId: agencyUser.agencyId}, limit: perPage, offset: perPage * (page - 1)})
}

/**
 * @method deleteCompany
 * 删除企业信息
 * @param params.companyId 企业id
 * @returns {Promise<boolean>}
 */
validateApi(deleteCompany, ['companyId']);
export async function deleteCompany(params: {companyId: string}){
    let self = this;
    let accountId = self.accountId;
    await API.permit.checkPermission({accountId: accountId, permission: "company.delete", type: 2});    //检查权限
    params['userId'] = accountId;
    return API.company.deleteCompany(params);
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
validateApi(fundsCharge, ['channel', 'money', 'companyId'], ['remark']);
export function fundsCharge(params: {channel: string, money: number, companyId: string, remark?: string}){
    let self = this;
    params['userId'] = self.accountId;
    params['type'] = 1;
    params.remark = params.remark || '充值';

    return API.company.moneyChange(params);
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
validateApi(frozenMoney, ['money', 'companyId'], ['channel']);
export function frozenMoney(params : {channel?: string, money: number, companyId: string}){
    let self = this;
    params.channel = params.channel || '冻结';
    params['userId'] = self.accountId;
    params['type'] = -2;
    params['remark'] = '冻结账户资金';

    return API.company.moneyChange(params);
}

/**
 * @method consumeMoney
 * 消费企业账户余额
 * @param params
 * @returns {Promise}
 */
export function consumeMoney(params){
    let self = this;
    params.userId = self.accountId;
    params.type = -1;
    params.channel = params.channel || '消费';
    params.remark = params.remark || '账户余额消费';

    return API.company.moneyChange(params);
}

/**
 * @method getCompanyFundsAccount
 * 获取企业资金账户信息,企业和员工
 * @returns {Promise}
 */
export async function getCompanyFundsAccount(){
    let self = this;

    let staff = await API.staff.getStaff({id: self.accountId, columns: ['companyId']});
    return API.company.getCompanyFundsAccount({companyId: staff.companyId});
}


/**
 * @method getCompanyFundsAccountByAgency
 * 代理商获取企业资金账户信息
 * @param params.companyId 企业id
 * @returns {Promise}
 */
validateApi(getCompanyFundsAccountByAgency, ['companyId']);
export async function getCompanyFundsAccountByAgency(params: {companyId: string}){
    let self = this;
    let companyId = params.companyId;

    let agencyUser = await API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']});
    let company = await API.company.getCompany({companyId: companyId, columns: ['agencyId']});

    if(agencyUser.agencyId != company.agencyId) {
        throw L.ERR.PERMISSION_DENY;
    }

    return API.company.getCompanyFundsAccount({companyId: companyId});
}
