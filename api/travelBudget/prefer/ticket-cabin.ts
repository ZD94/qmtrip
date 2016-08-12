/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "../_interface";

/* * * * * * * * *
 * 仓位信息打分
 * * * * * * * * */

/**
 * 根据仓位信息打分
 *
 * @param data
 * @param expected
 * @param notExpected
 * @param score
 */
function cabin(data: IFinalTicket[], expected: Array<string>|string, score: number) :IFinalTicket[] {
    let cabins: Array<string> = [];
    if (typeof expected == 'string') {
        cabins.push(expected);
    } else {
        cabins = expected;
    }
    data = data.map( (v) => {
        if (!v['score']) v['score']=0;
        if (!v.reasons) v.reasons = [];
        if (cabins.indexOf(v.cabin) >= 0) {
            v['score'] += score;
            v.reasons.push(`座次符合规定:+${score}`)
        }
        return v;
    });
    return data;
}

export= cabin;