/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var moment = require("moment");
var formidable = require('formidable');
var config = require('config');
var fs = require('fs');
var path = require('path');
import crypto = require("crypto");
var API = require("common/api");
var requestProxy = require('express-request-proxy');

module.exports = function(app) {
    //app.post('/upload/ajax-upload-file', proxy('http://localhost:4001', { reqAsBuffer: true,reqBodyEncoding: false }));
    app.post('/upload/ajax-upload-file', requestProxy({
        url:config.hosts.main.www+'/upload/ajax-upload-file',
        reqAsBuffer: true,
        cache: false,
    }));
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
async function getPublicFile(req, res, next) {
    req.clearTimeout();
    var cacheFile = await API.attachment.getFileCache({id:req.params.id, isPublic:true});
    if(!cacheFile) {
        return next(404);
    }
    res.set("Content-Type", cacheFile.type);
    return res.sendFile(cacheFile.file);
}

/*
function downloadExcle(req, res, next) {
    req.clearTimeout();
    var fileName = req.params.fileName;
    var filePath = config.upload.tmpDir + "/" + fileName;
    if(fileName.indexOf('template') != -1) {
        filePath = config.template.file + "/" + fileName;
    }
    fs.exists(filePath, function(exists) {
        if(!exists) {
            res.send("文件不存在");
        }
    });
    fs.readFile(filePath, function(err, data) {
        res.writeHead(200, {
            'Content-Type': "application/vnd.ms-excel",
            'Content-Disposition': 'attachment; filename="' + fileName + '"'
        });
        res.write(data);
        res.end();
        if(fileName.indexOf('template') == -1) {
            fs.exists(filePath, function(exists) {
                if(exists) {
                    fs.unlink(filePath);
                    console.log("删除临时文件");
                }
            });
        }
    })
}
*/

