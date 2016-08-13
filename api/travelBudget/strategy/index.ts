/**
 * Created by wlh on 16/8/13.
 */

'use strict';
import {ITicket, IFinalTicket} from "../_interface";
import {ticketPrefer} from '../prefer'
import {TRAFFIC} from "../_const";
import {EInvoiceType} from "../../_types/tripPlan";

export interface IStrategy {
     getResult(params: any): Promise<any>;
}

export abstract class AbstractStrategy implements IStrategy {
    tickets: ITicket[];
    result: any;

    constructor(tickets?: ITicket[]) {
        this.tickets = tickets;
    }
    //设置原始数据
    setTickets(tickets: ITicket[]) {
        this.tickets = tickets;
    }
    //计算过程,子类需要实现
    abstract async buildProcess(params: any): Promise<any>;
    //开始计算前
    private async _begin(): Promise<any> {
        console.log('原始数据:' + this.tickets)
        return null;
    }
    //计算完成
    private async _finish(): Promise<any> {
        console.log('计算结果:' + this.result);
        return null;
    }
    //对外暴漏获取结果函数
    async getResult(params: any): Promise<any> {
        this._begin();
        let result = await this.buildProcess(params);
        this._finish();
        return result;
    }
}

export class CommonTicketStrategy extends AbstractStrategy {

    constructor(tickets?: ITicket[]) {
        super(tickets);
    }

    async buildProcess(params: {originCity: any, destinationCity: any, leaveDate: string,
        leaveTime?: string, latestArrivalTime?: string}):Promise<any> {

        const ARRIVAL_TIME_POINTS = 100;
        const DEPART_TIME_POINTS = 100;
        const CHEAP_SUPPLIER_POINTS = 200;
        const CORRECT_TRAFFIC_POINTS = 500;
        const CABIN_POINTS = 500;

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
        _tickets = ticketPrefer.cabin(_tickets, ['Economy', '二等座', '硬卧'], CABIN_POINTS);

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
    constructor(tickets: ITicket[]) {
        super(tickets);
        this.tickets = tickets;
    }

    async buildProcess(params:any):Promise<any> {
        const POINTS = 500;
        let tickets = formatTicketData(this.tickets);
        tickets.sort( (v1, v2) => {
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