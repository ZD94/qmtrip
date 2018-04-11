import * as fs from "fs";
import * as path from "path";
import {Staff} from "_types/staff";

const API = require("@jingli/dnode-api");
const config = require("@jingli/config");
var haversine = require("haversine");
const _ = require("lodash");
import {ISearchHotelParams, ISearchTicketParams, TmcServiceType} from "./index";

var request = require("request-promise");
let moment = require("moment");
import {MTrainLevel, MPlaneLevel} from "_types";
import { IHotel, IFlightAgent } from '_types/travelbudget';
import { L } from '@jingli/language';


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
            username: config.auth.username,
            password: config.auth.password
        };
    }
    let str = JSON.stringify(info);
    str = encodeURIComponent(str);
    return str;
}

/* 获取鲸力供应商 */
export async function getJLAgents() {
    let result;
    let reqUrl = config['java-jingli-order1'].orderLink + "/tmc/suppliers";
    // let reqUrl = "http://192.168.1.144:8080/jingli-order1/tmc/suppliers";

    result = await request({
        url: reqUrl,
        method: 'get',
        headers: {
            agentType: AgentType.JL

        }
    }).catch((e: Error) => {
        throw e;
    });

    if (typeof result == 'string') {
        result = JSON.parse(result);
    }
    // console.log('getJLAgents  ------>   ', result.data);

    return result.data;
}

/* 获取美亚数据 */
export async function getMeiyaFlightData(params: ISearchTicketParams, authData: IMeiyaAuthData[]) {


    let data = [];
    let meiyaParam = {

        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlFlight = config['java-jingli-order1'].orderLink + "/tmc/searchFlight/getList/" + `${params.originPlaceId}/${params.destinationId}/${meiyaParam.depDate}`;
    console.log("urlFlight====>", urlFlight);
    let meiyaResult;
    let isBindService: boolean = false;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        let type = item.type;
        let agentType = item.agentType;
        // console.log('agenttype---->   ', agentType, 'typeof------  ', typeof agentType);
        isBindService = (type == `${TmcServiceType.FLIGHT}` || type == `${TmcServiceType.FLIGHT_ABROAD}`) ? true : false;
        meiyaResult = isBindService ? await request({
            url: urlFlight,
            method: "get",
            headers: {
                auth: meiyaAuth(info),
                supplier: sname,
                agentType: (agentType && agentType == '2') ? AgentType.JL :AgentType.CORP

            }
        }).catch((e: Error) => {
            console.log(e)
        }) : null;
        try {
            meiyaResult = JSON.parse(meiyaResult);

            if(meiyaResult && meiyaResult.code == 0){
                data.push(...meiyaResult.data);
            }else {
                console.log(meiyaResult)
            }
        } catch (e) {
        }
    }
        return data;
    // if (meiyaResult && meiyaResult.code == 0) {
    //     return meiyaResult.data;
    // } else {
    //     return [];
    // }
}

