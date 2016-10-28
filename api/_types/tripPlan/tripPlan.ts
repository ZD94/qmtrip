
import { Models } from 'api/_types';
import { Staff} from 'api/_types/staff';
import { Company} from 'api/_types/company';
import { Types, Values } from 'common/model';
import {Table, Create, Field, ResolveRef, Reference, TableIndex, TableExtends} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import {PaginateInterface} from "common/model/interface";
import {TripDetail} from "./";

declare var API: any;

export enum EPlanStatus {
    CANCEL = -4, //出差计划撤销状态
    AUDIT_NOT_PASS = -3, //票据未审核通过
    // APPROVE_NOT_PASS = -2, //审批未通过
    NO_BUDGET = -1, //没有预算
    // WAIT_APPROVE = 0, //待审批状态
    WAIT_UPLOAD = 1, //待上传票据
    WAIT_COMMIT = 2, //待提交状态
    AUDITING = 3, //已提交待审核状态
    COMPLETE = 4 //审核完，已完成状态
}

export enum EApproveStatus {
    CANCEL = -3, //撤销状态
    NO_BUDGET = -2, //没有预算
    REJECT = -1, //审批驳回
    WAIT_APPROVE = 0, //待审批
    PASS = 1 //审批通过
}

export const EApproveStatus2Text: {[index: number]: string} = {
    [EApproveStatus.CANCEL]: '已撤销',
    [EApproveStatus.NO_BUDGET]: '没有预算',
    [EApproveStatus.PASS]: '审批通过',
    [EApproveStatus.REJECT]: '审批驳回',
    [EApproveStatus.WAIT_APPROVE]: '等待审批',
};

export enum EApproveResult {
    NULL = -1,
    WAIT_APPROVE = 0, //等待审批
    AUTO_APPROVE = 1, //自动审批
    PASS = 2, //审批通过
    REJECT = 3 //驳回
}

export const EApproveResult2Text: {[index: number]: string} = {
    [EApproveResult.AUTO_APPROVE]: '自动通过',
    [EApproveResult.PASS]: '审批通过',
    [EApproveResult.REJECT]: '审批驳回',
    [EApproveResult.WAIT_APPROVE]: '提交审批',
};

export enum ETripType {
    OUT_TRIP = 0, //去程
    BACK_TRIP = 1,
    HOTEL = 2,
    SUBSIDY = 3,
    SPECIAL_APPROVE = 4
}

export enum EInvoiceType {
    TRAIN = 0,
    PLANE = 1,
    HOTEL = 2,
    SUBSIDY = 3,
    SPECIAL_APPROVE = 4
}

export enum  EAuditStatus {
    INVOICE_NOT_PASS = -2, //票据未审核通过
    NOT_PASS = -1, //审批未通过
    AUDITING = 0, //审批中
    PASS = 1, //审批通过，待审核
    INVOICE_PASS = 2, //票据审核通过
}

export var  MTxPlaneLevel  = {
    'Economy': "经济舱",
    'PremiumEconomy': "公务舱",
    'Business': "公务舱",
    'First': "公务舱",
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

    @Field({type: Types.INTEGER})
    get weight(): number { return 0; }
    set weight(val: number) {}
}


