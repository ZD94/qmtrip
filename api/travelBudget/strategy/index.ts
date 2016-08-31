/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket, TRAFFIC, TravelBudgeItem, IHotel, IFinalHotel} from "api/_types/travelbudget";
import {ticketPrefers, hotelPrefers} from '../prefer'
import {EInvoiceType} from "api/_types/tripPlan";
import {IPrefer} from '../prefer'
import {Models} from "../../_types/index";

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

function formatHotel(hotels: IHotel[]) : IFinalHotel[] {
    let _hotels: IFinalHotel[] = [];
    for(let i=0, ii=hotels.length; i<ii; i++) {
        let hotel = hotels[i]
        let agents = hotel.agents || hotel['agent'];
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

abstract class AbstractHotelStrategy {
    private prefers: IPrefer<IFinalHotel>[];
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

    addPrefer(p: IPrefer<IFinalHotel>) {
        this.prefers.push(p);
    }

    async getMarkedScoreHotels(hotels: IFinalHotel[]) :Promise<IFinalHotel[]> {
        let self = this;
        self.prefers.forEach( async (p) => {
            hotels = await p.markScore(hotels);
        })
        return hotels;
    }

    abstract async customMarkedScoreData(hotels: IFinalHotel[]) :Promise<IFinalHotel[]>;

    async getResult(hotels: IHotel[]): Promise<TravelBudgeItem> {
        let _hotels = formatHotel(hotels);
        if (!_hotels || !_hotels.length) {
            const defaultPrice = {
                "5": 500,
                "4": 450,
                "3": 400,
                "2": 350
            }
            return {
                price: defaultPrice[this.qs.star]
            }
        }

        _hotels = await this.getMarkedScoreHotels(_hotels);
        _hotels.sort( (v1, v2) => {
            return v2.score - v1.score;
        });
        _hotels = await this.customMarkedScoreData(_hotels);
        let ret = _hotels[0];
        let result: any = {
            price: ret.price,
            agent: ret.agent,
            name: ret.name,
            star: ret.star,
            latitude: ret.latitude,
            longitude: ret.longitude,
        }

        if (this.isRecord) {
            let travelBudgetLog = await Models.travelBudgetLog.create({});
            travelBudgetLog.title = `[住宿]${this.qs.query.city.name}-(${this.qs.query.checkInDate})`
            travelBudgetLog.prefers = this.qs.prefers;
            travelBudgetLog.query = this.qs.query;
            travelBudgetLog.originData = hotels;
            travelBudgetLog.type = 2;
            travelBudgetLog.result = result;
            travelBudgetLog.markedData = _hotels;
            let log = await travelBudgetLog.save();
            result.id = log.id;
        }
        return result;
    }
}

export class CommonHotelStrategy extends AbstractHotelStrategy {

    constructor(public qs: any, options: any) {
        super(qs, options);
    }

    async customMarkedScoreData(hotels:IFinalHotel[]):Promise<IFinalHotel[]> {
        hotels.sort ( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v2.price - v1.price;
        })
        return hotels;
    }
}

export class HighPriceHotelStrategy extends AbstractHotelStrategy {

    constructor(public qs: any, options: any) {
        super(qs, options);
    }

    async customMarkedScoreData(hotels: IFinalHotel[]): Promise<IFinalHotel[]> {
        hotels.sort( (v1, v2) => {
            let diff = v2.score - v1.score;
            if (diff) return diff;
            return v1.price - v2.price;
        })
        return hotels;
    }
}

abstract class AbstractTicketStrategy {
    private prefers: IPrefer<IFinalTicket>[];
    private isRecord: boolean;

    constructor(public qs: any, options: any) {
        if (options && options.isRecord) {
            this.isRecord = true;
        } else {
            this.isRecord = false;
        }

        let d = new Date();
        this.prefers = [];
    }

    addPrefer(p: IPrefer<IFinalTicket>) {
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
        let result: any = {
            price: ret.price,
            type: <EInvoiceType>(<number>ret.type),
            No: ret.No,
            agent: ret.agent,
            cabin: ret.cabin,
            destination: ret.destination,
            originPlace: ret.originPlace,
            departDateTime: ret.departDateTime,
            arrivalDateTime: ret.arrivalDateTime,
        } as TravelBudgeItem;

        if (this.isRecord) {
            let travelBudgetLog = await Models.travelBudgetLog.create({});
            travelBudgetLog.title = `[交通]${this.qs.query.originPlace.name}-${this.qs.query.destination.name}(${this.qs.query.leaveDate})`
            travelBudgetLog.prefers = this.qs.prefers;
            travelBudgetLog.query = this.qs.query;
            travelBudgetLog.originData = tickets;
            travelBudgetLog.type = 1;
            travelBudgetLog.result = result;
            travelBudgetLog.markedData = _tickets;
            let log = await travelBudgetLog.save();
            result.id = log.id;
        }
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

export class HotelBudgetStrategyFactory {
    static async getStrategy(qs, options) {
        let policy = qs.policy;
        let prefers = qs.prefers;
        let strategy = new CommonHotelStrategy(qs, options);
        for(let p of prefers) {
            let prefer = PreferFactory.getPrefer(p.name, p.options, 'hotel');
            if (!prefer) continue;
            strategy.addPrefer(prefer);
        }
        return strategy;
    }
}

class PreferFactory {
    static getPrefer(name, options, type?: string) {
        let cls = type == 'hotel' ? hotelPrefers[name]: ticketPrefers[name];
        if (cls && typeof cls == 'function') {
            return new (cls)(name, options);
        }
        return null;
    }
}