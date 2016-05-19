/**
 * Created by wlh on 15/12/12.
 */

import {HotelBudget, TrafficBudget} from "api/_types/budget";
/**
 * @module API
 */

const API = require("common/api");
const validate = require("common/validate");
const L = require("common/language");
const moment = require('moment');

// /**
//  * @class travelBudget 旅行预算
//  */
// var travelBudget = {};

/**
 * @method getTravelPolicyBudget
 *
 * 获取合适差旅预算
 *
 * @param {Object} params 参数
 * @param {String} params.originPlace 出发地
 * @param {String} params.destinationPlace 目的地
 * @param {String} params.outboundDate 出发时间 YYYY-MM-DD
 * @param {String} params.inboundDate 返回时间(可选) YYYY-MM-DD
 * @param {String} [params.inLatestArriveTime] 返程最晚时间
 * @param {String} [params.outLatestArriveTime] 出发最晚到达时间 HH:mm
 * @param {String} [params.checkInDate] 如果不传=outboundDate 入住时间
 * @param {String} [params.checkOutDate] 如果不传=inboundDate 离开时间
 * @param {String} [params.businessDistrict] 商圈ID
 * @param {Boolean} [params.isRoundTrip] 是否往返 [如果为true,inboundDate必须存在]
 * @return {Promise} {traffic: "2000", hotel: "1500", "price": "3500"}
 */
export function getTravelPolicyBudget(params: {originPlace: string, destinationPlace: string, outboundDate: string, inboundDate: string, 
    inLatestArriveTime?: string, outLatestArriveTime?: string, checkInDate?: string, checkOutDate?: string, 
    businessDistrict?: string, isRoundTrip: boolean}) :Promise<any> {
    var outboundDate = params.outboundDate; //离开时间
    var inboundDate = params.inboundDate;   //出发时间
    var isRoundTrip = params.isRoundTrip || false;  //是否往返
    var originPlace = params.originPlace;
    var destinationPlace = params.destinationPlace;
    var checkInDate = params.checkInDate;
    var checkOutDate = params.checkOutDate;
    var businessDistrict = params.businessDistrict;
    var outLatestArriveTime = params.outLatestArriveTime;
    var inLatestArriveTime = params.inLatestArriveTime;
    var self = this;
    if (!outboundDate || !validate.isDate(outboundDate)) {
        throw L.ERR.OUTBOUND_DATE_FORMAT_ERROR();
    }

    if (isRoundTrip && (!inboundDate || !validate.isDate(inboundDate))) {
        throw L.ERR.INBOUND_DATE_FORMAT_ERROR();
    }

    if (!originPlace) {
        throw L.ERR.CITY_NOT_EXIST();
    }

    if (!destinationPlace) {
        throw L.ERR.CITY_NOT_EXIST();
    }

    if (!checkInDate) {
        checkInDate = outboundDate;
    }

    if (!checkOutDate) {
        checkOutDate = inboundDate;
    }
    return getHotelBudget.call(self, {
            cityId: destinationPlace,
            businessDistrict: businessDistrict,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate
        })
        .then(function(hotel) {
            return getTrafficBudget.call(self, {
                    originPlace: originPlace,
                    destinationPlace: destinationPlace,
                    outboundDate: outboundDate,
                    inboundDate: inboundDate,
                    outLatestArriveTime: outLatestArriveTime,
                    inLatestArriveTime: inLatestArriveTime,
                    isRoundTrip: isRoundTrip
                })
                .then(function(traffic) {
                    return {hotel: hotel.price, traffic: traffic.price, goTraffic: traffic.goTraffic, backTraffic: traffic.backTraffic};
                })
        })
        .then(function(result:any) {
            var price = -1;
            if (result.hotel > 0 && result.traffic > 0) {
                price = Number(result.hotel) + Number(result.traffic);
            }

            result.price = price;
            return result;
        });
}

/**
 * @method getHotelBudget
 *
 * 获取酒店住宿预算
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.cityId    城市ID
 * @param {String} params.businessDistrict 商圈ID
 * @param {String} params.checkInDate 入住时间
 * @param {String} params.checkOutDate 离开时间
 * @return {Promise} {prize: 1000, hotel: "酒店名称"}
 */
