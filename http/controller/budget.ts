/**
 * Created by ycl on 2017/10/27.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";
// import {ApiTravelBudget} from "api/travelBudget/index";
var ApiTravelBudget = require("api/travelBudget");
import {ETripType} from "../../_types/tripPlan";
import { Request, Response, NextFunction } from 'express-serve-static-core'

@Restful()
export class BudgetController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        console.log("here .. ");
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async get(req: Request, res: Response, next: NextFunction){
        let {id} = req.params;
        if(!id)  return res.json(this.reply(0, null));
        let result = await ApiTravelBudget.getBudgetById(req.params);
        res.json(this.reply(0, result));
    }
    
    async add(req: Request, res: Response, next: NextFunction){
        let body = req.body;
        if(!body)
           return res.json(this.reply(0, null));
        let result = await ApiTravelBudget.createNewBudget(body);
        res.json(this.reply(0, result));
    }

    /*
     * @method 根据approve/tripApprove的id获取到查询条件，重新获取预算
     * @params id approveId或者tripApproveId
     * @return BudgetItem[]
     */
    @Router('/:id/refresh', "GET")
    async refresh(req: Request, res: Response, next: NextFunction){
        let {id} = req.params;
        if(!id)  return res.json(this.reply(400, null));
        let approve = await Models.approve.get(id);
        if(!approve)
            return res.json(this.reply(400, null));
        let oldBudgetInfo = approve.data;
        if(typeof oldBudgetInfo == 'string') {
            oldBudgetInfo = JSON.parse(oldBudgetInfo);
        }
        let staff = await Models.staff.get(approve.submitter);

        let {query} = oldBudgetInfo;
        query['staffId'] = approve["submitter"];
        let budgetId = await ApiTravelBudget.getTravelPolicyBudget(query);
        let budgetInfo = await ApiTravelBudget.getBudgetInfo({id: budgetId, accountId: approve['submitter']});
        let result = transform(budgetInfo.budgets, staff.travelPolicyId);
        res.json(this.reply(0, result));
    }

    @Router('/:approveId/updateBudget', 'POST') 
    async updateBudget(req, res, next) {
        let _budgets = req.body;
        let approveId = req.params.approveId;
         
        let updateBudget = await API['travelBudget'].updateBudget({approveId: approveId, budgetResult: _budgets});
        res.json(this.reply(0, null));
    }

    @Router('/getBudgetInfo', "POST")
    async getBudgetInfo(req: Request, res: Response, next: NextFunction){
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
    async qmGetBudgetInfo(req: Request, res: Response, next: NextFunction){
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


function transform(budgetItems: Array<ITravelBudgetInfo >, travelPolicyId: string){
    let budgets: ITravelBudgetInfo[] = budgetItems.map(function(budget: ITravelBudgetInfo ){
        if(budget["tripType"] == ETripType.OUT_TRIP || budget["tripType"] == ETripType.BACK_TRIP){
            return {
                id: budget.id,
                no: budget.no,
                budget: budget.price,
                type: budget.type,
                deepLink: budget.bookurl,
                agent: budget.agent,
                trafficType: budget.tripType,
                discount: budget.discount,
                policy: travelPolicyId
            } as ITravelBudgetInfo
        }
        if(budget["tripType"] == ETripType.HOTEL) {
            return {
                id: budget.id,
                name: budget.name,
                budget: budget.price,
                type: budget.type,
                deepLink: budget.bookurl,
                agent: budget.agent,
                trafficType: budget.tripType,
                discount: budget.discount,
                policy: travelPolicyId,
                checkInDate: budget.checkInDate,
                checkOutDate: budget.checkOutDate,
                star: budget.star,
        } as ITravelBudgetInfo;
    }});
    return budgets;
}

export interface ITravelBudgetInfo {
    id?: string;
    no?: string;
    rate?: number;
    type?: number;  //类型，是交通还是酒店
    unit?: string;
    agent?: string;  //代理商
    cabin?: number;
    price?: number;
    toCity?: string;
    bookurl?: string;
    prefers?: Array<any>;
    discount?: number;
    fromCity?: string;
    tripType?:number;
    cabinClass?: number;
    departTime?: string;
    arrivalTime?: string;
    destination?: string;
    originPlace?: string;
    trafficType?: number;  //交通类型，为飞机、火车、轮船
    originStation?: any;
    destinationStation?: any;
    policy?: string;   //uuid， 员工的差旅标准
    deepLink?: string;  //预定链接
    budget?: number;  //即price， 对外开放的字段为budget，
    star?: number;
    city?: string;
    checkInDate?: string;
    checkOutDate?: string;
    name?: string;

}


