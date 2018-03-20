'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import {Models} from "_types";
import {Request, Response, NextFunction} from "express-serve-static-core";
const API = require("@jingli/dnode-api");

@Restful()
export class AnalysisController extends AbstractController {

    constructor() {
        super()
    }

    $isValidId(id: string) {
        console.log("here...");
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }
    
    @Router("/:id/companySaved", "GET")
    async getCompanySaved(req: Request, res: Response, next: NextFunction) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let companySaved: number = await API.tripPlan.getCompanySaved({companyId: id});
        return companySaved;
    }

}