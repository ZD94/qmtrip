/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket, TRAFFIC, TravelBudgeItem, IHotel, IFinalHotel} from "api/_types/travelBudget";
import {ticketPrefer, hotelPrefer} from '../prefer'
import {EInvoiceType} from "api/_types/tripPlan";
import {RedisStorage, IStorage} from '../storage';
var C = require('config');

export interface IStrategy {
     getResult(params: any): Promise<any>;
}


export abstract class AbstractHotelStrategy implements IStrategy {
    protected hotels: IHotel[];
    private _key: string;
    protected storage: IStorage;

    constructor(hotels: IHotel[], storage: IStorage) {
        this.hotels = hotels;
        this.storage = storage;
        this._key = 'ID' + Date.now() + Math.ceil(Math.random() * 1000);
    }

    async _begin(params: any): Promise<any> {
        console.log(`${this._key}开始于:${Date.now()}`);
        return null;
    }

    async _end(data: any): Promise<any> {
        console.log(`${this._key}结束于:${Date.now()}`);
        return null;
    }

    abstract buildProcess(params: any): Promise<any>;

    async getResult(params: any): Promise<any> {
        this._begin(params);
        let result = await this.buildProcess(params);
        this._end(result);
        return result;
    }
}

export abstract class AbstractStrategy implements IStrategy {
    tickets: ITicket[];
    result: TravelBudgeItem;
    storage: IStorage;
    private _key;

    constructor(tickets?: ITicket[], storage?: IStorage) {
        this.storage = storage;
        this.tickets = tickets;
        this._key = 'ID' + Date.now() + Math.ceil(Math.random() * 1000);
    }

    //设置原始数据
    setTickets(tickets: ITicket[]) {
        this.tickets = tickets;
    }
    //计算过程,子类需要实现
    abstract async buildProcess(params: any): Promise<any>;
    //开始计算前
    private async _begin(): Promise<any> {
        // console.log('原始数据:' + JSON.stringify(this.tickets));
        if (this.storage) {
            return this.storage.write(this._key+':data', JSON.stringify(this.tickets));
        }
        return null;
    }
    //计算完成
    private async _finish(): Promise<any> {
        // console.log('计算结果:' + JSON.stringify(this.result));
        if (this.storage) {
            return this.storage.write(this._key, JSON.stringify(this.result));
        }
        return null;
    }

    //对外暴漏获取结果函数
    async getResult(params: any): Promise<TravelBudgeItem> {
        this._begin();
        this.result = await this.buildProcess(params);
        this.result.id = this._key;
        this._finish();
        return this.result;
    }
}

export class CommonTicketStrategy extends AbstractStrategy {

    constructor(tickets?: ITicket[], storage?: IStorage) {
        super(tickets, storage);
    }

    async buildProcess(params: {originCity: any, destinationCity: any, leaveDate: string,
        leaveTime?: string, latestArrivalTime?: string, cabin?: string[]}):Promise<any> {

        const ARRIVAL_TIME_POINTS = 100;
        const DEPART_TIME_POINTS = 100;
        const CHEAP_SUPPLIER_POINTS = 200;
        const CORRECT_TRAFFIC_POINTS = 500;
        const CABIN_POINTS = 500;
        const PRICE_PREFER_POINTS = 100;

        let {leaveDate, leaveTime, latestArrivalTime} = params;
        let _tickets: IFinalTicket[] = [];
        _tickets = formatTicketData(this.tickets);

        /* * * * * * * * * * *
         * 根据到达时间打分
         * * * * * * * * * * * */
        _tickets = ticketPrefer.arrivaltime(_tickets, `${leaveDate} ${leaveTime} +0800`, null, ARRIVAL_TIME_POINTS);

        /* * * * * * * * * * *
         * 根据出发时间打分
         * * * * * * ** * * * */
        _tickets = ticketPrefer.departtime(_tickets, null, `${leaveDate} ${latestArrivalTime} +0800`, DEPART_TIME_POINTS);

        /* * * * * * * * * * * *
         * 根据是否廉价供应商打分
         * * * * * ** * * * * * */
        let cheapSuppliers = ['春秋航空', '中国联合航空', '吉祥航空', '西部航空', '成都航空', '九元航空', '幸福航空']
        _tickets = ticketPrefer.cheapsupplier(_tickets, cheapSuppliers, CHEAP_SUPPLIER_POINTS);

        /* * * * * * * * * * * *
         * 根据时长对不同交通方式打分
         * * * * * * * * * * * * * */
        const CHOOSE_TRAIN_DURATION = 3.5 * 60;
        const CHOOSE_FLIGHT_DURATION = 6 * 60;
        _tickets = ticketPrefer.selecttraffic(_tickets, CHOOSE_TRAIN_DURATION, CHOOSE_FLIGHT_DURATION, CORRECT_TRAFFIC_POINTS);

        /* * * * * * * * * * * *
         * 根据仓位打分
         * * * * * * * * * * * * * */
        _tickets = ticketPrefer.cabin(_tickets, params.cabin, CABIN_POINTS);
        
        _tickets = ticketPrefer.priceprefer(_tickets, 0.5, PRICE_PREFER_POINTS);
        /* * * * * * * * * * * *
         * 如果没有车票信息,直接返回无预算
         * * * * * * * * * * * * * */
        if (!_tickets || !_tickets.length) return {price: -1};

        /* * * * * * * * * * * *
         * 权衡得分,价格信息给出预算结果
         * * * * * * * * * * * * * */
        _tickets = _tickets.sort( (v1, v2) => {
            let diffScore =  v2.score - v1.score;
            if (diffScore) return diffScore;
            //火车按照价格倒叙
            if (v1.type == TRAFFIC.TRAIN && v2.type == TRAFFIC.TRAIN) {
                return v2.price - v1.price;
            }
            //飞机按照价格顺序
            if (v1.type == TRAFFIC.FLIGHT && v2.type == TRAFFIC.FLIGHT) {
                return v1.price - v2.price;
            }
            //飞机火车取价格较高的
            return v2.price - v1.price;
        });

        return {
            price: _tickets[0].price,
            type: <EInvoiceType>(<number>_tickets[0].type),
            No: _tickets[0].No,
            agent: _tickets[0].agent,
            cabin: _tickets[0].cabin,
            destination: _tickets[0].destination,
            originPlace: _tickets[0].originPlace,
        }
    }
}

