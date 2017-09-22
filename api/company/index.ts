/**
 * Created by yumiao on 15-12-9.
 */
import {DB} from '@jingli/database';
import L from '@jingli/language';
let C = require("@jingli/config");
let API = require("@jingli/dnode-api");
import Logger from '@jingli/logger';
let logger = new Logger('company');
let moment = require('moment');
let promoCodeType = require('libs/promoCodeType');
let scheduler = require('common/scheduler');
let schedule = require("node-schedule");
let _ = require("lodash");
let Config = require('@jingli/config');
import {requireParams, clientExport} from "@jingli/dnode-api/dist/src/helper";
import {Models} from "_types";
import {Company, MoneyChange, Supplier, TripPlanNumChange, ECompanyType, NUM_CHANGE_TYPE, InvoiceTitle, CompanyProperty, CPropertyType} from '_types/company';
import {Staff, EStaffRole} from "_types/staff";
import {PromoCode} from "_types/promoCode";
import {Agency, AgencyUser, EAgencyUserRole} from "_types/agency";
import {Department, StaffDepartment} from "_types/department";
import {requirePermit, conditionDecorator, condition, modelNotNull} from "api/_decorator";
import {md5} from "common/utils";
import { FindResult, PaginateInterface } from "common/model/interface";
import {CoinAccount} from "_types/coin";
// import {RestfulAPIUtil} from "../restfulAPIUtil"
var RestfulAPIUtil = require('../restfulAPIUtil');

const supplierCols = Supplier['$fieldnames'];
const companyCols = Staff['$getAllFieldNames']();

