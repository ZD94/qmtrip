/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket, TRAFFIC} from "_types/travelbudget";
import {AbstractPrefer} from "./index";
//只允许乘坐供应商

// const CHEAP_SUPPLIERS = ['中国北方航空公司', '大新华航空公司', '上海航空公司'];
class PermitOnlySupplierPrefer extends AbstractPrefer<IFinalTicket> {

    private score: number;
    private permitSuppliers: string[];

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        if (!tickets.length) return tickets;
        let self = this;
        if (!self.permitSuppliers || !self.permitSuppliers.length) return tickets;  //如果没有设置,默认不做处理
        tickets = tickets.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v['reasons']) v['reasons'] = [];
            let supplier = "";
            if(v.type == TRAFFIC.FLIGHT && v.No && v.No.length > 2){
                supplier = v.No.substr(0,2);
            }
            if (v.type == TRAFFIC.FLIGHT && supplier.length > 0 && self.permitSuppliers.indexOf(supplier) < 0) {
                v['score'] += self.score;
                v['reasons'].push(`不允许乘坐的供应商 ${self.score}`)
            }
            return v;
        });
        return tickets;
    }
}

export= PermitOnlySupplierPrefer