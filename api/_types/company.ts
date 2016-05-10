'use strict';
import { Models, ModelObject } from 'api/_types';
import {Staff} from 'api/_types/staff';
import * as apiCompany from 'api/client/company';
import { regApiType } from 'common/api/helper';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

export enum COMPANY_STATUS {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

export enum ECompanyStatus {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}


@Table()
@regApiType('API.')
export class Company implements ModelObject{
    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    // '代理商id'
    @Field({type: Types.UUID})
    get agencyId(): string { return null; }
    set agencyId(val: string) {}

    // '企业编号'
    @Field({type: Types.STRING(30)})
    get companyNo(): string { return ''; }
    set companyNo(val: string) {}

    // '创建人id'
    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    // '企业名称'
    @Field({type: Types.STRING})
    get name(): string { return ''; }
    set name(val: string) {}

    // '企业域名'
    @Field({type: Types.STRING})
    get domainName(): string { return ''; }
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
    get email(): string { return ''; }
    set email(val: string) {}

    // '创建人手机号'
    @Field({type: Types.STRING})
    get mobile(): string { return ''; }
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

    @ResolveRef({type: Types.UUID}, Models.agency.get)
    get agency(): Company { return null; }

    @Reference({type: Types.UUID}, 'staffs')
    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({});
    }

    @Update(Models.company.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.company.destroy)
    destroy(): Promise<void> { return null; }
}