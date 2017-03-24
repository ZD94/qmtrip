/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import {IFinalHotel} from "api/_types/travelbudget";
import {AbstractPrefer} from "./index";

const REFERENCE_HOTELS_PRICE = {
    "2": [ '如家酒店', '莫泰酒店', '汉庭酒店', 'IBIS', '7天', '星程', '锦江之星', '布丁', '海友', '99旅馆', '速8'],
    "3": [ '如家精选', '和颐酒店', '全季酒店', '桔子水晶', '智选假日', '维也纳'],
    "4": [ '福朋喜来登', '诺富特', '希尔顿逸林', '假日酒店'],
    "5": [ '万丽', '喜来登', '希尔顿', '皇冠假日', 'JW万豪', '威斯汀', '康莱德', '洲际酒店']
}

class RepresentPrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[]) : Promise<IFinalHotel[]> {
        let self = this;
        hotels = hotels.map( (v) => {
            if (!v.score) v.score = 0;
            if (!v.reasons) v.reasons = [];
            let representHotels = REFERENCE_HOTELS_PRICE[""+v.star] || [];
            let i=0;
            let ii = representHotels.length;
            for(; i<ii; i++) {
                let keyword = representHotels[i];
                if (v.name.indexOf(keyword) >=0 ){
                    v.score += self.score;
                    v.reasons.push(`匹配${keyword}为代表性酒店+${self.score}`);
                    break;
                }
            }

            if (i >= ii) {
                v.reasons.push(`未匹配代表性酒店 0`)
            }
            return v;
        })
        return hotels;
    }
}

export= RepresentPrefer;