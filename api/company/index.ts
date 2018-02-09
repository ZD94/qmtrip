/**
 * Created by yumiao on 15-12-9.
 */
import { DB } from '@jingli/database';
import L from '@jingli/language';
let C = require("@jingli/config");
let API = require("@jingli/dnode-api");
import { getSession } from "@jingli/dnode-api";
import Logger from '@jingli/logger';
let logger = new Logger('company');
let moment = require('moment');
let scheduler = require('common/scheduler');
let _ = require("lodash");
import { requireParams, clientExport } from "@jingli/dnode-api/dist/src/helper";
import { Models } from "_types";
import { Company, MoneyChange, Supplier, TripPlanNumChange, ECompanyType, NUM_CHANGE_TYPE, InvoiceTitle, CompanyProperty, CPropertyType } from '_types/company';
import { Staff, EStaffRole } from "_types/staff";
import { PromoCode } from "_types/promoCode";
import { AgencyUser, EAgencyUserRole } from "_types/agency";
import { Department, StaffDepartment } from "_types/department";
import { requirePermit, conditionDecorator, condition, modelNotNull } from "api/_decorator";
import { md5 } from "common/utils";
import { FindResult, PaginateInterface } from "common/model/interface";
import { CoinAccount } from "_types/coin";
import { restfulAPIUtil } from "api/restful";
import { ISegment } from '_types/tripPlan';
let RestfulAPIUtil = restfulAPIUtil;


const DEFAULT_EXPIRE_MONTH = 1;

export enum HotelPriceLimitType {
    NO_SET = 0,
    Min_Price_Limit = -1,
    Max_Price_Limit = 1,
    Price_Limit_Both = 2
}

