import * as fs from "fs";
import * as path from "path";
import { Staff } from "_types/staff";
const API = require("@jingli/dnode-api");
const config = require("@jingli/config");
import { ISearchHotelParams, ISearchTicketParams } from "./index";
var request = require("request-promise");
let moment = require("moment");
import { MTrainLevel, MPlaneLevel } from "_types";



/* 判断是否需要美亚数据 */
export async function meiyaJudge() {
    let currentStaff = await Staff.getCurrent();
    let suppliers = await API.company.getAllSuppliers({ companyId: currentStaff.company.id });
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
            password: "123456"
        };
    }
    let str = JSON.stringify(info);
    str = encodeURIComponent(str);
    return str;
}

/* 获取美亚数据 */
let airCode = require("libs/suppliers/taobao_com/cityCode");
export async function getMeiyaFlightData(params: ISearchTicketParams) {
    let departure = await API.place.getCityInfo({ cityCode: params.originPlaceId });
    let arrival = await API.place.getCityInfo({ cityCode: params.destinationId });

    let departureCode = airCode[departure.name] && airCode[departure.name].airCode;
    let arrivalCode = airCode[arrival.name] && airCode[arrival.name].airCode;
    if (!departureCode || !arrivalCode) {
        return [];
    }

    let meiyaParam = {
        departureCode,
        arrivalCode,
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlFlight = config.orderSysConfig.orderLink + "/searchflight/getlist/" + `${departureCode}/${arrivalCode}/${meiyaParam.depDate}`;
    console.log("urlFlight====>", urlFlight);
    let meiyaResult = await request({
        url: urlFlight,
        method: "get",
        // qs: meiyaParam,
        headers: {
            auth: meiyaAuth(),
            supplier: "meiya"
        }
    });

    try {
        meiyaResult = JSON.parse(meiyaResult);
    } catch (e) { }

    if (meiyaResult.code == 0) {
        return meiyaResult.data;
    } else {
        return [];
    }
}

export async function getMeiyaTrainData(params: ISearchTicketParams) {
    let departure = await API.place.getCityInfo({ cityCode: params.originPlaceId });
    let arrival = await API.place.getCityInfo({ cityCode: params.destinationId });

    let meiyaParam = {
        depCity: encodeURIComponent(departure.name),
        arrCity: encodeURIComponent(arrival.name),
        depDate: moment(params.leaveDate).format("YYYY-MM-DD")
    };
    let urlTrain = config.orderSysConfig.orderLink + "/searchTrains/getlist" + `/${meiyaParam.depCity}/${meiyaParam.arrCity}/${meiyaParam.depDate}`;
    console.log("urlTrain===================>", urlTrain);
    let meiyaResult = await request({
        url: urlTrain,
        method: "get",
        // qs: meiyaParam,
        headers: {
            auth: meiyaAuth(),
            supplier: "meiya"
        }
    });

    try {
        meiyaResult = JSON.parse(meiyaResult);
    } catch (e) { }

    if (meiyaResult.code == 0) {
        return meiyaResult.data;
    } else {
        return [];
    }
}
/**
 * @method 匹配jlbudget酒店数据为基础，meiya不一定都有
 */
export async function getMeiyaHotelData(params: ISearchHotelParams) {
    let destination = await API.place.getCityInfo({ cityCode: params.cityId });
    params.checkInDate = moment(params.checkInDate).format("YYYY-MM-DD");
    params.checkOutDate = moment(params.checkOutDate).format("YYYY-MM-DD");
    let urlHotel = `${encodeURIComponent(destination.name)}/${params.checkInDate}/${params.checkOutDate}`;
    urlHotel = config.orderSysConfig.orderLink + "/searchhotel/getList/" + urlHotel;
    let meiyaResult = await request({
        url: urlHotel,
        method: "get",
        qs: {},
        headers: {
            auth: meiyaAuth(),
            supplier: "meiya"
        }
    });

    try {
        meiyaResult = JSON.parse(meiyaResult);
    } catch (e) { }

    if (meiyaResult.code == 0) {
        return meiyaResult.data;
    } else {
        return [];
    }
}


export function writeData(filename, data) {
    let dirPath = path.join(process.cwd(), "./meiyaData");
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
export function compareFlightData(origin, meiyaData) {
    console.log("compareTrainData origin.length===>", origin.length);
    console.log("compareTrainData meiyaData.length===>", meiyaData.length);
    if(!origin || typeof(origin) == 'undefined')
        return [];
    if(!meiyaData || typeof(meiyaData) == 'undefined' || !meiyaData.length)
        return origin;

    origin = origin.map((item:any) => {
        if(!item) return null;
        if(item.type != 1) 
            return item;
        for(let flight of meiyaData) {
            if(!flight.flightNo) return;
            if(item.No && flight.flightNo && item.No.trim() != flight.flightNo.trim())
                continue ;
            if (!flight.flightPriceInfoList || typeof(flight.flightPriceInfoList) == 'undefined')
                continue;

            let cabins = flight.flightPriceInfoList.map((flightDetail: any) => {
                if(!flightDetail) return null;
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
                if(!agentCabin || typeof(agentCabin) == 'undefined') return false;
                return true;
            });

            if(!item.agents) {
                item.agents = [{name: "meiya", cabins: cabins, other: {
                    fAmount: item.fAmount,  //头等舱全价
                    cAmount: item.cAmount,  //商务舱全价
                    yAmount: item.yAmount   //经济舱全价
                }}];
            }

            if(item.agents) {
                item.agents.push({name: "meiya", cabins: cabins, other: {
                    fAmount: item.fAmount,  //头等舱全价
                    cAmount: item.cAmount,  //商务舱全价
                    yAmount: item.yAmount   //经济舱全价
                }});
            }
        }
        return item;
    }).filter((item: any) => {
        if(!item || typeof(item) == 'undefined') return false;
        return true;
    });
  
    console.log("compareTrainData origin.length===>", origin.length);
    return origin;
}

/**
 * @method 火车数据匹配，以meiya为基础数据 
 */ 
export function compareTrainData(origin, meiyaData) {
    console.log("compareTrainData origin.length===>", origin.length);
    console.log("compareTrainData meiyaData.length===>", meiyaData.length);
    if(!origin || typeof(origin) == 'undefined')
        return [];
    if(!meiyaData || typeof(meiyaData) == 'undefined' || !meiyaData.length)
        return origin;

    origin = origin.map((item:any) => {
        if(!item) return null;
        if(item.type != 0) {
            return item;
        }
        for(let train of meiyaData) {
            if(train.TrainNumber) continue;
            //用于测试，需要删除
            if(train.No && train.TrainNumber && train.No.trim() != train.TrainNumber.trim()) 
                continue ;
            // if(item.No && train.TrainNumber && item.No.trim() != train.TrainNumber.trim()) 
            //     continue ;
            if (!train.SeatList || typeof(train.SeatList) == 'undefined') {
                continue;
            }

            let cabins = train.SeatList.map((seat: any) => {
                if(!seat) return null;
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
            }).filter((agentCabin: any) => {
                if(!agentCabin || typeof(agentCabin) == 'undefined') return false;
                return true;
            });

            if(!item.agents) 
                item.agents = [{ name: "meiya", cabins: cabins,other: {}}];
            if(item.agents)
                item.agents.push({ name: "meiya", cabins: cabins, other: {}});
 
        }
        return item;
    }).filter((item: any) => {
        if(!item || typeof(item) == 'undefined') return false;
        return true;
    });

    if(!origin) 
        return [];
    console.log("after ===============compareTrainData meiyaData.length===>", origin.length);
    return origin;
}

/**
 * @method 酒店数据匹配，以meiya为基础数据 
 */ 
export function compareHotelData(origin, meiyaData) {
    console.log("compareHotelData meiyaData.length==== >  ", meiyaData.length);
    if(!origin || typeof(origin) == 'undefined')
        return [];
    if(!meiyaData || typeof(meiyaData) == 'undefined')
        return origin;
    let i = 0;
    for (let item of origin) {
        for (let meiya of meiyaData) {
            if(!meiya.cnName) continue;
            if (meiya.cnName && item.name && meiya.cnName.trim() != item.name.trim())
                continue;
            console.log("meiyaHotel in:", meiya.cnName);
            let price = Math.ceil(Math.random() * 500) + 300;
            let agentMeiya = {
                name: "meiya",
                price,
                urlParams: {
                    hotelId: meiya.hotelId
                }
            }
            item.agents.push(agentMeiya);
        }
    }
    console.log("after ===============compareHotelData meiyaData.length===>", meiyaData.length);
    return origin;
}
        // for( i = 0; i < meiyaData; i++) {
        //     let meiya = meiyaData[i];
        //     if (meiya.cnName != item.name) {
        //         continue;
        //     }
        //     console.log("meiyaHotel in:", meiya.cnName);
        //     let price = Math.ceil(Math.random() * 500) + 300;
        //     let agentMeiya = {
        //         name: "meiya",
        //         price,
        //         urlParams: {
        //             hotelId: meiya.hotelId
        //         }
        //     }
        // }