/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var formidable = require('formidable');
var config = require('../config');
var fs = require('fs');
var path = require('path');
var crypto = require("crypto");
var attachmentServer = require("../api/attachment/index");
//var ImgProxy = BaseProxy.instance('attachment.attachment');

function uploadActionFile(req, res, next) {
    var user_id = req.cookies.user_id;
//    var user_id = 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6';
    var type = req.query.type;
    var form = new formidable.IncomingForm();
    form.uploadDir = config.upload.tmpDir;
    form.maxFieldsSize = config.upload.maxSize;
    form.keepExtensions = true;
    var filePath = '';//file.tmpFile.path
    if (!fs.existsSync(config.upload.tmpDir)) {
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
        if (type && type == 'xls' && ('.xls.xlsx').indexOf(fileExt.toLowerCase()) === -1) {
            fs.exists(filePath, function (exists) {
                if(exists){
                    fs.unlinkSync(filePath);
                }
            });
            res.send('{"ret":-1, "errMsg":"仅允许上传“xlsm,xlsx”格式文件"}');
            return;
        }else{
            fs.readFile(filePath, function (err, data) {
                if (err) {
                    res.send('{"ret":-1, "errMsg":"'+err.message+'"}');
                } else {
                    var file_type = file.tmpFile.type;
                    var md5 = crypto.createHash("md5");
                    var md5key = md5.update(data).digest("hex");
                    var has_id = [];
                    has_id.push(user_id);
                    var imgObj = {md5key: md5key,content: data, userId: user_id, hasId: JSON.stringify(has_id),fileType:file_type};
                    attachmentServer.deleteAttachment({md5key: md5key,userId: user_id})
                        .then(function(){
                            return attachmentServer.createAttachment(imgObj)
                                .then(function(result){
                                    fs.exists(filePath, function (exists) {
                                        if(exists){
                                            fs.unlinkSync(filePath);
                                            console.log("删除临时文件");
                                        }
                                    });
                                    res.send('{"ret":0, "errMsg":"", "md5key":"'+md5key+'"}');
                                })
                        })
                        .catch(next).done();
                }
            });

            /*return staffServer.importExcel({accountId: user_id, md5key: md5key})
                .then(function(result){
                    if(result){
                        fs.exists(filePath, function (exists) {
                            if(exists){
                                fs.unlinkSync(filePath);
                                console.log("删除临时文件");
                            }
                        });
                    }
                })*/
        }
    });
};

function getImg(req, res, next) {
    var md5key = req.params.md5key;
    var userId = req.cookies.user_id;
    attachmentServer.getAttachment({md5key: md5key, userId: userId})
        .then(function(result){
            result = result.toJSON();
            if(result.isPublic){
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
};

exports.uploadActionFile = uploadActionFile;
exports.getImg = getImg;