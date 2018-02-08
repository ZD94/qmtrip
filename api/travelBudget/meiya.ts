import * as fs from "fs";
import * as path from "path";
import {Staff} from "_types/staff";

const API = require("@jingli/dnode-api");
const config = require("@jingli/config");
var haversine = require("haversine");
import {ISearchHotelParams, ISearchTicketParams} from "./index";

var request = require("request-promise");
let moment = require("moment");
import {MTrainLevel, MPlaneLevel} from "_types";
import { IHotel, IFlightAgent } from '_types/travelbudget';

/* 判断是否需要美亚数据 */
export async function meiyaJudge() {
    let currentStaff = await Staff.getCurrent();
    let suppliers = await API.company.getAllSuppliers({companyId: currentStaff.company.id});
    for (let item of suppliers) {
        if (item.name == "meiya") {
            return true;
        }
    }

    return false;
}

/* 美亚认证信息 */
export function meiyaAuth(info?: object) {
    if (!info) {
        info = {
            username: "JingLiZhiXiang",
            password: "asdasdasdas"
        };
    }
    let str = JSON.stringify(info);
    str = encodeURIComponent(str);
    return str;
}

/* 获取美亚数据 */
export async function getMeiyaFlightData(params: ISearchTicketParams, authData: IMeiyaAuthData[]) {
    // let data = [];
    let flightData: {[index: string]: Array<IMeiyaFlight>} = {};
    // let departure = await API.place.getCityInfo({ cityCode: params.originPlaceId });
    // let arrival = await API.place.getCityInfo({ cityCode: params.destinationId });

    // let departureCode = airCode[departure.name] && airCode[departure.name].airCode;
    // let arrivalCode = airCode[arrival.name] && airCode[arrival.name].airCode;
    // if (!departureCode || !arrivalCode) {
    // return [];
    // }
    let meiyaParam = {
        // departureCode,
        // arrivalCode,
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlFlight = config.orderSysConfig.orderLink + "/tmc/searchFlight/getList/" + `${params.originPlaceId}/${params.destinationId}/${meiyaParam.depDate}`;
    console.log("urlFlight====>", urlFlight);
    let meiyaResult;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        meiyaResult = await request({
            url: urlFlight,
            method: "get",
            // qs: meiyaParam,
            headers: {
                auth: meiyaAuth(info),
                supplier: sname
            }
        }).catch((e: Error) => {
            console.log(e)
        });
        try {
            meiyaResult = JSON.parse(meiyaResult);
            if(meiyaResult.code == 0){
                flightData[sname] = meiyaResult.data;
                // data.push(...meiyaResult.data);
                // meiyaResult.data = data
            }else {
                console.log(meiyaResult)
            }
        } catch (e) {
        }
    }
        return flightData;
    // if (meiyaResult && meiyaResult.code == 0) {
    //     return meiyaResult.data;
    // } else {
    //     return [];
    // }
}

export async function getMeiyaTrainData(params: ISearchTicketParams, authData: IMeiyaAuthData[]) {
    // let departure = await API.place.getCityInfo({ cityCode: params.originPlaceId });
    // let arrival = await API.place.getCityInfo({ cityCode: params.destinationId });
    // let data = []
    let trainData: {[index: string]: Array<IMeiyaTrain>} = {};
    let meiyaParam = {
        depCity: params.originPlaceId,
        arrCity: params.destinationId,
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlTrain = config.orderSysConfig.orderLink + "/tmc/searchTrains/getList" + `/${meiyaParam.depCity}/${meiyaParam.arrCity}/${meiyaParam.depDate}`;
    console.log("urlTrain===================>", urlTrain);
    let meiyaResult;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        meiyaResult = await request({
            url: urlTrain,
            method: "get",
            // qs: meiyaParam,
            headers: {
                auth: meiyaAuth(info),
                supplier: sname
            }
        }).catch((e: Error) => {
            console.log(e)
        });
            try {
                meiyaResult = JSON.parse(meiyaResult);
                if(meiyaResult.code == 0){
                    trainData[sname] = meiyaResult.data;
                    // data.push(...meiyaResult.data);
                    // meiyaResult.data = data
                }else{
                    console.log(meiyaResult)
                }
            } catch (e) {
                console.log(e)
            }
    }
        return trainData;
    // if (meiyaResult && meiyaResult.code == 0) {
    //     return meiyaResult.data;
    // } else {
    //     return [];
    // }
}

