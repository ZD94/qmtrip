import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Request, Response } from 'express-serve-static-core';
import { JLError, CustomerError } from '@jingli/error';

@Restful()
export class WorkWechatController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    @Router('/login', 'POST')
    async loginByWechatCode(req: Request, res: Response) {
        try {
            const result = await API['sso'].loginByWechatCode(req.body)
            return res.json(result)
        } catch (e) {
            throw new CustomerError(400, '登录失败')
        }
    }

}
