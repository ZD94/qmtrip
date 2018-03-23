'use strict';

import { AbstractController, Restful, Router } from "@jingli/restful";
import { Request, Response, NextFunction } from 'express';
const API = require('@jingli/dnode-api');

@Restful()
export class IdentityInfoController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    async add(req: Request, res: Response, next?: NextFunction) {
        try {
            const result = await API.staff.createIdentityInfo(req.body)
            res.json(this.reply(0, result))
        } catch (e) {
            res.json(this.reply(e.code || 500, null))
        }
    }

    @Router('/:staffId/:certificateType/single', 'GET')
    async getIdentityInfoBy(req: Request, res: Response, next?: NextFunction) {
        const result = await API.staff.getIdentityInfoBy(req.params)
        res.json(this.reply(0, result || null))
    }

    @Router('/:staffId/:certificateType/list', 'GET')
    async getIdentityInfosBy(req: Request, res: Response, next?: NextFunction) {
        const result = await API.staff.getIdentityInfosBy(req.params)
        res.json(this.reply(0, result || []))
    }

}