import { Models, ModelObject } from 'api/_types';
import { Company } from 'api/_types/company';
import { regApiType } from 'common/api/helper';
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

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

@Table("staff.Staff")
@regApiType('API.')
export class Staff implements ModelObject{
    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

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

    @ResolveRef({type: Types.UUID}, Models.company.get)
    get company(): Company { return null; }

    @ResolveRef({type: Types.UUID}, Models.department.get)
    get department(): Department { return null; }
    set department(val: Department) {}

    @Reference({type: Types.UUID}, 'travelLevel')
    getTravelPolicy(id?:string): Promise<TravelPolicy> {
        return Models.travelPolicy.get(id);
    }
    setTravelPolicy(val: TravelPolicy) {}

    @Update(Models.staff.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.staff.destroy)
    destroy(): Promise<void> { return null; }
}

@Table("Credentials", {tableName : "papers", schema : "staff"})
@regApiType('API.')
export class Credentials implements ModelObject{
    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

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

    @Field({type: Types.UUID})
    get ownerId(): string { return null; }
    set ownerId(val: string) {}

    @Update(Models.staff.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.staff.destroy)
    destroy(): Promise<void> { return null; }
}

@regApiType('API.')
export class PointChange {
    id: string;
    companyId: string;
    staffId: string;
    orderId: string;
    status: number;
    points: number;
    currentPoint: number;
    remark: string;
    createAt: Date;

    constructor(obj: any) {
        this.id = obj.id;
        this.companyId = obj.companyId;
        this.staffId = obj.staffId;
        this.orderId = obj.orderId;
        this.status = obj.status;
        this.points = obj.points;
        this.currentPoint = obj.currentPoint;
        this.remark = obj.remark;
        this.createAt = obj.createAt;
    }
}

