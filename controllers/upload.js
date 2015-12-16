/**
 * Created by YCXJ-wanglihui on 2014/7/14.
 */
'use strict';
var formidable = require('formidable');
var config = require('../config');
var fs = require('fs');
var path = require('path');
var crypto = require("crypto");
var staffServer = require("../api/staff/index");
//var ImgProxy = BaseProxy.instance('attachment.attachment');

function uploadActionFile(req, res, next) {
//    var user_id = req.cookies.user_id;
    var user_id = 'ee3eb6a0-9f22-11e5-8540-8b3d4cdf6eb6';
    var form = new formidable.IncomingForm();
    form.uploadDir = config.upload.tmpDir;
    form.maxFieldsSize = config.upload.maxSize;
    form.keepExtensions = true;
    var filePath = '';//file.tmpFile.path
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
        if (('.xls.xlsx').indexOf(fileExt.toLowerCase()) === -1) {
            fs.exists(filePath, function (exists) {
                if(exists){
                    fs.unlinkSync(filePath);
                }
            });
            res.send('{"ret":-1, "errMsg":"仅允许上传“xlsm,xlsx”格式文件"}');
            return;
        }else{
            var fileUrl = config.upload.tmpDir+filePath.substring(filePath.lastIndexOf('/'));
            staffServer.importExcel({accountId: user_id, fileUrl: filePath})
                .then(function(result){
                    if(result){
                        fs.exists(filePath, function (exists) {
                            if(exists){
                                fs.unlinkSync(filePath);
                                console.log("删除临时文件");
                            }
                        });
                        res.send('{"ret":0, "errMsg":"", "result":"'+result+'"}');
                    }
                })
        }
    });
};

exports.uploadActionFile = uploadActionFile;