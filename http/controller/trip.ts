/**
<<<<<<< HEAD
 * Created by lei.liu on 2017/10/31
 */

"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful"
import API from '@jingli/dnode-api'
var TripApproveModule = require("../../api/tripPlan")

@Restful('/tripPolicy')
=======
 * Created by ycl on 2017/10/30.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";
var TripApproveModule= require("API/tripApprove")

@Restful('/approve')
>>>>>>> 42bf1a49e81667b74b420ce64fe47fa8804b6c3f
export class TripController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

<<<<<<< HEAD
    @Router("/:id/finish","POST")
    async finishTrip(req,res,next) {

        let id = req.params.id
        let expenditure = req.body.expenditure

        try {
            await TripApproveModule.finishTripPlan({id: id, expendArray: expenditure})
            res.json(this.reply(0,null))
        } catch (err) {
            res.json(this.reply(502, err)) //暂时将code设置为502，之后完善错误信息。
        }
=======
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
>>>>>>> 42bf1a49e81667b74b420ce64fe47fa8804b6c3f
    }

}

