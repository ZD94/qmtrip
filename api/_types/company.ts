'use strict';

import { Models } from 'api/_types';
import {Staff} from 'api/_types/staff';
import {Agency} from 'api/_types/agency';
import {TravelPolicy} from "api/_types/travelPolicy";
import { Types, Values } from 'common/model';
import { Department } from './department';
import { TripPlan } from "api/_types/tripPlan";
import { Table, Create, Field, Reference } from 'common/model/common';
import { ModelObject } from 'common/model/object';

export enum ECompanyStatus {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

@Table(Models.company, 'company.')
export class Company extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Company { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    // '企业编号'
    @Field({type: Types.STRING(30)})
    get companyNo(): string { return null; }
    set companyNo(val: string) {}

    // '创建人id'
    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    // '企业名称'
    @Field({type: Types.STRING})
    get name(): string { return null; }
    set name(val: string) {}

    // '企业域名'
    @Field({type: Types.STRING})
    get domainName(): string { return null; }
    set domainName(val: string) {}

    // '企业描述'
    @Field({type: Types.STRING})
    get description(): string { return ''; }
    set description(val: string) {}

    // '企业状态'
    @Field({type: Types.INTEGER})
    get status(): ECompanyStatus { return 0; }
    set status(val: ECompanyStatus) {}

    // '企业邮箱'
    @Field({type: Types.STRING})
    get email(): string { return null; }
    set email(val: string) {}

    // '创建人手机号'
    @Field({type: Types.STRING})
    get mobile(): string { return null; }
    set mobile(val: string) {}

    // '员工数目'
    @Field({type: Types.INTEGER})
    get staffNum(): number { return 0; }
    set staffNum(val: number) {}

    // '员工积分'
    @Field({type: Types.INTEGER})
    get staffScore(): number { return 0; }
    set staffScore(val: number) {}

    // '备注'
    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}

    @Field({type: Types.STRING})
    get paymentPwd(): string { return null; }
    set paymentPwd(val: string) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get income(): number { return 0; }
    set income(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get consume(): number { return 0; }
    set consume(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get frozen(): number { return 0; }
    set frozen(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get staffReward(): number { return 0; }
    set staffReward(val: number) {}

    @Field({type: Types.BOOLEAN})
    get isSetPwd(): boolean { return false; }
    set isSetPwd(val: boolean) {}

    @Reference({type: Types.UUID})
    getAgency(id?:string): Promise<Agency> {
        return Models.agency.get(id);
    }

    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({companyId: this.id});
    }
    
    getDepartments(): Promise<Department[]> {
        return Models.department.find({companyId: this.id});
    }

    getTravelPolicies(): Promise<TravelPolicy[]> {
        return Models.travelPolicy.find({companyId: this.id})
    }

    getTripPlans(): Promise<TripPlan[]> {
        return Models.tripPlan.find({companyId: this.id});
    }

    getMoneyChanges(companyId?:string): Promise<MoneyChange[]> {
        return Models.moneyChange.find({fundsAccountId: companyId});
    }
}

@Table(Models.moneyChange, 'company.')
export class MoneyChange extends ModelObject {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): MoneyChange { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get companyId(): string { return null; }
    set companyId(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): number { return 0; }
    set status(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get money(): number { return 0; }
    set money(val: number) {}

    @Field({type: Types.INTEGER})
    get channel(): number { return 0; }
    set channel(val: number) {}

    @Field({type: Types.UUID})
    get userId(): string { return null; }
    set userId(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}
}