/**
 * Created by ycl on 2017/10/27.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";

@Restful('/budget/')
export class BudgetController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async get(req, res, next){
        let {events} = req.body;
        console.info(events);
        //do something
        res.json(this.reply(0, events));
    }


    async post(req, res, next){
        let {events} = req.body;
        console.info(events);
        //do something
        res.json(this.reply(0, events));
    }

    @Router('/:id/refresh', "GET")
    async refresh(req, res, next){
        let {events} = req.body;
        console.info(events);
        //do something
        res.json(this.reply(0, events));
    }
}