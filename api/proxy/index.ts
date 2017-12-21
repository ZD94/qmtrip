import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
import { Staff } from "_types/staff";
import { Models } from "_types";
import { EOrderStatus, EOrderType } from "_types/tripPlan";
var request = require("request");
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

        app.all(/order.*/, cors(corsOptions),resetTimeout, timeout('120s'), async (req: Request, res: Response, next: Function) => {
            if(req.method == 'OPTIONS') {
                return next();
            }
            let authstr = req.query.authstr;
            if(!authstr || typeof authstr == 'undefined') 
                authstr = req.body.authstr;
            console.log("======> authstr ", authstr)
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
            console.log("===========url: ", url, '===tripDetailId: ', tripDetailId, '====>method:', req.method, '=======> body: ', req.body);
            try{
                result = await new Promise((resolve,reject) => {  
                    request({ url, headers, body, 
                        json: true,
                        method: req.method,
                        timeout: 120*1000
                    }, (err: Error, res: any, body: any) => {
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
            //以下提交订单成功后，更新订单状态和订单号
            if(typeof result == 'string') {
                result = JSON.parse(result);
            }
            if(result.code == 0 && result.data && !tripDetail.orderNo){  //&& result.data.orderN
                if(result.data.orderNos && typeof(result.data.orderNos) != 'undefined'){
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;  //飞机的orderNos为数组
                    tripDetail.orderNo = result.data.orderNos[0];
                    tripDetail.orderType = EOrderType.PLANE;
                }
                if(result.data.OrderNo && typeof(result.data.OrderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;  //火车的OrderNo为string
                    tripDetail.orderNo = result.data.OrderNo;
                    tripDetail.orderType = EOrderType.TRAIN;
                }  
                if(result.data.orderNo && typeof(result.data.orderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;   //酒店的orderNo为string
                    tripDetail.orderNo = result.data.orderNo;
                    tripDetail.orderType = EOrderType.HOTEL;
                }
                // tripDetail.orderType = body.orderType? body.orderType: null;  //后期返回的orderNo统一后，使用此确定订单类型
                await tripDetail.save();
            }
            return res.json(result);

        }); 
    }
}
export default Proxy;



