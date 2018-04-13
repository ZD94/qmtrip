
const config = require("@jingli/config");

const _ = require("lodash");
import {ISearchHotelParams, ISearchTicketParams, TmcServiceType} from "./index";

var request = require("request-promise");
let moment = require("moment");

import { L } from '@jingli/language';



/* 认证信息 */
export function authentic(info?: object) {
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
    let reqUrl = config['java-jingli-order1'].orderLink + "/tmc/suppliers";

    let result = await request({
        url: reqUrl,
        method: 'get',
        headers: {
            agentType: AgentType.JL
        },
        json: true
    });


    return result.data;
}
async function sendRequest(params: {url: string, method: string, info?: any, sname?: string, agentType?: string, body?: any}) {
    let {url, info, sname, agentType, method, body} = params;
    return await request({
        url: url,
        method: method,
        headers: {
            auth: authentic(info),
            supplier: sname,
            agentType: (agentType && agentType == '2') ? AgentType.JL : AgentType.CORP
        },
        body: body,
        json: true
    })
}
/* 获取tmc数据 */
export async function getFlightData(params: ISearchTicketParams, authData: IAuthData[]) {


    let data = [];
    let tmcParam = {

        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlFlight = config['java-jingli-order1'].orderLink + "/tmc/searchFlight/getList/" + `${params.originPlaceId}/${params.destinationId}/${tmcParam.depDate}`;
    console.log("urlFlight====>", urlFlight);
    let isBindService: boolean = false;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        let type = item.type;
        let agentType = item.agentType;
        isBindService = (type == `${TmcServiceType.FLIGHT}` || type == `${TmcServiceType.FLIGHT_ABROAD}`) ? true : false;
        let result = isBindService ? await sendRequest({url: urlFlight, method: "get", info: info, sname: sname, agentType: agentType}): null;
        try {
            if(result && result.code == 0){
                data.push(...result.data);
            }else {
                console.log(result)
            }
        } catch (e) {
        }
    }
        return data;
}

export async function getTrainData(params: ISearchTicketParams, authData: IAuthData[]) {
    let data: Array<ITMCTrain> = []
    let tmcParam = {
        depCity: params.originPlaceId,
        arrCity: params.destinationId,
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlTrain = config['java-jingli-order1'].orderLink + "/tmc/searchTrains/getList" + `/${tmcParam.depCity}/${tmcParam.arrCity}/${tmcParam.depDate}`;
    console.log("urlTrain===================>", urlTrain);

    let isBindService: boolean = false;
    for (let item of authData) {
        let info = item.identify;
        let sname = item.sname;
        let type = item.type;
        let agentType = item.agentType;
        isBindService = (type == `${TmcServiceType.TRAIN}` || type == `${TmcServiceType.TRAIN_ABROAD}`) ? true : false;
        let result = isBindService ? await sendRequest({url: urlTrain, method: "get", info: info, sname: sname, agentType: agentType}) : null;
            try {
                if(result && result.code == 0){
                    data.push(...result.data);
                }else{
                    console.log(result)
                }
            } catch (e) {
                console.log(e)
            }
    }
        return data;
}

/**
 * @method 匹配jlbudget酒店数据为基础，meiya不一定都有
 */
export async function getHotelData(params: ISearchHotelParams, authData: IAuthData[]) {
    let data: Array<ITMCHotel> = [];
    params.checkInDate = moment(params.checkInDate).format("YYYY-MM-DD");
    params.checkOutDate = moment(params.checkOutDate).format("YYYY-MM-DD");
    let urlHotel = config['java-jingli-order1'].orderLink + "/tmc/searchHotel";
    let result;
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
            auth: authentic(info),
            supplier: sname,
            agentType: (agentType && agentType == '2') ? AgentType.JL : AgentType.CORP
        }
        console.log("headers", headers);
        try {
            result = await sendRequest({url: urlHotel, method: "post", info: info, sname: sname, agentType: agentType, body: body})
            if (result.code == 0) {
                data.push(...result.data);
            } else { 
                throw new L.ERROR_CODE_C(result.code, '获取供应商数据错误');
            }
        } catch (err) { 
            console.error('获取供应商数据时错误:', err);
            throw new L.ERROR_CODE_C(500, '获取供应商数据时错误');
        }
    }
    return data;
}



