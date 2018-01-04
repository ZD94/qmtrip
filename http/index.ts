/**
 * Created by wlh on 2017/8/25.
 */

'use strict';

import {scannerDecoration, registerControllerToRouter} from "@jingli/restful";
import { conf, auth } from 'server-auth';
import { Models } from '_types';
import { genSign } from '@jingli/sign';
const cache = require('common/cache')
const config = require('@jingli/config')

import path = require("path");
import express = require("express");
import { Request, Response, NextFunction } from 'express';
import { Application } from 'express-serve-static-core';

let router = express.Router();
scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(router);

let allowOrigin = [
    "localhost",
    "jingli365"
];

function checkOrigin( origin ){
    for(let item of allowOrigin){
        if(origin.indexOf(item) > -1){
            return true;
        }
    }

    return false;
}

function getAppSecretByAppId(appId) {
    return config.agent.appSecret;
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

export async function initHttp(app: Application) {
    // router.param("companyId", validCompanyId);
    // app.use('/api/v1', allowCrossDomain, router);
    // app.use('/api/v1', authenticate, router);

    conf.setConfig(5 * 60 * 1000, [/^\/wechat/], cache, getAppSecretByAppId)
    app.use('/api/v1', jlReply)
    app.use('/api/v1', allowCrossDomain);
    app.use('/api/v1', (req: Request, res: any, next: NextFunction) => {
        auth(req, res, next, async (err, isValid, data) => {
            if (isValid) {
                const companies = await Models.company.find({
                    where: { appId: data.appId }
                })
                res.session = { ...data, companyId: companies[0] && companies[0].id }
                return next()
            }
            return res.sendStatus(403)
        })
    }, router);
}

export function jlReply(req: any, res: any, next: NextFunction) {
    res.jlReply = function (data: any) {
        let { appId, appSecret } = req.session || { appId: '00000000', appSecret: '00000000' };
        let timestamp = Math.floor(Date.now() / 1000);
        let sign = genSign(data, timestamp, appSecret);
        res.setHeader('appid', appId);
        res.setHeader('sign', sign);
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(data));
        res.end();
    }
     next();
}