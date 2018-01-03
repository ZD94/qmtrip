import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
import { Staff } from "_types/staff";
import { Models } from "_types";
import { AuthRequest, AuthResponse } from '_types/auth';
import {getCompanyTokenByAgent} from '../restful';
var requestp = require("request-promise");
import { EOrderStatus, EOrderType, TripDetail } from "_types/tripPlan";
var request = require("request");
var path = require("path");
var _ = require("lodash");
var cors = require('cors');
const config = require("@jingli/config");
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout');
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
import { genSign } from "@jingli/sign";
const corsOptions = { origin: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'Content-Type, auth, supplier, authstr, staffid, companyid, accountid'} 
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

        app.options(/^\/(order|travel|mall)*/, cors(corsOptions), (req: Request, res: Response, next: Function) => {         
            return res.sendStatus(200);
        })

        // verifyToken

        app.all(/^\/travel.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next: Function) => {

            //公有云验证
            // let staff: Staff = await Staff.getCurrent();
            let {authstr, staffid}  = req.headers;
            let staff: Staff = await Models.staff.get(staffid);
            let companyId: string = staff.company.id;
            let companyToken: string = await getCompanyTokenByAgent(companyId);
            if (!companyToken) {
                throw new Error('换取 token 失败！');
            }
            
            //request to JLCloud(jlbudget) 
            let result: any;
            let pathstr: string = req.path;
            pathstr = pathstr.replace('/travel', '');
            let JLOpenApi: string = config.cloud;
            JLOpenApi = JLOpenApi.replace('/cloud', '');
            let url: string = `${JLOpenApi}${pathstr}`;
            console.log('url-----> ', url);

            try {
                result = await new Promise((resolve, reject) => {
                    return request({
                        uri: url,
                        body: req.body,
                        json: true,
                        method: req.method,
                        qs: req.query,
                        headers: {
                            token: companyToken,
                            companyId: companyId
                        }
                    }, (err, resp, result) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(result);
                    });
                });
                console.log('resultttttt---->', result);
                return res.json(result);
            } catch(err) {
                if (err) {
                    console.error('ERROR TRAVEL In api/proxy/index:   ', err);
                    return null;
                }
            }
        });


        app.all(/^\/supplier.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next: Function) => {

            //公有云验证
            let {authstr, staffid}  = req.headers;
            let staff: Staff = await Models.staff.get(staffid);
            let companyId: string = staff.company.id;
            let companyToken: string = await getCompanyTokenByAgent(companyId);
            if (!companyToken) {
                throw new Error('换取 token 失败！');
            }
            
            //request to JLCloud(jlbudget) 
            let result: any;
            let pathstr: string = req.path;
            pathstr = pathstr.replace('/supplier', '');
            let JLOpenApi: string = config.cloud;
            JLOpenApi.replace('/cloud', '');
            let url: string = `${JLOpenApi}${pathstr}`;

            try {
                result = await new Promise((resolve, reject) => {
                    return request({
                        uri: url,
                        body: req.body,
                        json: true,
                        method: req.method,
                        qs: req.query,
                        headers: {
                            token: companyToken,
                            companyId: companyId
                        }
                    }, (err, resp, result) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(result);
                    });
                });
                return res.json(result);
            } catch(err) {
                if (err) {
                    console.error('ERROR SUPPLIER In api/proxy/index:   ', err);
                    return null;
                }
            }
        });

        // verifyToken
        app.all(/^\/order.*$/, cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function) => {
            
            let staff: Staff = await Staff.getCurrent();
            let staffId = req.headers.staffid;
            if(staffId && !staff) {
                staff = await Models.staff.get(staffId);
            }

            let {tripDetailId} = req.query;

            let listeningon: string;
            if(!tripDetailId || typeof tripDetailId == undefined){
                if(req.body.tripDetailId) {
                    tripDetailId = req.body.tripDetailId;
                }
            }
            let tripDetail: TripDetail;
            if(tripDetailId) {
                tripDetail = await Models.tripDetail.get(tripDetailId)
                if(!tripDetail) {
                    console.log("tripDetail not found");
                    return res.sendStatus(403);
                }       
                if(!staff) {
                    staff = await Models.staff.get(tripDetail.accountId);
                }
                listeningon = `${config.orderSysConfig.tripDetailMonitorUrl}/${tripDetail.id}`;
            }

            let addon:{[index: string]: any} = {
                listeningon: listeningon     
            };
            
            let headers: {[index: string]: any} = {
               auth: req.headers['auth'],
               supplier: req.headers['supplier'],
               accountid: staff.accountId,
               staffid: staff.id,
               companyid: staff.companyId,    
            }

            let body: {[index: string]: any} = req.body;
            let qs: {[index: string]: any} = req.query;

            if(req.method == 'GET') {
                _.assign(headers, addon)
            } else {
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
                    request({ url, headers, body, qs,
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
            if(tripDetail && result.code == 0 && result.data && tripDetail.orderNo == null){  //&& result.data.orderN
                if(result.data.orderNos && typeof(result.data.orderNos) != 'undefined'){
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;  //飞机的orderNos为数组
                    tripDetail.orderNo = result.data.orderNos[0];
                }
                if(result.data.OrderNo && typeof(result.data.OrderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;  //火车的OrderNo为string
                    tripDetail.orderNo = result.data.OrderNo;
                }  
                if(result.data.orderNo && typeof(result.data.orderNo) != 'undefined') {  
                    tripDetail.reserveStatus = EOrderStatus.AUDITING;   //酒店的orderNo为string
                    tripDetail.orderNo = result.data.orderNo;
                }
                tripDetail.orderType = body.orderType != null? body.orderType: null;  //后期返回的orderNo统一后，使用此确定订单类型
                await tripDetail.save();
            }
            return res.json(result);

        });
        
        app.all(/^\/mall.*$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
            let {staffid, companyid, accountid} = req.headers;
            let params =  req.body;
            if(req.method == 'GET') {
                params = req.query;
            }
            let staff = await Models.staff.get(staffid);
            let appSecret = config.mall.appSecret;
            let pathstring = req.path;
            let timestamp = Math.floor(Date.now()/1000);
            pathstring = pathstring.replace("/mall", '');
            let sign = genSign(params, timestamp, appSecret)
            let url = `${config.mall.orderLink}${pathstring}`;
            console.log("==timestamp:  ", timestamp, "===>sign", sign, '====>url', url, 'appid: ', config.mall.appId, '===request params: ', params) 
            let result = await new Promise((resolve, reject) => {
                return request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        sign: sign,
                        appid: config.mall.appId,
                        staffid: staff.id, 
                        companyid: staff.companyId,
                        accountid: staff.accountId
                    }
                }, (err, resp, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            });
            console.log("===mall===result: ", result)
            return res.json(result);
        });


        app.all(/^\/bill.*$/ ,cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
            let {staffid, companyid, accountid} = req.headers;
            let params =  req.body;
            if(req.method == 'GET') {
                params = req.query;
            }
            let appSecret = config.bill.appSecret;
            let staff = await Models.staff.get(staffid)
            let pathstring = req.path;
            let timestamp = Math.floor(Date.now()/1000);
            pathstring = pathstring.replace("/bill", '');
            let sign = genSign(params, timestamp, appSecret)
            let url = `${config.bill.orderLink}${pathstring}`;
            console.log("==timestamp:  ", timestamp, "===>sign", sign, '====>url', url, 'appid: ', config.bill.appId, '===request params: ', params) 
            let result = await new Promise((resolve, reject) => {
                return request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        sign: sign,
                        appid: config.bill.appId,
                        staffid: staff.id, 
                        companyid: staff.companyId,
                        accountid: staff.accountId
                    }
                }, (err, resp, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            });
            console.log("===bill===result: ", result)
            return res.json(result);
        });

        
        app.all(/^\/permission.*$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
            let {staffid, companyid, accountid} = req.headers;
            let params =  req.body;
            if(req.method == 'GET') {
                params = req.query;
            }
            let staff = await Models.staff.get(staffid);
            let appSecret = config.permission.appSecret;
            let pathstring = req.path;
            let timestamp = Math.floor(Date.now()/1000);
            pathstring = pathstring.replace("/permission", '');
            let sign = genSign(params, timestamp, appSecret);
            let url = `${config.permission.orderLink}${pathstring}`;
            console.log("==timestamp:  ", timestamp, "===>sign:  ", sign, '====>url:  ', url, 'appid: ', config.permission.appId, '===request params: ', params);
            let result = await new Promise((resolve, reject) => {
                return request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        sign: sign,
                        appid: config.permission.appId,
                        staffid: staff.id,
                        staffname: staff.name,
                        companyid: staff.companyId,
                        accountid: staff.accountId
                    }
                }, (err, resp, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            });
            console.log("===permission===result: ", result);
            return res.json(result);
        });
    }
}
export default Proxy;

async function verify(req: Request, res: Response, next: Function) {
    if(req.method == 'OPTIONS') {
        return next();
    }
    let {authstr, staffid} = req.headers;
    console.log("======> authstr ", authstr, staffid)
    let token = parseAuthString(authstr);
    let verification: AuthResponse = await API.auth.authentication(token);
    console.log("-======>verification:  ", verification)
    if(!verification) {
        console.log("auth failed", JSON.stringify(req.cookies))
        return res.sendStatus(401);
    }
    try{
        await API.auth.setCurrentStaffId({
            accountId : verification.accountId,
            staffId   : staffid
        })
    } catch(err) {
        if(err)
            return res.sendStatus(401);
    }
    next();
}
var verifyToken = CLSNS.bind(verify, CLSNS.createContext())