export async function getMeiyaTrainData(params: ISearchTicketParams, authData: IMeiyaAuthData[]) {
    // let departure = await API.place.getCityInfo({ cityCode: params.originPlaceId });
    // let arrival = await API.place.getCityInfo({ cityCode: params.destinationId });
    let data: Array<IMeiyaTrain> = []
    // let trainData: {[index: string]: Array<IMeiyaTrain>} = {};

    let meiyaParam = {
        depCity: params.originPlaceId,
        arrCity: params.destinationId,
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlTrain = config['java-jingli-order1'].orderLink + "/tmc/searchTrains/getList" + `/${meiyaParam.depCity}/${meiyaParam.arrCity}/${meiyaParam.depDate}`;
    console.log("urlTrain===================>", urlTrain);

    let isBindService: boolean = false;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        let type = item.type;
        let agentType = item.agentType;
        // console.log('agenttype---->   ', agentType, 'typeof------  ', typeof agentType);
        isBindService = (type == `${TmcServiceType.TRAIN}` || type == `${TmcServiceType.TRAIN_ABROAD}`) ? true : false;
        let meiyaResult = isBindService
        ? await request({

            url: urlTrain,
            method: "get",
            // qs: meiyaParam,
            headers: {
                auth: meiyaAuth(info),
                supplier: sname,
                agentType: (agentType && agentType == '2') ? AgentType.JL : AgentType.CORP
            }
        }).catch((e: Error) => {
            console.log(e)
        })
        : null;
            try {
                meiyaResult = JSON.parse(meiyaResult);
                if(meiyaResult && meiyaResult.code == 0){
                    data.push(...meiyaResult.data);
                    // trainData[sname] = meiyaResult.data;
                    // data.push(...meiyaResult.data);
                    // meiyaResult.data = data
                }else{
                    console.log(meiyaResult)
                }
            } catch (e) {
                console.log(e)
            }
    }
        return data;
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
    let data: Array<IMeiyaHotel> = [];
    params.checkInDate = moment(params.checkInDate).format("YYYY-MM-DD");
    params.checkOutDate = moment(params.checkOutDate).format("YYYY-MM-DD");
    let urlHotel = config['java-jingli-order1'].orderLink + "/tmc/searchHotel";
    let meiyaResult;
    console.log("urlHotel==>", urlHotel)
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        let agentType = item.agentType;

        let body = {
            city: params.cityId,
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            pageSize: params.pageSize || 50,
            pageNo: params.pageNo || 1,
        }
        console.log("body==>", body);
        let headers = {
            auth: meiyaAuth(info),
            supplier: sname,
            agentType: (agentType && agentType == '2') ? AgentType.JL : AgentType.CORP
        }
        console.log("headers", headers);
        try {
            meiyaResult = await request({
                url: urlHotel,
                method: "POST",
                body: JSON.stringify(body),
                // qs: meiyaParam,
                headers: headers,
            })
            meiyaResult = JSON.parse(meiyaResult);
            if (meiyaResult.code == 0) {
                data.push(...meiyaResult.data);
            } else { 
                throw new L.ERROR_CODE_C(meiyaResult.code, '获取供应商数据错误');
            }
        } catch (err) { 
            console.error('获取美亚数据时错误:', err);
            throw new L.ERROR_CODE_C(500, '获取美亚数据时错误');
        }
    }
    return data;
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
export function handelHotelsData(meiyaHotelData: Array<IMeiyaHotel>, originalData: ISearchHotelParams) {
    let data: any[] = [];
    if (meiyaHotelData) {
        let result: Array<any> = [];
        let handleData;
        for (let item of meiyaHotelData) {
            handleData = transferHotelData(item, originalData);
            result.push(handleData)
        }

        // for (let index in meiyaHotelData) {
        //     console.log(`供应商: ${index}: 酒店数据长度 ===> ${meiyaHotelData[index].length}`);
        //     for (let item of meiyaHotelData[index]) {
        //         handleData = transferHotelData(index, item, originalData);
        //         result.push(handleData)
        //     }
        // }
        data.push(...result);
        return data
    } else {
        return data
    }
}
//坐标距离计算
function getDistance(lat1: string, lng1: string, lat2: string, lng2: string) {
    var dis = 0;
    var radLat1 = toRadians(lat1);
    var radLat2 = toRadians(lat2);
    var deltaLat = radLat1 - radLat2;
    var deltaLng = toRadians(lng1) - toRadians(lng2);
    var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137;

    function toRadians(d: string) {  return Number(d) * Math.PI / 180;}
}

function transferHotelData(meiyaHotelData: IMeiyaHotel, originalData: ISearchHotelParams): any {
    let distance;
    if(originalData.lat && originalData.lon){
        distance = getDistance(meiyaHotelData.latitude || '', meiyaHotelData.longitude || '', originalData.lat, originalData.lon)
        distance = Math.ceil(distance)
    }else{
        distance = null
    }
    let star;
    if(meiyaHotelData.starRating == 0 || meiyaHotelData.starRating == 1){
        star = 2
    }else {
        star = meiyaHotelData.starRating
    }
    let hotelPicture = [];
    if(meiyaHotelData.hotelPictureList && meiyaHotelData.hotelPictureList.length) {
        for(let item of meiyaHotelData.hotelPictureList){
            hotelPicture.push(item.url)
        }
    }

        let model = {
        "name": meiyaHotelData.cnName,
        "star": star,
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
                "name": meiyaHotelData.agent,
                "agentType": meiyaHotelData.agentType || '',
                "price": meiyaHotelData.hotelMinPrice,
                "urlParams": {
                    "hotelId": meiyaHotelData.hotelId
                }
            }
        ],
        hotelPicture,
        "latitude": meiyaHotelData.latitude,
        "longitude": meiyaHotelData.longitude,
        "shortName": meiyaHotelData.cnName,
        "checkInDate": originalData.checkInDate,
        "checkOutDate": originalData.checkOutDate,
        // "commentScore": 9.6,
        distance
    }
    return model
}

//处理美亚飞机数据
export async function handleFlightData(meiyaFlightData: Array<IMeiyaFlight>, originalData: ISearchTicketParams): Promise<any> {
    let data: any[] = [];
    if (meiyaFlightData) {
        let result: Array<any> = [];
        let handleData;
        for (let item of meiyaFlightData) {
            handleData =await transferFlightData(item, originalData)
            result.push(handleData)
        }

        // for (let index in meiyaFlightData) {
        //     console.log(`供应商: ${index}: 航班数据长度 ===> ${meiyaFlightData[index].length}`);
        //     for(let item of meiyaFlightData[index]){
        //         handleData = await transferFlightData(index, item, originalData)
        //         result.push(handleData)
        //     }
        // }
        data.push(...result);
        return data
    } else {
        return data
    }
}

