'use strict';

import {AbstractController, Restful, Router} from '@jingli/restful';
import API from '@jingli/dnode-api';
import {Models} from '_types';


@Restful()
export class PrivilegeController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);  
    }

    //获取企业福利账户余额
    @Router('/:id/getBalance', 'GET')  
    async getBalance(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        
    }
}