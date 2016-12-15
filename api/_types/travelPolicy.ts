import {Models} from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import {underline} from "colors/safe";

export var  MTrainLevel  = {
    1: "商务座",
    2: "一等座",
    3: "二等座",
    4: '特等座',
    5: '高级软卧',
    6: '软卧',
    7: '硬卧',
    8: '软座',
    9: '硬座',
    10: '无座'
}

export enum ETrainLevel {
    // BUSINESS = 1,
    // FIRST_CLASS = 2,
    // SECOND_CLASS = 3,
    BUSINESS_SEAT = 1,
    FIRST_SEAT = 2,
    SECOND_SEAT = 3,
    PRINCIPAL_SEAT = 4,
    SENIOR_SOFT_SLEEPER = 5,
    SOFT_SLEEPER = 6,
    HARD_SLEEPER = 7,
    SOFT_SEAT = 8,
    HARD_SEAT = 9,
    NO_SEAT = 10,
}

export function enumTrainLevelToStr(trainLevels: ETrainLevel[]) :string {
    if (!trainLevels) return '';
    return trainLevels.map( (trainLevel) => {
        return MTrainLevel[trainLevel]
    }).join("、")
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

export function enumHotelLevelToStr(hotelLevels: EHotelLevel[]) :string {
    if (!hotelLevels) return '';
    return hotelLevels.map( (hotelLevel) => {
        return MHotelLevel[hotelLevel];
    }).join("、")
}

export function enumHotelsFormat(hotelLevels: EHotelLevel[]) :Array<{name: string, value: EHotelLevel}> {
    if (!hotelLevels) return [];
    return hotelLevels.map( (v) => {
        return {name: MHotelLevel[v], value: v};
    })
}

export var  MPlaneLevel  = {
    // 1: "公务舱/头等舱",
    2: "经济舱",
    3: '头等舱',
    4: '商务舱',
    5: '高端商务舱',
}

export enum EPlaneLevel {
    // BUSINESS_FIRST = 1,
    ECONOMY = 2,
    FIRST = 3,
    BUSINESS = 4,
    PREMIUM_ECONOMY = 5,    //高端经济仓
}


export function enumPlaneLevelToStr(planeLevels: EPlaneLevel[]) :string {
    if (!planeLevels) return '';
    return planeLevels.map( (planeLevel) => {
        return MPlaneLevel[planeLevel];
    }).join('、')
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

    @Field({type: Types.ARRAY(Types.INTEGER)})
    get planeLevels(): EPlaneLevel[] {return null}
    set planeLevel(val: EPlaneLevel[]){}

    @Field({type: Types.DOUBLE})
    get planeDiscount(): number{return null}
    set planeDiscount(planeDiscount: number){}

    @Field({type: Types.ARRAY(Types.INTEGER)})
    get trainLevels(): ETrainLevel {return null}
    set trainLevel(val: ETrainLevel){}

    @Field({type: Types.ARRAY(Types.INTEGER)})
    get hotelLevels(): EHotelLevel {return null}
    set hotelLevel(val: EHotelLevel){}


    @Field({type: Types.DOUBLE})
    get hotelPrice(): number {return null}
    set hotelPrice(hotelPrice: number){}
    
    @Field({type: Types.NUMERIC(15, 2)})
    get subsidy(): number {return 0}
    set subsidy(subsidy: number){}

    @Field({type: Types.BOOLEAN})
    get isChangeLevel(): boolean {return null}
    set isChangeLevel(isChangeLevel: boolean){}
    
    @Field({type: Types.BOOLEAN})
    get isDefault(): boolean {return false}
    set isDefault(isDefault: boolean){}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}
    
    @Field({type: Types.BOOLEAN})
    get isOpenAbroad() : boolean { return false}
    set isOpenAbroad(b: boolean) {}
    
    @Field({type: Types.ARRAY(Types.INTEGER)})   //国际机票
    get abroadPlaneLevels() :EPlaneLevel[] { return null}
    set abroadPlaneLevel(planeLevel: EPlaneLevel[]) {}
    
    @Field({type: Types.ARRAY(Types.INTEGER)})   //国际火车
    get abroadTrainLevels() :ETrainLevel[] { return null;}
    set abroadTrainLevel(trainLevel: ETrainLevel[]) {}

    @Field({type: Types.ARRAY(Types.INTEGER)})   //国际酒店
    get abroadHotelLevels() :EHotelLevel[] { return null}
    set abroadHotelLevel(hotelLevel: EHotelLevel[]) {}

    async getStaffs(): Promise<Staff[]> {
        let query = {where: {companyId: this.company.id, travelPolicyId: this.id}};
        return Models.staff.find(query);
    }

    async getSubsidyTemplates(): Promise<SubsidyTemplate[]> {
        let query = { where: {travelPolicyId: this.id}};
        return Models.subsidyTemplate.find(query);
    }
}

@Table(Models.subsidyTemplate, "travelPolicy.")
export class SubsidyTemplate extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): SubsidyTemplate { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    //补助金额
    @Field({type: Types.NUMERIC(15, 2)})
    get subsidyMoney(): number{return null}
    set subsidyMoney(value: number){}

    //模板名称
    @Field({type: Types.STRING(50)})
    get name(): string { return null; }
    set name(val: string) {}

    //所属差旅标准
    @ResolveRef({type: Types.UUID}, Models.travelPolicy)
    get travelPolicy(): Company { return null; }
    set travelPolicy(val: Company) {}

    @Field({type: Types.BOOLEAN})
    get isInternal() { return false;}
    set isInternal(b: boolean) {}
}