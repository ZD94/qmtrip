/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var config = require('@jingli/config');
var API = require("@jingli/dnode-api");
var requestProxy = require('express-request-proxy');
import fs = require("fs");

function resetTimeout(req, res, next){
    req.clearTimeout();
    next();
    //conn_timeout('180s')(req, res, next);
}

module.exports = function(app) {
    //app.post('/upload/ajax-upload-file', proxy('http://localhost:4001', { reqAsBuffer: true,reqBodyEncoding: false }));
    app.post('/upload/ajax-upload-file', resetTimeout, requestProxy({
        url:config.hosts.main.www+'/upload/ajax-upload-file',
        reqAsBuffer: true,
        cache: false,
        timeout: 180000,
    }));
    app.get("/attachment/temp/:id", resetTimeout, function(req, res, next) {
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
let path= require("path");
async function getPublicFile(req, res, next) {
    req.clearTimeout();
    var cacheFile = await API.attachment.getFileCache({id:req.params.id, isPublic:true});
    if(!cacheFile) {
        return next(404);
    }
    res.set("Content-Type", cacheFile.type);
    let filePath = path.join(pwd , cacheFile.file)
    let isExist = await new Promise((resolve, reject) => {
        fs.exists(filePath, resolve);
    });
    if (!isExist) {
        return next(404);
    }
    return res.sendFile(filePath);
}