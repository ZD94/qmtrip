import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');

@Restful()
export class CostController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    async get(req, res, next) {
        const budgets = await API['costCenter'].listDeptBudget(req.params.id)
        res.json(budgets)
    }

}