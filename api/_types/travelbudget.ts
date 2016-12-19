/**
 * Created by wlh on 16/6/28.
 */

'use strict';

import {EInvoiceType, ETripType} from "../_types/tripPlan";
import {ModelObject} from "common/model/object";
import {Table, Create, Field} from "common/model/common";
import {Models} from "./index";
import {Types, Values} from "common/model";

export enum TRAFFIC {
    TRAIN = 0,
    FLIGHT = 1
}

export interface TravelBudgeItem {
    price: number;
    type?: EInvoiceType;
    tripType?: ETripType;
    id?: string;
}

export interface IFinalTicket {
    No: string;   //航班号或者车次
    departDateTime: string; //出发时间
    arrivalDateTime: string;    //到达时间
    originPlace: string;    //出发城市
    destination: string;    //目的地
    duration: number;
    originStation?: string; //出发机场或者车站
    destinationStation?: string;    //目的地机场或者车站
    type: TRAFFIC,
    agent: string;
    cabin: string;
    price: number;
    score?: number;
    reasons?: string[];
    stops?: string[];
}

//仓位信息
export interface ICabin {
    name: string;
    price: number;
    remainNum?: number;
}

//代理商
export interface IAgent {
    name: string;
    bookUrl?: string;    //预订链接
}

export interface IFlightAgent extends IAgent {
    cabins: Array<ICabin>
}

export interface ITicket {
    No: string;   //航班号或者车次
    agents: Array<IFlightAgent>,   //代理商
    departDateTime: string; //出发时间
    arrivalDateTime: string;    //到达时间
    originPlace: string;    //出发城市
    destination: string;    //目的地
    duration: number;
    originStation?: string; //出发机场或者车站
    destinationStation?: string;    //目的地机场或者车站
    type: TRAFFIC,
    stops?: string[],   //中转城市
}

//酒店代理商
export interface IHotelAgent extends IAgent{
    price: number;
}

//酒店
export interface IHotel {
    name: string;
    latitude: string;
    longitude: string;
    agents: Array<IHotelAgent>;
    star: string| number;
    checkInDate: string;
    checkOutDate: string;
}

export interface IFinalHotel {
    name: string;
    latitude: string;
    longitude: string;
    star: number;
    agent: string;
    price: number;
    bookUrl?: string;
    score?: number;
    reasons?: string[];
    checkInDate: string;
    checkOutDate: string;
    outPriceRange: boolean;
}

//记录预算分析数据及结果
@Table(Models.travelBudgetLog, "travelbudget.travel_budget_log")
export class TravelBudgetLog extends ModelObject {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TravelBudgetLog { return null; }

    @Field({type: Types.UUID})
    get id():string { return Values.UUIDV1()};
    set id(id: string) {}

    //便于调试时选择
    @Field({type: Types.STRING(255)})
    get title(): string { return null}
    set title(title: string) {}

    @Field({type: Types.JSONB})
    get query(): any { return null};
    set query(query: any) {}

    @Field({type: Types.JSONB})
    get prefers(): any {return null};
    set prefers(prefers: any) {}

    @Field({type: Types.JSONB})
    get originData(): any{ return null}
    set originData(data: any) {}

    @Field({type: Types.JSONB})
    get markedData(): any{ return null}
    set markedData(data: any) {}

    @Field({type: Types.JSONB})
    get result() :any { return null};
    set result(result: any) {}

    @Field({type: Types.INTEGER})
    get type(): number { return 1};
    set type(t: number) {}

    @Field({type: Types.INTEGER})
    get status(): number{ return 0}
    set status(status: number){}
}