async function transferFlightData(meiyaFlightData: IMeiyaFlight, originalData: ISearchTicketParams): Promise<any> {
    let name;
    let stopItemList;
    if( meiyaFlightData.stopNumber == 1){
       let stopsNo = (meiyaFlightData.carrierNo) ? meiyaFlightData.carrierNo : meiyaFlightData.flightNo;
       let  urlStop = config['java-jingli-order1'].orderLink + "/tmc/stopItems/" + `${stopsNo}/${meiyaFlightData.depDate}`;
       let  stopItem = await request({
            url: urlStop,
            method: "get",
            json:true,
            headers: {
                auth: meiyaAuth(),
                supplier: "meiya"
            }
        })
        stopItemList = stopItem.data
    }else{
        stopItemList = []
    }
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
                case "豪华经济舱":
                    name = 5
                    break
                default:
                    name = 0
            }
            let agentCabin = {
                name,
                "price": item.price,
                "discount": item.discount,
                "cabin": item.cabin,
                "cabinType":item.cabinType,
                "seatNum":item.seatNum,
                "refundChangeInfo":item.refundChangeInfo,
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
        "carrier":meiyaFlightData.carrier,
        "isCodeShare":meiyaFlightData.isCodeShare,
        "planeMode":meiyaFlightData.planeMode,
        "meal":meiyaFlightData.meal,
        stopItemList,
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
        "stopNumber":meiyaFlightData.stopNumber,
        "carry": meiyaFlightData.airline,
        "agents": [
            {
                "name": meiyaFlightData.agent,
                "agentType": meiyaFlightData.agentType || '',
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
export function handleTrainData(meiyaTrainData: Array<IMeiyaTrain>, originalData: ISearchTicketParams) {
    let data: any[] = [];
    if (meiyaTrainData) {
        let result: Array<any> = []
        let handleData;
        for (let item of meiyaTrainData) {
            handleData = transferTrainData(item, originalData)
            result.push(handleData)
        }

        // for (let index in meiyaTrainData) {
        //     console.log(`供应商: ${index}: 火车数据长度 ===> ${meiyaTrainData[index].length}`);
        //     for (let item of meiyaTrainData[index]) {
        //         handleData = transferTrainData(index, item, originalData)
        //         result.push(handleData)
        //     }
        // }
        data.push(...result);
        return data
    } else {
        return data
    }
}


function transferTrainData(meiyaTrainData: IMeiyaTrain, originalData: ISearchTicketParams) {
    let departDateTime = meiyaTrainData.StartTimeLong;
    let arrivalDateTime = meiyaTrainData.EndTimeLong;
    let cabins: any[];
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
                case "动卧":
                    name = 10
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
                "name": meiyaTrainData.agent,
                "agentType": meiyaTrainData.agentType || '',
                "cabins":cabins,
                "other": {}
            }
        ],
        "ServicePrice":config.trainServicePrice,
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
 * @method 根据指定的介质，进行比较，继而合并同类项
 * @param Data
 * @param match {string} 指定相比较的项名
 * @param mergeProperty {string} 指定需要合并属性名, 目前只支持该属性的值类型是数组类型
 */
export function combineData(Data: Array<any>, match: string, mergeProperty: string){
    for(let i = 0; i < Data.length; i++){
        for(let j = i+1; j < Data.length; j++) {
            if(/[\u4e00-\u9fa5]/.test(Data[i][match]) && /[\u4e00-\u9fa5]/.test(Data[j][match])){  //包含中文使用相似度匹配
                let isSame = similarityMatch({
                    base: Data[i][match],
                    target:Data[j][match]
                });
                if(isSame){
                    Data[i][mergeProperty] = _.concat(Data[i][mergeProperty], Data[j][mergeProperty]);
                    Data.splice(j,1);
                    j--;
                }
            }else if(Data[i][match] === Data[j][match]){
                Data[i][mergeProperty] = _.concat(Data[i][mergeProperty], Data[j][mergeProperty]);
                Data.splice(j,1);
                j--;
            }
        }
    }
    return Data;
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
            let agentMeiya: { [index: string]: any } | undefined;
            if (item.latitude && item.longitude && meiya.latitude && meiya.longitude) { //若存在等于0等情况，此时精确度已超过允许范围，直接跳过模糊匹配      
                let end = {latitude: meiya.latitude, longitude: meiya.longitude};
                isNearby = haversine(start, end, {threshold: 3, unit: 'km'}); //距离不超过3km，return true
            }
            if (isNearby) {
                //添加模糊匹配逻辑
                let isMatched = similarityMatch({
                    base: item.name,
                    target: meiya.cnName
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
    let {base, target} = params;
    if (!base || !target) return false;
    if (base == target) 
        return true
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
        if (meiya.name && names.indexOf(meiya.name) > -1) {
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
        result.push(data as IHotel);
    }

    console.log("matchMeiyaHotel matchMeiyaHotel matchMeiyaHotel===>", result.length)

    return result;
}

/**
 * 企业是否绑定供应商类型
 */
export enum AgentType {
    CORP = 1,
    JL = 2

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
    flightPriceInfoList: Array<IMeiyaFlightPriceInfo>;
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
    depTerm?: string | number;
    agent?: string;
    agentType?: string;
    carrierNo?: string;
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
    agent?: string;
    agentType?: string;
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
    hotelPicture?:string
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
    agent?: string;
    agentType?: string;
}

export interface IMeiyaAuthData {
    identify: object,
    sname: string,
    type: string,
    agentType: string
}