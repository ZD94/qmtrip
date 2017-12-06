/**
 * Created by ycl on 2017/11/13.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
const API = require("@jingli/dnode-api");
import { Request, Response, NextFunction } from 'express-serve-static-core';

@Restful()
export class EmailController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        // return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
        return true;
    }

    @Router('/sendEmail', "POST")
    async sendEmail(req: Request, res: Response, next: NextFunction){
        let params = req.body;

        let {email, content, subject, attachments } = params;
        if(!email || !content || !subject || !attachments) {
            return res.json(this.reply(500, null));
        }

        try{
            await API.mail.sendEmail({
                toEmail: email,
                content: content,
                subject: subject,
                attachments: attachments
            });
        } catch(err) {
            if(err) {
                return res.json(this.reply(500, null));
            }
        }
        res.json(this.reply(0, null));
    }

}
