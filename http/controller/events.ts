/**
 * Created by wyl on 2017/10/26.
 */

'use strict';
import {AbstractController, Restful, Router, ERR} from "@jingli/restful";
var API = require("@jingli/dnode-api");
import {Models} from "_types";
import { Request, Response, NextFunction} from 'express';
import {EventListener} from "_types/eventListener";

@Restful()
export class EventsController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router('/registry-event-listener', "POST")
    async registryEventListener(req: Request, res: Response, next: NextFunction){
        try{
            let {events, url, method, companyId} = req.body;
            if(typeof events == "string"){
                events = JSON.parse(events);
            }
            let eventListener = EventListener.create({events, url, method, companyId});
            eventListener = await eventListener.save();

            // let rest = await API.eventListener.sendEventNotice({eventName: "new_trip_approve", data: {"s":"w"," value": "rrr"}, companyId: "1a1a4330-046b-11e7-b585-933198eebdaa"});
            // res.json(this.reply(ERR.OK, rest));

            res.json(this.reply(ERR.OK, eventListener));
        }catch (e){
            res.json(this.reply(ERR.REQ_PARAM_ERROR, e));
        }

    }

    @Router('/trip_approve', "POST")
    async tripApprove(req: Request, res: Response, next: NextFunction){
        try{

            console.info(req.body);
            console.info(req.query);
            console.info(typeof req.body);
            console.info(typeof req.query);
            console.info("tripApprove===================");
            res.json(this.reply(ERR.OK, {msg: "第三方返回信息======"}));
        }catch (e){
            res.json(this.reply(ERR.REQ_PARAM_ERROR, e));
        }

    }

}