const DEFAULT_EXPIRE_MONTH = 1;
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
    @requireParams(['mobile', 'name', 'pwd', 'userName'],
        ['email', 'status', 'isValidateMobile', 'promoCode', 'referrerMobile', 'ldapUrl', 'ldapBaseDn'])
    static async registerCompany(params: {mobile: string, name: string, email?: string, userName: string,
                                         pwd?: string, status?: number, isValidateMobile?: boolean, promoCode?: string,
                                         referrerMobile?: string, ldapUrl?: string, ldapBaseDn?: string, ldapStaffRootDn?: string,
                                         ldapDepartmentRootDn?: string, ldapAdminPassword?: string, ldapAdminDn?: string}): Promise<any>{
        let session = Zone.current.get('session');
        let pwd = params.pwd;
        let defaultAgency = await Models.agency.find({where:{email:C.default_agency.email}});//Agency.__defaultAgencyId;
        let agencyId:any;
        if(defaultAgency && defaultAgency.length==1){
            agencyId=defaultAgency[0].id;
        }
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
        company.expiryDate = moment().add(DEFAULT_EXPIRE_MONTH, 'months').toDate();
        company.isApproveOpen = true;
        company.points2coinRate = 50;
        let department = Department.create({name: company.name, isDefault: true});
        let staffDepartment = StaffDepartment.create({staffId: staff.id, departmentId: department.id});

        department.company = company;
        staff.company = company;
        company.createUser = staff.id;
        company['agencyId'] = agencyId;
        //新注册企业默认套餐行程数为60
        company.tripPlanNumLimit = 60;

        if(params.referrerMobile){
            let ac = await Models.account.find({where: {mobile: params.referrerMobile}});
            if(ac && ac.length > 0){
                company.setReferrer(ac[0]);
            }
        }
        if(params.ldapUrl){
            let jsonValue = {ldapUrl: params.ldapUrl, ldapBaseDn: params.ldapBaseDn,
                ldapStaffRootDn: params.ldapStaffRootDn, ldapDepartmentRootDn: params.ldapDepartmentRootDn,
                ldapAdminPassword: params.ldapAdminPassword, ldapAdminDn: params.ldapAdminDn };
            let companyProperty = CompanyProperty.create({companyId: company.id, type: CPropertyType.LDAP, value: JSON.stringify(jsonValue)});
            await companyProperty.save();
        }

        await Promise.all([staff.save(), company.save(), department.save(), staffDepartment.save()]);
        let promoCode: PromoCode;
        if(params.promoCode){
            promoCode = await company.doPromoCode({code: params.promoCode});
        }

        //为企业设置资金账户
        let ca = CoinAccount.create();
        await ca.save();
        company.coinAccount = ca;
        company = await company.save();

        //为创建人设置资金账户
        let ca_staff = CoinAccount.create();
        await ca_staff.save();
        let account = await Models.account.get(staff.accountId);
        account.coinAccount = ca_staff;
        await account.save();

        //默认开启所有公有预订服务商
        await company.setDefaultSupplier();

        //jlbudget create company record.


        //jlbudget create account record.

        return {company: company, description: promoCode ? promoCode.description : ""};
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
    static async checkAgencyCompany(params) :Promise<boolean> {
        var c = await Models.company.get(params.companyId);
        var user = await Models.agencyUser.get(params.userId);

        if(!c || c.status == -2){
            return false;
        }

        if(c['agencyId'] != user.agency.id || (user.roleId != EAgencyUserRole.OWNER && user.roleId != EAgencyUserRole.ADMIN)) {
            return false;
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
        //var domain = params.domain.toLowerCase();
        // let black = await DB.models.BlackDomain.findAll({where: params});
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
    static async deleteCompanyByTest(params){
        var mobile = params.mobile;
        var email = params.email;
        await DB.models.Company.destroy({where: {$or: [{mobile: mobile}, {email: email}]}});
        return true;
    }

    /*************************************供应商begin***************************************/
    /**
     * 创建供应商
     * @param data
     * @returns {*}
     */
    // @clientExport
    // @requireParams(["name", "companyId"], supplierCols)
    // @conditionDecorator([
    //     {if: condition.isCompanyAdminOrOwner("0.companyId")}
    // ])
    // static async createSupplier (params) : Promise<Supplier>{
    //     var supplier = Supplier.create(params);
    //     return supplier.save();
    // }

    @clientExport
    // @requireParams(['name', 'companyId'])
    static async createSupplier (params): Promise<Supplier> {
        let resCreate = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'POST'
            }
        });
        return resCreate.data;
    }


    /**
     * 删除供应商
     * @param params
     * @returns {*}
     */
    // @clientExport
    // @requireParams(["id"])
    // @conditionDecorator([
    //     {if: condition.isSupplierAdminOrOwner("0.id")}
    // ])
    // static async deleteSupplier(params) : Promise<any>{
    //     var id = params.id;
    //     var st_delete = await Models.supplier.get(id);
    //
    //     await st_delete.destroy();
    //     return true;
    // }

    @clientExport
    // @requireParams(['id'])
    static async deleteSupplier(params): Promise<any> {
        let resDelete = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'DELETE'
            }
        });
        return resDelete.data;
    }


    /**
     * 更新供应商
     * @param id
     * @param data
     * @returns {*}
     */
    // @clientExport
    // @requireParams(["id"], supplierCols)
    // @conditionDecorator([
    //     {if: condition.isSupplierAdminOrOwner("0.id")}
    // ])
    // static async updateSupplier(params) : Promise<Supplier>{
    //     var id = params.id;
    //
    //     var sp = await Models.supplier.get(id);
    //     for(var key in params){
    //         sp[key] = params[key];
    //     }
    //     return sp.save();
    // }

    @clientExport
    // @requireParams(['id'])
    static async updateSupplier(params): Promise<any> {
        console.log('updateparams', params);
        let resUpdate = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'PUT'
            }
        });
        return resUpdate.data;
    }

    /**
     * 根据id查询供应商
     * @param {String} params.id
     * @returns {*}
     */
    // @clientExport
    // @requireParams(["id"])
    // static async getSupplier(params: {id: string}) : Promise<Supplier>{
    //     let id = params.id;
    //     var ah = await Models.supplier.get(id);
    //
    //     return ah;
    // };

    @clientExport
    // @requireParams(['id'])
    static async getSupplier(params: {id: string}): Promise<Supplier> {
        // console.log('getsupplier', params);
        let resGet = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'GET'
            }
        });
        return resGet.data;
    }



    /**
     * 根据属性查找属于企业的供应商
     * @param params
     * @returns {*}
     */
    // @clientExport
    // static async getSuppliers(params): Promise<FindResult>{
    //     params.order = params.order || [['created_at', 'desc']];
    //
    //     let paginate = await Models.supplier.find(params);
    //     let ids =  paginate.map(function(s){
    //         return s.id;
    //     })
    //     return {ids: ids, count: paginate['total']};
    // }

    @clientExport
    // @requireParams(['companyId'])
    static async getSuppliers(params): Promise<any> {
        console.log('getsuppliers', params);
        let resGets = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'GET'
            }
        });
        return resGets.data;
    }



    /**
     * 查找系统公共供应商
     * @param params
     * @returns {*}
     */
    // @clientExport
    // static async getPublicSuppliers(params): Promise<FindResult>{
    //     params.order = params.order || [['created_at', 'desc']];
    //
    //     params.where.companyId = null;//查询companyId为空的公共供应商
    //     let paginate = await Models.supplier.find(params);
    //     let ids =  paginate.map(function(s){
    //         return s.id;
    //     })
    //     return {ids: ids, count: paginate['total']};
    // }


    /**
     * get public suppliers' id
     */
    @clientExport
    static async getPublicSuppliersId(params): Promise<any> {
        // console.log('publicparams', params);
        let resPublic = await RestfulAPIUtil.operateOnModel({
            model: 'company',
            params: {
                fields: {
                    id: params['companyId']
                },
                method: 'GET',
            },
            flag: true
        });
        let res = resPublic.data.appointedPubilcSuppliers;
        console.log('publicres', res);
        return res;
    }

    /**
     * get all suppliers' id
     */
    @clientExport
    static async getAllSuppliers(params): Promise<any> {
        console.log('allparams', params);
        let resPri = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'GET'
            }
        });

        let resPub = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: {
                    companyId: null
                },
                method: 'GET'
            }
        });

        let res = _.concat(resPri.data, resPub.data)
        console.log('res', res);
        return res;
    }


    /**
     * get all used suppliers' id
     */
    @clientExport
    static async getAllUsedSuppliersId(params): Promise<any> {
        // console.log('allusedparams',params);
        console.log('id:', params['companyId']);
        let resPublic = await RestfulAPIUtil.operateOnModel({
            model: 'company',
            params: {
                fields: {
                    id: params['companyId']
                },
                method:'GET',
            },
            flag: true
        });
        // console.log('resPublic', resPublic.data.appointedPubilcSuppliers);

        let resPrivate = await RestfulAPIUtil.operateOnModel({
            model: 'supplier',
            params: {
                fields: params,
                method: 'GET'
            }
        });
        // console.log('resPrivate', resPrivate.data);

        let res = resPublic.data.appointedPubilcSuppliers;
        let resPrivateData = resPrivate.data;
        resPrivateData.map(function(item) {
            res.push(item.id);
            return ;
        });
        // console.log('res', res);
        return res;
    }


    /*************************************供应商end***************************************/


    /*************************************企业行程点数变更日志begin***************************************/

    @clientExport
    static async createTripPlanNumChange (params) : Promise<TripPlanNumChange>{
        var tpc = TripPlanNumChange.create(params);
        return tpc.save();
    }

    @clientExport
    @requireParams(["id"])
    static async getTripPlanNumChange(params) :Promise<TripPlanNumChange> {
        return Models.tripPlanNumChange.get(params.id);
    }

    /**
     * 企业行程点数变更记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getTripPlanNumChanges(params): Promise<FindResult>{
        params.order = params.order || [['createdAt', 'desc']];
        let paginate = await Models.tripPlanNumChange.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    @clientExport
    static async getSelfCompanies(params): Promise<Company[]> {
        let session = Zone.current.get("session");
        let accountId = session["accountId"]
        let staffs = await Models.staff.all({where: {accountId: accountId}});
        let companies = staffs.map( (staff) => {
            return staff.company;
        })
        return companies;
    }

    /*************************************企业行程点数变更日志end***************************************/

    static async urgentResetTripPlanNum(){
        let companies = await Models.company.all({where : {expiryDate : {$gt: moment().format('YYYY-MM-DD HH:mm:ss')}, type: ECompanyType.PAYED}});
        await Promise.all(companies.map(async (co) => {
            let tripBasicPackage = co.tripBasicPackage;
            let num = co.tripPlanNumInBase;
            co.tripPlanPassNum = 0;
            if (tripBasicPackage) {
                co.tripPlanNumLimit = parseInt(tripBasicPackage.tripNum + "");
            }
            await co.save();

            if (num > 0) {
                let log1 = TripPlanNumChange.create({
                    companyId: co.id,
                    type: NUM_CHANGE_TYPE.SYSTEM_REDUCE,
                    number: 0 - num,
                    remark: "套餐余额过期",
                    content: "套餐包余额过期"
                });
                await log1.save();
            }
            let log2 = TripPlanNumChange.create({
                companyId: co.id,
                type: NUM_CHANGE_TYPE.SYSTEM_ADD,
                number: co.tripPlanNumLimit,
                remark: "套餐新增行程",
                content: "套餐新增行程"
            });
            await log2.save();
        }))
    }

    static async resetTripPlanNum(){
        let companies = await Models.company.all({where : {expiryDate : {$gt: moment().format('YYYY-MM-DD HH:mm:ss')}, type: ECompanyType.PAYED}});
        await Promise.all(companies.map(async (co) => {
            let tripBasicPackage = co.tripBasicPackage;
            let num = co.tripPlanNumLimit - co.tripPlanPassNum;
            co.tripPlanPassNum = 0;
            co.tripPlanFrozenNum = 0;
            if (tripBasicPackage) {
                co.tripPlanNumLimit = parseInt(tripBasicPackage.tripNum + "");
            }
            await co.save();

            if (num > 0) {
                let log1 = TripPlanNumChange.create({
                    companyId: co.id,
                    type: NUM_CHANGE_TYPE.SYSTEM_REDUCE,
                    number: 0 - num,
                    remark: "上月套餐余额及冻结余额过期",
                    content: "套餐包余额过期"
                });
                await log1.save();
            }

            if(co.tripPlanNumLimit > 0){
                let log2 = TripPlanNumChange.create({
                    companyId: co.id,
                    type: NUM_CHANGE_TYPE.SYSTEM_ADD,
                    number: co.tripPlanNumLimit,
                    remark: "本月套餐新增行程",
                    content: "本月套餐新增行程"
                });
                await log2.save();
            }
        }))
    }

    static async initCompanyRegion(){
        let companies = await Models.company.all({where: {}});
        await Promise.all(companies.map(async (co) => {
            let subsidyRegions = await API.travelPolicy.initSubsidyRegions({companyId: co.id});
        }))
    }


    /* ============= company.invoiceTitle api ========== */

    static async isRepeatInvoice( params: { companyId:string, name:string } ){
        let invoices = await Models.invoiceTitle.find({
            where : {
                companyId : params.companyId,
                name : params.name
            }
        });
        return invoices.length ? true : false;
    }


    @clientExport
    @requireParams(["id"])
    static async getInvoiceTitle(params: { id:string }) : Promise<InvoiceTitle>{
        let id = params.id;
        let result = await Models.invoiceTitle.get(id);

        return result;
    }

    @clientExport
    static async getInvoiceTitles(params) : Promise<FindResult>{
        params.order =params.order || [['created_at', 'desc']];
        params.where = params.where || {};
        let invoices = await Models.invoiceTitle.find(params);

        let ids = invoices.map((s)=>s.id);

        return { ids, count:invoices.total }
    }

    @clientExport
    static async createInvoiceTitle (params) : Promise<InvoiceTitle>{

        let isRepeat = await CompanyModule.isRepeatInvoice({
            companyId : params.companyId,
            name      : params.name
        });

        if(isRepeat){
            throw L.DefineErrorCode("errorInvoiceName", -556, "发票名称重复" );
        }

        var tpc = InvoiceTitle.create(params);
        return tpc.save();
    }

    @clientExport
    @requireParams(["id"], InvoiceTitle['$fieldnames'])
    static async updateInvoiceTitle(params) : Promise<InvoiceTitle>{
        let id = params.id;
        let staff = await Staff.getCurrent();

        let sp = await Models.invoiceTitle.get(id);
        if(sp.companyId != staff.company.id){
            throw L.ERR.PERMISSION_DENY();
        }

        if(params.name){
            let isRepeat = await CompanyModule.isRepeatInvoice({
                companyId : staff.company.id,
                name      : params.name
            });

            if(isRepeat){
                throw L.DefineErrorCode("errorInvoiceName", -556, "发票名称重复" );
            }
        }

        for(var key in params){
            sp[key] = params[key];
        }
        return sp.save();
    }

    @clientExport
    @requireParams(["id"])
    static async deleteInvoiceTitle(params) : Promise<any>{
        let id = params.id;
        let staff = await Staff.getCurrent();
        let st_delete = await Models.invoiceTitle.get(id);
        if(st_delete.companyId != staff.company.id){
            throw L.ERR.PERMISSION_DENY();
        }

        await st_delete.destroy();
        return true;
    }

    /* ====================== END ======================= */


    static _scheduleTask () {
        let taskId = "resetTripPlanPassNum";
        scheduler('0 5 0 1 * *', taskId, function() {
            //每月1号付费企业消耗行程数，冻结数归零
            (async ()=> {
                await CompanyModule.resetTripPlanNum();
            })()
                .catch( (err) => {
                    logger.error(`执行任务${taskId}错误:${err.stack}`);
                })
        });

        let taskId2 = 'notifyExpireCompany';
        scheduler('0 0 1 * * *', taskId2, function() {
            //失效日期前1,7,15天时发送 App, 短信, 邮件通知
            (async function() {
                let companies = [];
                let now = new Date();
                const EXPIRE_BEFORE_DAYS = 15;
                const PAYED_COMPANY_EXPIRE_NOTIFY = [-1,1, 7, 15]
                const TRYING_COMPANY_EXPIRE_NOTIFY = [7];

                //获取所有待失效企业
                let pager = await Models.company.find({
                    where: {
                        expiryDate: {
                            $lte: moment().add(EXPIRE_BEFORE_DAYS, 'days'),
                            $gte: now,
                        },
                    }
                });
                pager.forEach((company) => {
                    companies.push(company);
                });

                while(pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }

                for(let company of companies) {
                    if (!company.expiryDate) {
                        continue;
                    }

                    let diffDays = moment(company.expiryDate).diff([now.getFullYear(), now.getMonth(), now.getDate()], 'days');
                    let key = null;
                    if (company.type == ECompanyType.PAYED
                        && PAYED_COMPANY_EXPIRE_NOTIFY.indexOf(diffDays) >= 0) {
                        key = 'qm_notify_will_expire_company';
                    }
                    if (company.type != ECompanyType.PAYED
                        && TRYING_COMPANY_EXPIRE_NOTIFY.indexOf(diffDays) >= 0) {
                        key = 'qm_notify_trying_will_expire_company'
                    }
                    if (key) {
                        // let detailUrl = C.host + "/#/company-pay/service-pay";
                        let host = C.host;
                        //查询公司管理员和创建人
                        let managers = await company.getManagers({withOwner: true});
                        let ps = managers.map( (manager) => {
                            //给各个企业发送通知
                            return API.notify.submitNotify({
                                userId: manager.id,
                                key: key,
                                values: {
                                    company: company,
                                    expiryDate: moment(company.expiryDate).format('YYYY-MM-DD'),
                                    days: diffDays,
                                    host: host
                                }
                            });
                        });
                        await Promise.all(ps);
                    }
                }
            })()
                .catch((err) => {
                    logger.error(`run stark ${taskId2} error:`, err.stack);
                });
        });

        let taskId3 = "companyExpire";
        scheduler('0 0 * * * *', taskId3, function() {
            //每小时检查一次企业是否过期 将过期企业套餐行程数置为0
            (async ()=> {
                let companies = [];
                let pager = await Models.company.find({where : {expiryDate : {$lt: moment().format('YYYY-MM-DD HH:mm:ss')}, tripPlanNumLimit: {$gt: 0}}});
                pager.forEach((company) => {
                    companies.push(company);
                });

                while(pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }
                await Promise.all(companies.map(async (co) => {
                    let num = co.tripPlanNumLimit - co.tripPlanPassNum - co.tripPlanFrozenNum;
                    co.tripPlanNumLimit = 0;
                    await co.save();
                    if(num > 0){
                        let log = TripPlanNumChange.create({companyId: co.id, type:NUM_CHANGE_TYPE.SYSTEM_REDUCE, number:0-num, remark:"企业服务到期套餐内行程数置为0", content:"套餐包余额过期"});
                        await log.save();
                    }
                }))
            })()
                .catch( (err) => {
                    logger.error(`执行任务${taskId3}错误:${err.stack}`);
                })
        });

        let taskId4 = "extraExpiryDate";
        scheduler('0 0 * * * *', taskId4, function() {
            //每小时检查一次增量包是否过期
            (async ()=> {
                let companies = [];
                let pager = await Models.company.find({where : {extraExpiryDate : {$lt: moment().format('YYYY-MM-DD HH:mm:ss')}, extraTripPlanNum: {$gt: 0}}});
                pager.forEach((company) => {
                    companies.push(company);
                });

                while(pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }
                await Promise.all(companies.map(async (co) => {
                    if(co.extraTripPlanNum){
                        let num = co.extraTripPlanNum;
                        co.extraTripPlanNum = 0;
                        co.extraTripPlanFrozenNum = 0;
                        await co.save();
                        if(num > 0){
                            let log = TripPlanNumChange.create({companyId: co.id, type:NUM_CHANGE_TYPE.SYSTEM_REDUCE, number:0-num, remark:"增量包余额过期", content:"增量包余额过期"});
                            await log.save();
                        }
                    }
                    
                }))
            })()
                .catch( (err) => {
                    logger.error(`执行任务${taskId4}错误:${err.stack}`);
                })
        });

        let taskId5 = 'qm:task:perDayMail'
        scheduler('0 10 8 * * *', taskId5, function() {
            if (!C.perDayRegisterEmail) {
                return false;
            }

            //每天八点10分发送每日企业注册邮件
            ( async () => {
                let pager;
                let companies = [];
                do {
                    pager = await Models.company.find( {
                        where: {
                            createdAt: {
                                "$lte": new Date(),
                                "$gte": moment().add(-1, 'days').format('YYYY-MM-DD 08:00')
                            }
                        }
                    });

                    let ps = pager.map( async (company) => {
                        let staff = await Models.staff.get(company.createUser);
                        company['createUserObj'] = staff;
                        return company;
                    })

                    let _companies = await Promise.all(ps);
                    _companies.forEach( (company: Company) => {
                        companies.push({
                            name: company.name,
                            createUser: {
                                name: company['createUserObj']['name'],
                                mobile: company['createUserObj']['mobile']
                            },
                            createdAt: company.createdAt
                        })
                    });
                } while(pager && pager.hasNextPage())

                await API.notify.submitNotify({
                    key: "qm_notify_perday_mail",
                    values: {
                        companies: companies,
                    },
                    email: C.perDayRegisterEmail
                });
                logger.info(`成功执行任务${taskId5}`);
            })()
                .catch( (err) => {
                    logger.error(`执行任务${taskId5}错误:${err.stack}`);
                })
        });

        let taskId6 = 'dataStatisticsPerWeek';
        scheduler('0 0 1 * * 1', taskId6, function() {
            //每周一晚上一点给管理员 创建者发送统计邮件
            (async function() {
                let now = new Date();

                //获取所有企业
                let companies = await Models.company.all({
                    where: {
                        expiryDate: {$gte: now},
                        type: ECompanyType.PAYED
                    }
                });

                for(let company of companies) {
                    if (!company.expiryDate) {
                        continue;
                    }

                    let staticData = await company.staticTripPlanInfo({beginTime: moment().subtract(7, 'days'), endTime: now});
                    let key =  'qm_notify_perweek_data_statistics';
                    let host = C.host;
                    //查询公司管理员和创建人
                    let managers = await company.getManagers({withOwner: true});
                    let ps = managers.map( (manager) => {
                        //给各个企业发送通知
                        return API.notify.submitNotify({
                            userId: manager.id,
                            key: key,
                            values: {
                                company: company,
                                sumBudget: staticData.sumBudget,
                                sumTripPlanNum: staticData.sumTripPlanNum,
                                staffNum: staticData.staffNum,
                                host: host
                            }
                        });
                    });
                    await Promise.all(ps);
                }
                logger.info(`成功执行任务${taskId6}`);
            })()
                .catch((err) => {
                    logger.error(`run stark ${taskId6} error:`, err.stack);
                });
        });

        let taskId7 = 'notifyNewStaffPerDayMail';
        scheduler('0 0 8 * * *', taskId7, function() {
            if (!C.perDayRegisterEmail) {
                return false;
            }

            //每天八点发送每日添加员工邮件
            ( async () => {
                let staffs = await Models.staff.all( {
                    where: {
                        createdAt: {
                            "$lte": new Date(),
                            "$gte": moment().add(-1, 'days').format('YYYY-MM-DD 08:00')
                        }
                    }
                });

                await API.notify.submitNotify({
                    key: "qm_notify_perday_mail_staff",
                    values: {
                        staffs: staffs,
                    },
                    email: C.perDayRegisterEmail
                });
                logger.info(`成功执行任务${taskId7}`);
            })()
                .catch( (err) => {
                    logger.error(`执行任务${taskId7}错误:${err.stack}`);
                })
        });
    }

}


CompanyModule._scheduleTask();
export = CompanyModule;