/**
 * Created by ycl on 2017/10/30.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";
var TripApproveModule= require("api/tripApprove");
import {Request, Response} from "express-serve-static-core";

/*
 * 外部审批结束调用模块， 处理审批结果：
 *   同意: 生成行程单
 *   拒绝：修改申请单状态
 */
@Restful('/approve')
export class TripApproveController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router("/trip/:id/approve", 'POST')
    async updateTripApprove(req: Request, res: Response, next: Function){
        let {id, nextApproveUserId, status, reason} = req.body;
        if(!id)
            return res.json(this.reply(0, null));
        let result;

        let isNextApprove = false;
        if(nextApproveUserId && typeof(nextApproveUserId) != 'undefined'){
            isNextApprove = true;
        }

        //特殊审批暂不支持，支持需要传入特殊审批的 budgetId
        try{
            result = await TripApproveModule.approveTripPlan({
                id: id,
                approveResult: status,
                approveRemark: reason,
                isNextApprove: isNextApprove,
                nextApproveUserId: nextApproveUserId,
            });
        } catch(err) {
            return res.json(this.reply(500, null));
        }
        res.json(this.reply(0, result));
    }

}
