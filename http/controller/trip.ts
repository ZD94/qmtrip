/**
 * Created by ycl on 2017/10/30.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";
var TripApproveModule= require("TripApproveModule")

@Restful('/approve')
export class TripController extends AbstractController {

    constructor() {
        super();
    }

    reply(code: number, data: any):{code: number, msg: any, data: any} {
        let msg = '';
        if(code == 0) {
            msg = '请求成功';
        }
        if(code == 500) {
            msg = '请求参数错误';
        } else if(code) {
            msg = '请求失败';
        }
        return {code: code, msg: msg, data: data}
    };

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router("/trip/:id/approve", 'POST')
    async updateTripApprove(req, res, next){
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

