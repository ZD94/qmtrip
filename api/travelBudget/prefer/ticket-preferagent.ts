/**
 * Created by wlh on 16/8/23.
 */

'use strict';

import {IFinalTicket} from '_types/travelbudget';
import {AbstractPrefer} from "./index";

class AgentPrefer extends AbstractPrefer<IFinalTicket> {

    private expectedAgents: string[];
    private score: number;

    constructor(name, options) {
        super(name, options);
        if (!this.expectedAgents) {
            this.expectedAgents = [];
        }
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(tickets: IFinalTicket[]) : Promise<IFinalTicket[]>{
        let self = this;
        tickets = tickets.map( (v) => {
            if (!v['score']) v['score']=0;
            if (!v.reasons) v.reasons = [];

            let result = false;
            self.expectedAgents.forEach( (agent) => {
                if (v.agent && agent.indexOf(v.agent) >= 0) {
                    result = true;
                    return false;
                }
            });
            if (result) {
                v.score += self.score;
                v.reasons.push(`期望代理商${self.score}`);
            }
            return v;
        });
        return tickets;
    }
}

export= AgentPrefer;