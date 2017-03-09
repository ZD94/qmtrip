/**
 * Created by wlh on 16/9/2.
 */

'use strict';
import {AbstractPrefer} from "./index";
import {IFinalHotel} from "api/_types/travelbudget";
import _ = require("lodash");

class PricePrefer extends AbstractPrefer<IFinalHotel> {

    private score: number;
    private percent: number;

    constructor(name, options) {
        super(name, options);
        if (!this.score) {
            this.score = 0;
        }
        if (!this.percent) {
            this.percent = 0.7;
        }
    }

    async markScoreProcess(hotels: IFinalHotel[]) : Promise<IFinalHotel[]> {
        if (!hotels.length) return hotels;
        let self = this;

        let groups = {};
        hotels.forEach( (v) => {
            if (!groups[v.star]) {
                groups[v.star] = [];
            }
            groups[v.star].push(v);
        });

        let _hotels = [];
        for(let k in groups) {
            _hotels = _.concat(_hotels, await _markScore(groups[k]));
        }
        return _hotels;

        async function _markScore(hotels: IFinalHotel[]) :Promise<IFinalHotel[]> {
            if (!hotels || !hotels.length) return hotels;
            if (hotels.length == 1) return hotels;
            let ll = hotels.length;
            let totalMoney = 0;
            hotels.forEach((v) => {
                totalMoney += v.price;
            });
            //平均价格
            let avgPrice = totalMoney / ll;
            let totalDiff = 0;
            hotels.forEach((v) => {
                totalDiff += Math.pow((v.price - avgPrice), 2);
            });
            //标准偏差
            let avgDiff = Math.sqrt(totalDiff/ (ll -1));
            let validHotels = hotels.filter( (v)=> {
                if (v.price > (avgPrice + avgDiff) || v.price < (avgPrice - avgDiff)) {
                    return false;
                }
                return true;
            });
            validHotels.sort( (v1, v2) => {
                return v1.price - v2.price;
            });

            let maxPriceDiff = validHotels[validHotels.length-1].price - validHotels[0].price;
            let lowestLimit = avgPrice - avgDiff;   //均方差下限
            let highestLimit = avgPrice + avgDiff;  //均方差上限

            let expectPrice = lowestLimit + maxPriceDiff * self.percent;    //预期价格
            for(let i=1, ii=validHotels.length; i<ii; i++) {
                if (validHotels[i].price >= expectPrice && validHotels[i-1].price <= expectPrice) {
                    let diff1 = validHotels[i].price - expectPrice;
                    let diff2 = expectPrice - validHotels[i-1].price;
                    if (diff1 < diff2) {
                        expectPrice = validHotels[i].price;
                    } else {
                        expectPrice = validHotels[i-1].price;
                    }
                    break;
                }
            }
            for(let v of validHotels) {
                if (v.price >= expectPrice) {
                    expectPrice = v.price;  //实际价格
                    break;
                }
            }
            //价格波动大于标准差的价格,减掉分数上线
            hotels = hotels.map ( (v) => {
                if (!v.score) v.score = 0;
                if (!v.reasons) v.reasons = [];
                if(!v.outPriceRange){
                    if (v.price <= expectPrice) {
                        let score = Math.floor(self.score * ( 1- Math.pow((v.price - expectPrice) / (expectPrice - lowestLimit), 2)));
                        v.score += score;
                        v.reasons.push(`价格在偏好价格下 ${score}`);
                    }

                    if (v.price > expectPrice) {
                        let score = Math.floor(self.score * (1 - Math.pow((v.price - expectPrice) / (expectPrice - highestLimit), 2)));
                        v.score += score
                        v.reasons.push(`价格在偏好价格上 ${score}`);
                    }
                }
                return v;
            });
            return hotels;
        }
    }
}

export=PricePrefer