export function getHotelBudget(params: {accountId: string, cityId: string, businessDistrict: string,
    checkInDate: string, checkOutDate: string}) :Promise<HotelBudget> {
    var self = this;
    var cityId = params.cityId;
    var accountId = self.accountId;
    var businessDistrict = params.businessDistrict;
    var checkInDate = params.checkInDate;
    var checkOutDate = params.checkOutDate;

    if (!cityId) {
        throw L.ERR.CITY_NOT_EXIST();
    }

    if (!checkInDate || !validate.isDate(checkInDate)) {
        throw L.ERR.CHECK_IN_DATE_FORMAT_ERROR();
    }

    if (!checkOutDate || !validate.isDate(checkOutDate)) {
        throw L.ERR.CHECK_OUT_DATE_FORMAT_ERROR();
    }

    if (new Date(checkOutDate) < new Date(checkInDate)) {
        throw {code: -1, msg: "离开日期大于入住日期"};
    }

    var policy;
    var hotelStar;
    //查询员工信息
    return API.staff.getStaff({id: accountId})
        .then(function(staff) {
            if (!staff || !staff.travelLevel) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
            }
            //查询员工差旅标准
            return API.travelPolicy.getTravelPolicy({id: staff.travelLevel})
        })
        .then(function(travelPolicy) {
            if (!travelPolicy) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
            }
            policy = travelPolicy;
            hotelStar = 3;
            if (/二星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 2;
            }

            if (/三星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 3;
            }

            if (/四星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 4;
            }
            if (/五星级/g.test(travelPolicy.hotelLevel)) {
                hotelStar = 5;
            }

            var data = {
                maxMoney: travelPolicy.hotelPrice,
                hotelStar: hotelStar,
                cityId: cityId,
                businessDistrict: businessDistrict,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate
            }

            return API.travelbudget.getHotelBudget(data)
        })
        .then(function(result) {
            //如果没有查询到结果,直接扔回最大金额
            var days = moment(checkOutDate).diff(checkInDate, 'days');
            if (!result.price || result.price <=0) {
                days = days<= 0 ? 1 :days;
                if (policy.hotelPrice) {
                    return {price: policy.hotelPrice * days, bookListUrl: result.bookListUrl};
                } else {
                    return {price: _getDefaultPrice(hotelStar) * days, bookListUrl: result.bookListUrl};
                }
            } else if (policy.hotelPrice && result.price > policy.hotelPrice) {
                return {price: policy.hotelPrice * days, bookListUrl: result.bookListUrl};
            }
            return result;
        })
        .then(function(result) {
            return new HotelBudget({price: result.price, bookUrl: result.bookListUrl});
        })
}

export function getBookUrl(params: {spval: string, epval:string, st: string, et: string}) :Promise<string> {
    var spval = params.spval,
        epval = params.epval,
        st = params.st,
        et = params.et,
        url = "";
    if(!st || st == "" ){
        throw {code:-1, msg:"出发时间不能为空"};
    }
    return Promise.all([
            API.place.getCityInfo({cityCode: spval}),
            API.place.getCityInfo({cityCode: epval})
        ])
        .spread<string>(function(deptCity, endPlace){
            var scode = "",
                ecode = "";
            if(deptCity && deptCity.skyCode){
                scode = deptCity.skyCode.split("-")[0].toLowerCase();
            }
            if(endPlace && endPlace.skyCode){
                ecode = endPlace.skyCode.split("-")[0].toLowerCase();
            }
            if(et && et != ""){
                url = "http://www.tianxun.com/round-"+ scode +"-"+ ecode +".html?depdate="+st+"&rtndate="+et+"&cabin=Economy";
            }else{
                url = "http://www.tianxun.com/oneway-"+ scode +"-"+ ecode +".html?depdate="+st+"&cabin=Economy";
            }
            return url;
        })
}

/**
 *@method getBookListUrl
 * 得到飞机 火车 酒店预订列表链接
 * @param params
 * @param params.spval  出发城市id或出发地名称
 * @param params.epval  目的地城市id或目的地名称
 * @param params.st      出发时间
 * @param params.hotelCity   订酒店城市
 * @param params.hotelAddress  酒店所在商圈
 * @param params.type 类型 air (飞机) train（火车） hotel（酒店）
 * @param params.from 设备 computer (电脑) mobile（手机）
 * @param params.hotelSt 住宿开始时间
 * @param params.hotelEt 住宿结束时间
 * @returns {*}
 */