/**
 * @method 匹配jlbudget酒店数据为基础，meiya不一定都有
 */
export async function getMeiyaHotelData(params: ISearchHotelParams, authData: IMeiyaAuthData[]) {
    // let data = [];
    let hotelData: {[index: string]: Array<IMeiyaHotel>} = {};
    // let destination = await API.place.getCityInfo({ cityCode: params.cityId });
    params.checkInDate = moment(params.checkInDate).format("YYYY-MM-DD");
    params.checkOutDate = moment(params.checkOutDate).format("YYYY-MM-DD");
    let urlHotel = `${params.cityId}/${params.checkInDate}/${params.checkOutDate}`;
    urlHotel = config.orderSysConfig.orderLink + "/tmc/searchHotel/getList/" + urlHotel;
    console.log("urlHotel =====>", urlHotel);
    let meiyaResult;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        meiyaResult = await request({
            url: urlHotel,
            method: "get",
            // qs: meiyaParam,
            headers: {
                auth: meiyaAuth(info),
                supplier: sname
            }
        }).catch((e: Error) => {
            console.log(e)
        });
        try {
            meiyaResult = JSON.parse(meiyaResult);
            if(meiyaResult.code == 0){
                hotelData[sname] = meiyaResult.data;
                // data.push(...meiyaResult.data);
                // meiyaResult.data = data
            }else{
                console.log(meiyaResult)
            }
        } catch (e) {
            console.log(e)
        }
    }
        return hotelData;
    // if (meiyaResult && meiyaResult.code == 0) {
    //     return meiyaResult.data;
    // } else {
    //     return [];
    // }
}


export function writeData(filename: string, data: object) {
    let dirPath = path.join(process.cwd(), "./mytest", "data");
    let source = fs.createWriteStream(path.join(dirPath, filename));
    let result = JSON.stringify(data, null, 4);

    source.write(result);
    source.end(() => {
        console.log("数据记录结束 :", filename);
    });
}


/**
 * @method 匹配jlbudget飞机数据为基础，meiya不一定都有
 */
export function compareFlightData(origin: IFlightAgent[], meiyaData: IMeiyaFlight[]) {
    console.log("compareTrainData origin.length===>", origin.length);
    console.log("compareTrainData meiyaData.length===>", meiyaData.length);
    if (!origin || typeof (origin) == 'undefined')
        return [];
    if (!meiyaData || typeof (meiyaData) == 'undefined' || !meiyaData.length)
        return origin;

    origin = origin.map((item: any) => {
        if (!item) return null;
        if (item.type != 1)
            return item;
        for (let flight of meiyaData) {
            if (!flight.flightNo) return;
            if (item.No && flight.flightNo && item.No.trim() != flight.flightNo.trim())
                continue;
            if (!flight.flightPriceInfoList || typeof (flight.flightPriceInfoList) == 'undefined')
                continue;

            let cabins = flight.flightPriceInfoList.map((flightDetail: any) => {
                if (!flightDetail) return null;
                let agentCabin = {
                    name: 2,
                    price: flightDetail.price,
                    cabin: flightDetail.cabin,
                    urlParams: {
                        No: flight.flightNo,
                        priceId: flightDetail.priceID
                    }
                };

                for (let key in MPlaneLevel) {
                    if (MPlaneLevel[key] == flightDetail.cabin) {
                        agentCabin.name = Number(key);
                    }
                }
                return agentCabin;
            }).filter((agentCabin: any) => {
                if (!agentCabin || typeof (agentCabin) == 'undefined') return false;
                return true;
            });

            if (!item.agents) {
                item.agents = [{
                    name: "meiya", cabins: cabins, other: {
                        fAmount: item.fAmount,  //头等舱全价
                        cAmount: item.cAmount,  //商务舱全价
                        yAmount: item.yAmount   //经济舱全价
                    }
                }];
            }

            if (item.agents) {
                item.agents.push({
                    name: "meiya", cabins: cabins, other: {
                        fAmount: item.fAmount,  //头等舱全价
                        cAmount: item.cAmount,  //商务舱全价
                        yAmount: item.yAmount   //经济舱全价
                    }
                });
            }
        }
        return item;
    }).filter((item: any) => {
        if (!item || typeof (item) == 'undefined') return false;
        return true;
    });

    console.log("compareTrainData origin.length===>", origin.length);
    return origin;
}

