/**
 * Created by wlh on 2016/10/19.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Values, Types} from "common/model/index";
import {EPlanStatus, ETripType, TripPlan} from "./tripPlan";
import {Field, Table, TableExtends} from "common/model/common";
import {Models} from "../index";
import {TripDetail} from "./tripDetail";


enum ECabin {
    PLANE_FIRST = 1,
    PLANE_BUSINESS = 2,
    PLANE_ECONOMY = 4,
    TRAIN_FIRST = 11,
    TRAIN_SECOND = 12,
}

@TableExtends(TripDetail, 'tripDetailInfo', 'type', 1)
@Table(Models.tripDetailTraffic, "tripPlan.")
export class TripDetailTraffic extends ModelObject implements TripDetail {
    constructor(target) {
        super(target);
    }

    @Field({type: Types.UUID})
    get id() : string {return Values.UUIDV1()}
    set id(id: string) {}

    //出发时间
    @Field({type: Types.DATE})
    get deptDateTime() :Date {return null;}
    set deptDateTime(d: Date) {}

    //最晚到达时间
    @Field({type: Types.DATE})
    get arrivalDateTime() :Date { return null;}
    set arrivalDateTime(d: Date) {}

    @Field({type: Types.INTEGER})
    get cabin() :ECabin {return null}
    set cabin(cabin: ECabin) {}

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
}

@TableExtends(TripDetail, 'tripDetailInfo', 'type', 2)
@Table(Models.tripDetailHotel, 'tripPlanrs.')
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
}

@TableExtends(TripDetail, 'tripDetailInfo', 'type', 3)
@Table(Models.tripDetailSubsidy, 'tripPlan.')
export class TripDetailSubsidy extends ModelObject implements TripDetail {
    constructor(target) {
        super(target);
    }

    @Field({type: Types.UUID})
    get id() :string { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.BOOLEAN})
    get isIncFirstDay(): boolean { return true}
    set isIncFirstDay(b: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isIncLastDay(): boolean { return true}
    set isIncLastDay(b: boolean) {}

    @Field({type: Types.INTEGER})
    get days() {return 1}
    set days(d: number) {}

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
}