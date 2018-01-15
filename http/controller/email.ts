/**
 * Created by ycl on 2018/01/15.
 */

'use strict';
import {AbstractController, Restful, Router, ERR} from "@jingli/restful";
import { Request, Response, NextFunction} from 'express-serve-static-core';
import {EventListener} from "_types/eventListener";
import { Models } from '_types';
var API = require("@jingli/dnode-api");

@Restful()
export class EventsController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    /**
     * @method 支持外部发送邮件等信息， post请求,数据更安全
     *   {userId} 和 {email、mobile} 为互补项，必有其一
     * @return {Promise<boolean>} true表示成功发送， false表示发送失败
     */
    async add(req: Request, res: Response, next: NextFunction){
        let {userId, key, email, mobile, values} = req.body;
        let resp = false;
        if(!email && !mobile) {
            if(!userId)
                return res.json(this.reply(502, resp));
            let account = await Models.staff.get(userId);
            if(!account) {
                let agencyUser = await Models.agency.get(userId);
                if(!agencyUser)  return res.json(this.reply(0, resp));
            }
        }
        try{
            resp = await API.notify.submitNotify({
                userId,
                key,
                email,
                values
            });
        }catch(err) {
            if(err)
                return res.json(this.reply(502, false));
        }
        res.json(this.reply(0, resp));
    }

}