/**
 * @method 火车数据匹配，以meiya为基础数据
 */
export function compareTrainData(origin: any[], meiyaData: IMeiyaTrain[]) {
    console.log("compareTrainData origin.length===>", origin.length);
    console.log("compareTrainData meiyaData.length===>", meiyaData.length);
    if (!origin || typeof (origin) == 'undefined')
        return [];
    if (!meiyaData || typeof (meiyaData) == 'undefined' || !meiyaData.length)
        return origin;
    origin = origin.map((item) => {
        if (!item) return null;
        if (item.type != 0) {
            return item;
        }
        for (let train of meiyaData) {
            if (!train.TrainNumber) continue;
            //用于测试，需要删除
            // if(train.No && train.TrainNumber && train.No.trim() != train.TrainNumber.trim()) 
            //     continue ;
            if (item.No && train.TrainNumber && item.No.trim() != train.TrainNumber.trim())
                continue;
            if (!train.SeatList || typeof (train.SeatList) == 'undefined') {
                continue;
            }

            let cabins = train.SeatList.map((seat: any) => {
                if (!seat) return null;
                let agentCabin = {
                    name: 3,
                    price: seat.SeatPrice,
                    cabin: seat.SeatName,
                    urlParams: {
                        No: train.TrainNumber,
                        seatName: seat.SeatName,
                        price: seat.SeatPrice
                    }
                };

                for (let key in MTrainLevel) {
                    if (MTrainLevel[key] == seat.SeatName) {
                        agentCabin.name = Number(key);
                    }
                }
                return agentCabin;
            }).filter((agentCabin) => {
                if (!agentCabin || typeof (agentCabin) == 'undefined') return false;
                return true;
            });


            if (!item.agents)
                item.agents = [{name: "meiya", cabins: cabins, other: {}}];
            if (item.agents)
                item.agents.push({name: "meiya", cabins: cabins, other: {}});

        }
        return item;
    }).filter((item: any) => {
        if (!item || typeof (item) == 'undefined') return false;
        return true;
    });

    if (!origin)
        return [];
    console.log("after ===============compareTrainData meiyaData.length===>", origin.length);
    return origin;
}

//处理美亚酒店数据
export function handelHotelsData(meiyaHotelData: {[index: string]: Array<IMeiyaHotel>}, originalData: ISearchHotelParams) {
    let data: any[] = [];
    if (meiyaHotelData && meiyaHotelData.length) {
        let result: Array<any> = [];
        let handleData;
        for (let index in meiyaHotelData) {
            for (let item of meiyaHotelData[index]) {
                handleData = transferHotelData(index, item, originalData);
                result.push(handleData)
            }
        }
        data.push(...result);
        return data
    } else {
        return data
    }
}