//处理美亚酒店数据
export function handelHotelsData(tmcHotelData: Array<ITMCHotel>, originalData: ISearchHotelParams) {
    let data: any[] = [];
    if (tmcHotelData) {
        let result: Array<any> = [];
        let handleData;
        for (let item of tmcHotelData) {
            handleData = transferHotelData(item, originalData);
            result.push(handleData)
        }

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

function transferHotelData(tmcHotelData: ITMCHotel, originalData: ISearchHotelParams): any {
    let distance;
    if(originalData.lat && originalData.lon){
        distance = getDistance(tmcHotelData.latitude || '', tmcHotelData.longitude || '', originalData.lat, originalData.lon)
        distance = Math.ceil(distance)
    }else{
        distance = null
    }
    let star;
    if(tmcHotelData.starRating == 0 || tmcHotelData.starRating == 1){
        star = 2
    }else {
        star = tmcHotelData.starRating
    }
    let hotelPicture = [];
    if(tmcHotelData.hotelPictureList && tmcHotelData.hotelPictureList.length) {
        for(let item of tmcHotelData.hotelPictureList){
            hotelPicture.push(item.url)
        }
    }

        let model = {
        "name": tmcHotelData.cnName,
        "star": star,
        "agents": [
            {
                "name": tmcHotelData.agent,
                "agentType": tmcHotelData.agentType || '',
                "price": tmcHotelData.hotelMinPrice,
                "urlParams": {
                    "hotelId": tmcHotelData.hotelId
                }
            }
        ],
        hotelPicture,
        "hotelMinPrice":tmcHotelData.hotelMinPrice,

        "latitude": tmcHotelData.latitude,
        "longitude": tmcHotelData.longitude,
        "baidulongitude":tmcHotelData.baidulongitude,
        "baidulatitude":tmcHotelData.baidulatitude,
        "category":tmcHotelData.category,
        "trafficStation":tmcHotelData.trafficStation,
        "districtZoneName":tmcHotelData.districtZoneName,
        "businessZoneName":tmcHotelData.businessZoneName,
        "bedType":tmcHotelData.bedType,
        "shortName": tmcHotelData.cnName,
        "checkInDate": originalData.checkInDate,
        "checkOutDate": originalData.checkOutDate,
        distance
    }
    return model
}

//处理美亚飞机数据
export async function handleFlightData(tmcFlightData: Array<ITMCFlight>, originalData: ISearchTicketParams): Promise<any> {
    let data: any[] = [];
    if (tmcFlightData) {
        let result: Array<any> = [];
        let handleData;
        for (let item of tmcFlightData) {
            handleData =await transferFlightData(item, originalData)
            result.push(handleData)
        }
        data.push(...result);
        return data
    } else {
        return data
    }
}

async function transferFlightData(tmcFlightData: ITMCFlight, originalData: ISearchTicketParams): Promise<any> {
    let name;
    let stopItemList;
    if( tmcFlightData.stopNumber == 1){
       let stopsNo = (tmcFlightData.carrierNo) ? tmcFlightData.carrierNo : tmcFlightData.flightNo;
       let  urlStop = config['java-jingli-order1'].orderLink + "/tmc/stopItems/" + `${stopsNo}/${tmcFlightData.depDate}`;
       let  stopItem = await request({
            url: urlStop,
            method: "get",
            json:true,
            headers: {
                auth: authentic(),
                supplier: "meiya"
            }
        })
        stopItemList = stopItem.data
    }else{
        stopItemList = []
    }
       let cabins = tmcFlightData.flightPriceInfoList.map((item)=>{
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
                    "No": tmcFlightData.flightNo,
                    "priceId": item.priceID,
                }
            }
            return agentCabin
        })
    let arriDateTime = tmcFlightData.arrDate + " " + tmcFlightData.arrTime;
    let deptDateTime = tmcFlightData.depDate + " " + tmcFlightData.depTime;
    let model = {
        "No": tmcFlightData.flightNo,
        "carrier":tmcFlightData.carrier,
        "isCodeShare":tmcFlightData.isCodeShare,
        "planeMode":tmcFlightData.planeMode,
        "meal":tmcFlightData.meal,
        stopItemList,
        "segs": [
            {
                "base": {
                    "flgno": tmcFlightData.flightNo,
                    "aircode": tmcFlightData.airlineCode,
                    "ishared": true,
                    "airsname": tmcFlightData.airline
                },
                "arriAirport": {
                    "city": tmcFlightData.arrival,
                    "code": tmcFlightData.arrivalCode,
                    "name": tmcFlightData.desAirport,
                    "bname": tmcFlightData.arrTerm
                },
                "deptAirport": {
                    "city": tmcFlightData.departure,
                    "code": tmcFlightData.departureCode,
                    "name": tmcFlightData.orgAirport,
                    "bname": tmcFlightData.depTerm
                },
                "arriDateTime": arriDateTime,
                "deptDateTime": deptDateTime
            }
        ],
        "type": 1,
        "stopNumber":tmcFlightData.stopNumber,
        "carry": tmcFlightData.airline,
        "agents": [
            {
                "name": tmcFlightData.agent,
                "agentType": tmcFlightData.agentType || '',
                "cabins":cabins,
                "deeplinkData": {
                    "type": "domestic",
                    "flgno": tmcFlightData.flightNo,
                    "datetime": tmcFlightData.depDate,
                    "destination": tmcFlightData.arrivalCode,
                    "originPlace": tmcFlightData.departureCode
                }
            },
        ],
        "destination": originalData.destinationId,
        "originPlace": originalData.originPlaceId,
        "originStation": {
            "code": tmcFlightData.departureCode,
            "port": tmcFlightData.depTerm
        },
        "departDateTime": deptDateTime,
        "arrivalDateTime": arriDateTime,
        "destinationStation": {
            "code": tmcFlightData.arrivalCode,
            "port": tmcFlightData.arrTerm
        }
    }
    return model
}

