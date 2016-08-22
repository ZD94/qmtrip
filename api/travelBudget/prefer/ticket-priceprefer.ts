/**
 * Created by wlh on 16/8/16.
 */

'use strict';
import {IFinalTicket} from "../../_types/travelbudget";


function priceperfer(data: IFinalTicket[], percent: number, score: number) :IFinalTicket[]{
    console.info('价格排序:', data)
    if (!data || !data.length) return data;
    //只有一条记录直接返回
    let l = data.length;

    if (l == 1) {
        if (!data[0]['score']) data[0]['score'] = 0;
        data[0]['score'] += score;
        return data;
    }

    //对价格进行排序
    data.sort( (v1, v2) => {
        return v1.price - v2.price;
    });

    let idx = Math.floor(l * percent);

    console.info('idx==>', idx, '总数:', data.length);
    if (!data[idx].score) data[idx].score = 0;
    if (!data[idx].reasons) data[idx].reasons = [];
    
    data[idx].score += score;
    data[idx].reasons.push(`倾向于${percent * 100}%位置价格`);
    return data;
}

export=priceperfer