function transferHotelData(supplierName: string, meiyaHotelData: IMeiyaHotel, originalData: ISearchHotelParams) {
    let model = {
        "name": meiyaHotelData.cnName,
        "star": meiyaHotelData.starRating,
        "agents": [
            // {
            //     "name": "meiya",
            //     // "price": 2488,
            //     // "bookUrl": "http://m.ctrip.com/webapp/hotel/hoteldetail/371132.html?daylater=20&days=4&contrl=0&pay=0&latlon=#fromList",
            //     "deeplinkData": {
            //         "type": "domestic",
            //         "hotelId": meiyaHotelData.hotelId,
            //         "checkInDate": originalData.checkInDate,
            //         "checkOutDate":originalData.checkOutDate
            //     }
            // },
            {
                "name": supplierName,
                "price": meiyaHotelData.hotelMinPrice,
                "urlParams": {
                    "hotelId": meiyaHotelData.hotelId
                }
            }
        ],
        "latitude": meiyaHotelData.latitude,
        "longitude": meiyaHotelData.longitude,
        "shortName": meiyaHotelData.cnName,
        "checkInDate": originalData.checkInDate,
        "checkOutDate": originalData.checkOutDate,
        // "commentScore": 9.6,
        "distance": 440
    }
    return model
}

//处理美亚飞机数据
export function handleFlightData(meiyaFlightData: {[index: string]:Array<IMeiyaFlight>}, originalData: ISearchTicketParams) {
    let data: any[] = [];
    if (meiyaFlightData && meiyaFlightData.length) {
        let result: Array<any> = [];
        let handleData;
            for (let index in meiyaFlightData) {
                for(let item of meiyaFlightData[index]){
                    handleData = transferFlightData(index, item, originalData)
                    result.push(handleData)
                }
            }
        data.push(...result);
        return data
    } else {
        return data
    }
}

function transferFlightData(supplierName: string, meiyaFlightData: IMeiyaFlight, originalData: ISearchTicketParams) {
    let name;
       let cabins = meiyaFlightData.flightPriceInfoList.map((item)=>{
            switch (item.cabin){
                case "经济舱":
                    name = 2
                break;
                case "头等舱":
                    name = 3
                break;
                case "商务舱":
                    name = 4
                break;
                case "高端经济舱":
                    name = 5
                break;
                default:
                    name = 0
            }
            let agentCabin = {
                name,
                "price": item.price,
                "discount": item.discount,
                "cabin": item.cabin,
                "seatNum":item.seatNum,
                "urlParams": {
                    "No": meiyaFlightData.flightNo,
                    "priceId": item.priceID,
                }
            }
            return agentCabin
        })
    let arriDateTime = meiyaFlightData.arrDate + " " + meiyaFlightData.arrTime;
    let deptDateTime = meiyaFlightData.depDate + " " + meiyaFlightData.depTime;
    let model = {
        "No": meiyaFlightData.flightNo,
        "segs": [
            {
                "base": {
                    "flgno": meiyaFlightData.flightNo,
                    "aircode": meiyaFlightData.airlineCode,
                    "ishared": true,
                    "airsname": meiyaFlightData.airline
                },
                // "craft": {
                //     "kind": "中",
                //     "name": "空客",
                //     "series": "321"
                // },
                "arriAirport": {
                    "city": meiyaFlightData.arrival,
                    "code": meiyaFlightData.arrivalCode,
                    "name": meiyaFlightData.desAirport,
                    "bname": meiyaFlightData.arrTerm
                },
                "deptAirport": {
                    "city": meiyaFlightData.departure,
                    "code": meiyaFlightData.departureCode,
                    "name": meiyaFlightData.orgAirport,
                    "bname": meiyaFlightData.depTerm
                },
                "arriDateTime": arriDateTime,
                "deptDateTime": deptDateTime
            }
        ],
        "type": 1,
        "carry": meiyaFlightData.airline,
        "agents": [
            {
                "name": supplierName,
                "cabins":cabins,
                // "bookUrl": "http://m.ctrip.com/html5/flight/swift/domestic/SHA/CAN/2017-12-26",
                "deeplinkData": {
                    "type": "domestic",
                    "flgno": meiyaFlightData.flightNo,
                    "datetime": meiyaFlightData.depDate,
                    "destination": meiyaFlightData.arrivalCode,
                    "originPlace": meiyaFlightData.departureCode
                }
            },
        ],
        // "duration": 170,
        "destination": originalData.destinationId,
        "originPlace": originalData.originPlaceId,
        "originStation": {
            "code": meiyaFlightData.departureCode,
            "port": meiyaFlightData.depTerm
        },
        "departDateTime": deptDateTime,
        "arrivalDateTime": arriDateTime,
        "destinationStation": {
            "code": meiyaFlightData.arrivalCode,
            "port": meiyaFlightData.arrTerm
        }
    }
    return model
}

