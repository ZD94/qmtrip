import {Request, Response, Application, NextFunction} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
import { Staff } from "_types/staff";
import { Models } from "_types";
import { AuthResponse } from '_types/auth';
import {getCompanyTokenByAgent} from '../restful';
var ApiTravelBudget = require('api/travelBudget');
import { EOrderStatus, TripDetail, ETripDetailStatus, EPayType, Project } from "_types/tripPlan";
var request = require("request");
var _ = require("lodash");
var cors = require('cors');
const config = require("@jingli/config");
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout');
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
import { genSign } from "@jingli/sign";
import { Department } from '_types/department';
import Logger from '@jingli/logger';
import { ITMCSupplier } from 'api/travelBudget';
const logger = new Logger("proxy");
const corsOptions = { 
    origin: true, 
    methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], 
    allowedHeaders: 'content-type, Content-Type, auth, supplier, authstr, staffid, companyid, accountid, isneedauth'
} 
function resetTimeout(req: Request, res: Response, next: NextFunction){
    req['clearTimeout']();
    next();
}
class Proxy {
    /**
     * @method 注册获取订单详情事件
     * @param app {Express} 
     * @return {}
     */
    static __initHttpApp(app: Application){

        app.options(/^\/(order|travel|mall|supplier|bill|permission)*/, cors(corsOptions), (req: Request, res: Response, next: Function) => {         
            return res.sendStatus(200);
        })

        // verifyToken

        app.all(/^\/travel.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next: Function) => {

            //公有云验证
            // let staff: Staff = await Staff.getCurrent();
            let {staffid}  = req.headers;
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
            let JLOpenApi: string = config.cloudAPI;
            let url: string = `${JLOpenApi}${pathstr}`;

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
                }, (err: Error, resp: any, result: object) => {
                    if (err) {
                        logger.error("url:", url, err.stack);
                        return reject(err);
                    }
                    if (typeof result == 'string') { 
                        try {
                            result = JSON.parse(result);
                        } catch (err) { 
                            logger.error('url:', url, err.stack);
                            return reject(err);
                        }
                    }
                    resolve(result);
                });
            });
            return res.json(result);

        });


        app.all(/^\/supplier.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next: Function) => {

            //公有云验证
            let {staffid}  = req.headers;
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
            let JLOpenApi: string = config.cloudAPI;
            let url: string = `${JLOpenApi}${pathstr}`;

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
                }, (err: Error, resp: any, result: object) => {
                    if (err) {
                        logger.error("url:", url, err.stack);
                        return reject(err);
                    }
                    if (typeof result == 'string') { 
                        try {
                            result = JSON.parse(result);
                        } catch (err) { 
                            logger.error('url:', url, err.stack);
                            return reject(err);
                        }
                    }
                    resolve(result);
                });
            });
            return res.json(result);
        });

        /**
         * @method 提供中台、app端的订单转发请求
         *  1. app端根据tripDetailId创、退、改一系列订单请求
         *  2. app端根据staffid, 订单状态获取该员工的相应订单
         *  3. 中台根据companyid获取该公司所有订单
         */
        app.all(/^\/order.*$/, cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function) => {
            let staff: Staff = await Staff.getCurrent();
            let staffId = req.headers.staffid;
            let isNeedAuth = req.headers['isneedauth'] || '';
            if(staffId && !staff) {
                staff = await Models.staff.get(staffId);
            }
            let {tripDetailId, authStr} = req.query;

            let listeningon: string;
            if(!tripDetailId || typeof tripDetailId == undefined){
                if(req.body.tripDetailId) {
                    tripDetailId = req.body.tripDetailId;
                }
            }
            let tripDetail: TripDetail;
            //若tripDetailId存在，为创、退、改相关订单请求封装特殊请求参数
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
                if(req.body.jlPayType == EPayType.PERSONAL_PAY) {
                    await API.tripPlan.updateTripDetail({
                        id: tripDetailId,
                        payType: req.body.jlPayType,
                        status: ETripDetailStatus.WAIT_UPLOAD,
                        reserveStatus: EOrderStatus.WAIT_SUBMIT
                    });
                }
            }

            let addon:{[index: string]: any} = {
                listeningon: listeningon     
            };
            let supplier =req.headers['supplier'] || 'meiya';
            let companyInfo: Array<ITMCSupplier>;
            try{
                companyInfo = await ApiTravelBudget.getCompanyInfo(supplier, staff.id);
            }catch(err){ return res.json({code: 407, msg: "未绑定供应商", data: null}) }
            
            let identify: string|{username:string, password: string} = companyInfo && companyInfo.length ?companyInfo[0].identify: null;
            if(!identify) return res.json({code: 407, msg: "未绑定供应商", data: null});
            if (typeof identify == 'object') {
                identify = JSON.stringify(identify);
            }
            identify = encodeURIComponent(identify);
            let auth: string = (isNeedAuth == '1') ? identify : authStr;
            // let auth : string = identify;

            let headers: {[index: string]: any} = {
               appid: config.orderSysConfig.appId,
               sign: null,
               auth: auth,
               supplier,
               accountid: staff.accountId,
               staffid: staff.id,
               companyid: staff.companyId,
            }

            let body: {[index: string]: any} = req.body;
            let qs: {[index: string]: any} = req.query;

            let timestamp = Math.floor(Date.now()/1000);       
            let sign: string;
            if(req.method == 'GET') {
                sign = genSign(qs, timestamp, config.orderSysConfig.appSecret);
                headers['sign'] = sign;
                _.assign(headers, addon)
            } else {
                _.assign(headers, addon)
                _.assign(body, addon);
                sign = genSign(body, timestamp, config.orderSysConfig.appSecret);
                headers['sign'] = sign;
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
                    }, (err: Error, res: any, result: any) => {
                        if(err) {
                            console.log("-=========>err: ", err);
                            reject(err)
                        }
                        resolve(result);
                    });
                });
            }catch(err) {
                if(err) {
                    console.log("请求预定错误: ", err)
                }
                return res.json(500, null);
            }
            if(!result)
                return res.json(null);
            if(typeof result == 'string') {
                result = JSON.parse(result);
            }
            if(result.code == 0 && tripDetail && (body.orderType || body.orderType == 0)) {
                tripDetail.orderType = body.orderType;  //后期返回的orderNo统一后，使用此确定订单类型
                await tripDetail.save();
            }

            return res.json(result);

        });
        
        app.all(/^\/mall.*$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
            let {staffid} = req.headers;
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
                request({
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
                }, (err: Error, resp: any, result: object) => {
                    if (err) {
                        console.log("-=========>err: ", err);
                        reject(err);
                    }
                    resolve(result);
                });
            });
            return res.json(result);
        });


        app.all(/^\/bill.*$/ ,cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
    
            let {staffid} = req.headers;
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
                }, (err: Error, resp: any, result: object) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            });
            return res.json(result);
        });

        
        app.all(/^\/permission.*$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
      
            let {staffid} = req.headers;
            let params =  req.body;
            if(req.method == 'GET') {
                params = req.query;
            }
            let staff = await Models.staff.get(staffid);
            let role: any = null ;

            if(staff.roleId == 0) {
                role = 'defaultCreater'; //表示创建者身份
            }

            if(!role){
                let managers: Department[] | Project[] = await Models.department.find({where: {managerId: staff.id}});
                if(managers && managers.length) role = 'departmentManager';
                if(!role){
                    managers =  await Models.project.find({where: {managerId: staff.id}})
                    if(managers && managers.length)  role = 'projectManager';
                }
            }
         
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
                        companyid: staff.companyId,
                        accountid: staff.accountId,
                        role: role
                    }
                }, (err: Error, resp: any, result: object) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            });
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
    let token = parseAuthString(authstr);
    let verification: AuthResponse = await API.auth.authentication(token);
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
        return res.sendStatus(401);
    }
    next();
}
var verifyToken = CLSNS.bind(verify, CLSNS.createContext())




