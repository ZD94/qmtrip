/**
 * Created by wlh on 16/8/23.
 */

'use strict';

import {IFinalTicket, TRAFFIC} from '_types/travelbudget';

function preferaircompany(data: IFinalTicket[], expected: Array<string>|string, score: number) :IFinalTicket[] {
    let airCompanies: Array<string> = [];
    if (typeof expected == 'string') {
        airCompanies.push(expected);
    } else {
        airCompanies = expected;
    }

    data = data.map( (v) => {
        if (!v['score']) v['score']=0;
        if (!v.reasons) v.reasons = [];

        let result = false;
        airCompanies.forEach( (item) => {
            if (v['carry'] && v.type == TRAFFIC.FLIGHT && item.indexOf(v['carry']) >= 0) {
                result = true;
                return false;
            }
        });
        if (result) {
            v.score += score;
            v.reasons.push(`期望航空公司+${score}`);
        }
        return v;
    });
    return data;
}

export= preferaircompany;