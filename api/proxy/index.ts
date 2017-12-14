import {Express} from "express";
import {Request, Response} from "express-serve-static-core";
import {parseAuthString} from "_types/auth/auth-cert";
import { Staff } from "_types/staff";
import { Models } from "_types";
var request = require("request-promise");
var path = require("path");
var _ = require("lodash");
const config = require("@jingli/config");
const API = require("@jingli/dnode-api");
class Proxy {
    /**
     * @method 注册获取订单详情事件
     * @param app {Express} 
     * @return {}
     */
    static __initHttpApp(app: Express){
        app.all(/order.*/, async (req: Request, res: Response, next: Function) => {
            let authstr = req.query.authstr;
            if(!authstr || typeof authstr == 'undefined') 
                authstr = req.body.authstr;
            let token = parseAuthString(authstr);
            let verification = await API.auth.authentication(token);
            if(!verification) {
                console.log("auth failed", JSON.stringify(req.cookies))
                res.sendStatus(401);
                return; 
            }
            if(req.method == 'OPTIONS') {
                // let referer = req.headers['referer'];
                // res.header('Access-Control-Allow-Origin', referer);
                // res.header('Access-Control-Allow-Credentials', 'true');
                return res.sendStatus(200);
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
                listeningOn: `${config.orderSysConfig.tripDetailMonitorUrl}${tripDetail.id}`
            };
            let headers: {[index: string]: any} = {
               auth: req.headers['auth'],
               supplier: req.headers['supplier']
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
                _.assign(body, addon);
            }
            let pathstring = req.path;
            pathstring = pathstring.replace("/order", '');
            let url = `${config.orderSysConfig.orderLink}${pathstring}`;
            let result:any;
            try{
                result = await request(url, {
                    headers,
                    body,
                    json: true,
                    method: req.method
                });
            }catch(err) {
                if(err) {
                    console.log("请求预定错误: ", err)
                    return res.sendStatus(500);
                }  
            }
            if(!result) 
                res.json(null);
            res.json(result.data);

        }); 
    }
}
export default Proxy;