export function getBookListUrl(params: {spval: string, epval: string, st: string, hotelCity: string,
    hotelAddress: string, type: string, from: string, hotelSt: string, hotelEt: string}) :Promise<string> {
    var spval = params.spval,
        epval = params.epval,
        st = params.st,
        hotelCity = params.hotelCity,
        hotelAddress = params.hotelAddress,
        type = params.type,
        from = params.from,
        hotelSt = params.hotelSt,
        hotelEt = params.hotelEt,
        url = "";
    if(!type || type == "" ){
        throw {code:-1, msg:"类型不能为空"};
    }
    if(type == "air"){
        if(!spval || spval == "" ){
            throw {code:-1, msg:"出发城市不能为空"};
        }
        if(!epval || epval == "" ){
            throw {code:-1, msg:"目的地不能为空"};
        }
        if(!st || st == "" ){
            throw {code:-1, msg:"出发时间不能为空"};
        }
        st = moment(st).format('YYYY-MM-DD');
        return Promise.all([
                API.place.getCityInfo({cityCode: spval}),
                API.place.getCityInfo({cityCode: epval})
            ])
            .spread<string>(function(deptCity, endPlace){
                var scode = "",
                    ecode = "";
                if(deptCity && deptCity.skyCode){
                    scode = deptCity.skyCode.split("-")[0].toLowerCase();
                }
                if(endPlace && endPlace.skyCode){
                    ecode = endPlace.skyCode.split("-")[0].toLowerCase();
                }
                if(!scode) {
                    throw {code: -6, msg: '您选择的出发地没有机场'};
                }

                if(!ecode) {
                    throw {code: -6, msg: '您选择的目的地没有机场'};
                }
                url = "http://www.tianxun.com/oneway-"+ scode +"-"+ ecode +".html?depdate="+st+"&cabin=Economy";
                return url;
            })
    }else if(type == "train"){
        url = "https://kyfw.12306.cn/otn/leftTicket/init";
        return Promise.resolve(url);
    }else if(type == "hotel"){
        if(!hotelCity || hotelCity == "" ){
            throw {code:-1, msg:"目的地不能为空"};
        }
        return API.place.getCityInfo({cityCode: hotelCity})
            .then(function(result){
                if(result){
                    hotelSt = moment(hotelSt).format('YYYY-MM-DD');
                    hotelEt = moment(hotelEt).format('YYYY-MM-DD');
                    if(from == "computer"){
                        if(!hotelAddress || hotelAddress == "" ){
                            url = "http://hotel.tianxun.com/domestic/"+result.pinyin+"/";
                        }else{
                            url = "http://hotel.tianxun.com/domestic/"+result.pinyin+"/key_"+hotelAddress;
                        }
                    }else{
                        url = "http://m.tianxun.com/hotel/domestic/"+result.pinyin+"/?hotelDate1="+hotelSt+"&hotelDate2="+hotelEt;
                    }
                }else{
                    url = "http://hotel.tianxun.com/?_ga=1.18929464.1095670645.1456827902";
                }
                return url;
            })
    }
}


/**
 * @method getTrafficBudget
 * 获取交通预算
 *
 * @param {String} params.originPlace 出发地
 * @param {String} params.destinationPlace 目的地
 * @param {String} params.outboundDate 出发时间 YYYY-MM-DD
 * @param {String} params.inboundDate 返回时间(可选) YYYY-MM-DD
 * @param {String} params.outLatestArriveTime 最晚到达时间 HH:mm
 * @param {String} params.inLatestArriveTime 返程最晚到达时间 HH:mm
 * @param {Boolean} params.isRoundTrip 是否往返 [如果为true,inboundDate必须存在]
 * @return {Promise} {price: "1000"}
 */
