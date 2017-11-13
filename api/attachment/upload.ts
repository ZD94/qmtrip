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
import {md5} from "common/utils";

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
        console.info(content, filePath, "===============")
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

function signFileId(fileid: string, expirttime: number) {
    let key = 'wojiushibugaosuni';
    let str = fileid + expirttime + key;
    return md5(str);
}

async function getTmpAttachment(req, res, next) {
    logger.info("call getTmpAttachment===>");
    req.clearTimeout();
    let {fileId } = req.params;
    let {sign, expireTime} = req.query;
    //参数不完全直接抛错
    if (!fileId || !sign || !expireTime) {
        logger.info("sign error");
        return res.send(404);
    }
    //签名
    let userSign = signFileId(fileId, expireTime);
    if (userSign != sign) return res.send(403);
    //附件
    let attachment = await API.attachment.getAttachment({id: fileId});
    if (!attachment) {
        logger.info('can not find attachment');
        return res.send(404);
    }
    //输出文件头信息
    let headers = {}
    if (attachment.contentType) {
        headers['content-type'] =attachment.contentType
    }
    res.writeHead(200, headers);
    let bfs = new Buffer(attachment.content, 'base64')
    //内容
    res.write(bfs);
    res.end();
}

function allowCrossDomain(req, res, next) {
    /*if (req.headers.origin && checkOrigin(req.headers.origin)) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }*/
    console.info(req.method, "================");
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    if (req.method == 'OPTIONS') {
        return res.send("OK");
    }
    next();
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
    app.post(url, allowCrossDomain, uploadActionFile);
    app.options(url, function (req, res, next) {
        let referer = req.headers['referer'];
        let host;
        if (!referer) {
            host = parseHost(req);
        } else { 
            let url = urlModule.parse(referer);
            host = parseHost(url);
        }
        res.header('Access-Control-Allow-Origin', "*");
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

    /*app.get("/attachment/temp/:id", resetTimeout, function(req, res, next) {
        let id = req.params.id;
        return requestProxy({
            url: config.hosts.main.www + '/attachment/temp/' + id ,
            reqAsBuffer: true,
            cache: false,
            timeout: 180000,
        })(req, res, next);
    });*/

    app.get("/attachment/temp/:id", getTmpAttachment);

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
    console.info(cacheFile, "cacheFile=========")
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