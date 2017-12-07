/*
 * @Author: Mr.He 
 * @Date: 2017-12-06 18:17:21 
 * @Last Modified by: Mr.He
 * @Last Modified time: 2017-12-06 20:06:12
 * @content what is the content of this file. */

let fs = require("fs");
let path = require("path");


dealHotel();
dealTraffic();


function dealHotel(){
    let hotelData = require("../meiyaData/2017_12_06_05_28_07.finallyHotel");

    for (let hotel of hotelData) {
        if (checkHasMeiya(hotel.agents)) {
            continue;
        }

        //增加一个meiya
        let data = {
            "name": "meiya",
            "price": hotel.agents[0].price,
            "urlParams": {
                "hotelId": "20421691"
            }
        }
        hotel.agents.push(data);
    }

    writeData("finallyUsingHotel.json", hotelData);
}


function dealTraffic(){
    let trafficData = require("../meiyaData/2017_12_06_05_11_24.finallyTraffic");
    for (let ticket of trafficData){
        if (checkHasMeiya(ticket.agents)){
            continue;
        }

        if(ticket.type == 0){
            //火车
            let data = {
                "name": "meiya",
                "cabins": [
                    {
                        "name": 3,
                        "price": 793,
                        "cabin": "二等座",
                        "urlParams": {
                            "No": "G1301",
                            "seatName": "二等座",
                            "price": 793
                        }
                    },
                    {
                        "name": 2,
                        "price": 1302.5,
                        "cabin": "一等座",
                        "urlParams": {
                            "No": "G1301",
                            "seatName": "一等座",
                            "price": 1302.5
                        }
                    },
                    {
                        "name": 1,
                        "price": 2492.5,
                        "cabin": "商务座",
                        "urlParams": {
                            "No": "G1301",
                            "seatName": "商务座",
                            "price": 2492.5
                        }
                    }
                ],
                "other": {}
            };

            ticket.agents.push(data);
        }

        if(ticket.type == 1){
            //机票
            let data = {
                "name": "meiya",
                "cabins": [
                    {
                        "name": 2,
                        "price": ticket.agents[0].cabins[0].price,
                        "cabin": "经济舱",
                        "urlParams": {
                            "No": "FM9319",
                            "priceId": "12"
                        }
                    }
                ],
                "other": {}
            }
            ticket.agents.push(data);
        }
    }
    writeData("finallyUsingTraffic.json", trafficData);
}













function checkHasMeiya(agents){
    for(let item of agents){
        if(item.name == "meiya"){
            return true;
        }
    }

    return false;
}

function writeData(filename, data){
    let source = fs.createWriteStream(path.join(process.cwd(),filename));
    let result = JSON.stringify(data, null, 4);

    source.write(result);
    source.end(() => {
        console.log("酒店数据记录结束");
    });
}

