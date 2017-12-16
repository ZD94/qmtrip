import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Models } from "_types";

@Restful()
export default class CostController extends AbstractController {

    constructor() {
        super()
    }

    $isValidId(id: string): boolean {
        return true
    }

    @Router('/init', 'POST')
    async initCost(req, res, next) {
        await API['costCenter'].initBudget(req.body)
        res.json(this.reply(0, null))
    }

    @Router('/change/:id', 'PUT')
    async changeCost(req, res, next) {
        await API['costCenter'].changeBudget(req.params.id, req.body)
        res.json(this.reply(0, null))
    }

    @Router('/apply/:id', 'PUT')
    async applyConf(req, res, next) {
        await API['costCenter'].applyConf(req.params.id)
        res.json(this.reply(0, null))
    }

    @Router('/setE', 'PUT')
    async setEarlyWarning(req, res, next) {
        const { costId, type, rate, audienceTypes } = req.body
        await API['costCenter'].setEarlyWarning(costId, type, rate, audienceTypes)
        res.json(this.reply(0, null))
    }

    @Router('/exp/:id', 'GET')
    async notice(req, res, next) {
        await API['costCenter'].f(req.params.id)
        res.json(this.reply(0, null))
    }

}