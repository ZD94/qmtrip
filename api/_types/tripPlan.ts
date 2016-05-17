
import { Models } from 'api/_types';
import { regApiType } from 'common/api/helper';
import { ModelObject, Table, Field, Types, ResolveRef, Reference } from 'common/model';
import {now} from 'common/utils'
import {Staff} from 'api/_types/staff';
import {Company} from 'api/_types/company';
import { Create } from 'common/model.client';

export enum EPlanStatus {
    DELETE = -2, //删除
    NO_BUDGET = -1, //没有预算
    WAIT_UPLOAD = 0, //待上传票据
    NO_COMMIT = 0, //待提交状态
    COMMIT = 1, //已提交待审核状态
    COMPLETE = 2 //审核完，已完成状态
};

export enum ETripType {
    OUT_TRIP = 0, //去程
    BACK_TRIP = 1,
    HOTEL = 2
}

export enum EInvoiceType {
    TRAIN = 0,
    PLANE = 1,
    HOTEL = 2
};

@Table(Models.project, 'tripPlan.')
@regApiType('API.')
export class Project extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): Project { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get companyId(): string { return null; }
    set companyId(val: string) {}

    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    @Field({type: Types.STRING})
    get code(): string { return ''; }
    set code(val: string) {}

}

@Table(Models.tripPlan, 'tripPlan.')
@regApiType('API.')
export class TripPlan extends ModelObject {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): TripPlan { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.STRING})
    get planNo(): string { return ''; }
    set planNo(val: string) {}

    @Field({type: Types.BOOLEAN})
    get isInvoiceUpload(): boolean { return false; }
    set isInvoiceUpload(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isCommit(): boolean { return false; }
    set isCommit(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isNeedTraffic(): boolean { return false; }
    set isNeedTraffic(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isNeedHotel(): boolean { return false; }
    set isNeedHotel(val: boolean) {}

    @Field({type: Types.STRING})
    get title(): string { return ''; }
    set title(val: string) {}

    @Field({type: Types.STRING})
    get description(): string { return ''; }
    set description(val: string) {}

    @Field({type: Types.STRING})
    get deptCity(): string { return ''; }
    set deptCity(val: string) {}

    @Field({type: Types.STRING})
    get arrivalCity(): string { return ''; }
    set arrivalCity(val: string) {}

    @Field({type: Types.STRING})
    get deptCityCode(): string { return ''; }
    set deptCityCode(val: string) {}

    @Field({type: Types.STRING})
    get arrivalCityCode(): string { return ''; }
    set arrivalCityCode(val: string) {}

    @Field({type: Types.DATE})
    get startAt(): Date { return null; }
    set startAt(val: Date) {}

    @Field({type: Types.DATE})
    get backAt(): Date { return null; }
    set backAt(val: Date) {}

    @Field({type: Types.DOUBLE})
    get budget(): number { return 0; }
    set budget(val: number) {}

    @Field({type: Types.DOUBLE})
    get expenditure(): number { return 0; }
    set expenditure(val: number) {}


    @Field({type: Types.JSONB})
    get expendInfo(): Object { return null; }
    set expendInfo(val: Object) {}

    @Field({type: Types.STRING})
    get auditRemark(): string { return ''; }
    set auditRemark(val: string) {}

    @Field({type: Types.INTEGER})
    get score(): number { return 0; }
    set score(val: number) {}

    @Field({type: Types.DATE})
    get expireAt(): Date { return null; }
    set expireAt(val: Date) {}

    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}

    @Field({type: Types.DATE})
    get commitTime(): Date { return null; }
    set commitTime(val: Date) {}

    @ResolveRef({type: Types.UUID}, Models.project)
    get project(): Project { return null; }
    set project(val: Project) {}

    @Reference({type: Types.UUID}, 'accountId')
    getStaff(id?:string): Promise<Staff> {
        return Models.staff.get(id);
    }

    @Reference({type: Types.UUID})
    getCompany(id?:string): Promise<Company> {
        return Models.company.get(id);
    }
    setCompany(val: Company) {}

    getOutTrip(id?: string): Promise<TripDetail[]> {
        return Models.tripDetail.find({tripPlanId: id||this.id, type: ETripType.OUT_TRIP});
    }

    getBackTrip(id?: string): Promise<TripDetail[]> {
        return Models.tripDetail.find({tripPlanId: id||this.id, type: ETripType.BACK_TRIP});
    }

    getHotel(id?: string): Promise<TripDetail[]> {
        return Models.tripDetail.find({tripPlanId: id||this.id, type: ETripType.HOTEL});
    }
}

@Table(Models.tripDetail, 'tripPlan.')
@regApiType('API.')
export class TripDetail extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): TripDetail { return null; }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get tripPlanId(): string { return null; }
    set tripPlanId(val: string) {}

    @Field({type: Types.UUID})
    get accountId(): string { return null; }
    set accountId(val: string) {}

    @Field({type: Types.INTEGER})
    get type(): ETripType { return 0; }
    set type(val: ETripType) {}

    @Field({type: Types.INTEGER})
    get status(): ETripType { return 0; }
    set status(val: ETripType) {}

    @Field({type: Types.STRING})
    get deptCity(): string { return ''; }
    set deptCity(val: string) {}

    @Field({type: Types.STRING})
    get arrivalCity(): string { return ''; }
    set arrivalCity(val: string) {}

    @Field({type: Types.STRING})
    get deptCityCode(): string { return ''; }
    set deptCityCode(val: string) {}

    @Field({type: Types.STRING})
    get arrivalCityCode(): string { return ''; }
    set arrivalCityCode(val: string) {}

    @Field({type: Types.STRING})
    get city(): string { return ''; }
    set city(val: string) {}

    @Field({type: Types.STRING})
    get CityCode(): string { return ''; }
    set CityCode(val: string) {}

    @Field({type: Types.STRING})
    get hotelName(): string { return ''; }
    set hotelName(val: string) {}

    @Field({type: Types.STRING})
    get invoice(): string { return ''; }
    set invoice(val: string) {}

    @Field({type: Types.STRING})
    get newInvoice(): string { return ''; }
    set newInvoice(val: string) {}

    @Field({type: Types.STRING})
    get auditRemark(): string { return ''; }
    set auditRemark(val: string) {}

    @Field({type: Types.UUID})
    get auditUser(): string { return null; }
    set auditUser(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return null; }
    set remark(val: string) {}

    @Field({type: Types.BOOLEAN})
    get isCommit(): boolean { return false; }
    set isCommit(val: boolean) {}

    @Field({type: Types.DATE})
    get startTime(): Date { return null; }
    set startTime(val: Date) {}

    @Field({type: Types.DATE})
    get endTime(): Date { return null; }
    set endTime(val: Date) {}

    @Field({type: Types.DATE})
    get latestArriveTime(): Date { return null; }
    set latestArriveTime(val: Date) {}

    @Field({type: Types.DATE})
    get commitTime(): Date { return null; }
    set commitTime(val: Date) {}

    @Field({type: Types.DOUBLE})
    get budget(): number { return 0; }
    set budget(val: number) {}

    @Field({type: Types.DOUBLE})
    get expenditure(): number { return 0; }
    set expenditure(val: number) {}

    @Field({type: Types.INTEGER})
    get invoiceType(): number { return 0; }
    set invoiceType(val: number) {}

    @ResolveRef({type: Types.UUID}, Models.tripPlan)
    get tripPlan(): TripPlan { return null; }

}