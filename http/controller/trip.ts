/**
 * Created by lei.liu on 2017/10/31
 */

"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful"
import API from '@jingli/dnode-api'
import {Models} from "_types"
import {EPlanStatus, ExpendItem} from "_types/tripPlan"
import config = require("@jingli/config")
var TripApproveModule= require("TripApproveModule")

@Restful('/approve')
export class TripController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router("/:id/finish","POST")
    async finishTrip(req,res,next) {

        let id = req.params.id
        let expenditure = req.body.expenditure

        try {
            await TripApproveModule.finishTripPlan({id: id, expenditure: expenditure})
            res.json(this.reply(0,null))
        } catch (err) {
            res.json(this.reply(502, err))
        }
    }

}

