
import {Models, isBrowser} from 'api/_types';
import {Staff} from 'api/_types/staff';
import {Company} from 'api/_types/company';
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef, Reference } from 'common/model/common';
import { ModelObject } from 'common/model/object';
declare var API: any;

export enum EPlanStatus {
    AUDIT_NOT_PASS = -2,
    NO_BUDGET = -1, //没有预算
    WAIT_UPLOAD = 0, //待上传票据
    WAIT_COMMIT = 1, //待提交状态
    AUDITING = 2, //已提交待审核状态
    COMPLETE = 3 //审核完，已完成状态
}

export enum ETripType {
    OUT_TRIP = 0, //去程
    BACK_TRIP = 1,
    HOTEL = 2,
    SUBSIDY = 3,
    OTHER = 4,
}

export enum EInvoiceType {
    TRAIN = 0,
    PLANE = 1,
    HOTEL = 2,
    OTHER = 3,
}

export enum  EAuditStatus {
    INVOICE_NOT_PASS = -2, //票据未审核通过
    NOT_PASS = -1, //审批未通过
    AUDITING = 0, //审批中
    PASS = 1, //审批通过，待审核
    INVOICE_PASS = 2, //票据审核通过
}

@Table(Models.project, 'tripPlan.')
export class Project extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Project { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
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

    @Field({type: Types.STRING})
    get name(): string { return ''; }
    set name(val: string) {}

}

@Table(Models.tripPlan, 'tripPlan.')
export class TripPlan extends ModelObject {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TripPlan { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
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

    @Field({type: Types.INTEGER})
    get status(): EPlanStatus { return 0; }
    set status(val: EPlanStatus) {}

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

    @Field({type: Types.INTEGER})
    get auditStatus(): EAuditStatus { return EAuditStatus.AUDITING; }
    set auditStatus(val: EAuditStatus) {}

    @Field({type: Types.STRING})
    get auditUser(): string { return ''; }
    set auditUser(val: string) {}
    
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

    getOutTrip(): Promise<TripDetail[]> {
        return Models.tripDetail.find({where: {tripPlanId: this.id, type: ETripType.OUT_TRIP}});
    }

    getBackTrip(): Promise<TripDetail[]> {
        return Models.tripDetail.find({where: {tripPlanId: this.id, type: ETripType.BACK_TRIP}});
    }

    getHotel(): Promise<TripDetail[]> {
        return Models.tripDetail.find({ where: {tripPlanId: this.id, type: ETripType.HOTEL}});
    }
    
    getTripDetails(options: {where?: any, limit?: number}): Promise<TripDetail[]> {
        if(!options) {
            options = {where: {}};
        }
        if(!options.where) {
            options.where = {};
        }
        options.where.tripPlanId = this.id;
        return Models.tripDetail.find(options);
    }

    /**
     * 审批人审批出差计划
     * @param params
     * @returns {Promise<boolean>}
     */
    audit(params: {auditResult: EAuditStatus, auditRemark?: string}): Promise<boolean> {
        params['id'] = this.id;
        return API.tripPlan.auditTripPlan(params);
    }

    /**
     * 提交出差计划
     * @returns {Promise<boolean>}
     */
    commit(): Promise<boolean> {
        return API.tripPlan.commitTripPlan({id: this.id});
    }
}

@Table(Models.tripDetail, 'tripPlan.')
export class TripDetail extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TripDetail { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
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
    get status(): EPlanStatus { return 0; }
    set status(val: EPlanStatus) {}

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

    @Field({type: Types.JSONB})
    get invoice(): any { return []; }
    set invoice(val: any) {}

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
    get invoiceType(): EInvoiceType { return 0; }
    set invoiceType(val: EInvoiceType) {}

    @ResolveRef({type: Types.UUID}, Models.tripPlan)
    get tripPlan(): TripPlan { return null; }
    set tripPlan(val: TripPlan) {}

    uploadInvoice(pictureFileId: string): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: pictureFileId});
    }

    approvePlanInvoice(params: {auditResult: EAuditStatus}): Promise<boolean> {
        params['id'] = this.id;
        return API.tripPlan.approvePlanInvoice(params);
    }
}

@Table(Models.tripPlanLog, 'tripPlan.')
export class TripPlanLog extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TripPlanLog { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get tripPlanId(): string { return null; }
    set tripPlanId(val: string) {}

    @Field({type: Types.UUID})
    get tripDetailId(): string { return null; }
    set tripDetailId(val: string) {}

    @Field({type: Types.UUID})
    get userId(): string { return null; }
    set userId(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return null; }
    set remark(val: string) {}

}