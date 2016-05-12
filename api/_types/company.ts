'use strict';
import { Models, ModelObject } from 'api/_types';
import {Staff} from 'api/_types/staff';
import {Agency} from 'api/_types/agency';
import { regApiType } from 'common/api/helper';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

export enum ECompanyStatus {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}


@Table('company.')
@regApiType('API.')
export class Company implements ModelObject{
    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

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


    @Reference({type: Types.UUID})
    getAgency(id?:string): Promise<Agency> {
        return Models.agency.get(id);
    }

    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({companyId: this.id});
    }

    @Update(Models.company.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.company.destroy)
    destroy(): Promise<void> { return null; }
}