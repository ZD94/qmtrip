/**
 * Created by ycl on 2017/10/30.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
var TripApproveModule= require("api/tripApprove");
import {Request, Response} from "express-serve-static-core";

/*
 * 外部审批结束调用模块， 处理审批结果：
 *   同意: 生成行程单
 *   拒绝：修改申请单状态
 */
@Restful('/trip')
export class TripApproveController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router("/:id/approve", 'POST')
    async approveTripApprove(req: Request, res: Response, next: Function){
        let {id, status, reason, isAutoApprove} = req.body;
        if(!id) id = req.params.id;
        if(!id)
            return res.json(this.reply(0, null));
        let result;

        try{
            result = await TripApproveModule.oaApproveTripPlan({
                id: id,
                approveResult: status,
                reason: reason,
                isAutoApprove: isAutoApprove
            });
        } catch(err) {
            console.info(err);
            res.json(this.reply(500, null));
        }
        res.json(this.reply(0, result));
    }

    @Router("/:id/nextApprove", 'POST')
    async nextApprove(req: Request, res: Response, next: Function){
        let {id, approveUserId, nextApproveUserId} = req.body;
        if(!id) id = req.params.id;
        if(!id)
            return res.json(this.reply(0, null));
        let result;

        try{
            result = await TripApproveModule.nextApprove({
                id: id,
                approveUserId: approveUserId,
                nextApproveUserId: nextApproveUserId
            });
        } catch(err) {
            console.info(err);
            res.json(this.reply(503, null));
        }
        res.json(this.reply(0, result));
    }

    @Router("/:id/cancelApprove", 'POST')
    async cancelApprove(req: Request, res: Response, next: Function){
        let {id, reason} = req.body;
        if(!id) id = req.params.id;
        if(!id)
            return res.json(this.reply(0, null));
        let result;

        try{
            result = await TripApproveModule.oaCancelTripApprove({
                id: id,
                cancelRemark: reason
            });
        } catch(err) {
            console.info(err);
            res.json(this.reply(503, null));
        }
        res.json(this.reply(0, result));
    }

}
