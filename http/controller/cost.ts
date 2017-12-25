import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');

@Restful()
export class CostController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    async get(req, res, next) {
        const budgets = await API['costCenter'].listDeptBudget(req.params.id, { start: '2017-01-01', end: '2017-12-31' })
        res.json(budgets)
    }

    async add(req, res, next) {
        await API['costCenter'].initBudget(req.body)
        res.send(200)
    }

    @Router('/apply/:id', 'PUT')
    async apply(req, res, next) {
        await API['costCenter'].applyConf(req.params.id)
        res.send(200)
    }

}