//处理美亚火车数据
export function handleTrainData(meiyaTrainData: {[index:string]: Array<IMeiyaTrain>}, originalData: ISearchTicketParams) {
    let data: any[] = [];
    if (meiyaTrainData && meiyaTrainData.length) {
        let result: Array<any> = []
        let handleData;
        for (let index in meiyaTrainData) {
            for (let item of meiyaTrainData[index]) {
                handleData = transferTrainData(index, item, originalData)
                result.push(handleData)
            }
        }
        data.push(...result);
        return data
    } else {
        return data
    }
}


function transferTrainData(supplierName: string, meiyaTrainData: IMeiyaTrain, originalData: ISearchTicketParams) {
    let departDateTime = meiyaTrainData.StartTimeLong;
    let arrivalDateTime = meiyaTrainData.EndTimeLong;
    let cabins;
    if(meiyaTrainData.SeatList && meiyaTrainData.SeatList.length >= 1){
        cabins = meiyaTrainData.SeatList.map((item)=>{
            let name:any ;
            switch (item.SeatName){
                case '商务座':
                    name = 1
                break;
                case '一等座':
                    name = 2
                break;
                case '二等座':
                    name = 3
                break;
                case '特等座':
                    name = 4
                break;
                case "高级软卧":
                    name = 5
                break;
                case "软卧":
                    name = 6
                break;
                case "硬卧":
                    name = 7
                break;
                case '软座':
                    name = 8
                break;
                case "硬座":
                    name = 9
                break;
                default:
                name = 0
            }
            let agentCabin = {
                name,
                price: item.SeatPrice,
                cabin: item.SeatName,
                isBookable:item.IsBookable,
                urlParams: {
                    No: meiyaTrainData.TrainNumber,
                    seatName: item.SeatName,
                    price: item.SeatPrice
                }
            };
            return agentCabin
        });
    }else{
        cabins = []
    }
    
    let model = {
        "No": meiyaTrainData.TrainNumber,
        "type": 0,
        "agents": [
            {
                "name": supplierName,
                "cabins":cabins,
                "other": {}
            }
        ],
        "duration": 411,
        "destination": originalData.destinationId,
        "originPlace": originalData.originPlaceId,
        "originStation": {
            "name": meiyaTrainData.DepStation
        },
        "departDateTime":departDateTime,
        "arrivalDateTime": arrivalDateTime,
        "destinationStation": {
            "name": meiyaTrainData.ArrStation
        }
    }
    return model
}


/**
 * @method 酒店数据匹配，以meiya为基础数据
 *    3km范围内的模糊匹配，和3km范围外的严格匹配
 * @param origin {Array} 来自jlbudget的数据
 * @param meiyaData {Array} 来自tmc数据
 * @return {Array}
 */
