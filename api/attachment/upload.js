/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var moment = require("moment");
var formidable = require('formidable');
var config = require('config');
var fs = require('fs');
var path = require('path');
var nodeXlsx = require("node-xlsx");
var crypto = require("crypto");
var API = require("common/api");

function uploadActionFile(req, res, next) {
    var user_id = req.cookies.user_id;
//    var user_id = 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6';
    var type = req.query.type;
    var has_id = [];
    var form = new formidable.IncomingForm();
    form.uploadDir = config.upload.tmpDir;
    form.maxFieldsSize = config.upload.maxSize;
    form.keepExtensions = true;
    var filePath = '';//file.tmpFile.path
    if (!fs.exists(config.upload.tmpDir)) {
        fs.mkdirSync(config.upload.tmpDir);
    }
    form.parse(req, function (err, fields, file) {
        if(file.tmpFile){
            filePath = file.tmpFile.path;
        } else {
            for(var key in file){
                if( file[key].path && filePath==='' ){
                    filePath = file[key].path;
                }
            }
        }
        var fileExt = filePath.substring(filePath.lastIndexOf('.'));
        if (type && type == 'xls' && ('.xls.xlsx').indexOf(fileExt.toLowerCase()) === -1) {//导入excle
            fs.exists(filePath, function (exists) {
                if(exists){
                    fs.unlink(filePath);
                }
            });
            res.send('{"ret":-1, "errMsg":"仅允许上传“xls,xlsx”格式文件"}');
            return;
        }
        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.send('{"ret":-1, "errMsg":"'+err.message+'"}');
            } else {
                var file_type = file.tmpFile.type;
                var md5 = crypto.createHash("md5");
                var md5key = md5.update(data).digest("hex");
                has_id.push(user_id);
                var imgObj = {md5key: md5key,content: data, userId: user_id, hasId: JSON.stringify(has_id),fileType:file_type};
                if (type && type == 'avatar'){//上传头像
                    imgObj = {md5key: md5key,content: data, userId: user_id, isPublic: true,fileType:file_type};
                }
                if (type && type == 'invoice'){//上传票据
                    API.staff.getInvoiceViewer({accountId: user_id})
                        .then(function(data){
                            has_id.push.apply(has_id, data);
                            return API.attachment.deleteAttachment({md5key: md5key,userId: user_id})
                                .then(function(){
                                    return API.attachment.createAttachment(imgObj)
                                        .then(function(result){
                                            fs.exists(filePath, function (exists) {
                                                if(exists){
                                                    fs.unlink(filePath);
                                                    console.log("删除临时文件");
                                                }
                                            });
                                            res.send('{"ret":0, "errMsg":"", "md5key":"'+md5key+'"}');
                                        })
                                })
                        })
                        .catch(next).done();
                }else{
                    API.attachment.deleteAttachment({md5key: md5key,userId: user_id})
                        .then(function(){
                            return API.attachment.createAttachment(imgObj)
                                .then(function(result){
                                    fs.exists(filePath, function (exists) {
                                        if(exists){
                                            fs.unlink(filePath);
                                            console.log("删除临时文件");
                                        }
                                    });
                                    res.send('{"ret":0, "errMsg":"", "md5key":"'+md5key+'"}');
                                })
                        })
                        .catch(next).done();
                }
            }
        });
    });
}

function getImg(req, res, next) {
    var md5key = req.params.md5key;
    var userId = req.cookies.user_id;
//    var userId = 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6';
    API.attachment.getAttachment({md5key: md5key, userId: userId})
        .then(function(result){
            if(!result.isPublic){
                if(result && ((result.hasId && result.hasId.join(",").indexOf(userId) != -1))){
                    res.write(result.content, "hex");
                    res.end();
                }else{
                    res.write("您没有权限访问该图片", "utf-8");
                    res.end();
                }
            }else{
                res.write(result.content, "hex");
                res.end();
            }
        })
        .catch(next).done();
}

function downloadExcle(req, res, next){
    var fileName = req.params.fileName;
    var filePath = config.upload.tmpDir+"/" + fileName;
    if(fileName.indexOf('template') != -1){
        filePath = config.template.file+"/" + fileName;
    }
    fs.exists(filePath, function (exists) {
        if(!exists){
            res.send("文件不存在");
        }
    });
    fs.readFile(filePath, function (err, data) {
        res.writeHead(200, {
            'Content-Type': "application/vnd.ms-excel",
            'Content-Disposition': 'attachment; filename="'+fileName+'"'
        });
        res.write(data);
        res.end();
        if(fileName.indexOf('template') == -1){
            fs.exists(filePath, function (exists) {
                if(exists){
                    fs.unlink(filePath);
                    console.log("删除临时文件");
                }
            });
        }
    })
}
module.exports = function(app){
    app.post('/upload/ajax-upload-file', uploadActionFile);
    app.get('/upload/get-img-file/:md5key', getImg);
    app.get('/download/excle-file/:fileName', downloadExcle);
};

