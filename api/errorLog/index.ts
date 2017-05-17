/**
 * Created by wlh on 2017/5/12.
 */

'use strict';
import {Models} from "_types/index";


export default class ErrorRecord {

    static __initHttpApp(app) {

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