export function getTrafficBudget(params: {originPlace: string, destinationPlace: string, outboundDate: string,
    inboundDate: string, outLatestArriveTime: string, inLatestArriveTime: string, isRoundTrip: boolean}) : Promise<any> {
    var self = this;
    var accountId = self.accountId;

    if (!params) {
        throw new Error(L.ERR.DATA_FORMAT_ERROR());
    }

    if (!params.destinationPlace) {
        throw new Error(JSON.stringify({code: -1, msg: "目的地城市信息不存在"}));
    }

    if (!params.originPlace) {
        throw new Error(JSON.stringify({code: -1, msg: "出发城市信息不存在"}));
    }

    if (!params.outboundDate) {
        throw {code: -1, msg: "出发时间不存在"};
    }

    if (params.isRoundTrip && !params.inboundDate) {
        throw {code: -1, msg: "往返预算,返程日期不能为空"};
    }

    //查询员工信息
    return API.staff.getStaff({id: accountId})
        .then(function(staff) {
            if (!staff || !staff.travelLevel) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
            }
            //查询员工差旅标准
            return API.travelPolicy.getTravelPolicy({id: staff.travelLevel})
        })
        .then(function(travelPolicy) {
            if (!travelPolicy) {
                throw L.ERR.TRAVEL_POLICY_NOT_EXIST();
            }

            return travelPolicy;
        })
        .then(function(travelPolicy) {
            var cabinClass = '';
            if (travelPolicy.planeLevel == '经济舱') {
                cabinClass = 'Economy';
            } else if (travelPolicy.planeLevel == '高端经济舱') {
                cabinClass = 'PremiumEconomy'
            } else if (travelPolicy.planeLevel == '商务舱') {
                cabinClass = 'Business';
            } else if (travelPolicy.planeLevel == '头等舱') {
                cabinClass = 'First';
            }

            var trainCabinClass = '二等座,硬卧';
            if (travelPolicy.trainLevel) {
                trainCabinClass = travelPolicy.trainLevel;
                trainCabinClass = trainCabinClass.replace(/\//g, ",");
            }

            if (params.isRoundTrip) {
                return Promise.all([
                        API.travelbudget.getTrafficBudget({
                            originPlace: params.originPlace,
                            destinationPlace: params.destinationPlace,
                            outboundDate: params.outboundDate,
                            inboundDate: params.inboundDate,
                            latestArriveTime: params.outLatestArriveTime,
                            cabinClass: cabinClass,
                            trainCabinClass: trainCabinClass
                        }),
                        API.travelbudget.getTrafficBudget({
                            originPlace: params.destinationPlace,
                            destinationPlace: params.originPlace,
                            outboundDate: params.inboundDate,
                            latestArriveTime: params.inLatestArriveTime,
                            cabinClass: cabinClass,
                            trainCabinClass: trainCabinClass
                        })
                    ])
                    .spread(function(goTraffic, backTraffic) {
                        var goTrafficPrice = -1;
                        var backTrafficPrice = -1;
                        var traffic = -1;
                        var price = -1;

                        if (goTraffic && goTraffic.price != -1) {
                            goTrafficPrice = goTraffic.price;
                        }

                        if (backTraffic && backTraffic.price != -1) {
                            backTrafficPrice = backTraffic.price;
                        }

                        if (goTrafficPrice >0 && backTrafficPrice > 0) {
                            traffic = Number(goTrafficPrice) + Number(backTrafficPrice);
                        }

                        price = traffic;
                        var result = {
                            goTraffic: goTraffic,
                            backTraffic: backTraffic,
                            traffic: traffic,
                            price: price
                        };
                        return result;
                    });
            } else {
                return API.travelbudget.getTrafficBudget({
                        originPlace: params.originPlace,
                        destinationPlace: params.destinationPlace,
                        outboundDate: params.outboundDate,
                        inboundDate: params.inboundDate,
                        latestArriveTime: params.outLatestArriveTime,
                        cabinClass: cabinClass,
                        trainCabinClass: trainCabinClass
                    })
                    .then(function(traffic) {
                        var result = {
                            goTraffic: traffic,
                            backTraffic: {},
                            traffic: traffic.price || -1,
                            price: traffic.price || -1
                        };
                        return result;
                    });
            }
        })
}

//获取酒店默认价格
function _getDefaultPrice(hotelStar) {
    var price;
    if (typeof hotelStar != 'number') {
        hotelStar = parseInt(hotelStar);
    }

    switch(hotelStar) {
        case 5:
            price = 500;
            break;
        case 4:
            price = 450;
            break;
        case 3:
            price = 400;
            break;
        case 2:
            price = 350;
            break;
        default:
            price = 500;
    }
    return price;
}