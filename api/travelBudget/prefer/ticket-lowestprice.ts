/**
 * Created by wlh on 16/8/10.
 */

'use strict';
import {IFinalTicket} from "../_interface";

function lowestprice(data: IFinalTicket[], score: number) :IFinalTicket[]{
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
    
    // let scoreRate = score / l;
    for(var i=0, ii=data.length; i<ii; i++) {
        if (!data[i].score) data[i].score = 0;
        data[i].score -= score * i;
    }
    return data;
}

export= lowestprice