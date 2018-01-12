/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
let config = require('@jingli/config');
import * as path from 'path';
var API = require("@jingli/dnode-api");
var requestProxy = require('express-request-proxy');
import fs = require("fs");
import urlModule = require("url");
import { Request, Application, Response, NextFunction } from 'express-serve-static-core';
var cors = require('cors');
const corsOptions = { origin: true, credentials: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'content-type, Content-Type, auth, authstr, staffid, companyid, accountid'} 


function resetTimeout(req: Request, res: Response, next: NextFunction){
    // req.clearTimeout();
    next();
    //conn_timeout('180s')(req: Request, res: Response, next: NextFunction);
}

module.exports = function(app: Application) {
    //app.post('/upload/ajax-upload-file', proxy('http://localhost:4001', { reqAsBuffer: true,reqBodyEncoding: false }));
    let url = '/upload/ajax-upload-file'

    app.post(url, cors(corsOptions), resetTimeout, requestProxy({
        url:config.hosts.main.www+'/upload/ajax-upload-file',
        reqAsBuffer: true,
        cache: false,
        timeout: 180000,
    }));
    app.options(url, cors(corsOptions), function (req, res, next) {
        let referer = req.headers['referer'] as string;
        let host;
        if (!referer) {
            host = parseHost(req);
        } else { 
            let url = urlModule.parse(referer);
            host = parseHost(url);
        }
        res.header('Access-Control-Allow-Origin', host);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    })

    function parseHost(obj: { host?: string, protocol?: string}): string { 
        if (!obj.host) {
            return '*';
        }
        if (!obj.protocol) { 
            return obj.host;
        }
        var host = obj.protocol.replace(":", "") + '://' + obj.host;
        return host;
    }

    app.get("/attachment/temp/:id", cors(corsOptions), resetTimeout, function(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        return requestProxy({
            url: config.hosts.main.www + '/attachment/temp/' + id ,
            reqAsBuffer: true,
            cache: false,
            timeout: 180000,
        })(req, res, next);
    });

    app.get("/attachments/:id", getPublicFile);
    //app.post('/upload/ajax-upload-file', uploadActionFile);
    //app.get('/download/excle-file/:fileName', downloadExcle);
};

/**
 * 访问公共文件
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
let pwd = process.cwd();
async function getPublicFile(req: Request, res: Response, next: NextFunction) {
    // req.clearTimeout();
    var cacheFile = await API.attachment.getFileCache({id:req.params.id, isPublic:true});
    if(!cacheFile) {
        return next(404);
    }
    res.set("Content-Type", cacheFile.type);
    let file = cacheFile.file;
    if(!path.isAbsolute(file))
        file = path.join(pwd, file);

    let isExist = await new Promise((resolve, reject) => {
        fs.exists(file, resolve);
    });
    if (!isExist) {
        return next(404);
    }
    return res.sendFile(file);
}