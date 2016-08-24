/**
 * Created by wlh on 16/8/23.
 */

'use strict';

import {IFinalTicket} from 'api/_types/travelbudget';

function preferagent(data: IFinalTicket[], expected: Array<string>|string, score: number) :IFinalTicket[] {
    let expectedAgents: Array<string> = [];
    if (typeof expected == 'string') {
        expectedAgents.push(expected);
    } else {
        expectedAgents = expected;
    }

    data = data.map( (v) => {
        if (!v['score']) v['score']=0;
        if (!v.reasons) v.reasons = [];

        let result = false;
        expectedAgents.forEach( (agent) => {
            if (v.agent && agent.indexOf(v.agent) >= 0) {
                result = true;
                return false;
            }
        });
        if (result) {
            v.score += score;
            v.reasons.push(`期望代理商+${score}`);
        }
        return v;
    });
    return data;
}

export= preferagent;