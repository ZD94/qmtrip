"use strict"

import {AbstractController, Restful} from "@jingli/restful";
var API = require('@jingli/dnode-api');
import { Request, Response, NextFunction} from 'express-serve-static-core';
import { EOrderStatus } from '_types/tripPlan';
import { Models } from '_types';
import SavingEvent from 'api/eventListener/savingEvent';

@Restful()
export class TripDetailController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const {reserveStatus, expenditure} = req.body
        let params = req.body;
        let id = req.params.id;
        if(id == void 0) {
            return res.json(this.reply(0, null));
        }
        if(reserveStatus == EOrderStatus.SUCCESS) {
            const tripDetail = await Models.tripDetail.get(id)
            const staff = await Models.staff.get(tripDetail.accountId)
            const saving = tripDetail.budget - expenditure
            if (saving > 0) {
                let coins = saving * 0.05
                coins = coins > 100 ? coins : 100
                await SavingEvent.emitTripSaving({ coins, orderNo: params.orderNo, staffId: staff.id, companyId: staff.company.id, type: 2 })
            }
        }
        let obj: {[index: string]: string} = {};
        try{
            obj = await API.tripPlan.updateTripDetailReserveStatus({...params, id});
        } catch(err) {
            if(err) {
                console.log("====update tripDetail error: ", err);
                return res.json(this.reply(502, null));
            }

        }
        res.json(this.reply(0, obj));
    }
}

