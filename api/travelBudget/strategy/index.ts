/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket, TRAFFIC, TravelBudgeItem, IHotel, IFinalHotel} from "api/_types/travelbudget";
import {ticketPrefer, hotelPrefer} from '../prefer'
import {EInvoiceType} from "api/_types/tripPlan";
import {IStorage} from '../storage';

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

export abstract class AbstractTicketStrategy implements IStrategy {
    tickets: ITicket[];
    storage: IStorage;
    private _key;
    config: any;

    constructor(tickets: ITicket[], config: any, storage?: IStorage) {
        this.storage = storage;
        this.tickets = tickets;
        this._key = 'ID' + Date.now() + Math.ceil(Math.random() * 1000);
        this.config = config;
    }

    public async setPointConfig(pointConfig): Promise<any> {
        this.config = pointConfig;
    }

    private async _markScore(): Promise<IFinalTicket[]> {
        let _tickets: IFinalTicket[] = [];
        _tickets = formatTicketData(this.tickets);

        let config = this.config;
        let prefers = [
            'arrivaltime',
            'departtime',
            'cheapsupplier',
            'preferagent',
            'selecttraffic',
            'cabin',
            'priceprefer',
        ]

        prefers.forEach( (fnName) => {
            let fn = ticketPrefer[fnName];
            if (fn && typeof fn == 'function') {
                _tickets = fn.bind(null, _tickets).apply(null, config[fnName]);
            }
        })
        return _tickets;
    }

    abstract async handleMarkedScoreData(tickets: IFinalTicket[]) :Promise<IFinalTicket[]>;

    //对外暴漏获取结果函数
    async getResult(): Promise<TravelBudgeItem> {
        if (this.storage) {
            this.storage.write(this._key+':data', JSON.stringify(this.tickets));
        }
        let tickets = await this._markScore();
        tickets = await this.handleMarkedScoreData(tickets);
        if (this.storage) {
            this.storage.write(this._key+':marked', JSON.stringify(tickets));
        }
        let ret = tickets[0];
        return {
            price: ret.price,
            type: <EInvoiceType>(<number>ret.type),
            No: ret.No,
            agent: ret.agent,
            cabin: ret.cabin,
            destination: ret.destination,
            originPlace: ret.originPlace,
            id: this._key
        }
    }
}

export class CommonTicketStrategy extends AbstractTicketStrategy {

    constructor(tickets: ITicket[], query: any, storage?: IStorage, pointConfig?: any) {
        let preferConfig = {
            "arrivaltime": [null, `${query.leaveDate} ${query.latestArrivalTime} +0800`, 100],  //达到时间
            "departtime": [`${query.leaveDate} ${query.leaveTime} +0800`, null, 100],           //出发时间
            "cheapsupplier": [['春秋航空', '中国联合航空', '吉祥航空', '西部航空', '成都航空', '九元航空', '幸福航空'], 200], //廉价航空
            "selecttraffic": [3.5 * 60, 6 * 60, 500],   //正确交通方式
            "cabin": [query.cabin, 500],    //正确仓位信息
            "priceprefer": [0.5, 50],       //那个百分比的价格合理
            "preferagent": [['ctrip', '携程旅行网', '同程旅游'], 100],   //比较靠谱的供应商
        }
        super(tickets, preferConfig, storage);
    }

    public async handleMarkedScoreData(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        tickets.sort ((v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;  //优先使用分数倒叙排序,如果份数相同使用价格升序排序
            return v1.price - v2.price;
        })
        return tickets;
    }
}

export class HighestPriceTicketStrategy extends AbstractTicketStrategy {

    constructor(tickets: ITicket[], query: any, storage?: IStorage) {
        let preferConfig = {
            "arrivaltime": [null, `${query.leaveDate} ${query.latestArrivalTime} +0800`, 0],
            "departtime": [`${query.leaveDate} ${query.leaveTime} +0800`, null, 0],
            "cheapsupplier": [['春秋航空', '中国联合航空', '吉祥航空', '西部航空', '成都航空', '九元航空', '幸福航空'], 200],
            "selecttraffic": [3.5 * 60, 6 * 60, 500],
            "cabin": [query.cabin, 500],
            "priceprefer": [0.9, 500],
            "preferagent": [['ctrip', '携程旅行网', '同程旅游'], 100],
        }

        super(tickets, preferConfig, storage);
    }

    public async handleMarkedScoreData(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        tickets.sort( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v2.price - v1.price;
        })
        return tickets;
    }
}

export class DynamicTicketStrategy extends AbstractTicketStrategy {
    constructor(tickets: ITicket[], pointConfig: any, storage?: IStorage) {
        super(tickets, pointConfig, storage);
    }

    public async handleMarkedScoreData(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        tickets.sort( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v1.price - v2.price;
        })
        return tickets;
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