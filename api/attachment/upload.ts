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
var formidable = require('formidable');
import Logger from '@jingli/logger';
var logger = new Logger('attachments');
import bluebird = require('bluebird');
import url = require("url");

function resetTimeout(req, res, next){
    req.clearTimeout();
    next();
    //conn_timeout('180s')(req, res, next);
}

async function fs_exists(file): Promise<boolean>{
    try{
        var stat = await fs.statAsync(file);
        return true;
    }catch(e){
        if(e.code != 'ENOENT')
            throw e;
        return false;
    }
}

async function uploadActionFile(req, res, next) {
    console.info("uploadActionFile===========");
    req.clearTimeout();
    var filePath;
    res.header("")
    try {
        var type = req.query.type;
        var form = new formidable.IncomingForm();
        form.uploadDir = config.upload.tmpDir;
        form.maxFieldsSize = config.upload.maxSize || 20*1024*1024;
        form.keepExtensions = true;
        var parseForm = bluebird.promisify<any[], any>(form.parse, {context: form, multiArgs:true});
        var [fields, file] = await parseForm(req);
        if(!file.tmpFile)
            throw '文件不存在';
        filePath = file.tmpFile.path;
        var fileExt = path.extname(filePath);
        if(type && type == 'xls' && ('.xls.xlsx').indexOf(fileExt.toLowerCase()) === -1) {//导入excle
            throw '仅允许上传 xls/xlsx 格式文件';
        }

        var data = await fs.readFileAsync(filePath);
        var file_type = file.tmpFile.type;
        var isPublic = false;
        if(type && type == 'avatar') {//上传头像
            isPublic = true;
        }

        var content = data.toString("base64")
        var contentType = file_type;
        var obj = await API.attachment.saveAttachment({
            content: content,
            contentType: contentType,
            isPublic: isPublic
        });
        console.info("obj===", obj);
        res.send({
            ret:0,
            errMsg:"",
            fileId: obj.fileId,
            sign: obj.sign,
            expireTime: obj.expireTime,
        });
    } catch(err) {
        logger.error(err.stack || err);
        res.send({
            ret: -1,
            errMsg: err.message || err
        });
    } finally {
        if(filePath){
            var exist = await fs_exists(filePath);
            if(exist){
                fs.unlink(filePath);
                console.log("删除临时文件");
            }
        }
    }
}

module.exports = function(app) {
    //app.post('/upload/ajax-upload-file', proxy('http://localhost:4001', { reqAsBuffer: true,reqBodyEncoding: false }));
    let url = '/upload/ajax-upload-file'

    /*app.post(url, resetTimeout, requestProxy({
        url:config.hosts.main.www+'/upload/ajax-upload-file',
        reqAsBuffer: true,
        cache: false,
        timeout: 180000,
    }));*/
    app.post(url, uploadActionFile);
    app.options(url, function (req, res, next) {
        let referer = req.headers['referer'];
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
async function getPublicFile(req, res, next) {
    req.clearTimeout();
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