
import {TableExtends, Table, Create, Field, ResolveRef, RemoteCall} from 'common/model/common';
import { Account } from '../auth';
import { Models, EAccountType, EGender } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { getSession, Types, Values } from 'common/model';
import { Agency } from './agency';
import moment=require('moment');
import {PaginateInterface} from "common/model/interface";
import {Company, ECompanyType} from "../company/company";
import {L} from "../../../common/language";
let sequelize = require("common/model").DB;


export enum EAgencyStatus {
    DELETE = -2, //删除状态
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

export enum  EAgencyUserRole {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2
}

@TableExtends(Account, 'account')
@Table(Models.agencyUser, 'agency.')
export class AgencyUser extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): AgencyUser { return null; }

    static async getCurrent(): Promise<AgencyUser> {
        await AgencyUser['$model'].$resolve();
        let session = getSession();
        if(session.currentAgencyUser)
            return session.currentAgencyUser;
        if(!session.accountId)
            return null;
        var account = await Models.account.get(session.accountId);
        if(!account || account.type != EAccountType.AGENCY)
            return null;
        var agencyUser = await Models.agencyUser.get(session.accountId);
        session.currentAgencyUser = agencyUser;
        return agencyUser;
    }

    @RemoteCall()
    async  findCompanies(options?: any):Promise<any>{
        let self = this;
        let {page, perPage} = options;
        if (!page || !/^\d+$/.test(page)) {
            page = 1;
        }
        if (!perPage || !/^\d+$/.test(perPage)) {
            perPage = 20;
        }
        let sql = `SELECT C.id FROM company.companies AS C `;
        //分页
        let countSQL = `SELECT  count(1) as total FROM company.companies AS C`;
        let where = ` WHERE C.agency_id = '${self.agency.id}' AND `;
        if (options.userName || options.mobile ) {
            let piece = ' LEFT JOIN staff.staffs AS S ON S.id = C.create_user '
            sql += piece;
            countSQL += piece;
        }
        //创建者
        if ( options.userName) {
            where += ` S.name like '%${options.userName}%' AND `;
        }
        //关键词
        if (options.keyword) {
            where += ` C.name like '%${options.keyword}%' AND `;
        }
        //联系人的手机号
        if (options.mobile) {
            let piece = ` LEFT JOIN auth.accounts AS A ON A.id = S.id `;
            sql += piece;
            countSQL += piece;
            where += ` A.mobile like '%${options.mobile}%' AND `
        }
        //注册时间段
        if (options.regDateStart&&options.regDateEnd) {
            where+=  ` C.created_at > '${moment(options.regDateStart).format('YYYY-MM-DD HH:mm:ss') }' AND  C.created_at < '${moment(options.regDateEnd).format('YYYY-MM-DD HH:mm:ss') }' AND `;
        }
        //到期时间
        if(options.days){
            where+= ` C.expiry_date <  '${moment().add(options.days, 'days').format('YYYY-MM-DD HH:mm:ss')}' AND `;
        }
        where = where.replace(/AND\s*$/i, '');
        sql = sql + where;
        sql += `  ORDER BY C.created_at desc LIMIT ${perPage} OFFSET ${ (page-1) * perPage} `;
        countSQL += where;
        let company_ret = await sequelize.query(sql);
        let num_ret=await sequelize.query(countSQL);
        let result = {
            total: <number>(num_ret[0][0]['total']),
            items: company_ret[0],
            page: page,
            perPage: perPage
        };
        return result;

    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): EAgencyStatus { return EAgencyStatus.UN_ACTIVE; }
    set status(val: EAgencyStatus) {}

    @Field({type: Types.STRING})
    get name(): string { return ''; }
    set name(val: string) {}

    @Field({type: Types.INTEGER})
    get sex(): EGender { return EGender.MALE; }
    set sex(val: EGender) {}

    @Field({type: Types.STRING})
    get avatar(): string { return ''; }
    set avatar(val: string) {}

    @Field({type: Types.INTEGER})
    get roleId(): EAgencyUserRole { return EAgencyUserRole.COMMON; }
    set roleId(val: EAgencyUserRole) {}

    @ResolveRef({type: Types.UUID}, Models.agency)
    get agency(): Agency { return null; }
    set agency(val: Agency) {}

    //充值鲸币
    @RemoteCall()
    async addCompanyCoin(companyId: string, coin: number, remark?: string): Promise<any> {
        let self=this;
        let company = await Models.company.get(companyId);
        let agency = await company.getAgency();

        if (agency.createUser != self.id ) {
            throw L.ERR.PERMISSION_DENY();
        }
        //先记录操作日志
        let log = await Models.agencyOperateLog.create({agency_userId:this.id,agencyId: agency.id, remark:'因'+remark+'的原因为'+company.name+'('+company.id+')'+'充值了'+coin+'鲸币'});
        await log.save();
        //给企业加鲸币
        let ret = await company.coinAccount.addCoin(coin, remark);
        return ret;
    }

    //修改到期时间
    @RemoteCall()
    async addExpiryDate(companyId: string, qs:any): Promise<any>{
        let self=this;
        let company = await Models.company.get(companyId);
        let agency = await company.getAgency();
        if (agency.createUser != self.id ) {
            throw L.ERR.PERMISSION_DENY();
        }
        //先记录操作日志
        let log = await Models.agencyOperateLog.create({agency_userId:this.id,agencyId: agency.id, remark:'因'+qs.remark+'的原因为'+company.name+'('+company.id+')'+'的到期时间增加了'+qs.months+'月'});
        await log.save();
        //修改企业到期时间
        let ret =  new Date(moment(company.expiryDate).add(qs.months,'months').valueOf());
        company.expiryDate = ret;
        if(qs.IsChange){
            company.type = ECompanyType.PAYED;
        }
        await company.save();
        return ret;
    }
    //增加行程流量包
    @RemoteCall()
    async  addFlowPackage(companyId:string, qs:any):Promise<any>{
        console.info("333");
        let self=this;
        let company = await Models.company.get(companyId);
        let agency = await company.getAgency();
        if (agency.createUser != self.id ) {
            throw L.ERR.PERMISSION_DENY();
        }
        //先记录操作日志
        let log = await Models.agencyOperateLog.create({agency_userId:this.id,agencyId: agency.id, remark:'因'+qs.remark+'的原因为'+company.name+'('+company.id+')'+'的流量包增加了'+'到期时间增加了3个月'});
        await log.save();
        //修改行程流量包
        if(qs.AddTwenty){
            company.extraTripPlanNum=company.extraTripPlanNum+20;
        }
        if(qs.AddFifty){
            company.extraTripPlanNum=company.extraTripPlanNum+50;
        }
        let ret =  new Date(moment(company.expiryDate).add(3,'months').valueOf());
        company.expiryDate = ret;
        company.save();
        return company;
    }


    //Account properties:
    email: string;
    mobile: string;
    pwd: string;
    forbiddenExpireAt: Date;
    loginFailTimes: number;
    lastLoginAt: Date;
    lastLoginIp: string;
    activeToken: string;
    pwdToken: string;
    oldQrcodeToken: string;
    qrcodeToken: string;
    type: EAccountType;
    isFirstLogin: boolean;
}