export default class CompanyModule {
    /**
     * 创建企业
     * @param {Object} params
     * @param {UUID} params.createUser 创建人
     * @param {String} params.name 企业名称
     * @param {String} params.domainName 域名,邮箱后缀
     * @returns {Promise<Company>}
     */
    @requireParams(['createUser', 'name', 'domainName', 'mobile', 'email', 'agencyId'], ['id', 'description', 'telephone', 'remark'])
    static async createCompany(params: Company): Promise<Company> {
        let results = await Models.company.find({ where: { $or: [{ email: params.email }, { mobile: params.mobile }] } });

        if (results && results.length > 0) {
            throw { code: -2, msg: '邮箱或手机号已注册企业' };
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
    static async registerCompany(params: {
        mobile: string, name: string, email?: string, userName: string,
        pwd: string, status?: number, isValidateMobile?: boolean, promoCode?: string,
        referrerMobile?: string, ldapUrl?: string, ldapBaseDn?: string, ldapStaffRootDn?: string,
        ldapDepartmentRootDn?: string, ldapAdminPassword?: string, ldapAdminDn?: string
    }): Promise<any> {
        let session = getSession();
        let pwd = params.pwd;
        let defaultAgency = await Models.agency.find({ where: { email: C.default_agency.email } });//Agency.__defaultAgencyId;
        let agencyId: string | undefined;
        if (defaultAgency && defaultAgency.length == 1) {
            agencyId = defaultAgency[0].id;
        }
        let domain: string = ''; //企业域名
        if (params.email) {
            let res = params.email.match(/.*\@(.*)/)
            domain = res && res[1] || '';
        }

        if (domain && domain != "" && params.email && params.email.indexOf(domain) == -1) {
            throw { code: -6, msg: "邮箱格式不符合要求" };
        }

        /*let companies = await Models.company.find({where: {$or: [{email: params.email}, {mobile: params.mobile}/!*, {domain_name: domain}*!/]}});
        if(companies && companies.length > 0) {
            throw {code: -7, msg: '邮箱或手机号已经注册'};
        }*/

        if (session && session.accountId) {
            let agencyUser = await Models.agencyUser.get(session.accountId);
            if (agencyUser) {
                agencyId = agencyUser.agency.id;
            }
        }

        let staff = Staff.create({ 
            email: params.email, 
            name: params.userName,
            mobile: params.mobile || null, 
            roleId: EStaffRole.OWNER, 
            pwd: md5(pwd), 
            status: params.status, 
            isValidateMobile: params.isValidateMobile,
            isNeedChangePwd: false
        });
        let company = Company.create(params);
        company.domainName = domain;
        company.expiryDate = moment().add(DEFAULT_EXPIRE_MONTH, 'months').toDate();
        company.isApproveOpen = true;
        company.points2coinRate = 100;
        let department = Department.create({ name: company.name, isDefault: true });
        let staffDepartment = StaffDepartment.create({ staffId: staff.id, departmentId: department.id });

        department.company = company;
        staff.company = company;
        company.createUser = staff.id;
        company['agencyId'] = agencyId;
        //新注册企业默认套餐行程数为60
        company.tripPlanNumLimit = 60;

        //注册

        if (params.referrerMobile) {
            let ac = await Models.account.find({ where: { mobile: params.referrerMobile } });
            if (ac && ac.length > 0) {
                company.setReferrer(ac[0]);
            }
        }
        if (params.ldapUrl) {
            let jsonValue = {
                ldapUrl: params.ldapUrl, ldapBaseDn: params.ldapBaseDn,
                ldapStaffRootDn: params.ldapStaffRootDn, ldapDepartmentRootDn: params.ldapDepartmentRootDn,
                ldapAdminPassword: params.ldapAdminPassword, ldapAdminDn: params.ldapAdminDn
            };
            let companyProperty = CompanyProperty.create({ companyId: company.id, type: CPropertyType.LDAP, value: JSON.stringify(jsonValue) });
            await companyProperty.save();
        }

        await Promise.all([staff.save(), company.save(), department.save(), staffDepartment.save()]);
        let promoCode: PromoCode | undefined;
        if (params.promoCode) {
            promoCode = await company.doPromoCode({ code: params.promoCode });
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

        await CompanyModule.syncCompanyToJLCloud(company, pwd, params.mobile);

        //jlbudget create company record.
        // try {
        //     await RestfulAPIUtil.operateOnModel({
        //         model: "agent",
        //         params: {
        //             fields: {
        //                 name: company.name,
        //                 priceLimitType: HotelPriceLimitType.NO_SET,
        //                 appointedPubilcSuppliers: company.appointedPubilcSuppliers,
        //                 companyId: company.id,
        //                 mobile: params.mobile,
        //                 password: md5(pwd)
        //             },
        //             method: "post"
        //         },
        //         addUrl: 'company/create',
        //         useProxy: false
        //     });

        // } catch (e) {
        //     throw e;
        // }

        //jlbudget create account record. Waiting jlbudget account identifie online.

        //默认添加 中国大陆(国内）、通用地区（国际）、港澳台 三个地区用于差旅、补助、限价等的管理
        await API.travelPolicy.initDefaultCompanyRegion({companyId: company.id});
        return { company: company, description: promoCode ? promoCode.description : "" };
    }


    /**
     * @method 同步新建企业到公有云后台
     * @param company 
     */
    @clientExport
    static async syncCompanyToJLCloud(company: Company, pwd: string, mobile?: string): Promise<boolean> {
        let staff: Staff | undefined;
        if(!mobile) {
            if(company.createUser)
                staff = await Models.staff.get(company.createUser);
            if(staff && staff.mobile && staff.mobile != '')
                mobile = staff.mobile;
            if(!mobile) {
                let managers: Staff[] = await company.getManagers({withOwner: true})
                if(!managers) mobile = undefined;
                for(let staff of managers) {
                    if(staff.mobile && staff.mobile != '') mobile = staff.mobile; 
                }
            }
        }
        try {
            await restfulAPIUtil.operateOnModel({
                model: "agent",
                params: {
                    fields: {
                        name: company.name,
                        priceLimitType: HotelPriceLimitType.NO_SET,
                        appointedPubilcSuppliers: company.appointedPubilcSuppliers,
                        companyId: company.id,
                        mobile: mobile,
                        password: md5(pwd)
                    },
                    method: "post"
                },
                addUrl: 'company/create',
                useProxy: false
            });
        } catch (e) {
            throw e;
        }
        return true;
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
    static async updateCompany(params: Company): Promise<Company> {
        let companyId = params.id;
        let company = await Models.company.get(companyId);

        for (let key in params) {
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
        { if: condition.isMyCompany("0.id") },
        { if: condition.isCompanyAgency("0.id") }
    ])
    static getCompany(params: { id: string }): Promise<Company> {
        return Models.company.get(params.id);
    }

    /**
     * 获取企业列表
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    @requireParams([], ['where.status'])
    static async listCompany(options: {
        order: any, where: any
    }): Promise<FindResult> {
        let agencyUser = await AgencyUser.getCurrent();
        options.order = options.order || [['created_at', 'desc']];
        if (!options.where) {
            options.where = {};
        }
        options.where.agencyId = agencyUser.agency.id;
        let companies = await Models.company.find(options);
        let ids = companies.map((c) => c.id);
        return { ids: ids, count: companies['total'] };
    }

    static async getCompanyNoAgency(): Promise<PaginateInterface<Company>> {
        let agencies = await Models.company.find({ where: { agencyId: null } });
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
    static async deleteCompany(params: { id: string }): Promise<boolean> {
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
    @requireParams(['companyId', 'userId'])
    static async checkAgencyCompany(params: {companyId: string, userId: string}): Promise<boolean> {
        var c = await Models.company.get(params.companyId);
        var user = await Models.agencyUser.get(params.userId);

        if (!c || c.status == -2) {
            return false;
        }

        if (c['agencyId'] != user.agency.id || (user.roleId != EAgencyUserRole.OWNER && user.roleId != EAgencyUserRole.ADMIN)) {
            return false;
        }

        return true;
    }

    /**
     * @method 验证公司
     * @param params.tripNum {number} 此次出差需要的行程点数
     * @param params.company {Company} 出差人所在公司
     * @param params.acccountId {string} 出差人的staffId
     * @param params.query {} 此次出差的参数，包括目的地列表、
     */
    @clientExport
    @requireParams(['companyId', 'tripNum', 'query', 'accountId', 'isCheckTripNumStillLeft'])
    static async verifyCompanyTripNum(params: {
        tripNum: number,
        companyId: string,
        accountId: string,
        query: any,
        isCheckTripNumStillLeft: boolean
    }): Promise<{ company: Company, frozenNum: { limitFrozen: number, extraFrozen: number } }> {
        let { tripNum, companyId, accountId, query, isCheckTripNumStillLeft } = params;
        let company = await Models.company.get(companyId);
        if (isCheckTripNumStillLeft) {
            await company.beforeGoTrip({ number: tripNum });  //新版出差提交审批时不检查公司剩余流量数,领导审批时检查
        }

        let destinationPlaces = query.destinationPlacesInfo;
        let content = '';

        if (query && query.originPlace) {
            let originCity = await API.place.getCityInfo({ cityCode: query.originPlace, companyId: company.id });
            content = content + originCity.name + "-";
        }
        if (destinationPlaces && _.isArray(destinationPlaces) && destinationPlaces.length > 0) {
            for (let i = 0; i < destinationPlaces.length; i++) {
                let segment: ISegment = destinationPlaces[i]
                let destinationCity = await API.place.getCityInfo({ cityCode: segment.destinationPlace, companyId: company.id });
                if (i < destinationPlaces.length - 1) {
                    content = content + destinationCity.name + "-";
                } else {
                    content = content + destinationCity.name;
                }
            }
        }

        let result = await company.frozenTripPlanNum({
            accountId: accountId, number: tripNum,
            remark: "提交出差申请消耗行程点数", content: content
        });
        return result;
    }


    /**
     * 保存资金变动记录
     * @param params
     * @returns {Promise<MoneyChange>}
     */
    static async saveMoneyChange(params: { companyId: string, money: number, channel: number, userId: string, remark: string }): Promise<MoneyChange> {
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
    static getMoneyChange(params: { id: string }): Promise<MoneyChange> {
        return Models.moneyChange.get(params.id);
    }


    /**
     *
     * @param params
     * @returns {Promise<string[]>}
     */
    @clientExport
    static async listMoneyChange(options: {where: any}): Promise<FindResult> {
        let staff = await Staff.getCurrent();
        if (!options.where) {
            options.where = {}
        }
        options.where.companyId = staff.company.id;
        let changes = await Models.moneyChange.find(options);
        let ids = changes.map((c) => c.id);
        return { ids: ids, count: changes['total'] };
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
    static fundsCharge(params: { channel: string, money: number, companyId: string, remark?: string }) {
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
    static frozenMoney(params: { channel?: string, money: number, companyId: string }) {
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
    static consumeMoney(params: { userId: string, type: number,
        channel: string, remark: string
    }) {
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
    static async domainIsExist(params: {domain: string}) {
        if (C.is_allow_domain_repeat) {
            return false;
        }

        let domain = params.domain;
        let company = await Models.company.find({ where: { domainName: domain } });
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
    static async isBlackDomain(params: { domain: string }) {
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
    static async deleteCompanyByTest(params: { mobile: string, email: string }) {
        var mobile = params.mobile;
        var email = params.email;
        await DB.models.Company.destroy({ where: { $or: [{ mobile: mobile }, { email: email }] } });
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
    static async createSupplier(params: object): Promise<Supplier> {
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
    // static async deleteSupplier(params: any) : Promise<any>{
    //     var id = params.id;
    //     var st_delete = await Models.supplier.get(id);
    //
    //     await st_delete.destroy();
    //     return true;
    // }

    @clientExport
    // @requireParams(['id'])
    static async deleteSupplier(params: object): Promise<any> {
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
    // static async updateSupplier(params: any) : Promise<Supplier>{
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
    static async updateSupplier(params: object): Promise<any> {
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
    static async getSupplier(params: { id: string }): Promise<Supplier> {
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
    // static async getSuppliers(params: any): Promise<FindResult>{
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
    static async getSuppliers(params: object): Promise<any> {
        // console.log('getsuppliers', params);
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
    // static async getPublicSuppliers(params: any): Promise<FindResult>{
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
    static async getPublicSuppliersId(params: {companyId: string}): Promise<any> {
        // console.log('publicparams', params);
        let resPublic = await RestfulAPIUtil.operateOnModel({
            model: 'company',
            params: {
                fields: {
                    id: params['companyId']
                },
                method: 'GET',
            }
        });
        let res = resPublic.data.appointedPubilcSuppliers;
        console.log('publicres', res);
        return res;
    }

    /**
     * get all suppliers' id
     */
    @clientExport
    static async getAllSuppliers(params: object): Promise<any> {
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
        // console.log('res', res);
        return res;
    }


    /**
     * get all used suppliers' id
     */
    @clientExport
    static async getAllUsedSuppliersId(params: {companyId: string}): Promise<any> {
        // console.log('allusedparams',params);
        console.log('id:', params['companyId']);
        let resPublic = await RestfulAPIUtil.operateOnModel({
            model: 'company',
            params: {
                fields: {
                    id: params['companyId']
                },
                method: 'GET',
            }
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
        resPrivateData.map(function (item: {id: string}) {
            res.push(item.id);
            return;
        });
        // console.log('res', res);
        return res;
    }


    /**
     * get public common suppliers
     */
    @clientExport
    static async getCommonSupplier(params: object): Promise<any> {
        let commonSuppliers = await RestfulAPIUtil.operateOnModel({
            model: 'supplierAlternateName',
            params: {
                fields: params,
                method: 'GET',
            }
        });

        if (commonSuppliers.code == 0) {
            let res = commonSuppliers.data;
            if (res && res.total > 0) {
                let commonSupplierId = res[0].commonSupplierId;
                let commonSupplier = await RestfulAPIUtil.operateOnModel({
                    model: 'commonSupplier',
                    params: {
                        fields: { id: commonSupplierId },
                        method: 'GET',
                    }
                });

                if (commonSupplier.code == 0) {
                    commonSupplier = commonSupplier.data;
                    // commonSupplier.logo = `${C.cloud}/${commonSupplier.logo}`;
                    return commonSupplier;
                } else {
                    throw new Error(commonSuppliers.code);
                }

            } else {
                throw new Error("供应商不存在");
            }

        } else {
            throw new Error(commonSuppliers.code);
        }

    }

    /*************************************供应商end***************************************/


    /*************************************企业行程点数变更日志begin***************************************/

    @clientExport
    static async createTripPlanNumChange(params: object): Promise<TripPlanNumChange> {
        var tpc = TripPlanNumChange.create(params);
        return tpc.save();
    }

    @clientExport
    @requireParams(["id"])
    static async getTripPlanNumChange(params: {id: string}): Promise<TripPlanNumChange> {
        return Models.tripPlanNumChange.get(params.id);
    }

    /**
     * 企业行程点数变更记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getTripPlanNumChanges(params: {
        order: any
    }): Promise<FindResult> {
        params.order = params.order || [['createdAt', 'desc']];
        let paginate = await Models.tripPlanNumChange.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    @clientExport
    static async getSelfCompanies(): Promise<Company[]> {
        let session = getSession();
        let accountId = session["accountId"]
        let staffs = await Models.staff.all({ where: { accountId: accountId } });
        let companies = staffs.map((staff) => {
            return staff.company;
        })
        return companies;
    }

    /*************************************企业行程点数变更日志end***************************************/

    static async urgentResetTripPlanNum() {
        let companies = await Models.company.all({ where: { expiryDate: { $gt: moment().format('YYYY-MM-DD HH:mm:ss') }, type: ECompanyType.PAYED } });
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

    static async resetTripPlanNum() {
        let companies = await Models.company.all({ where: { expiryDate: { $gt: moment().format('YYYY-MM-DD HH:mm:ss') }, type: ECompanyType.PAYED } });
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

            if (co.tripPlanNumLimit > 0) {
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

    static async initCompanyRegion() {
        let companies = await Models.company.all({ where: {} });
        await Promise.all(companies.map(async (co) => {
            await API.travelPolicy.initSubsidyRegions({ companyId: co.id });
        }))
    }


    /* ============= company.invoiceTitle api ========== */

    static async isRepeatInvoice(params: { companyId: string, name: string }) {
        let invoices = await Models.invoiceTitle.find({
            where: {
                companyId: params.companyId,
                name: params.name
            }
        });
        return invoices.length ? true : false;
    }


    @clientExport
    @requireParams(["id"])
    static async getInvoiceTitle(params: { id: string }): Promise<InvoiceTitle> {
        let id = params.id;
        let result = await Models.invoiceTitle.get(id);

        return result;
    }

    @clientExport
    static async getInvoiceTitles(params: {order: any, where: any}): Promise<FindResult> {
        params.order = params.order || [['created_at', 'desc']];
        params.where = params.where || {};
        let invoices = await Models.invoiceTitle.find(params);

        let ids = invoices.map((s) => s.id);

        return { ids, count: invoices.total }
    }

    @clientExport
    static async createInvoiceTitle(params: InvoiceTitle): Promise<InvoiceTitle> {

        let isRepeat = await CompanyModule.isRepeatInvoice({
            companyId: params.companyId,
            name: params.name
        });

        if (isRepeat) {
            throw L.DefineErrorCode("errorInvoiceName", -556, "发票名称重复");
        }

        var tpc = InvoiceTitle.create(params);
        return tpc.save();
    }

    @clientExport
    @requireParams(["id"], InvoiceTitle['$fieldnames'])
    static async updateInvoiceTitle(params: {id: string, name: string}): Promise<InvoiceTitle> {
        let id = params.id;
        let staff = await Staff.getCurrent();

        let sp = await Models.invoiceTitle.get(id);
        if (sp.companyId != staff.company.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        if (params.name) {
            let isRepeat = await CompanyModule.isRepeatInvoice({
                companyId: staff.company.id,
                name: params.name
            });

            if (isRepeat) {
                throw L.DefineErrorCode("errorInvoiceName", -556, "发票名称重复");
            }
        }

        for (var key in params) {
            sp[key] = params[key];
        }
        return sp.save();
    }

    @clientExport
    @requireParams(["id"])
    static async deleteInvoiceTitle(params: {id: string}): Promise<any> {
        let id = params.id;
        let staff = await Staff.getCurrent();
        let st_delete = await Models.invoiceTitle.get(id);
        if (st_delete.companyId != staff.company.id) {
            throw L.ERR.PERMISSION_DENY();
        }

        await st_delete.destroy();
        return true;
    }

    /* 
     * 获取企业 国内，国际偏好设置 (或者，中国大陆，通用地区)
    */
    @clientExport
    static async getCompanyPrefer(companyId?: string): Promise<any> {
        if (!companyId) {
            let staff = await Staff.getCurrent();
            companyId = staff.company.id;
        }
        //获取 国内，国际两个通用地区
        let CompanyRegions = await RestfulAPIUtil.operateOnModel({
            model: 'companyRegion',
            params: {
                fields: {
                    companyId
                },
                method: 'get'
            }
        });
        let result: { [key: string]: any } = {}

        for (let companyRegion of CompanyRegions.data) {
            if (companyRegion.name == "国内") {
                result.inlandId = companyRegion.id;
            }
            if (companyRegion.name == "国际") {
                result.nationalId = companyRegion.id;
            }
        }

        //获取两个地区对应prefer，没有创建
        let preferRegionNation = await RestfulAPIUtil.operateOnModel({
            model: 'prefer',
            params: {
                fields: {
                    companyId,
                    id: result.nationalId
                },
                method: 'get'
            }
        });
        result.national = preferRegionNation.data && preferRegionNation.data.budgetConfig;
        let preferRegionInland = await RestfulAPIUtil.operateOnModel({
            model: 'prefer',
            params: {
                fields: {
                    companyId,
                    id: result.inlandId
                },
                method: 'get'
            }
        });
        result.inland = preferRegionInland.data && preferRegionInland.data.budgetConfig;

        return result;
    }

    /* ====================== END ======================= */


    static _scheduleTask() {
        let taskId = "resetTripPlanPassNum";
        scheduler('0 5 0 1 * *', taskId, function () {
            //每月1号付费企业消耗行程数，冻结数归零
            (async () => {
                await CompanyModule.resetTripPlanNum();
            })()
                .catch((err) => {
                    logger.error(`执行任务${taskId}错误:${err.stack}`);
                })
        });

        let taskId2 = 'notifyExpireCompany';
        scheduler('0 0 1 * * *', taskId2, function () {
            //失效日期前1,7,15天时发送 App, 短信, 邮件通知
            (async function () {
                let companies: Array<Company> = [];
                let now = new Date();
                const EXPIRE_BEFORE_DAYS = 15;
                const PAYED_COMPANY_EXPIRE_NOTIFY = [-1, 1, 7, 15]
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

                while (pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }

                for (let company of companies) {
                    if (!company.expiryDate) {
                        continue;
                    }

                    let diffDays = moment(company.expiryDate).diff([now.getFullYear(), now.getMonth(), now.getDate()], 'days');
                    let key = '';
                    if (company.type == ECompanyType.PAYED
                        && PAYED_COMPANY_EXPIRE_NOTIFY.indexOf(diffDays) >= 0) {
                        key = 'qm_notify_will_expire_company';
                    }
                    if (company.type != ECompanyType.PAYED
                        && TRYING_COMPANY_EXPIRE_NOTIFY.indexOf(diffDays) >= 0) {
                        key = 'qm_notify_trying_will_expire_company'
                    }
                    if (key) {
                        let version = C.link_version || 2
                        let detailUrl = ""
                        if (version == 2) {
                            detailUrl = C.v2_host + "#/manage/expiry-date";
                        } else {
                            detailUrl = C.host + "/#/company-pay/service-pay";
                        }
                        // let host = C.host;
                        //查询公司管理员和创建人
                        let managers = await company.getManagers({ withOwner: true });
                        let ps = managers.map((manager) => {
                            //给各个企业发送通知
                            return API.notify.submitNotify({
                                userId: manager.id,
                                key: key,
                                values: {
                                    company: company,
                                    expiryDate: moment(company.expiryDate).format('YYYY-MM-DD'),
                                    days: diffDays,
                                    detailUrl: detailUrl
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
        scheduler('0 0 * * * *', taskId3, function () {
            //每小时检查一次企业是否过期 将过期企业套餐行程数置为0
            (async () => {
                let companies: Company[] = [];
                let pager = await Models.company.find({ where: { expiryDate: { $lt: moment().format('YYYY-MM-DD HH:mm:ss') }, tripPlanNumLimit: { $gt: 0 } } });
                pager.forEach((company) => {
                    companies.push(company);
                });

                while (pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }
                await Promise.all(companies.map(async (co) => {
                    let num = co.tripPlanNumLimit - co.tripPlanPassNum - co.tripPlanFrozenNum;
                    co.tripPlanNumLimit = 0;
                    await co.save();
                    if (num > 0) {
                        let log = TripPlanNumChange.create({ companyId: co.id, type: NUM_CHANGE_TYPE.SYSTEM_REDUCE, number: 0 - num, remark: "企业服务到期套餐内行程数置为0", content: "套餐包余额过期" });
                        await log.save();
                    }
                }))
            })()
                .catch((err) => {
                    logger.error(`执行任务${taskId3}错误:${err.stack}`);
                })
        });

        let taskId4 = "extraExpiryDate";
        scheduler('0 0 * * * *', taskId4, function () {
            //每小时检查一次增量包是否过期
            (async () => {
                let companies: Company[] = [];
                let pager = await Models.company.find({ where: { extraExpiryDate: { $lt: moment().format('YYYY-MM-DD HH:mm:ss') }, extraTripPlanNum: { $gt: 0 } } });
                pager.forEach((company) => {
                    companies.push(company);
                });

                while (pager && pager.hasNextPage()) {
                    pager = await pager.nextPage();
                    pager.forEach((company) => {
                        companies.push(company);
                    })
                }
                await Promise.all(companies.map(async (co) => {
                    if (co.extraTripPlanNum) {
                        let num = co.extraTripPlanNum;
                        co.extraTripPlanNum = 0;
                        co.extraTripPlanFrozenNum = 0;
                        await co.save();
                        if (num > 0) {
                            let log = TripPlanNumChange.create({ companyId: co.id, type: NUM_CHANGE_TYPE.SYSTEM_REDUCE, number: 0 - num, remark: "增量包余额过期", content: "增量包余额过期" });
                            await log.save();
                        }
                    }

                }))
            })()
                .catch((err) => {
                    logger.error(`执行任务${taskId4}错误:${err.stack}`);
                })
        });

        let taskId5 = 'qm:task:perDayMail'
        scheduler('0 10 8 * * *', taskId5, function () {
            if (!C.perDayRegisterEmail) {
                return false;
            }

            //每天八点10分发送每日企业注册邮件
            (async () => {
                let pager: PaginateInterface<Company>
                let companies: {name: string, createUser: object,createdAt: Date}[] = [];
                do {
                    pager = await Models.company.find({
                        where: {
                            createdAt: {
                                "$lte": new Date(),
                                "$gte": moment().add(-1, 'days').format('YYYY-MM-DD 08:00')
                            }
                        }
                    });

                    let ps = pager.map(async (company) => {
                        let staff = await Models.staff.get(company.createUser);
                        company['createUserObj'] = staff;
                        return company;
                    })

                    let _companies = await Promise.all(ps);
                    _companies.forEach((company) => {
                        companies.push({
                            name: company.name,
                            createUser: {
                                name: company['createUserObj']['name'],
                                mobile: company['createUserObj']['mobile']
                            },
                            createdAt: company.createdAt
                        })
                    });
                } while (pager && pager.hasNextPage())

                await API.notify.submitNotify({
                    key: "qm_notify_perday_mail",
                    values: {
                        companies: companies,
                    },
                    email: C.perDayRegisterEmail
                });
                logger.info(`成功执行任务${taskId5}`);
            })()
                .catch((err) => {
                    logger.error(`执行任务${taskId5}错误:${err.stack}`);
                })
        });

        let taskId6 = 'dataStatisticsPerWeek';
        scheduler('0 0 1 * * 1', taskId6, function () {
            //每周一晚上一点给管理员 创建者发送统计邮件
            (async function () {
                let now = new Date();

                //获取所有企业
                let companies = await Models.company.all({
                    where: {
                        expiryDate: { $gte: now },
                        type: ECompanyType.PAYED
                    }
                });

                let linkVersion = C.link_version || 2
                let detailUrl: string = ""
                if (linkVersion == 2) {
                    detailUrl = C.v2_host + '#/statistics/stat-index'
                } else {
                    detailUrl = C.host + '/#/statistics/'
                }
                for (let company of companies) {
                    if (!company.expiryDate) {
                        continue;
                    }

                    let staticData = await company.staticTripPlanInfo({ beginTime: moment().subtract(7, 'days'), endTime: now });
                    let key = 'qm_notify_perweek_data_statistics';

                    //查询公司管理员和创建人
                    let managers = await company.getManagers({ withOwner: true });
                    let ps = managers.map((manager) => {
                        //给各个企业发送通知
                        return API.notify.submitNotify({
                            userId: manager.id,
                            key: key,
                            values: {
                                company: company,
                                sumBudget: staticData.sumBudget,
                                sumTripPlanNum: staticData.sumTripPlanNum,
                                staffNum: staticData.staffNum,
                                detailUrl: detailUrl
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
        scheduler('0 0 8 * * *', taskId7, function () {
            if (!C.perDayRegisterEmail) {
                return false;
            }

            //每天八点发送每日添加员工邮件
            (async () => {
                let staffs = await Models.staff.all({
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
                .catch((err) => {
                    logger.error(`执行任务${taskId7}错误:${err.stack}`);
                })
        });

        }

}


CompanyModule._scheduleTask();
// export = CompanyModule;