export function compareHotelData(origin: any[], meiyaData: any[]) {
    console.log("compareHotelData meiyaData.length==== >  ", meiyaData.length);
    if (!origin || typeof (origin) == 'undefined')
        return [];
    if (!meiyaData || typeof (meiyaData) == 'undefined')
        return origin;
    for (let item of origin) {
        let start = {latitude: item.latitude, longitude: item.longitude};
        let isNearby = false;
        for (let meiya of meiyaData) {
            if (!meiya.cnName) continue;
            let agentMeiya: { [index: string]: any };
            if (item.latitude && item.longitude && meiya.latitude && meiya.longitude) { //若存在等于0等情况，此时精确度已超过允许范围，直接跳过模糊匹配      
                let end = {latitude: meiya.latitude, longitude: meiya.longitude};
                isNearby = haversine(start, end, {threshold: 3, unit: 'km'}); //距离不超过3km，return true
            }
            if (isNearby) {
                //添加模糊匹配逻辑
                let isMatched = similarityMatch({
                    base: item.name,
                    target: meiya.cnName,
                    ignores: ['酒店', '旅店', '{}', '()']
                });
                if (!isMatched) continue;
                console.log("meiyaHotel in:", meiya.cnName);
                let price = Math.ceil(Math.random() * 500) + 300;
                agentMeiya = {
                    name: "meiya",
                    price,
                    urlParams: {
                        hotelId: meiya.hotelId
                    }
                }
            }
            if (!isNearby) {
                if (meiya.cnName && item.name && meiya.cnName.trim() != item.name.trim())
                    continue;
                console.log("meiyaHotel in:", meiya.cnName);
                let price = Math.ceil(Math.random() * 500) + 300;
                agentMeiya = {
                    name: "meiya",
                    price,
                    urlParams: {
                        hotelId: meiya.hotelId
                    }
                }
            }
            if (agentMeiya && typeof agentMeiya != 'undefined') {
                if (!item.agents)
                    item.agents = [agentMeiya];
                if (item.agents)
                    item.agents.push(agentMeiya);
            }
        }
    }
    console.log("after ===============compareHotelData meiyaData.length===>", meiyaData.length);
    return matchMeiyaHotel(origin, meiyaData);
}

/**
 * @method 中文相似度匹配-初用于酒店名
 *    考虑因素(暂定)：去掉特定字符，两字符长度对比，是否为子字符, 是否为
 * @param base {string} 基准字符
 * @param target {string} 目标字符
 * @return {boolean} 成功匹配-true， 反之-false
 */
export function similarityMatch(params: {
    base: string,
    target: string,
    ignores?: Array<string>,
    minimalLength?: number
}): boolean {
    let {base, target, minimalLength = 8, ignores} = params;
    if (!base || !target) return false;
    if (ignores) {
        ignores.forEach((ignoreString: any) => {
            if (ignoreString == '()') {
                base = base.replace(/\(.*\)/g, '');
                target = target.replace(/\(.*\)/g, '');
            } else {
                base = base.replace(ignoreString, '');
                target = target.replace(ignoreString, '');
            }
        });
    }
    //互换，设置base为较长的字符
    if (base.length - target.length < 0) {
        let temp = target;
        target = base;
        base = temp;
    }
    let similarity = 0;
    if (base.length < minimalLength || target.length < minimalLength) {
        //两字符串长度关系，相似度加(减)0.1
        if (target.length / base.length >= 0.7) {
            similarity += 0.05;
        } else {
            similarity -= 0.05;
        }
    }
    //满足子字符串关系，相似度添加0.8
    if (base.indexOf(target) > -1)
        similarity += 0.8;

    //单个字符进行位置匹配, 总相似度不超过0.2
    for (let i = 0; i < target.length; i++) {
        let actualPos = (base.indexOf(target.charAt(i)) + 1) / base.length;
        if (actualPos <= 0) continue;
        let expectedPos = (i + 1) / target.length;
        if (Math.abs(actualPos - expectedPos) <= 0.4) {
            similarity += 0.6 / target.length;
        }
        if (Math.abs(actualPos - expectedPos) > 0.4) {
            similarity -= 0.2 / target.length;

        }
    }
    // console.log("=====hotelmatch========similarity: ", similarity)
    if (similarity >= 0.5) //暂定0.5，则返回
        return true;
    return false;
}

