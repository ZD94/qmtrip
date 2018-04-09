/**
 * Created by wlh on 2017/5/12.
 */

'use strict';
import {Models} from "_types/index";
import { Application } from 'express';


export class ErrorRecord {

    __initHttpApp(app: Application) {

        app.use('/e', function(req, res, next) {
            let {s, u} = req.query || req.body;
            let errorLog = Models.errorLog.create({url: u, error: s});
            return errorLog.save()
                .then( (errorLog) => {
                    res.send(200);
                })
                .catch((err) => {
                    console.error(err);
                    res.send(200);
                })
        });
    }
}

export default new ErrorRecord();