/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket, TravelBudgeItem, IHotel, IFinalHotel, TravelBudgeTraffic, TravelBudgetHotel} from "_types/travelbudget";
import {ticketPrefers, hotelPrefers} from '../prefer'
import {EInvoiceType} from "_types/tripPlan";
import {IPrefer} from '../prefer'
import {Models} from "_types/index";
import util = require("util");
import moment = require("moment");
import {LandMark} from "../_interface"


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
                    duration: tickets[i].duration || ((new Date(tickets[i].arrivalDateTime).valueOf() - new Date(tickets[i].departDateTime).valueOf())/(60*1000)),
                    type: tickets[i].type,
                    stops: tickets[i].stops,
                    segs: tickets[i].segs,
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
                agent: agents[j].name,
                checkInDate: hotel.checkInDate,
                checkOutDate: hotel.checkOutDate,
                outPriceRange: false
            } as IFinalHotel)
        }
    }
    return _hotels;
}

export abstract class AbstractHotelStrategy {
    private prefers: IPrefer<IFinalHotel>[];
    private isRecord: boolean;
    private landmark:LandMark;

    constructor(public qs: any, options: any) {
        if(options){
            if(options.isRecord){
                this.isRecord=true;
            }else{
                this.isRecord=false;
            }
            if(options.landmark){
                this.landmark=options.landmark;
            }else{
                this.landmark=null;
            }
        }
        this.prefers = [];
    }

    addPrefer(p: IPrefer<IFinalHotel>) {
        this.prefers.push(p);
    }

    async getMarkedScoreHotels(hotels: IFinalHotel[]) :Promise<IFinalHotel[]> {
        let self = this;
        for(let prefer of self.prefers) {
            hotels = await prefer.markScore(hotels,self.landmark);
        }
        return hotels;
    }

    abstract async customMarkedScoreData(hotels: IFinalHotel[]) :Promise<IFinalHotel[]>;

    async getResult(hotels: IHotel[], isRetMarkedData?: boolean): Promise<TravelBudgetHotel> {
        let _hotels = formatHotel(hotels);
        let query = this.qs.query || {};
        if (!_hotels || !_hotels.length) {
            const defaultPrice = {
                "5": 500,
                "4": 450,
                "3": 400,
                "2": 350
            }
            if (!util.isArray(query.star)) {
                this.qs.star = [query.star];
            }
            let prices = query.star.map( (star) => {
                return defaultPrice[star];
            });
            prices.sort();
            let days = moment(query.checkOutDate).diff(query.checkInDate, 'days');
            return {
                price: prices[prices.length-1] * days,
                checkInDate: query.checkInDate,
                checkOutDate: query.checkOutDate,
                cityName: query.city.name,
                hotelName: query.hotelName
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
            checkInDate: query.checkInDate,
            checkOutDate: query.checkOutDate,
            cityName: query.city.name,
            hotelName: query.hotelName
        }as TravelBudgetHotel
        if (isRetMarkedData) {
            result.markedScoreData = _hotels;
        }
        if (this.isRecord) {
            let travelBudgetLog = await Models.travelBudgetLog.create({});
            travelBudgetLog.title = `[住宿]${query.city.name}-(${query.checkInDate})`
            travelBudgetLog.prefers = this.qs.prefers;
            travelBudgetLog.query = query;
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

export abstract class AbstractTicketStrategy {
    private prefers: IPrefer<IFinalTicket>[];
    private isRecord: boolean;

    constructor(public qs: any, options: any) {
        if (options && options.isRecord) {
            this.isRecord = true;
        } else {
            this.isRecord = false;
        }

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

    async getResult(tickets: ITicket[], isRetMarkedData?: boolean) :Promise<TravelBudgeTraffic> {
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
            leaveDate: this.qs.query.leaveDate
        } as TravelBudgeTraffic;
        if (isRetMarkedData) {
            result.markedScoreData = _tickets;
        }
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
        //let policy = qs.policy;
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