import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Request, Response, NextFunction } from 'express-serve-static-core';

@Restful()
export class CostController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    async get(req: Request, res: Response, next: NextFunction) {
        const budgets = await API['costCenter'].listDeptBudget(req.params.id, { start: new Date, end: new Date })
        res.json(budgets)
    }

    async add(req: Request, res: Response, next: NextFunction) {
        await API['costCenter'].initBudget(req.body)
        res.send(200)
    }

    @Router('/apply/:id', 'PUT')
    async apply(req: Request, res: Response, next: NextFunction) {
        await API['costCenter'].applyConf(req.params.id)
        res.send(200)
    }

}