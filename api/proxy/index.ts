import {Request, Response, Application, NextFunction} from "express-serve-static-core";
import { Staff, EStaffRole } from "_types/staff";
import { Models } from "_types";
import {getCompanyTokenByAgent} from '../restful';
var ApiTravelBudget = require('api/travelBudget');
import { EOrderStatus, TripDetail, ETripDetailStatus, EPayType, Project } from "_types/tripPlan";
var request = require("request-promise");
var _ = require("lodash");
import L from '@jingli/language';
var cors = require('cors');
const config = require("@jingli/config");
const API = require("@jingli/dnode-api");
var timeout = require('connect-timeout');
import * as CLS from 'continuation-local-storage';
let CLSNS = CLS.getNamespace('dnode-api-context');
import { genSign } from "@jingli/sign";
import { Department } from '_types/department';
import Logger from '@jingli/logger';
import { ITMCSupplier, TMCStatus } from 'api/travelBudget';
import { AgentType } from 'api/travelBudget/getData';
import { parseAuthString, AuthResponse } from '_types/auth';
const logger = new Logger("proxy");
const corsOptions = { 
    origin: true, 
    methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], 
    allowedHeaders: 'content-type, Content-Type, auth, supplier, authstr, staffid, companyid, accountid, isneedauth, agenttype'
} 
function resetTimeout(req: Request, res: Response, next?: NextFunction){
    req['clearTimeout']();
    next && next();
}

const projects = require('./proxy-project');
const proxy = require("express-http-proxy");

