/**
 * Created by by wyl on 15-12-16.
 */

'use strict';
let config = require('@jingli/config');
import * as path from 'path';
var API = require("@jingli/dnode-api");
import fs = require("fs");
var formidable = require('formidable');
import Logger from '@jingli/logger';
var logger = new Logger('attachments');
import bluebird = require('bluebird');
import {md5} from "common/utils";
import { Request, Application, Response, NextFunction } from 'express-serve-static-core';
var cors = require('cors');
const corsOptions = { origin: true, credentials: true, methods: ['GET', 'PUT', 'POST','DELETE', 'OPTIONS', 'HEAD'], allowedHeaders: 'content-type, Content-Type, auth, authstr, staffid, companyid, accountid'} 


// function resetTimeout(req: Request, res: Response, next: NextFunction){
    // req.clearTimeout();
    // next();
    //conn_timeout('180s')(req: Request, res: Response, next: NextFunction);
// }

async function fs_exists(file: string): Promise<boolean>{
    try{
        await fs.statAsync(file);
        return true;
    }catch(e){
        if(e.code != 'ENOENT')
            throw e;
        return false;
    }
}

async function uploadActionFile(req: any, res: Response) {
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
        var dir_exist = await fs_exists(config.upload.tmpDir);
        if(!dir_exist){
            await fs.mkdirAsync(config.upload.tmpDir, '755');
        }
        var parseForm = bluebird.promisify<any[], any>(form.parse, {context: form, multiArgs:true});
        var [, file] = await parseForm(req);
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

async function getTmpAttachment(req: any, res: Response, next?: NextFunction): Promise<any> {
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

module.exports = function(app: Application) {
    //app.post('/upload/ajax-upload-file', proxy('http://localhost:4001', { reqAsBuffer: true,reqBodyEncoding: false }));
    let url = '/upload/ajax-upload-file'

    /*app.post(url, cors(corsOptions), resetTimeout, requestProxy({
        url:config.hosts.main.www+'/upload/ajax-upload-file',
        reqAsBuffer: true,
        cache: false,
        timeout: 180000,
    }));*/
    app.post(url, cors(corsOptions), uploadActionFile);
    app.options(url, cors(corsOptions), function (req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    })

    /*app.get("/attachment/temp/:id", cors(corsOptions), resetTimeout, function(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        return requestProxy({
            url: config.hosts.main.www + '/attachment/temp/' + id ,
            reqAsBuffer: true,
            cache: false,
            timeout: 180000,
        })(req, res, next);
    });*/

    app.get("/attachment/temp/:fileId", getTmpAttachment);

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
async function getPublicFile(req: Request, res: Response, next?: NextFunction) {
    // req.clearTimeout();
    var cacheFile = await API.attachment.getFileCache({id:req.params.id, isPublic:true});
    if(!cacheFile) {
        return next && next(404);
    }
    res.set("Content-Type", cacheFile.type);
    let file = cacheFile.file;
    if(!path.isAbsolute(file))
        file = path.join(pwd, file);

    let isExist = await new Promise((resolve, reject) => {
        fs.exists(file, resolve);
    });
    if (!isExist) {
        return next && next(404);
    }
    return res.sendFile(file);
}