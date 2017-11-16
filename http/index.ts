/**
 * Created by wlh on 2017/8/25.
 */

'use strict';

import {scannerDecoration, registerControllerToRouter, Reply} from "@jingli/restful";

import path = require("path");
import express = require("express");
import { Request, Response, NextFunction, Express } from 'express';

let router = express.Router();

scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(router);

let allowOrigin = [
    "localhost",
    "jingli365"
];

function checkOrigin( origin: Array<any> ){
    for(let item of allowOrigin){
        if(origin.indexOf(item) > -1){
            return true;
        }
    }

    return false;
}

function allowCrossDomain(req: Request, res: Response, next: NextFunction) {
    if (req.headers.origin && checkOrigin(req.headers.origin)) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    if (req.method == 'OPTIONS') {
        return res.send("OK");
    }
    next();
}


export async function initHttp(app: Express) {
    // router.param("companyId", validCompanyId);
    app.use('/api/v1', allowCrossDomain, router);
    // app.use('/api/v1', authenticate, router);
}