//处理美亚火车数据
export function handleTrainData(tmcTrainData: Array<ITMCTrain>, originalData: ISearchTicketParams) {
    let data: any[] = [];
    if (tmcTrainData) {
        let result: Array<any> = []
        let handleData;
        for (let item of tmcTrainData) {
            handleData = transferTrainData(item, originalData)
            result.push(handleData)
        }

        data.push(...result);
        return data
    } else {
        return data
    }
}


function transferTrainData(tmcTrainData: ITMCTrain, originalData: ISearchTicketParams) {
    let departDateTime = tmcTrainData.StartTimeLong;
    let arrivalDateTime = tmcTrainData.EndTimeLong;
    let cabins: any[];
    if(tmcTrainData.SeatList && tmcTrainData.SeatList.length >= 1){
        cabins = tmcTrainData.SeatList.map((item)=>{
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
                    No: tmcTrainData.TrainNumber,
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
        "No": tmcTrainData.TrainNumber,
        "type": 0,
        "agents": [
            {
                "name": tmcTrainData.agent,
                "agentType": tmcTrainData.agentType || '',
                "cabins":cabins,
                "other": {}
            }
        ],
        "ServicePrice":config.trainServicePrice,
        "duration": 411,
        "destination": originalData.destinationId,
        "originPlace": originalData.originPlaceId,
        "originStation": {
            "name": tmcTrainData.DepStation
        },
        "departDateTime":departDateTime,
        "arrivalDateTime": arrivalDateTime,
        "destinationStation": {
            "name": tmcTrainData.ArrStation
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

/**
 * 企业是否绑定供应商类型
 */
export enum AgentType {
    CORP = 1,
    JL = 2

}

export interface ITMCFlightPriceInfo {
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

export interface ITMCFlight {
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
    flightPriceInfoList: Array<ITMCFlightPriceInfo>;
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

export interface ITMCTrainSeat {
    SeatName: string;
    SeatPrice: string;
    IsBookable: boolean
}

export interface ITMCTrain {
    TrainNumber: string;
    SeatList: Array<ITMCTrainSeat>;
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

export interface ITMCHotel {
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
    baidulongitude?:string;
    baidulatitude?:string;
    category?:string;
    trafficStation?:string;
    districtZoneName?:string;
    businessZoneName?:string;
    bedType?:string;
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

export interface IAuthData {
    identify: object,
    sname: string,
    type: string,
    agentType: string
}