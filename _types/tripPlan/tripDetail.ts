/**
 * Created by wlh on 2016/10/19.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Values, Types} from "common/model/index";
import {EPlanStatus, ETripType, TripPlan, EAuditStatus} from "./tripPlan";
import {Supplier} from "_types/company";
import {Field, Create, ResolveRef, Table} from "common/model/common";
import {Models} from "../index";
import {EInvoiceFeeTypes, EPayType, ESourceType, EInvoiceStatus} from "./index";
import {PaginateInterface} from "common/model/interface";
declare var API: any;

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
    get auditRemark(): string { return ''; }
    set auditRemark(val: string) {}

    @Field({type: Types.UUID})
    get auditUser(): string { return null; }
    set auditUser(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return null; }
    set remark(val: string) {}

    @Field({type: Types.DOUBLE})
    get budget(): number { return 0; }
    set budget(val: number) {}

    @Field({type: Types.DOUBLE})
    get expenditure(): number { return 0; }
    set expenditure(val: number) {}
    
    @Field({type: Types.NUMERIC(15, 2)})
    get personalExpenditure() : number { return 0}
    set personalExpenditure(expenditure: number) {}
    
    @ResolveRef({type: Types.UUID}, Models.tripPlan)
    get tripPlan(): TripPlan { return null; }
    set tripPlan(val: TripPlan) {}

    getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
        let self = this;
        return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
    }

    // editBudget(params: {budget: number}): Promise<boolean> {
    //     //    f3ac3f50-2c70-11e6-bb82-8dd809b99199
    //     return API.tripPlan.editTripDetailBudget({id: this.id, budget: params.budget});
    // }
    //
    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }

    async auditPlanInvoice(params: {auditResult: EAuditStatus, reason?: string, expenditure?: number}): Promise<boolean> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        params['id'] = this.id;
        return API.tripPlan.auditPlanInvoice(params);
    }
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

    @Field({type: Types.UUID})
    get accountId() { return null}
    set accountId(accountId: string) {}

    @ResolveRef({type: Types.UUID}, Models.supplier)
    get supplier(): Supplier { return null; }
    set supplier(val: Supplier) {}

    @Field({type: Types.STRING})
    get orderId() { return null}
    set orderId(orderId: string) {}

    @Field({type: Types.INTEGER})
    get sourceType() :ESourceType { return ESourceType.MANUALLY_ADD }
    set sourceType(payType: ESourceType) {}

    @Field({type: Types.TEXT})
    get pictureFileId() : string { return null}
    set pictureFileId(pictureFileId: string) {}

    //票据类型
    @Field({type: Types.INTEGER})
    get type() :EInvoiceFeeTypes { return null}
    set type(type: EInvoiceFeeTypes) {}

    @Field({type: Types.INTEGER})
    get payType() :EPayType { return EPayType.PERSONAL_PAY }
    set payType(payType: EPayType) {}

    @Field({type: Types.DATE})
    get invoiceDateTime() :Date { return null}
    set invoiceDateTime(invoiceDate: Date) {}
    
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
    get status() : EInvoiceStatus { return EInvoiceStatus.WAIT_AUDIT}
    set status(status: EInvoiceStatus) {}

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