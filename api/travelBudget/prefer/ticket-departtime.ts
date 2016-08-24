/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
import moment = require("moment");


function departtime(data: IFinalTicket[], d1, d2, score) :IFinalTicket[] {
    data = data.map( (v) => {
        if (!v['score']) v['score'] = 0;
        if (!v['reasons']) v['reasons'] = [];
        let d = new Date(v.departDateTime).valueOf();
        if (d1) {
            let _d1 = new Date(d1).valueOf();
            if (_d1 - d > 0) {
                v['score'] -= score;
                v['reasons'].push(`出发时间早于规定时间 -${score}`)
                return v;
            }
        }

        if (d2) {
            let _d2 = new Date(d2).valueOf();
            if (d - _d2> 0) {
                v['score'] -= score;
                v['reasons'].push(`出发时间晚于规定时间 -${score}`)
                return v;
            }
        }
        return v;
    })
    return data;
}

export= departtime;