export function matchMeiyaHotel(origin: IHotel[], meiyaData: IMeiyaHotel[]) {
    let names: string[] = [];
    let result: IHotel[] = [];
    origin.map((hotel, index: number) => {
        let hasMeiya = false;
        for (let agent of hotel.agents) {
            if (agent.name == "meiya") {
                names.push(hotel.name);
                hasMeiya = true;
                break;
            }
        }

        if (hasMeiya) {
            result.push(hotel);
        }
    });

    let checkInDate = origin[0].checkInDate,
        checkOutDate = origin[0].checkOutDate;

    for (let meiya of meiyaData) {
        if (names.indexOf(meiya.name) > -1) {
            continue;
        }

        let data = {
            "name": meiya.cnName,
            "star": meiya.starRating,
            "agents": [
                {
                    "name": "meiya",
                    "price": Math.ceil(Math.random() * 500) + 300,
                    urlParams: {
                        hotelId: meiya.hotelId
                    }
                }
            ],
            "latitude": meiya.latitude,
            "longitude": meiya.longitude,
            "checkInDate": checkInDate,
            "checkOutDate": checkOutDate,
            "commentScore": Math.ceil(Math.random() * 2) + 8,
            "distance": 2000
        }
        console.log("add one in meiya");
        result.push(data);
    }

    console.log("matchMeiyaHotel matchMeiyaHotel matchMeiyaHotel===>", result.length)

    return result;
}

export interface IMeiyaFlightPriceInfo {
    airPortFree?: number;
    airlineYouHui?: number;
    airlineYouHuiAmount?: number;
    amount?: number;
    cabin?: string;
    cabinType?: string;
    discount?: number,
    flightID?: string;
    meiYaYouHui?: number;
    oilFree?: number;
    policyList?: any;
    priceID?: string;
    protocolType?: number;
    refundChangeInfo?: string;
    seatNum?: string;
    serviceAmount?: number;
    ticketPrice?: number;
    violate?: number;
    price?: number;
}

export interface IMeiyaFlight {
    airlineCode?: string;
    arrDate?: string;
    arrTerm?: string;
    arrTime?: string;
    cAmount?: number;
    carrier?: string;
    depDate?: string;
    depTime?: string;
    desAirport?: string;
    fAmount?: number;
    flightNo: string;
    flightPriceInfoList?: Array<IMeiyaFlightPriceInfo>;
    isCodeShare?: boolean;
    meal?: boolean;
    orgAirport?: string;
    planeMode?: string;
    resultID?: string;
    segmentID?: string;
    stopNumber?: number;
    yAmount?: number;
    airline?: string;
    arrival?: string;
    arrivalCode?: string;
    departure?: string;
    departureCode?: string;
    depTerm?: string | number
}

export interface IMeiyaTrainSeat {
    SeatName: string;
    SeatPrice: string;
    IsBookable: boolean
}

export interface IMeiyaTrain {
    TrainNumber: string;
    SeatList: Array<IMeiyaTrainSeat>;
    ServicePrice?: number;
    DepDate?: string;
    ArrDate?: string;
    DepStation?: string;
    ArrStation?: string;
    StartTimeLong?: Date;
    EndTimeLong?: Date;
}

export interface IMeiyaHotel {
    cnName: string;
    hotelId: string;
    enName?: string;
    address?: string;
    starRating?: number
    mobile?: string
    otherName?: string;
    hotelUrl?: string;
    hotelOpeningTime?: string | Date;
    hotelDecorationTime?: string | Date;
    RecommendCode?: string;
    hotelBusinessCircle?: any;
    hotelPictureList?: any;
    postalCode?: string;
    longitude?: string;
    latitude?: string;
    hotelFax?: string;
    groupName?: string;
    hotelBrand?: null
    supportCARDSCodeList?: any;
    generalAmenities?: any;
    roomAmenities?: any;
    recreationAmenities?: any;
    conferenceAmenities?: any
    diningAmenities?: any;
    description?: string;
    location?: any;
    hotelRoomList?: any;
    strHotelTrafficInformation?: any;
    hotelMinPrice?: number;
    name?: string;
}

export interface IMeiyaAuthData {
    identify: object,
    sname: string
}