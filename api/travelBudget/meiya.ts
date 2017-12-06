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
    let urlFlight = config.tmcUrl + "/searchflight/getlist/" + `${departureCode}/${arrivalCode}/${meiyaParam.depDate}`;
    let meiyaResult = await request({
        url: urlFlight,
        method: "get",
        qs: meiyaParam,
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
    let urlTrain = config.tmcUrl + "/searchTrains/getlist" + `/${meiyaParam.depCity}/${meiyaParam.arrCity}/${meiyaParam.depDate}`;

    let meiyaResult = await request({
        url: urlTrain,
        method: "get",
        qs: meiyaParam,
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

export async function getMeiyaHotelData(params: ISearchHotelParams) {
    let destination = await API.place.getCityInfo({ cityCode: params.cityId });
    params.checkInDate = moment(params.checkInDate).format("YYYY-MM-DD");
    params.checkOutDate = moment(params.checkOutDate).format("YYYY-MM-DD");
    let urlHotel = `${encodeURIComponent(destination.name)}/${params.checkInDate}/${params.checkOutDate}`;
    urlHotel = config.tmcUrl + "/searchhotel/getList/" + urlHotel;
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


export function writeData(filename: string, data: any) {
    let dirPath = path.join(process.cwd(), "./mytest", "data");
    let source = fs.createWriteStream(path.join(dirPath, filename));
    let result = JSON.stringify(data, null, 4);

    source.write(result);
    source.end(() => {
        console.log("数据记录结束 :", filename);
    });
}


/* 匹配数据 */
export function compareFlightData(origin: any, meiyaData: any) {
    for (let item of origin) {
        if (item.type != 1) {
            continue;
        }

        for (let meiya of meiyaData) {
            if (item.No != meiya.flightNo) {
                continue;
            }

            let agentMeiya: {[key: string]: any} = {
                name: "meiya",
                cabins: [],
                other: {
                    fAmount: item.fAmount,  //头等舱全价
                    cAmount: item.cAmount,  //商务舱全价
                    yAmount: item.yAmount   //经济舱全价
                }
            };

            if (!meiya.flightPriceInfoList) {
                continue;
            }
            for (let flightPrice of meiya.flightPriceInfoList) {
                let agentCabin = {
                    name: 2,
                    price: flightPrice.price,
                    cabin: flightPrice.cabin,
                    urlParams: {
                        No: meiya.flightNo,
                        priceId: flightPrice.priceID
                    }
                };

                for (let key in MPlaneLevel){
                    if (MPlaneLevel[key] == flightPrice.cabin){
                        agentCabin.name = Number(key);
                    }
                }

                agentMeiya.cabins.push(agentCabin);
            }

            item.agents.push(agentMeiya);
        }
    }

    return origin;
}

export function compareTrainData(origin: any, meiyaData: any) {
    console.log("compareTrainData meiyaData.length===>", meiyaData.length);
    for (let item of origin) {
        if (item.type != 0) {
            continue;
        }

        for (let trian of meiyaData) {
            if (item.No != trian.TrainNumber) {
                continue;
            }

            let agentMeiya: {[key: string]: any} = {
                name: "meiya",
                cabins: [],
                other: {
                }
            };

            if (!trian.SeatList) {
                continue;
            }

            console.log("meiyaTrain in:", item.No);
            for (let trianSeat of trian.SeatList) {
                let agentCabin = {
                    name: 3,
                    price: trianSeat.SeatPrice,
                    cabin: trianSeat.SeatName,
                    urlParams: {
                        No: trian.TrainNumber,
                        seatName: trianSeat.SeatName,
                        price: trianSeat.SeatPrice
                    }
                };

                for (let key in MTrainLevel){
                    if (MTrainLevel[key] == trianSeat.SeatName){
                        agentCabin.name = Number(key);
                    }
                }
                agentMeiya.cabins.push(agentCabin);
            }

            item.agents.push(agentMeiya);
        }
    }
}


export function compareHotelData(origin: any, meiyaData: any) {
    console.log("compareHotelData meiyaData.length==== >  ", meiyaData.length);
    for (let item of origin) {
        for (let meiya of meiyaData) {
            if (meiya.cnName != item.name) {
                continue;
            }
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

    return origin;
}