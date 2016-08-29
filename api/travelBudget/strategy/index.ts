/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket, TRAFFIC, TravelBudgeItem, IHotel, IFinalHotel} from "api/_types/travelbudget";
import {hotelPrefer, ticketPrefers} from '../prefer'
import {EInvoiceType} from "api/_types/tripPlan";
import {IStorage} from '../storage';
import {IPrefer} from '../prefer'
import {Models} from "../../_types/index";
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


abstract class AbstractTicketStrategy {
    private prefers: IPrefer[];
    private _id: string;
    private isRecord: boolean;

    constructor(public qs: any, options: any) {
        if (options && options.isRecord) {
            this.isRecord = true;
        } else {
            this.isRecord = false;
        }

        let d = new Date();
        this._id = `ID${d.getFullYear()}${d.getMonth()+1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}${Math.ceil(Math.random() * 1000)}`;
        this.prefers = [];
    }

    addPrefer(p: IPrefer) {
        this.prefers.push(p);
    }

    async getMarkedScoreTickets(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        let self = this;
        self.prefers.forEach( async (p) => {
            tickets =  await p.markScore(tickets)
        })
        return tickets;
    }

    abstract async customerMarkedScoreData(tickets: IFinalTicket[]): Promise<IFinalTicket[]>;

    async getResult(tickets: ITicket[]) :Promise<TravelBudgeItem> {
        let travelBudgetLog = await Models.travelBudgetLog.create({});
        // console.log(`* * * * * * * * 开始 ${this._id}* * * * * * * *`);

        let _tickets = formatTicketData(tickets);
        if (!_tickets || !_tickets.length) {
            return {
                price: -1
            }
        }

        _tickets = await this.getMarkedScoreTickets(_tickets);
        _tickets.sort( (v1, v2) => {
            return v2.score - v1.score;
        });
        _tickets = await this.customerMarkedScoreData(_tickets);
        let ret = _tickets[0];
        let result = {
            price: ret.price,
            type: <EInvoiceType>(<number>ret.type),
            No: ret.No,
            agent: ret.agent,
            cabin: ret.cabin,
            destination: ret.destination,
            originPlace: ret.originPlace,
            id: this._id
        }
        if (this.isRecord) {
            travelBudgetLog.title = `${this.qs.query.originPlace.name}-${this.qs.query.destination.name}(${this.qs.query.leaveDate})`
            travelBudgetLog.prefers = this.qs.prefers;
            travelBudgetLog.query = this.qs.query;
            travelBudgetLog.originData = tickets;
            travelBudgetLog.type = 1;
            travelBudgetLog.result = result;
            travelBudgetLog.markedData = _tickets;
            await travelBudgetLog.save();
        }
        // console.log(`* * * * * * * * * * 结束 ${this._id} * * * * * * *`);
        return result;
    }
}

export class CommonTicketStrategy extends AbstractTicketStrategy {
    constructor(public query: any, options: any) {
        super(query, options);
    }

    async customerMarkedScoreData(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        tickets.sort( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v1.price - v2.price;
        });
        return tickets;
    }
}

export class HighPriceTicketStrategy extends AbstractTicketStrategy {
    constructor(public query: any, options: any) {
        super(query, options);
    }

    async customerMarkedScoreData(tickets: IFinalTicket[]): Promise<IFinalTicket[]> {
        tickets.sort( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v2.price - v1.price;
        });
        return tickets;
    }
}

export class TrafficBudgetStrategyFactory {

    static async getStrategy(qs, options) {
        let policy = qs.policy;
        let prefers = qs.prefers;  //保存的是企业打分参数信息
        let strategy;
        //选择策略
        switch(policy) {
            case 'bmw':
                strategy = new HighPriceTicketStrategy(qs, options);
                break;
            default:
                strategy = new CommonTicketStrategy(qs, options);
        }
        //通过企业配置的喜好打分
        for(let k of prefers) {
            let prefer = PreferFactory.getPrefer(k.name, k.options);
            if (!prefer) continue;
            strategy.addPrefer(prefer)
        }
        return strategy;
    }
}

class PreferFactory {
    static getPrefer(name, options) {
        let cls = ticketPrefers[name]
        if (cls && typeof cls == 'function') {
            return new (ticketPrefers[name])(name, options);
        }
        return null;
    }
}