/**
 * Created by lei.liu on 2017/11/29
 * 网信组织架构修改通知接口。
 */

/*"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful"
import wangxEventHandFactory from "api/wangxin/lib/wangxEventHandler"

@Restful("/wangxin")
export class wangxinController extends AbstractController {
    constructor() {
        super()
    }

    $isValidId(id: string) {
        return true
    }

    @Router("/event","POST")
    async event(req, res, next) {
        try {
            let eventType = req.body.eventType
            let data = req.body.data
            let eventHandler = wangxEventHandFactory(eventType)
            await eventHandler(data)
            res.send("ok")
        } catch (err) {

        }
    }
}*/
