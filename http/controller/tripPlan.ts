"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful";
var API = require('@jingli/dnode-api');
import { Request, Response, NextFunction} from 'express-serve-static-core';

@Restful()
export class TripPlanController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router('/list', 'GET')
    async list(req: Request, res: Response, next: NextFunction) {
        const result = await API.tripPlan.tripList(req.query)
        res.json(this.reply(0, result))
    }

    @Router('/graph', 'GET')
    async g(req: Request, res: Response, next: NextFunction) {
        res.json(this.reply(0, await API.tripPlan.tripStatistics(req.query)))
    }

    @Router('/perMonth', 'GET')
    async perMonthStatistics(req: Request, res: Response, next: NextFunction) {
        res.json(this.reply(0, await API.tripPlan.perMonthStatistics(req.query)))
    }

    @Router('/unfinishedTrip', 'GET')
    async unfinishedTrip(req: Request, res: Response, next: NextFunction) {
        res.json(this.reply(0, await API.tripPlan.unfinishedTrip(req.query)))
    }
}