"use strict"

import { AbstractController, Restful, Router } from "@jingli/restful";
var API = require('@jingli/dnode-api');
import { Request, Response, NextFunction } from 'express-serve-static-core';
import { EOrderStatus, ETripType } from '_types/tripPlan';
import { Models } from '_types';
import SavingEvent from 'api/eventListener/savingEvent';
const _ = require('lodash/fp')

@Restful()
export class TripDetailController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async update(req: Request, res: Response, next: NextFunction) {
        let params = req.body;
        let id = req.params.id;
        if (id == void 0) {
            return res.json(this.reply(0, null));
        }

        let obj: { [index: string]: string } = {};
        try {
            obj = await API.tripPlan.updateTripDetailReserveStatus({ ...params, id });
        } catch (err) {
            if (err) {
                console.log("====update tripDetail error: ", err);
                return res.json(this.reply(502, null));
            }

        }
        res.json(this.reply(0, obj));
    }

    @Router('/onOrderChange', 'POST')
    async listen(req: Request, res: Response, next: NextFunction) {
        const { reserveStatus, expenditure, id, orderNo } = req.body
        if (reserveStatus == EOrderStatus.SUCCESS) {
            const tripDetail = await Models.tripDetail.get(id)
            const staff = await Models.staff.get(tripDetail.accountId)
            const saving = tripDetail.budget - expenditure
            const companyId = staff.company.id
            let route = ''
            if ([ETripType.BACK_TRIP, ETripType.OUT_TRIP].indexOf(tripDetail.type) != -1) {
                const tripDetailTraffic = await Models.tripDetailTraffic.get(tripDetail.id)
                const cityNames = _.pluck('name', await Promise.all([API.place.getCityById(tripDetailTraffic.deptCity, companyId), API.place.getCityById(tripDetailTraffic.arrivalCity, companyId)]))
                route = cityNames.join('-')
            } else if (tripDetail.type == ETripType.HOTEL) {
                const tripDetailHotel = await Models.tripDetailHotel.get(tripDetail.id)
                route = tripDetailHotel.city
            }

            if (saving > 0) {
                let coins = saving * 0.05
                coins = coins > 100 ? coins : 100
                const tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId)
                await SavingEvent.emitTripSaving({
                    coins, orderNo, staffId: staff.id,
                    companyId, type: 2, record: {
                        date: new Date(),
                        companyName: staff.company.name,
                        staffName: staff.name,
                        mobile: staff.mobile,
                        reserveStatus: EOrderStatus.SUCCESS,
                        route,
                        budget: tripDetail.budget,
                        realCost: expenditure,
                        saving,
                        ratio: 0.05,
                        coins,
                        currStatus: tripPlan.status
                    }
                })
            }

            res.send(200)
        }
    }

}

