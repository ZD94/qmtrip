/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";
//廉价供应商

const CHEAP_SUPPLIERS = ['春秋航空', '中国联合航空', '吉祥航空', '西部航空', '成都航空', '九元航空', '幸福航空'];
class CheapSupplierPrefer extends AbstractPrefer<IFinalTicket> {

    private score: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets:IFinalTicket[]):Promise<IFinalTicket[]> {
        let self = this;
        tickets = tickets.map( (v) => {
            if (!v['score']) v['score'] = 0;
            if (!v['reasons']) v['reasons'] = [];
            if (CHEAP_SUPPLIERS.indexOf(v.agent) >= 0) {
                v['score'] += self.score;
                v['reasons'].push(`廉价供应商 ${self.score}`)
            }
            return v;
        });
        return tickets;
    }
}

export= CheapSupplierPrefer