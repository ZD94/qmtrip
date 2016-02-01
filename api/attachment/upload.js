/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var moment = require("moment");
var formidable = require('formidable');
var config = require('config');
var fs = require('fs');
var path = require('path');
var crypto = require("crypto");
var API = require("common/api");

function uploadActionFile(req, res, next) {
    var user_id = req.cookies.user_id;
    var token_id = req.cookies.token_id;
    var token_sign = req.cookies.token_sign;
    var timestamp = req.cookies.timestamp;
    var type = req.query.type;
    var form = new formidable.IncomingForm();
    form.uploadDir = config.upload.tmpDir;
    form.maxFieldsSize = config.upload.maxSize;
    form.keepExtensions = true;
    var filePath = '';//file.tmpFile.path

    return API.auth.authentication({user_id: user_id, token_id: token_id, token_sign: token_sign, timestamp: timestamp})
        .then(function(result){
            if (!result) {
                return false;
            }
            fs.exists(config.upload.tmpDir, function (exists) {
                if(!exists){
                    fs.mkdir(config.upload.tmpDir);
                }
                form.parse(req, function (err, fields, file) {
                    if(file.tmpFile){
                        filePath = file.tmpFile.path;
                    } else {
                        res.send('{"ret":-1, "errMsg":"文件不存在"}');
                        return;

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
                            var isPublic = false;
                            if (type && type == 'avatar'){//上传头像
                                isPublic = true;
                            }

                            var content = data.toString("base64")
                            var contentType = file_type;
                            API.attachments.saveAttachment({
                                content: content,
                                contentType: contentType,
                                isPublic: isPublic
                            })
                                .then(function(fileid) {
                                    return API.attachment.bindOwner({
                                        accountId: user_id,
                                        fileId: fileid
                                    })
                                        .then(function(own) {
                                            return fileid
                                        })
                                })
                                .then(function(fileid) {
                                    fs.exists(filePath, function (exists) {
                                        if(exists){
                                            fs.unlink(filePath);
                                            console.log("删除临时文件");
                                        }
                                    });
                                    res.send('{"ret":0, "errMsg":"", "fileId":"'+fileid+'"}');
                                })
                                .catch(function(err){
                                    console.log(err);
                                }).done();
                        }
                    });
                });
            });
        });

}

/**
 * 访问公共文件
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function getPublicFile(req, res, next) {
    var attachmentPath = path.join(__dirname, "../../public/upload");
    var id = req.params.id;
    if (!id) {
        return next(404);
    }

    return API.attachments.getAttachment({id: id})
        .then(function(attachment) {

            if (!attachment || !attachment.isPublic) {
                return res.send(404);
            }

            fs.exists(attachmentPath, function(result) {
                if (!result) {
                    fs.mkdir(attachmentPath, function(err) {
                        if (err) {
                            return next(err);
                        }

                        doneAttachmentDir(attachment);
                    })
                }
                doneAttachmentDir(attachment);
            });
        })
        .catch(next).done();

    function doneAttachmentDir(attachment) {
        ////写入缓存文件
        var filepath = path.join(attachmentPath, attachment.id);
        fs.writeFile(filepath, attachment.content, {encoding: "binary"}, function(err) {
            if (err) {
                return next(err);
            }

            res.set("Content-Type", attachment.contentType);
            var content = new Buffer(attachment.content, "base64");
            res.write(content);
            res.end();
        })
    }
}

/**
 * 上传者访问上传附件（eg:上传前预览文件）
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function getSelfFile(req, res, next){
    var fileId = req.params.id;
    var accountId = req.cookies.user_id;
    var token_id = req.cookies.token_id;
    var token_sign = req.cookies.token_sign;
    var timestamp = req.cookies.timestamp;
    if (!fileId) {
        return next(404);
    }
    return API.auth.authentication({user_id: accountId, token_id: token_id, token_sign: token_sign, timestamp: timestamp})
        .then(function(result){
            if (!result) {
                return false;
            }

            return API.attachment.getOwner({fileId: fileId, user_id: accountId})
                .then(function(result){
                    if(result){
                        return API.attachments.getAttachment({id: fileId})
                            .then(function(attachment) {
                                res.set("Content-Type", attachment.contentType);
                                var content = new Buffer(attachment.content, 'base64');
                                res.write(content);
                                res.end();
                            })
                            .catch(function(err){
                                console.log(err);
                            }).done();
                    }else{
                        return next(404);;
                    }
                })
        })

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


/**
 * 访问公有附件
 * @param req
 * @param res
 * @param next
 */
/*function getUploadFile(req, res, next) {
    var md5key = req.params.md5key;
    var userId = req.cookies.user_id;
    API.attachment.getAttachment({md5key: md5key, userId: userId, isPublic: true})
        .then(function(result){
            if(result){
                fs.exists(config.upload.pubDir, function (exists) {
                    if(!exists){
                        fs.mkdir(config.upload.pubDir);
                    }
                    var fileName = result.md5key + result.fileType;
                    fs.exists(config.upload.pubDir+"/"+fileName, function (exists) {
                        if(exists){
                            res.redirect("/upload/"+fileName);
                        }else{
                            fs.writeFileAsync(config.upload.pubDir+'/'+ fileName , result.content, 'binary')
                                .then(function(){
                                    res.redirect("/upload/"+fileName);
                                });
                        }
                    });
                })
            }
        })
        .catch(next).done();
}*/


module.exports = function(app){
    app.post('/upload/ajax-upload-file', uploadActionFile);
    app.get("/attachments/:id", getPublicFile);
    app.get("/self/attachments/:id", getSelfFile);
    //app.get('/upload/get-img-file/:md5key', getImg);
    app.get('/download/excle-file/:fileName', downloadExcle);
//    app.get('/upload/:md5key', getUploadFile);

};

