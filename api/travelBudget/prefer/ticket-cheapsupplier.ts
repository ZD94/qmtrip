/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "api/_types/travelbudget";
//廉价供应商

function cheapsupplier(data: IFinalTicket[], cheapsuppliers: Array<string>, score: number) :IFinalTicket[] {
    data = data.map( (v) => {
        if (!v['score']) v['score'] = 0;
        if (!v['reasons']) v['reasons'] = [];
        if (cheapsuppliers.indexOf(v.agent) >= 0) {
            v['score'] -= score;
            v['reasons'].push(`廉价供应商 -${score}`)
        }
        return v;
    });
    return data;
}

export= cheapsupplier;