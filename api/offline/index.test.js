/**
 * Created by hxs on 17/7/28.
 */

let path = require("path");
require("ts-node").register({});
require('app-module-path').addPath(path.join(__dirname, "../../"));

let request = require("request");
let moment = require("moment");
let md5 = require("md5");
let uuid = require("uuid");
let config = require("../../config/config");
let expect = require("chai").expect;

function signToken(...args) {
    args = args.map((arg)=>{
        if(typeof arg === 'number'){
            return arg.toString(16);
        }
        if(arg instanceof Date){
            return Math.floor(arg.getTime()/1000).toString(16);
        }
        if(typeof arg === 'object'){
            throw new TypeError('signToken not accept argument of type:'+(typeof arg));
        }
        return arg;
    })
    return md5(args.join('|'));
}


describe("测试web接口/offlineApprove", function(){
    // this.timeout(60 * 1000);

    let param1 = {
        "accountId":"e3e79870-1b7c-11e7-a571-7fedc950bceb",
        "tokenId":"f2696ea0-1b7c-11e7-a571-7fedc950bceb",
        "token":"o404xRwqse",
        "is_first_login":false
    };

    let param = {
        tokenId: "f2696ea0-1b7c-11e7-a571-7fedc950bceb",
        timestamp: new Date(),
        staffId : "e3e79870-1b7c-11e7-a571-7fedc950bceb"
    };

    let sign = signToken( param1.accountId, param.tokenId, param1.token, param.timestamp );

    it("测试身份认证，验证失败", (done)=>{
        request.post("http://localhost:4002/offlineApprove", {
            form : {
                identity : {
                    tokenId: "dfdfdfdfdfdf",
                    timestamp: new Date(),
                    sign,
                    staffId : param.staffId
                }
            }
        }, function(err, httpResponse, body){
            if(err){
                console.log(err);
                return;
            }
            let result;
            try{
                result = JSON.parse( body );
            }catch(e){
                result = body;
            }
            expect(result.status).to.be.equal(500); 
            done();          
        });
    });




    it("测试城市输入错误返回结果", (done)=>{

        request.post("http://localhost:4002/offlineApprove", {
            form : {
                identity : {
                    tokenId: param.tokenId,
                    timestamp: new Date(),
                    sign,
                    staffId : param.staffId
                },
                param : {
                    projectName : "test乌台诗案",
                    leaveCityName: "北京市",
                    backCityName : "北京22",
                    destinationName: "重庆",
                    lastArrivalDate : moment().add(1, 'd').valueOf(),   //最晚到达
                    mostLeaveDate  : moment().add(2, 'd').valueOf(),    //最早离开
                    reason : "play, just play",
                    approveName : 'Mr.He',
                    signId : uuid.v1()
                }
            }
        }, function(err, httpResponse, body){

            if(err){
                console.log(err);
            }

            let result;
            try{
                result = JSON.parse( body );
            }catch(e){
                result = body;
            }

            expect(result.status == 200).to.be.ok;
            done();
        });
    });


    it("测试各项输入正确的返回结果", (done)=>{

        request.post("http://localhost:4002/offlineApprove", {
            form : {
                identity : {
                    tokenId: param.tokenId,
                    timestamp: new Date(),
                    sign,
                    staffId : param.staffId
                },
                param : {
                    projectName : "test乌台诗案",
                    leaveCityName: "北京市",
                    backCityName : "北京",
                    destinationName: "重庆",
                    lastArrivalDate : moment().add(1, 'd').valueOf(),   //最晚到达
                    mostLeaveDate  : moment().add(2, 'd').valueOf(),    //最早离开
                    reason : "play, just play",
                    approveName : '王亚丽',
                    signId : uuid.v1()
                }
            }
        }, function(err, httpResponse, body){

            if(err){
                console.log(err);
            }

            let result;
            try{
                result = JSON.parse( body );
            }catch(e){
                result = body;
            }

            expect(result.status == 200).to.be.ok;
            done();
        });
    })
});