@Table(Models.tripPlan, 'tripPlan.')
@TableIndex('accountId')
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
    get isRoundTrip() :boolean { return true; }
    set isRoundTrip(bool: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isNeedHotel(): boolean { return false; }
    set isNeedHotel(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isSpecialApprove(): boolean { return false; }
    set isSpecialApprove(val: boolean) {}

    @Field({type: Types.TEXT})
    get specialApproveRemark(): string { return ''; }
    set specialApproveRemark(val: string) {}

    @Field({type: Types.TEXT})
    get cancelRemark(): string { return ''; }
    set cancelRemark(val: string) {}

    @Field({ type: Types.JSONB})
    get query() : any { return null};
    set query(obj: any) {}

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
    get auditUser(): string { return null; }
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

    @Field({type: Types.DOUBLE})
    get originalBudget() : Number { return 0};
    set originalBudget(v: Number) {}

    @Field({type: Types.BOOLEAN})
    get isFinalBudget(): Boolean { return false; }
    set isFinalBudget(bool: Boolean) {}

    @Field({type: Types.DATE})
    get finalBudgetCreateAt() : Date { return null;}
    set finalBudgetCreateAt(d: Date) {};

    // @Field({type: Types.DATE})
    // get autoApproveTime() : Date { return null;}
    // set autoApproveTime(d: Date) {};

    @ResolveRef({type: Types.UUID}, Models.project)
    get project(): Project { return null; }
    set project(val: Project) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get account(): Staff { return null; }
    set account(val: Staff) {}

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

    async getTripDetails(options: {where?: any, limit?: number, order?: any}): Promise<PaginateInterface<TripDetail>> {
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
     * 提交出差计划
     * @returns {Promise<boolean>}
     */
    commit(): Promise<boolean> {
        return API.tripPlan.commitTripPlan({id: this.id});
    }

    async cancel(params: {remark: string}): Promise<boolean> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        var obj : any= {};
        obj.id = this.id;
        if(params && params.remark){
            obj.remark = params.remark;
        }
        return API.tripPlan.cancelTripPlan(obj);
    }

    /**
     * 获取出差记录日志
     * @returns {Promise<FindResult>}
     */
    getLogs(options): Promise<PaginateInterface<TripPlanLog>> {
        if(!options) {
            options = {where: {}};
        }

        if(!options.where) {
            options.where = {};
        }

        options.where.tripPlanId = this.id;
        return Models.tripPlanLog.find(options);
    }

    async getOddBudget() {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.getOddBudget({id: this.id});
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

    @Field({type: Types.INTEGER})
    get approveStatus(): EApproveResult { return EApproveResult.NULL; }
    set approveStatus(val: EApproveResult) {}
}

@Table(Models.tripApprove, 'tripPlan.')
@TableIndex('accountId')
export class TripApprove extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TripApprove { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get accountId(): string { return null; }
    set accountId(val: string) {}

    @Field({type: Types.BOOLEAN})
    get isNeedTraffic(): boolean { return false; }
    set isNeedTraffic(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isRoundTrip() :boolean { return true; }
    set isRoundTrip(bool: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isNeedHotel(): boolean { return false; }
    set isNeedHotel(val: boolean) {}

    @Field({ type: Types.JSONB})
    get query() : any { return null};
    set query(obj: any) {}

    @Field({type: Types.STRING})
    get title(): string { return ''; }
    set title(val: string) {}

    @Field({type: Types.STRING})
    get description(): string { return ''; }
    set description(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): EApproveStatus { return EApproveStatus.WAIT_APPROVE; }
    set status(val: EApproveStatus) {}

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

    @Field({type: Types.TEXT})
    get approvedUsers(): string { return ''; }
    set approvedUsers(val: string) {}

    @Field({type: Types.BOOLEAN})
    get isSpecialApprove(): boolean { return false; }
    set isSpecialApprove(val: boolean) {}

    @Field({type: Types.TEXT})
    get specialApproveRemark(): string { return ''; }
    set specialApproveRemark(val: string) {}

    @Field({type: Types.TEXT})
    get cancelRemark(): string { return ''; }
    set cancelRemark(val: string) {}

    @Field({type: Types.DATE})
    get startAt(): Date { return null; }
    set startAt(val: Date) {}

    @Field({type: Types.DATE})
    get backAt(): Date { return null; }
    set backAt(val: Date) {}

    @Field({type: Types.DOUBLE})
    get budget(): number { return 0; }
    set budget(val: number) {}

    @Field({type: Types.JSONB})
    get budgetInfo(): any { return []; }
    set budgetInfo(val: any) {}

    @Field({type: Types.DATE})
    get autoApproveTime() : Date { return null;}
    set autoApproveTime(d: Date) {};

    @ResolveRef({type: Types.UUID}, Models.project)
    get project(): Project { return null; }
    set project(val: Project) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get account(): Staff { return null; }
    set account(val: Staff) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get approveUser(): Staff { return null; }
    set approveUser(val: Staff) {}

    @Field({type: Types.STRING})
    get approveRemark(): string { return ''; }
    set approveRemark(val: string) {}

    @Reference({type: Types.UUID})
    getCompany(id?:string): Promise<Company> {
        return Models.company.get(id);
    }
    setCompany(val: Company) {}


    /**
     * 审批人审批出差计划
     * @param params
     * @returns {Promise<boolean>}
     */
    approve(params: {auditResult: EAuditStatus, auditRemark?: string, budgetId?: string, id?: string}): Promise<boolean> {
        params.id = this.id;
        return API.tripPlan.approveTripPlan(params);
    }

    getApproveLogs(options?: any): Promise<PaginateInterface<TripPlanLog>> {
        if(!options) options = {where: {}};
        if(!options.where) options.where = {};
        options.where.tripPlanId = this.id;
        options.where.approveStatus = {$ne: EApproveResult.NULL};
        options.order = [['created_at', 'desc']];
        return Models.tripPlanLog.find(options);
    }

    async cancel(params: {remark?: string}): Promise<boolean> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        var obj : any= {};
        obj.id = this.id;
        if(params && params.remark){
            obj.remark = params.remark;
        }
        return API.tripPlan.cancelTripApprove(obj);
    }
}

@Table(Models.financeCheckCode, 'tripPlan.')
export class FinanceCheckCode extends ModelObject {
    constructor(target: Object) {
        super(target);
    }

    @Create()
    static create(obj?: Object): TripApprove { return null; }

    @Field({type: Types.UUID})
    get id() :string {return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.UUID})
    get tripPlanId(): string { return null};
    set tripPlanId(id: string) {}

    @Field({type: Types.STRING(50)})
    get code(): string {return getRndCode(6);}
    set code(code: string) {}

    @Field({type: Types.BOOLEAN})
    get isValid() : boolean { return true}
    set isValid(b: boolean) {}
}

function getRndCode(length) {
    let ret = ''
    for(let i=0; i < length; i++) {
        ret += Math.floor(Math.random() * 10);
    }
    return ret;
}