/**
 * Created by wlh on 2016/10/19.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Values, Types} from "common/model/index";
import {EPlanStatus, ETripType, TripPlan, EInvoiceType, EAuditStatus} from "./tripPlan";
import {Field, Table, TableExtends, RemoteCall} from "common/model/common";
import {Models} from "../index";
import {TripDetail, TripDetailInvoice} from "./tripDetail";
import {PaginateInterface} from "common/model/interface";
import {ReserveLink} from 'libs/suppliers/interface';
import {ETrainLevel, EPlaneLevel} from "../travelPolicy";
declare var API: any;

@TableExtends(TripDetail, 'tripDetailInfo', 'type', [ETripType.OUT_TRIP, ETripType.BACK_TRIP])
@Table(Models.tripDetailTraffic, "tripPlan.")
export class TripDetailTraffic extends ModelObject implements TripDetail {
    constructor(target) {
        super(target);
    }

    @Field({type: Types.UUID})
    get id() : string {return Values.UUIDV1()}
    set id(id: string) {}

    //出发时间(发车或起飞时间)
    @Field({type: Types.DATE})
    get deptDateTime() :Date {return null;}
    set deptDateTime(d: Date) {}

    //最晚到达时间（到达时间）
    @Field({type: Types.DATE})
    get arrivalDateTime() :Date { return null;}
    set arrivalDateTime(d: Date) {}

    //预算出发时间
    @Field({type: Types.DATE})
    get leaveDate() :Date { return null;}
    set leaveDate(d: Date) {}

    @Field({type: Types.INTEGER})
    get cabin() :ETrainLevel|EPlaneLevel {return null}
    set cabin(cabin: ETrainLevel|EPlaneLevel) {}

    @Field({type: Types.INTEGER})
    get invoiceType() :EInvoiceType{ return null}
    set invoiceType(type: EInvoiceType) {}

    @Field({type: Types.STRING(10)})
    get deptCity() :string {return null}
    set deptCity(deptCity) {}

    @Field({type: Types.STRING(50)})
    get arrivalCity() :string {return null}
    set arrivalCity(arrivalCity) {}

    tripPlanId:string;
    accountId:string;
    type:ETripType;
    status:EPlanStatus;
    auditRemark:string;
    auditUser:string;
    remark:string;
    budget: number;
    expenditure:number;
    tripPlan:TripPlan;
    personalExpenditure: number;
    

    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }

    getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
        let self = this;
        return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
    }

    async auditPlanInvoice(params: {auditResult: EAuditStatus, reason?: string, expenditure?: number}): Promise<boolean> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        params['id'] = this.id;
        return API.tripPlan.auditPlanInvoice(params);
    }

    @RemoteCall()
    async getBookLink(params: {reserveType: string, supplierId: string}): Promise<ReserveLink> {
        var supplier = await Models.supplier.get(params.supplierId);
        return supplier.getBookLink({reserveType: params.reserveType, fromCity: this.deptCity, toCity: this.arrivalCity, leaveDate: this.deptDateTime})
    }
}

@TableExtends(TripDetail, 'tripDetailInfo', 'type', ETripType.HOTEL)
@Table(Models.tripDetailHotel, 'tripPlan.')
export class TripDetailHotel extends ModelObject implements TripDetail {
    constructor(target) {
        super(target);
    }

    @Field({type: Types.UUID})
    get id() : string {return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.DATEONLY})  //入住日期
    get checkInDate():Date { return null}
    set checkInDate(d: Date){}

    @Field({type: Types.DATEONLY})  //离开日期
    get checkOutDate(): Date { return null}
    set checkOutDate(d: Date) {}

    @Field({type: Types.STRING(20)})    //住宿城市
    get city(): string { return null}
    set city(city: string) {}

    @Field({type: Types.STRING(50)})    //酒店名称
    get name(): string { return null}
    set name(name: string) {}

    @Field({type: Types.STRING(50)})    //住宿地点
    get placeName(): string { return null}
    set placeName(placeName) {}

    @Field({type: Types.STRING(255)})   //定位地点
    get position(): string {return null}
    set position(p: string) {}

    tripPlanId:string;
    accountId:string;
    type:ETripType;
    status:EPlanStatus;
    auditRemark:string;
    auditUser:string;
    remark:string;
    budget: number;
    expenditure:number;
    tripPlan:TripPlan;
    personalExpenditure: number;
    
    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }

    getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
        let self = this;
        return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
    }

    async auditPlanInvoice(params: {auditResult: EAuditStatus, reason?: string, expenditure?: number}): Promise<boolean> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        params['id'] = this.id;
        return API.tripPlan.auditPlanInvoice(params);
    }

    @RemoteCall()
    async getBookLink(params: {reserveType: string, supplierId: string}): Promise<ReserveLink> {
        var supplier = await Models.supplier.get(params.supplierId);
        return supplier.getBookLink({reserveType: params.reserveType, city: this.city, leaveDate: this.checkInDate});
    }

}

@TableExtends(TripDetail, 'tripDetailInfo', 'type', ETripType.SUBSIDY)
@Table(Models.tripDetailSubsidy, 'tripPlan.')
export class TripDetailSubsidy extends ModelObject implements TripDetail {
    constructor(target) {
        super(target);
    }

    @Field({type: Types.UUID})
    get id() :string { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.BOOLEAN})
    get hasFirstDaySubsidy() { return true}
    set hasFirstDaySubsidy(b: boolean) {}

    @Field({type: Types.BOOLEAN})
    get hasLastDaySubsidy() { return true}
    set hasLastDaySubsidy(b: boolean) {}

    @Field({type: Types.DATE})
    get startDateTime(): Date {return null}
    set startDateTime(d: Date) {}

    @Field({type: Types.DATE})
    get endDateTime(): Date { return null}
    set endDateTime(d: Date) {}

    @Field({type: Types.NUMERIC(15,2)})
    get subsidyMoney() { return 0}
    set subsidyMoney(money: number) {}

    @Field({type: Types.UUID})
    get subsidyTemplateId() :string {return null}
    set subsidyTemplateId(id: string) {}

    tripPlanId:string;
    accountId:string;
    type:ETripType;
    status:EPlanStatus;
    auditRemark:string;
    auditUser:string;
    remark:string;
    budget: number;
    expenditure:number;
    tripPlan:TripPlan;
    personalExpenditure:number;

    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }

    getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
        let self = this;
        return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
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

@TableExtends(TripDetail, 'tripDetailInfo', 'type', ETripType.SPECIAL_APPROVE)
@Table(Models.tripDetailSpecial, 'tripPlan.')
export class TripDetailSpecial extends ModelObject implements TripDetail {
    
    constructor(target) {
        super(target);
    }
    
    @Field({type: Types.UUID})
    get id() : string { return Values.UUIDV1()}
    set id(id: string) {} 
    
    @Field({type: Types.STRING(50)})
    get deptCity() { return null}
    set deptCity(city: string) {}
    
    @Field({type: Types.STRING(50)})
    get arrivalCity() {return null}
    set arrivalCity(city: string) {}
    
    @Field({type: Types.DATE})
    get deptDateTime() :Date { return null}
    set deptDateTime(d: Date) {}
    
    @Field({type: Types.DATE})
    get arrivalDateTime(): Date {return null}
    set arrivalDateTime(d: Date) {}

    tripPlanId:string;
    accountId:string;
    type:ETripType;
    status:EPlanStatus;
    auditRemark:string;
    auditUser:string;
    remark:string;
    budget: number;
    expenditure:number;
    tripPlan:TripPlan;
    personalExpenditure:number;

    uploadInvoice(params): Promise<boolean> {
        return API.tripPlan.uploadInvoice({tripDetailId: this.id, pictureFileId: params.pictureFileId});
    }

    getInvoices() :Promise<PaginateInterface<TripDetailInvoice>> {
        let self = this;
        return Models.tripDetailInvoice.find({where: {tripDetailId: self.id}});
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