export class HighestPriceTicketStrategy extends AbstractStrategy {
    constructor(tickets: ITicket[], storage?: IStorage) {
        super(tickets, storage);
        this.tickets = tickets;
    }

    async buildProcess(params:any):Promise<TravelBudgeItem> {
        if (!this.tickets) {
            return {
                price: -1
            }
        }
        const CHOOSE_TRAIN_DURATION = 6 * 60;
        const CHOOSE_FLIGHT_DURATION = 3.5 * 60
        const CHOOSE_TRAFFIC_SCORE = 500;
        const PREFER_AGENT = 100;
        const CORRECT_CABIN = 400;
        let tickets = formatTicketData(this.tickets);
        tickets = ticketPrefer.selecttraffic(tickets, CHOOSE_FLIGHT_DURATION, CHOOSE_TRAIN_DURATION, CHOOSE_TRAFFIC_SCORE);
        tickets = ticketPrefer.cabin(tickets, params.cabin, CORRECT_CABIN);
        tickets = ticketPrefer.preferagent(tickets, ['ctrip', '携程旅行网', '同程旅游'], PREFER_AGENT);

        tickets.sort( (v1, v2) => {
            if (v2.score - v1.score != 0) return v2.score - v1.score;
            return v2.price - v1.price;
        });

        return {
            price: tickets[0].price,
            type: <EInvoiceType>(<number>tickets[0].type),
            No: tickets[0].No,
            agent: tickets[0].agent,
            cabin: tickets[0].cabin,
            destination: tickets[0].destination,
            originPlace: tickets[0].originPlace,
        }
    }
}

function formatTicketData(tickets: ITicket[]) : IFinalTicket[] {
    let _tickets : IFinalTicket[] = [];
    //把数据平铺
    for(var i=0, ii=tickets.length; i<ii; i++) {
        let agents = tickets[i].agents;
        for(var j=0, jj=agents.length; j < jj; j++) {
            let cabins = agents[j].cabins;
            for(var n = 0, nn=cabins.length; n< nn; n++) {
                let cabin = cabins[n];
                let _ticket = {
                    No: tickets[i].No,
                    departDateTime: tickets[i].departDateTime,
                    arrivalDateTime: tickets[i].arrivalDateTime,
                    originPlace: tickets[i].originPlace,
                    destination: tickets[i].destination,
                    originStation: tickets[i].originStation,
                    destinationStation: tickets[i].destinationStation,
                    agent: agents[j].name,
                    cabin: cabin.name,
                    price: cabin.price,
                    remainNum: cabin.remainNum,
                    bookUrl: agents[j].bookUrl,
                    duration: tickets[i].duration,
                    type: tickets[i].type,
                } as IFinalTicket
                _tickets.push(_ticket);
            }
        }
    }
    return _tickets;
}

export class CommonHotelStrategy extends AbstractHotelStrategy {

    constructor(hotels: IHotel[], storage: IStorage) {
        super(hotels, storage);
    }

    async buildProcess(params: {longitude: number, latitude: number, star: number}):Promise<TravelBudgeItem> {
        const defaultPrice = {
            "5": 500,
            "4": 450,
            "3": 400,
            "2": 350
        }

        if (!this.hotels || !this.hotels.length) {
            return {
                price: defaultPrice[params.star]
            } as TravelBudgeItem;
        }

        const BLACKLIST_SCORE = 500;
        const STAR_MATCH = 1000;
        const REPRESENT = 500;

        let hotels = formatHotel(this.hotels);
        hotels = hotelPrefer.blacklist(hotels, BLACKLIST_SCORE);
        hotels = hotelPrefer.starmatch(hotels, params.star, STAR_MATCH);
        hotels = hotelPrefer.represent(hotels, REPRESENT);

        hotels.sort( (v1, v2) => {
            //优先按照积分排序
            let diff = v2.score - v1.score;
            if (diff) return diff;
            //然后按照价格排序
            return v2.price - v1.price;
        });
        let hotel = hotels[0];
        return {
            name: hotel.name,
            agent: hotel.agent,
            price: hotel.price,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
        } as TravelBudgeItem;
    }
}


function formatHotel(hotels: IHotel[]) : IFinalHotel[] {
    let _hotels: IFinalHotel[] = [];
    for(let i=0, ii=hotels.length; i<ii; i++) {
        let hotel = hotels[i]
        let agents = hotel.agents;
        for(var j=0, jj=agents.length; j< jj; j++) {
            _hotels.push({
                name: hotel.name,
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                star: hotel.star,
                price: agents[j].price,
                bookUrl: agents[j].bookUrl,
                agent: agents[j].name
            } as IFinalHotel)
        }
    }
    return _hotels;
}