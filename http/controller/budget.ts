/**
 * Created by ycl on 2017/10/27.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";
// import {ApiTravelBudget} from "api/travelBudget/index";
var ApiTravelBudget = require("api/travelBudget");

@Restful('/budget')
export class BudgetController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async get(req, res, next){
        let {id} = req.params;
        if(!id)  return res.json(this.reply(0, null));
        let result = await ApiTravelBudget.getBudgetById(req.params);
        res.json(this.reply(0, result));
    }
    
    async add(req, res, next){
        let body = req.body;
        if(!body)
           return res.json(this.reply(0, null));
        let result = await ApiTravelBudget.createNewBudget(body);
        res.json(this.reply(0, result));
    }

    @Router('/:id/refresh', "GET")
    async refresh(req, res, next){
        let {id} = req.params;
        if(!id)  return res.json(this.reply(0, null));
        let result = await ApiTravelBudget.getBudgetById(req.params);
        res.json(this.reply(0, result));
    }

    @Router('/getBudgetInfo', "POST")
    async getBudgetInfo(req, res, next){
        let body = req.body;
        if(!body)
            return res.json(this.reply(0, null));
        try{
            let budgetsInfo = await API['travelBudget'].getBudgetInfo(body);
            res.json(this.reply(0, budgetsInfo));
        }catch(err){
            res.json(this.reply(0, null));
        }

    }

    @Router('/qmGetBudget', "POST")
    async qmGetBudgetInfo(req, res, next){
        let body = req.body;
        if(!body)
            return res.json(this.reply(0, null));

        try{
            let budgetsId = await API['travelBudget'].getTravelPolicyBudget(body);
            res.json(this.reply(0, budgetsId));
        }catch(err){
            console.info(err);
            res.json(this.reply(0, null));
        }
    }
}