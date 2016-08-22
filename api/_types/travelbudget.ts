/**
 * Created by wlh on 16/6/28.
 */

'use strict';

import {EInvoiceType, ETripType} from "../_types/tripPlan";

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
    reasons?: string[]
}