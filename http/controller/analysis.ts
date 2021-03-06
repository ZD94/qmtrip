'use strict';
import {AbstractController, Restful, Router, Group} from "@jingli/restful";
import {Request, Response, NextFunction} from "express-serve-static-core";
import { AnalysisType } from '_types/tripPlan';
const API = require("@jingli/dnode-api");

@Group('staffapi')
@Restful()
export class AnalysisController extends AbstractController {

    constructor() {
        super()
    }

    $isValidId(id: string) {
        console.log("here...");
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }
    
    /**
     * @author lizeilin
     * @param {companyId}
     * @return {companySaved}
     */
    @Router("/:companyId/companySaved", "GET")
    async getCompanySaved(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        try {
            let companySaved: number = await API.tripPlan.getCompanySaved(companyId);
            res.json(this.reply(0, companySaved));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     */
    @Router("/:companyId/companySavedChart", "GET")
    async getCompanySavedChart(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        try {
            let budgets: number[] = await API.tripPlan.getCompanySavedChart(companyId);
            return res.json(this.reply(0, budgets));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     * @param {body: type: AnalysisType, isSaved: boolean} 
     * @return {expenditure or saved}
     */
    @Router("/:companyId/confirmedExpenditureAndSaved", "POST")
    async getConfirmedExpenditure(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        let beginDate: Date = body.beginDate || null;
        let endDate: Date = body.endDate || null;
        try {
            let data: any = await API.tripPlan.getConfirmedExpenditureAndSaved({companyId: companyId, beginDate: beginDate, endDate: endDate})
            res.json(this.reply(0, data));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     * @param {body: type: AnalysisType}
     * @return {budget}
     */
    @Router("/:companyId/plannedBudget", "POST")
    async getPlannedBudget(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        let beginDate: Date = body.beginDate || null;
        let endDate: Date = body.endDate || null;

        try {
            let plannedBudget: number = await API.tripPlan.getPlannedBudget({companyId: companyId, beginDate: beginDate, endDate: endDate});
            res.json(this.reply(0, plannedBudget));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }
    
    /**
     * 
     * @author lizeilin
     * 
     */
    @Router("/:companyId/budgetData", "GET")
    async getBudgetData(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        try {
            let budgetData = await API.costCenter.budgetAnalysis(companyId);
            res.json(this.reply(0, budgetData));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     */
    @Router("/:companyId/costCenterData", "POST")
    async getCostCenterData(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        
        let type: AnalysisType = body.type;
        try {
            let analysisData = await API.costCenter.costCenterAnalysis({companyId: companyId, type: type});
            res.json(this.reply(0, analysisData));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     */
    @Router("/:companyId/budgetDataChart", "GET")
    async getBudgetDataChart(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId) 
            return res.json(this.reply(400, null));
        try {
            let budgetData = await API.costCenter.budgetDataChart(companyId);
            res.json(this.reply(0, budgetData));
        } catch(err) {
            console.error(err);
            res.json(this.reply(400, err));
        }
    }

    /**
     * @author lizeilin
     */
    @Router("/:companyId/subsidyBudget", "POST")
    async getSubsidyBudget(req: Request, res: Response, next: NextFunction) {
        let {companyId} = req.params;
        if (!companyId)
            return res.json(this.reply(400, null));
        let body = req.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        let beginDate: Date = body.beginDate || null;
        let endDate: Date = body.endDate || null;

        try {
            let subsidyBudget = await API.tripPlan.getSubsidyBudget({companyId: companyId, beginDate: beginDate, endDate: endDate});
            res.json(this.reply(0, subsidyBudget));
        } catch(err){
            console.error(err);
            res.json(this.reply(400, err));
        }
    }
}
