/**
 * Created by wlh on 2016/10/19.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Values, Types} from "common/model/index";
import {EPlanStatus, ETripType, TripPlan} from "./tripPlan";
import {Field, Create, ResolveRef, Table} from "common/model/common";
import {Models} from "../index";
import {EInvoiceFeeTypes} from "./index";


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

    // @Field({type: Types.STRING})
    // get deptCity(): string { return ''; }
    // set deptCity(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get arrivalCity(): string { return ''; }
    // set arrivalCity(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get deptCityCode(): string { return ''; }
    // set deptCityCode(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get arrivalCityCode(): string { return ''; }
    // set arrivalCityCode(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get city(): string { return ''; }
    // set city(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get cityCode(): string { return ''; }
    // set cityCode(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get hotelCode(): string { return ''; }
    // set hotelCode(val: string) {}
    //
    // @Field({type: Types.STRING})
    // get hotelName(): string { return ''; }
    // set hotelName(val: string) {}
    //
    // @Field({type: Types.JSONB})
    // get invoice(): any { return []; }
    // set invoice(val: any) {}
    //
    // @Field({type: Types.JSONB})
    // get latestInvoice(): any { return []; }
    // set latestInvoice(val: any) {}
    //
    // @Field({type: Types.STRING})
    // get newInvoice(): string { return ''; }
    // set newInvoice(val: string) {}

    @Field({type: Types.STRING})
    get auditRemark(): string { return ''; }
    set auditRemark(val: string) {}

    @Field({type: Types.UUID})
    get auditUser(): string { return null; }
    set auditUser(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return null; }
    set remark(val: string) {}

    // @Field({type: Types.BOOLEAN})
    // get isCommit(): boolean { return false; }
    // set isCommit(val: boolean) {}

    // @Field({type: Types.DATE})
    // get startTime(): Date { return null; }
    // set startTime(val: Date) {}
    //
    // @Field({type: Types.DATE})
    // get endTime(): Date { return null; }
    // set endTime(val: Date) {}
    //
    // @Field({type: Types.DATE})
    // get latestArriveTime(): Date { return null; }
    // set latestArriveTime(val: Date) {}

    // @Field({type: Types.DATE})
    // get commitTime(): Date { return null; }
    // set commitTime(val: Date) {}

    @Field({type: Types.DOUBLE})
    get budget(): number { return 0; }
    set budget(val: number) {}

    @Field({type: Types.DOUBLE})
    get expenditure(): number { return 0; }
    set expenditure(val: number) {}

    // @Field({type: Types.INTEGER})
    // get invoiceType(): EInvoiceType { return 0; }
    // set invoiceType(val: EInvoiceType) {}

    // @Field({type: Types.STRING})
    // get cabinClass(): string { return ''; }
    // set cabinClass(val: string) {}
    //
    // @Field({type: Types.DOUBLE})
    // get fullPrice(): number { return null; }
    // set fullPrice(val: number) {}

    @ResolveRef({type: Types.UUID}, Models.tripPlan)
    get tripPlan(): TripPlan { return null; }
    set tripPlan(val: TripPlan) {}

    // getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
    //     let self = this;
    //     return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
    // }

    // editBudget(params: {budget: number}): Promise<boolean> {
    //     //    f3ac3f50-2c70-11e6-bb82-8dd809b99199
    //     return API.tripPlan.editTripDetailBudget({id: this.id, budget: params.budget});
    // }
    //
    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }
    //
    // async auditPlanInvoice(params: {auditResult: EAuditStatus, reason?: string, expenditure?: number}): Promise<boolean> {
    //     if(!this.isLocal){
    //         API.require('tripPlan');
    //         await API.onload();
    //     }
    //     params['id'] = this.id;
    //     return API.tripPlan.auditPlanInvoice(params);
    // }
}



@Table(Models.tripDetailInvoice, "tripPlan.")
export class TripDetailInvoice extends ModelObject {
    constructor(target) {
        super(target)
    }
    @Create()
    static create(obj?: Object): TripDetailInvoice { return null; }

    @Field({type: Types.UUID})
    get id() { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.UUID})
    get tripDetailId() { return null}
    set tripDetailId(tripDetailId: string) {}

    @Field({type: Types.TEXT})
    get pictureFileId() { return null}
    set pictureFileId(pictureFileId: string) {}

    //票据类型
    @Field({type: Types.INTEGER})
    get type() :EInvoiceFeeTypes { return null}
    set type(type: EInvoiceFeeTypes) {}

    //金额
    @Field({type: Types.NUMERIC(15, 2)})
    get totalMoney() { return 0}
    set totalMoney(totalMoney: number) {}

    //用户提交时备注
    @Field({type: Types.TEXT})
    get remark() { return null}
    set remark(remark: string) {}

    //审核状态
    @Field({type: Types.INTEGER})
    get status() { return 0}
    set status(status: number) {}

    //审核失败时备注
    @Field({type: Types.TEXT})
    get auditRemark(): string { return null }
    set auditRemark(auditRemark: string) {}

    @Field({type: Types.INTEGER})
    get times(): number { return 0}
    set times(times: number) {}

    @Field({type: Types.DATE})
    get approveAt(): Date { return null}
    set approveAt(approveAt: Date) {}
}