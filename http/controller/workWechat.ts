import { AbstractController, Restful, Router } from "@jingli/restful";
const API = require('@jingli/dnode-api');
import { Request, Response } from 'express-serve-static-core';
import { CustomerError } from '@jingli/error';
import { Models } from '_types';
import { SPropertyType } from '_types/staff';

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

    @Router('/permanentCode/:corpId', 'GET')
    async getCorpPermanentCode(req: Request, res: Response) {
        const companies = await Models.companyProperty.find({
            where: { type: SPropertyType.WECHAT_CORPID, value: req.params.corpId }
        })
        const permanentCode = await Models.companyProperty.find({
            where: { type: SPropertyType, company_id: companies[0].companyId }
        })
    }

}
