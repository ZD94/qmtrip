import {Models} from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';

export var  MTrainLevel  = {
    1: "商务座/高级软卧",
    2: "一等座/软卧",
    3: "二等座/硬卧"
}
export enum ETrainLevel {
    BUSINESS = 1,
    FIRST_CLASS = 2,
    SECOND_CLASS = 3
}
export var  MHotelLevel  = {
    5: "国际五星",
    4: "高端商务",
    3: "精品连锁",
    2: "快捷连锁"
}
export enum EHotelLevel {
    FIVE_STAR = 5,
    FOUR_STAR = 4,
    THREE_STAR = 3,
    TWO_STAR = 2
}
export var  MPlaneLevel  = {
    1: "公务舱/头等舱",
    2: "经济舱",
}
export enum EPlaneLevel {
    BUSINESS_FIRST = 1,
    ECONOMY = 2
}

@Table(Models.travelPolicy, "travelPolicy.")
export class TravelPolicy extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TravelPolicy { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get name(): string {return null}
    set name(name: string){}

    @Field({type: Types.INTEGER})
    get planeLevel(): EPlaneLevel {return null}
    set planeLevel(val: EPlaneLevel){}

    @Field({type: Types.FLOAT})
    get planeDiscount(): number{return null}
    set planeDiscount(planeDiscount: number){}

    @Field({type: Types.INTEGER})
    get trainLevel(): ETrainLevel {return null}
    set trainLevel(val: ETrainLevel){}

    @Field({type: Types.INTEGER})
    get hotelLevel(): EHotelLevel {return null}
    set hotelLevel(val: EHotelLevel){}

    @Field({type: Types.FLOAT})
    get hotelPrice(): number {return null}
    set hotelPrice(hotelPrice: number){}
    
    @Field({type: Types.NUMERIC(15, 2)})
    get subsidy(): number {return 0}
    set subsidy(subsidy: number){}

    @Field({type: Types.BOOLEAN})
    get isChangeLevel(): boolean {return null}
    set isChangeLevel(isChangeLevel: boolean){}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }

    getStaffs(): Promise<Staff[]> {
        let query = {where: {companyId: this.company.id, travelPolicyId: this.id}}
        return Models.staff.find(query);
    }
}