export class Proxy {
    /**
     * @method 注册获取订单详情事件
     * @param app {Express} 
     * @return {}
     */
    __initHttpApp(app: Application){

        app.options(/^\/(order|travel|mall|supplier|bill|permission)*/, cors(corsOptions), (req: Request, res: Response, next?: Function) => {         
            return res.sendStatus(200);
        })

        
        app.all(/^\/travel.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next?: Function) => {
            try {
                let { staffid } = req.headers;
                let staff = await Models.staff.get(staffid);
                if (!staff) throw new Error('staff is null')
                let companyId: string = staff.company.id;
                let companyToken: string | null = await getCompanyTokenByAgent(companyId);
                if (!companyToken) {
                    throw new L.ERROR_CODE_C(500, '获取企业token失败');
                }
                let result: any;
                let pathstr: string = req.path;
                pathstr = pathstr.replace('/travel', '');
                let JLOpenApi: string = config.cloudAPI;
                let url: string = `${JLOpenApi}${pathstr}`;

                result = await request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        token: companyToken,
                        companyId: companyId
                    },
                });
                return res.json(result);
            } catch (err) { 
                logger.error(err);
                next(err);
            }
        });


        app.all(/^\/supplier.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next?: Function) => {
            try {
                //公有云验证
                let { staffid } = req.headers;
                let staff = await Models.staff.get(staffid);
                if (!staff) {
                    throw new L.ERROR_CODE_C(500, '员工信息不存在');
                }
                let companyId: string = staff.company.id;
                let companyToken: string | null = await getCompanyTokenByAgent(companyId);
                if (!companyToken) {
                    throw new L.ERROR_CODE_C(500, '获取企业token失败');
                }

                let result: any;
                let pathstr: string = req.path;
                pathstr = pathstr.replace('/supplier', '');
                let JLOpenApi: string = config.cloudAPI;
                let url: string = `${JLOpenApi}${pathstr}`;

                result = await request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        token: companyToken,
                        companyId: companyId
                    }
                });
                return res.json(result);
            } catch (err) { 
                logger.error(err);
                return next(err);
            }
        });

        app.all(/^\/jlbudget.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: any, res: Response, next?: Function) => {

            try {
                //公有云验证
                let { staffid } = req.headers;
                let staff = await Models.staff.get(staffid);
                if (!staff) {
                    throw new L.ERROR_CODE_C(500, '员工信息不存在');
                }
                let companyId: string = staff.company.id;
                let companyToken: string | null = await getCompanyTokenByAgent(companyId);
                if (!companyToken) {
                    throw new L.ERROR_CODE_C(500, '获取企业token失败');
                }

                //request to JLCloud(jlbudget) 
                let result: any;
                let pathstr: string = req.path;
                pathstr = pathstr.replace('/jlbudget', '');
                let JLOpenApi: string = config.cloudAPI;
                let url: string = `${JLOpenApi}${pathstr}`;

                result = await request({
                    uri: url,
                    body: req.body,
                    json: true,
                    method: req.method,
                    qs: req.query,
                    headers: {
                        token: companyToken,
                        companyId: companyId
                    }
                });
                return res.json(result);
            } catch (err) { 
                logger.error(err);
                return next(err);
            }
        });
        
        async function handleJavaProxy (req: Request, res: Response, next?: Function) {
            try {
                let projectName = req.params[0];
                let realUrl = req.params[1];
                if (!realUrl) {
                    realUrl = '/';
                }
                let { staffid } = req.headers;
                let projectConfig = projects[projectName];
                if (!projectConfig) {
                    throw new L.ERROR_CODE_C(404, '您请求的地址不存在或者已关闭访问');
                }
                let { appId, appSecret } = projectConfig;
                //计算转发过去的签名
                let params = req.body;
                let staff = await Models.staff.get(staffid);
                let timestamp = Math.floor(Date.now() / 1000);
                let sign = genSign(params, timestamp, appSecret)
                //最终地址
                let proxyUrl = config.java.getway;
                let isHttps = false;
                if (/^https:/.test(proxyUrl)) {
                    isHttps = true;
                }
                let parseReqBody = true;
                if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart') >= 0) {
                    parseReqBody = false;
                }
                console.log("need parseReqBoyd ====>", parseReqBody)
                // console.log("==timestamp:  ", timestamp, "===>sign", sign, '====>url', req.url, 'appid: ', appid, '===request params: ', params)
                let opts = {
                    reqAsBuffer: true,
                    parseReqBody: parseReqBody,
                    https: isHttps,
                    proxyReqPathResolver: (req: any) => {
                        let url = req.url.replace(/^\/java\//, '/');
                        console.log("SERVER==>", proxyUrl)
                        console.log("URL==>", '/svc' + url);
                        return '/svc' + url;
                    },
                    proxyReqOptDecorator: (proxyReqOpts: any, srcReq: any) => {
                        proxyReqOpts.headers['appid'] = appId;
                        proxyReqOpts.headers['sign'] = sign;
                        proxyReqOpts.headers['companyid'] = staff ? staff.companyId : '';
                        proxyReqOpts.headers['accountid'] = staff ? staff.accountId : '';
                        return proxyReqOpts;
                    }
                }
                return proxy(proxyUrl, opts)(req, res, next);
            } catch (err) {
                logger.error('转发java请求时失败:', req.originalUrl, err);
                return next(err);
            }
        }
        app.all(/^\/java\/([^\/]+)(.*)?$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, handleJavaProxy);

        /**
         * @method 提供中台、app端的订单转发请求
         *  1. app端根据tripDetailId创、退、改一系列订单请求
         *  2. app端根据staffid, 订单状态获取该员工的相应订单
         *  3. 中台根据companyid获取该公司所有订单
         */
        app.all(/^\/order.*$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next?: Function) => {
            try {
                let staff: Staff | null = await Staff.getCurrent();
                let staffId = req.headers.staffid;
                let isNeedAuth = req.headers['isneedauth'] || '';
                let agentType = req.headers['agenttype'] || AgentType.CORP;

                if (staffId && !staff) {
                    staff = await Models.staff.get(staffId);
                }
                let { tripDetailId } = req.query;
                let { authStr } = req.body;

                let listeningon: string = '';
                if (!tripDetailId || typeof tripDetailId == undefined) {
                    if (req.body.tripDetailId) {
                        tripDetailId = req.body.tripDetailId;
                    }
                }
                let tripDetail: TripDetail | null = null;
                //若tripDetailId存在，为创、退、改相关订单请求封装特殊请求参数
                if (tripDetailId) {
                    tripDetail = await Models.tripDetail.get(tripDetailId)
                    if (!tripDetail) {
                        console.log("tripDetail not found");
                        return res.sendStatus(403);
                    }
                    if (!staff) {
                        staff = await Models.staff.get(tripDetail.accountId);
                    }
                    listeningon = `${config['java-jingli-order1'].tripDetailMonitorUrl}/${tripDetail.id}`;
                    if (req.body.jlPayType == EPayType.PERSONAL_PAY) {
                        await API.tripPlan.updateTripDetail({
                            id: tripDetailId,
                            payType: req.body.jlPayType,
                            status: ETripDetailStatus.WAIT_UPLOAD,
                            reserveStatus: EOrderStatus.WAIT_SUBMIT
                        });
                    }
                }

                let addon: { [index: string]: any } = {
                    listeningon: listeningon
                };
                let supplier = req.headers['supplier'];
                let companyInfo: Array<ITMCSupplier>;
                let identify: any;
                let allInUseSuppliers = await ApiTravelBudget.getCompanyInfo(null, staff && staff.id, null, TMCStatus.OK_USE);
                if (isNeedAuth == '1') {
                    //no need to offer auth
                } else if (supplier) {
                    try {
                        companyInfo = await ApiTravelBudget.getCompanyInfo(supplier, staff && staff.id, null, TMCStatus.OK_USE);
                    } catch (err) { return res.json({ code: 407, msg: "未绑定供应商", data: null }) }

                    identify = companyInfo && companyInfo.length ? companyInfo[0].identify : null;
                    if (!identify && allInUseSuppliers) return res.json({ code: 407, msg: "未绑定供应商", data: null });
                    if (typeof identify == 'object') {
                        identify = JSON.stringify(identify);
                    }
                    identify = encodeURIComponent(identify);
                }
                identify = encodeURIComponent(identify);
                let auth: string = (isNeedAuth == '1') ? authStr : identify;
                // let auth : string = identify;

                let headers: { [index: string]: any } = {
                    appid: config['java-jingli-order1'].appId,
                    sign: null,
                    auth: auth,
                    supplier,
                    accountid: staff.accountId,
                    staffid: staff.id,
                    companyid: staff.companyId,
                    agenttype: agentType
                }

                let body: { [index: string]: any } = req.body;
                let qs: { [index: string]: any } = req.query;

                let timestamp = Math.floor(Date.now() / 1000);
                let sign: string;
                if (req.method == 'GET') {
                    sign = genSign(qs, timestamp, config['java-jingli-order1'].appSecret);
                    headers['sign'] = sign;
                    _.assign(headers, addon)
                } else {
                    _.assign(headers, addon)
                    _.assign(body, addon);
                    sign = genSign(body, timestamp, config['java-jingli-order1'].appSecret);
                    headers['sign'] = sign;
                }

                let pathstring = req.path;
                pathstring = pathstring.replace("/order", '');
                let url = `${config['java-jingli-order1'].orderLink}${pathstring}`;
                let result: any;
                console.log("===========url: ", url, '===tripDetailId: ', tripDetailId, '====>method:', req.method, '=======> body: ', req.body);
                try {
                    result = await new Promise((resolve, reject) => {
                        request({
                            url, headers, body, qs,
                            json: true,
                            method: req.method,
                            timeout: 120 * 1000
                        }, (err: Error, res: any, result: any) => {
                            if (err) {
                                console.log("-=========>err: ", err);
                                reject(err)
                            }
                            resolve(result);
                        });
                    });
                } catch (err) {
                    if (err) {
                        console.log("请求预定错误: ", err)
                    }
                    return res.json(500, null);
                }

                if (!result)
                    return res.json(null);
                if (typeof result == 'string') {
                    result = JSON.parse(result);
                }
                if (result.code == 0 && tripDetail && (body.orderType || body.orderType == 0)) {
                    tripDetail.orderType = body.orderType;  //后期返回的orderNo统一后，使用此确定订单类型
                    await tripDetail.save();
                }

                return res.json(result);
            } catch (err) { 
                logger.error(err);
                return next(err);
            }
        });
        
        app.all(/^\/mall\/(.*)$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next?: Function)=> {
            try {
                req.params[1] = req.params[0];
                req.params[0] = 'java-jingli-mall';
                req.url = '/java/' + req.params[0] + '/'+ req.params[1];
                return handleJavaProxy(req, res, next);
            } catch (err) {
                logger.error(err);
                return next(err)
            }
        });

        app.all(/^\/pay\/(.*)$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next: Function)=> {
            try {
                req.params[1] = req.params[0];
                req.params[0] = 'java-jingli-pay';
                req.url = '/java/' + req.params[0] + '/' + req.params[1];
                return handleJavaProxy(req, res, next);
            } catch(err) {
                return next(err)
            }
        });

        app.all(/^\/bill\/(.*)$/, cors(corsOptions), resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next?: Function) => {
            try {
                req.params[1] = req.params[0];
                req.params[0] = 'java-jingli-order1';
                req.url = '/java/' + req.params[0] + '/' + req.params[1];
                return handleJavaProxy(req, res, next);
            } catch (err) {
                logger.error("处理bill错误:", err);
                return next(err)
            }
        });

        app.all(/^\/permission\/(.*)$/ ,cors(corsOptions),resetTimeout, timeout('120s'), verifyToken, async (req: Request, res: Response, next?: Function)=> {
            try {
                let {staffid} = req.headers;
                let staff = await Models.staff.get(staffid);
                if (!staff) return res.sendStatus(404)
                let role: any = null ;

                if(staff.roleId == EStaffRole.OWNER) {
                    role = 'defaultCreater'; //表示创建者身份
                }
                if(staff.roleId == EStaffRole.ADMIN) {
                    role = 'manager'; //表示管理员身份
                }

                if(!role){
                    let managers: Department[] | Project[] = await Models.department.find({where: {managerId: staff.id}});
                    if(managers && managers.length) role = 'departmentManager';
                    if(!role){
                        managers =  await Models.project.find({where: {managerId: staff.id}})
                        if(managers && managers.length)  role = 'projectManager';
                    }
                }
                req.headers['role'] = role;
                req.params[1] = req.params[0];
                req.params[0] = 'java-jingli-auth';
                req.url = '/java/' + req.params[0] + '/' + req.params[1];
                return handleJavaProxy(req, res, next);
            } catch (err) {
                logger.error("处理persisson代理时错误:", err);
                return next(err)
            }
        });

        app.post("/addOrder" ,cors(corsOptions),resetTimeout, timeout('120s'),  async (req: Request, res: Response, next?: Function)=> {
            let url = `${config['java-jingli-order1'].orderLink}/interop`;
            let body = req.body;
            body.name = '';
            body.phone = '';
            let type = body.type;
            if(type) delete body.type;
            if(type == 'flights') url = `${url}/flights`;
            if(type == 'hotels') url = `${url}/hotels`;
            if(body.staffId){
                let staff = await Models.staff.get(body.staffId);
                if(staff){
                    body.name = staff.name;
                    body.phone = staff.mobile;
                }
            }
            console.log("===========url: ", url, '===tripDetailId: ', '=======> method: ', req.method, '=======> body: ', req.body);
            try {
                let proxyUrl = config.java.getway;
                let opts = {
                    reaAsBuffer: true,
                    https: true,
                    proxyReqPathResolver: (req: any) => {
                        return url;
                    }
                };
                return proxy(proxyUrl, opts)(req, res, next);
            } catch(err) {
                return next(err)
            }

        });


        app.use((err: any, req: Request, res: Response, next: Function) => {
            logger.error("REQ_URL===>", req.originalUrl, err && err.stack ? err.stack: err);
            if (err && err.code && err.msg) {
                return res.json({ code: err.code, msg: err.msg });
            }
            return next(err);
        })

        
    }
}
export default new Proxy();

async function verify(req: Request, res: Response, next?: Function) {
    try {
        if (req.method == 'OPTIONS') {
            return next && next();
        }
        let { authstr, staffid } = req.headers;
        if (!authstr) {
            throw new L.ERROR_CODE_C(403, '缺少登录凭证');
        }
        let token = parseAuthString(authstr);
        let verification: AuthResponse = await API.auth.authentication(token);
        if (!verification) {
            throw new L.ERROR_CODE_C(403, '登录凭证已失效');
        }
        try {
            await API.auth.setCurrentStaffId({
                accountId: verification.accountId,
                staffId: staffid
            })
        } catch (err) {
            logger.error(err);
            throw new L.ERROR_CODE_C(403, '员工信息不存在或者已被删除');
        }
        return next && next();
    } catch (err) { 
        return next(err);
    }
}
var verifyToken = CLSNS.bind(verify, CLSNS.createContext())




