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

var API = require('@jingli/dnode-api');
import path = require("path");
import express = require("express");
import { Request, Response, NextFunction } from 'express';
import { Application } from 'express-serve-static-core';
import { verifySign } from '@jingli/sign';
import { parseAuthString, AuthResponse } from '_types/auth';

let router = express.Router();
scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(router);

let openapiRouter = express.Router();
scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(openapiRouter, { group: 'openapi' });
let staffapiRouter = express.Router();
scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(staffapiRouter, {group: 'staffapi'});

let allowOrigin = [
    "localhost",
    "jingli365"
];

function checkOrigin( origin: any ){
    for(let item of allowOrigin){
        if(origin.indexOf(item) > -1){
            return true;
        }
    }

    return false;
}

function getAppSecretByAppId(appId: string) {
    return config.agent.appSecret;
}

function allowCrossDomain(req: Request, res: Response, next?: NextFunction) {
    if (req.headers.origin && checkOrigin(req.headers.origin)) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    if (req.method == 'OPTIONS') {
        return res.send("OK");
    }
    next && next();
}

export async function initHttp(app: Application) {
    // router.param("companyId", validCompanyId);
    // app.use('/api/v1', allowCrossDomain, router);
    // app.use('/api/v1', authenticate, router);

    conf.setConfig(5 * 60 * 1000, [/^\/wechat/, /^\/workWechat/i], cache, getAppSecretByAppId)
    /**
     * /api/v1 主要用于前端页面或者企业与本系统通信
     * appid, appsecret 为分配给企业的appid, appsecret
     */
    app.use('/api/v1', jlReply)
    app.use('/api/v1', allowCrossDomain);
    app.use('/api/v1', (req: Request, res: any, next?: NextFunction) => {
        if (!next) return
        auth(req, res, next, async (err, isValid, data) => {
               console.log("======auth request: ", err, isValid, data)
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
    /**
     * openapi主要用于可信的第三方系统与本系统通信
     * appid, appsecret 为 本系统分配给第三方系统的key和秘钥,切勿与 企业appid, appsecret混淆.
     * 通信算法与企业API通信算法相同
     */
    app.use('/openapi/v1', jlReply);
    app.use('/openapi/v1', (req: Request, res: Response, next?: NextFunction) => {
        if (!next) return;
        let appId: string = req.headers['appid'];
        let sign: string = req.headers['sign'];
        if (!appId || !sign || appId != config.openapi.appId) {
            return res.sendStatus(403);
        }
        let appSecret: string = config.openapi.appSecret;
        if (verifySign(getParams(req), sign, appSecret)) {
            return next();
        }
        return res.sendStatus(403);
    }, openapiRouter);

    app.use('/staffapi/v1', jlReply);
    app.use('/staffapi/v1', allowCrossDomain);
    app.use('/staffapi/v1', async (req: Request, res: Response, next?: NextFunction) => {
        let {authstr, staffid} = req.headers;
        let token = parseAuthString(authstr);
        let verification: AuthResponse = await API.auth.authentication(token);
        if (!verification) {
            console.log('auth failed...', JSON.stringify(req.cookies));
            return res.sendStatus(401);
        }
        try {
            await API.auth.setCurrentStaffId({
                accountId: verification.accountId,
                staffId: staffid
            })
        } catch(err) {
            return res.sendStatus(401);
        }
        next && next();
    }, staffapiRouter);
}

export function jlReply(req: any, res: any, next?: NextFunction) {
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
    next && next();
}

export function getParams(req: Request) {
    const { method } = req

    switch (method.toUpperCase()) {
        case 'GET':
            return req.query;
        case 'POST':
        case 'PUT':
            return req.body;
        case 'DELETE':
            return Object.create(null);
    }
}