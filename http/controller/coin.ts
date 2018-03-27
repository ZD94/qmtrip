'use strict';
import {AbstractController, Restful, Router, Group} from "@jingli/restful";
import API from '@jingli/dnode-api';
import { Request, Response, NextFunction } from 'express-serve-static-core';

export enum addCoinType {
    CORP = 1,   //企业
    STAFF = 2   //员工
}


@Group('openapi')
@Restful()
export class CoinController extends AbstractController {

    constructor() {
        super()
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);  
    }

    /**
     * 增加企业或员工鲸币
     * @author lizeilin
     * @param {req.params: staffId or companyId, req.body: {type, coins, remark}}
     * @return {coinAccount, coinAccountChange}
     */
    @Router('/:id/addCoin', 'POST')
    async addCoin(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        let body = req.body;
        if (!body) {
            return res.json(this.reply(0, null));
        }
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        let type: addCoinType = body.type;
        let coins: number = body.coins;
        let remark: string = body.remark;

        let result = await API['coin'].addJLCoin({type: type, coins: coins, id: id, remark: remark});
        res.json(this.reply(0, result));
    }
}