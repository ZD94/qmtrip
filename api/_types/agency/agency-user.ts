
import {TableExtends, Table, Create, Field, ResolveRef, RemoteCall, LocalCall} from 'common/model/common';
import { Account } from '../auth';
import { Models, EAccountType, EGender } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { getSession, Types, Values } from 'common/model';
import { Agency } from './agency';
import moment=require('moment');
import {PaginateInterface} from "common/model/interface";
import {Company} from "../company/company";
import L from 'common/language';
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

    async getCompanyAllStaffs(params: any): Promise<any> {
        let self = this;
        let company = await Models.company.get(params.companyId);
        let staffs = [];
        if(!company){
            throw L.ERR.COMPANY_NOT_EXIST();
        }
        let agency = await company.getAgency();
        if(agency.id != self.agency.id){
            throw L.ERR.PERMISSION_DENY("该企业员工");
        }

        let pager = await Models.staff.find({where: params});
        pager.forEach((s) => {
            staffs.push(s);
        });

        while(pager && pager.hasNextPage()) {
            pager = await pager.nextPage();
            pager.forEach((s) => {
                staffs.push(s);
            })
        }

        return staffs;
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
