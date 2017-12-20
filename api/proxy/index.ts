import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
import { Staff } from "_types/staff";
import { Models } from "_types";
import { EOrderStatus } from "_types/tripPlan";
var request = require("request-promise");
var requestp = require("request");
var path = require("path");
var _ = require("lodash");
var cors = require('cors');
const config = require("@jingli/config");
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout')
const corsOptions = { origin: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'Content-Type,auth,supplier'} 
function resetTimeout(req, res, next){
    req.clearTimeout();
    next();
    //conn_timeout('180s')(req, res, next);
}
class Proxy {
    /**
     * @method 注册获取订单详情事件
     * @param app {Express} 
     * @return {}
     */
    static __initHttpApp(app: Express){
        app.options(/order*/, cors(corsOptions), (req: Request, res: Response, next: Function) => {         
            return res.sendStatus(200);
        })
<<<<<<< HEAD
        app.all(/order.*/, cors(corsOptions),resetTimeout, async (req: Request, res: Response, next: Function) => {
=======
        app.all(/order.*/, cors(corsOptions),resetTimeout, timeout('120s'), async (req: Request, res: Response, next: Function) => {
>>>>>>> dc79eadb20c91ae68f7c67047ad1f148b9dbb0a1
            if(req.method == 'OPTIONS') {
                return next();
            }
            let authstr = req.query.authstr;
            if(!authstr || typeof authstr == 'undefined') 
                authstr = req.body.authstr;
            console.log("======> query ", req.query)
            console.log("======> body ", req.body)
            let token = parseAuthString(authstr);
            let verification = await API.auth.authentication(token);
            if(!verification) {
                console.log("auth failed", JSON.stringify(req.cookies))
                res.sendStatus(401);
                return; 
            }

            let {tripDetailId} = req.query;
            if(!tripDetailId || typeof tripDetailId == undefined)
                tripDetailId = req.body.tripDetailId;
            let tripDetail = await Models.tripDetail.get(tripDetailId)
            if(!tripDetail) {
                console.log("tripDetail not found");
                return res.sendStatus(403);
            }

            let staff: Staff = await Staff.getCurrent();
            if(!staff) {
                staff = await Models.staff.get(tripDetail.accountId);
            }
      
            let addon:{[index: string]: any} = {
                staffID: staff.id,
                companyID: staff.companyId,
                listeningon: `${config.orderSysConfig.tripDetailMonitorUrl}/${tripDetail.id}`
            };
            let headers: {[index: string]: any} = {
               auth: req.headers['auth'],
               supplier: req.headers['supplier'],
               listeningon: `${config.orderSysConfig.tripDetailMonitorUrl}/${tripDetail.id}`
            }
            //headers的测试数据
            // let headers:{[index: string]: any}={
            //     auth: '%7B%22username%22%3A%22JingLiZhiXiang%22%2C%22password%22%3A%22123456%22%7D',
            //     supplier: 'meiya'
            // }

            let body: {[index: string]: any} = req.body;

            if(req.method == 'GET') {
                _.assign(headers, addon)
            }
            if(req.method == 'POST') {
                _.assign(headers, addon)
                _.assign(body, addon);
            }
            let pathstring = req.path;
            pathstring = pathstring.replace("/order", '');
            let url = `${config.orderSysConfig.orderLink}${pathstring}`;
            let result:any;
            console.log("===========url: ", url);
            console.log("===========tripDetailId: ", tripDetailId);
            console.log("==========method, ", req.method)
            console.log("==========method, ", req.body)
            try{
                // result = await request(url, {
                //     headers,
                //     body,
                //     json: true,
                //     method: req.method,
                //     timeout: 500*1000
                // });
                result = await new Promise((resolve,reject) => {  //request-promise 无法设置超时
                    requestp({
                        url,
                        headers,
                        body,
                        json: true,
                        method: req.method,
                        timeout: 120*1000
                    }, (err, res, body) => {
                        if(err) {
                            console.log("-=========>err: ", err);
                            reject(err)
                        }
                        resolve(body);
                    });
                });
            }catch(err) {
                if(err) {
                    console.log("请求预定错误: ", err)
                    return null;
                }  
            }
            console.log("========================> result.", result)
            if(!result) 
                return res.json(null);
            //以下可要，可不要，具体需要对是否回调，哪些接口会回调做判断
            if(typeof result == 'string') {
                result = JSON.parse(result);
            }
            if(result.code == 0 && result.data && !tripDetail.orderNo){  //&& result.data.orderN
                if(result.data.orderNos && typeof(result.data.orderNos) != 'undefined'){
                    tripDetail.reserveStatus = EOrderStatus.await_auditing;  //飞机的orderNos为数组
                    tripDetail.orderNo = result.data.orderNos[0];
                }
                if(result.data.OrderNo && typeof(result.data.OrderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.await_auditing;  //飞机的orderNos为数组
                    tripDetail.orderNo = result.data.OrderNo;
                }  
                if(result.data.orderNo && typeof(result.data.orderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.await_auditing;   //酒店的orderNo为string
                    tripDetail.orderNo = result.data.orderNo;
                }
                await tripDetail.save();
            }
            return res.json(result);

        }); 
    }
}
export default Proxy;



