import { Models } from 'api/_types';
import { Company } from 'api/_types/company';
import { TripPlan } from 'api/_types/tripPlan';
import { regApiType } from 'common/api/helper';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Department } from 'api/_types/department';
import { ModelObject, Table, Field, Types, ResolveRef, Reference } from 'common/model';
import { Create } from 'common/model';

export enum EStaffStatus {
    ON_JOB = 0,
    QUIT_JOB = -1,
    DELETE = -2
}
export enum EStaffRole {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2,
    FINANCE = 3
}

export enum EGender {
    MALE = 1,
    FEMALE
};

function enumValues(e){
    return Object.keys(e).map((k)=>e[k]).filter((v)=>(typeof v != 'number'));
}

@Table(Models.staff, "staff.")
@regApiType('API.')
export class Staff extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): Staff { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}
    // '员工名称'
    @Field({type: Types.STRING(50)})
    get name(): string { return null; }
    set name(val: string) {}
    // '性别'
    @Field({type: Types.INTEGER, defaultValue: EGender.MALE})
    get sex(): EGender { return EGender.MALE; }
    set sex(val: EGender) {}
    // '员工头像'
    @Field({type: Types.TEXT})
    get avatar(): string { return ''; }
    set avatar(val: string) {}
    //状态
    @Field({type: Types.INTEGER})
    get status(): EStaffStatus { return 0; }
    set status(val: EStaffStatus) {}
    // '员工总获取的积分'
    @Field({type: Types.INTEGER})
    get totalPoints(): number { return 0; }
    set totalPoints(val: number) {}
    // '员工剩余积分'
    @Field({type: Types.INTEGER})
    get balancePoints(): number { return 0; }
    set balancePoints(val: number) {}
    // '权限'
    @Field({type: Types.INTEGER})
    get roleId(): EStaffRole { return null; }
    set roleId(val: EStaffRole) {}
    // '邮箱'
    @Field({type: Types.STRING(50)})
    get email(): string { return ''; }
    set email(val: string) {}
    // '手机'
    @Field({type: Types.STRING(20)})
    get mobile(): string { return ''; }
    set mobile(val: string) {}
    // '操作人id'
    @Field({type: Types.UUID})
    get operatorId(): string { return null; }
    set operatorId(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}

    @ResolveRef({type: Types.UUID}, Models.department)
    get department(): Department { return null; }
    set department(val: Department) {}

    @Reference({type: Types.UUID}, 'travelLevel')
    getTravelPolicy(id?:string): Promise<TravelPolicy> {
        return Models.travelPolicy.get(id);
    }
    setTravelPolicy(val: TravelPolicy) {}
}

@Table(Models.credential, "staff.")
@regApiType('API.')
export class Credential extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): Credential { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.INTEGER, defaultValue: 0})
    get type(): number {return 0}
    set type(type: number){}

    @Field({type: Types.STRING(50)})
    get idNo(): string {return null}
    set idNo(idNo: string){}

    @Field({type: Types.DATE})
    get birthday(): Date {return null}
    set birthday(birthday: Date){}

    @Field({type: Types.DATE})
    get validData(): Date {return null}
    set validData(validData: Date){}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get owner(): Staff { return null; }
    set owner(val: Staff) {}
}

@Table(Models.pointChange, "staff.")
@regApiType('API.')
export class PointChange extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): PointChange { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }

    @Reference({type: Types.UUID})
    getCompany(id?:string): Promise<Company> {
        return Models.company.get(id);
    }

    @Reference({type: Types.UUID}, 'orderId')
    getTripPlan(id?:string): Promise<TripPlan> {
        return Models.tripPlan.get(id);
    }

    @Field({type: Types.INTEGER, defaultValue: 1})
    get status(): number {return 1}
    set status(status: number){}

    @Field({type: Types.INTEGER})
    get points(): number {return null}
    set points(points: number){}

    @Field({type: Types.INTEGER})
    get currentPoint(): number {return null}
    set currentPoint(currentPoint: number){}

    @Field({type: Types.TEXT})
    get remark(): string {return null}
    set remark(remark: string){}

}

