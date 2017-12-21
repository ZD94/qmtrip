import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import { getAllChildren } from '_types/department';

@Restful()
export class CostController extends AbstractController {
    $isValidId(id: string): boolean {
        return true
    }

    async get(req, res, next) {
        const children = await getAllChildren(req.params.id)
        res.json(children)
    }
    
}