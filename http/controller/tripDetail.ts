"use strict"

import {AbstractController, Restful} from "@jingli/restful";
var API = require('@jingli/dnode-api');
import { Request, Response, NextFunction} from 'express-serve-static-core';

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
        if(!id || typeof(id) == 'undefined') {
            return res.json(this.reply(0, null));
        }
        params.id = id;
        let obj: {[index: string]: string} = {};
        try{
            console.log("===============updateTripDetail: ", params);
            obj = await API.tripPlan.updateTripDetailReserveStatus(params);
        } catch(err) {
            if(err) {
                console.log("====update tripDetail error: ", err);
                return res.json(this.reply(502, null));
            }

        }
        res.json(this.reply(0, obj));
    }
}

