"use strict"

import {AbstractController, Restful, Router} from "@jingli/restful";
import { TripDetail } from "_types/tripPlan";
var API = require('@jingli/dnode-api');

@Restful()
export class TripDetailController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async update(req, res, next) {
        let params = req.body;
        let id = req.params.id;
        if(!id || typeof(id) == 'undefined') {
            return res.json(this.reply(0, null));
        }
        params.id = id;
        let obj: {[index: string]: string} = {};
        try{
            obj = await API.tripPlan.updateTripDetail(params);
        } catch(err) {
            if(err) {
                console.log("====update tripDetail error: ", err);
                return res.json(this.reply(502, null));
            }

        }
        res.json(this.reply(0, obj));
    }
}

