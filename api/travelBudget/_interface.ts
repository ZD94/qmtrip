/**
 * Created by wlh on 16/6/28.
 */

'use strict';
import {TRAFFIC} from './_const';

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