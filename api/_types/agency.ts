/**
 * Created by yumiao on 16-4-26.
 */
'use strict';
import { regApiType } from 'common/api/helper';
import { isBrowser, Models, EGender, EAccountType } from 'api/_types';
import {Company} from 'api/_types/company';
import { getSession, Types, Values } from 'common/model';
import { Account } from './auth';
import { Table, TableExtends, Create, Field, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { TripPlan } from "api/_types/tripPlan";

export enum EAgencyStatus {
    DELETE = -2, //删除状态
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

export const AgencyError = {
    AGENCY_NOT_FOUND: {code: -11, msg: '没有该代理商'}
}

export enum  EAgencyUserRole {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2
}



@Table(Models.agency, 'agency.')
export class Agency extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    static __defaultAgencyId;
    
    @Create()
    static create(obj?: Object): Agency { return null; }

    async destroy(options?: Object): Promise<any> {
        if(this.isLocal){
            let agencyUsers = await Models.agencyUser.find({agencyId: this.id});
            await Promise.all(agencyUsers.map((user) => user.destroy(options))); 
        }
        super.destroy(options);
    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(10)})
    get agencyNo(): string { return ''; }
    set agencyNo(val: string) {}

    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    @Field({type: Types.STRING(100)})
    get name(): string { return ''; }
    set name(val: string) {}

    @Field({type: Types.TEXT})
    get description(): string { return ''; }
    set description(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): EAgencyStatus { return 0; }
    set status(val: EAgencyStatus) {}

    @Field({type: Types.STRING(30)})
    get email(): string { return ''; }
    set email(val: string) {}

    @Field({type: Types.STRING(15)})
    get mobile(): string { return ''; }
    set mobile(val: string) {}

    @Field({type: Types.INTEGER})
    get companyNum(): number { return 0; }
    set companyNum(val: number) {}

    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}

    getCompanys(): Promise<Company[]> {
        let query;
        if (isBrowser()) {
            query = {agencyId: this.id};
        } else {
            query = {where: {agencyId: this.id}}
        }
        return Models.company.find(query);
    }

    getUsers(): Promise<AgencyUser[]> {
        let query;
        if (isBrowser()) {
            query =  {agencyId: this.id};
        } else {
            query = { where: {agencyId: this.id}};
        }
        return Models.agencyUser.find(query);
    }

    async getTripPlans(): Promise<TripPlan[]> {
        let companies = await this.getCompanys();
        let compIds = companies.map((o)=>o.id);
        let query;
        if (isBrowser()) {
            query = {companyId: {$in: compIds}};
        } else {
            query = {where: {companyId: {$in: compIds}}}
        }
        return Models.tripPlan.find(query);
    }
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
    
    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): EAgencyStatus { return 0; }
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
    get roleId(): EAgencyStatus { return 0; }
    set roleId(val: EAgencyStatus) {}

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
