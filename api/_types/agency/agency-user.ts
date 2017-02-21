
import {TableExtends, Table, Create, Field, ResolveRef, RemoteCall} from 'common/model/common';
import { Account } from '../auth';
import { Models, EAccountType, EGender } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { getSession, Types, Values } from 'common/model';
import { Agency } from './agency';
import moment=require('moment');
import {PaginateInterface} from "common/model/interface";
import {Company} from "../company/company";
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
        let {page, perPage} = options;
        if (!page || !/^\d+$/.test(page)) {
            page = 1;
        }
        if (!perPage || !/^\d+$/.test(perPage)) {
            perPage = 20;
        }
        let sql = `SELECT C.id, C.name, C.mobile, C.created_at, C.expiry_date, C.create_user FROM company.companies AS C `;
        //分页
        let countSQL = `SELECT  count(1) as total FROM company.companies AS C`;
        let where = ' WHERE '
        //创建者
        if ( options.name) {
            let piece = ' LEFT JOIN staff.staffs AS S ON S.id = C.create_user '
            sql += piece;
            countSQL += piece;
            where += ` S.name like '%${options.name}%' AND `;

        }
        if (options.keyword) {
            where += ` C.name like '%${options.keyword}%' AND `;

        }
        if (options.mobile) {
            where += ` C.mobile like '%${options.mobile}%' AND `
        }

        if (options.regDateStart&&options.regDateEnd) {
            where+=  ` C.created_at > '${moment(options.regDateStart).format('YYYY-MM-DD HH:mm:ss') }' AND  C.created_at < '${moment(options.regDateEnd).format('YYYY-MM-DD HH:mm:ss') }' AND `;
        }
        if(options.days){
            where+= ` C.expiry_date <  '${moment().add(options.days, 'days').format('YYYY-MM-DD HH:mm:ss')}' AND `;
        }
        // where = where.replace(/AND\s*$/i, '');
        where += '1=1';
        sql = sql + where;
        sql += ` LIMIT ${perPage} OFFSET ${ (page-1) * perPage} `;
        countSQL += where;
        let company_ret = await sequelize.query(sql);
        let num_ret=await sequelize.query(countSQL);
        let result = {
            total: <number>(num_ret[0][0]['total']),
            items: company_ret[0],
            page: page,
            perPage: perPage
        };
        console.info(company_ret);
        return result;
        // console.info(company_ret);
        // return company_ret.map( (company) => {
        //     console.log(company)
        //     return company;
        // });

        // let where: any = {};
        // if (options.name) {
        //     //查询创建者时需要找到用户的id
        //     let id = await Models.staff.find({where:{
        //         name:{
        //             $like:'%'+options.name+'%'
        //         }
        //     }});
        //     console.info('id:',id[0].id);
        //    //循环遍历返回的id
        //     let pager:any={};
        //     let item=id.map(async (staff)=>{
        //         if(staff.roleId==0){
        //             where.create_user = staff.id;
        //         }
        //     })
        // }
        // if (options.mobile){
        //     where.mobile=options.mobile;
        // }
        // if(options.keyword){
        //     where.name={
        //         $like: '%' + options.keyword + '%'
        //     }
        // }
        // if(options.regDateStart&&options.regDateEnd){
        //     where.created_at = {
        //         $between: [
        //             options.regDateStart,
        //             options.regDateEnd
        //         ]
        //     }
        // }
        // if(options.expireDate){
        //     where.expiryDate = {
        //         $lte: new Date(moment(new Date()).add(options.expireDate, 'days').format('YYYY-MM-DD HH:mm:ss'))
        //     }
        // }
        // let pager = await Models.company.find({where});
        // return pager;
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
