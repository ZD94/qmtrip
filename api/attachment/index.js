/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var Q = require("q");
var fs = require("fs");
var crypto = require("crypto");
var config = require('config');
var utils = require("common/utils");
var sequelize = require("common/model").importModel("./models");
var attachmentModel = sequelize.models.Attachment;
var Owner = sequelize.models.Owner;
var Paginate = require("../../common/paginate").Paginate;
var L = require("../../common/language");
var API = require("../../common/api");
var attachment = {};

/**
 * 绑定拥有者
 *
 * @param {Object} params
 * @param {String} params.key
 * @param {UUID} params.accountId
 */
attachment.bindOwner = function(params) {
    var fileId = params.fileId;
    var accountId = params.accountId;
    return Owner.create({
        fileId: fileId,
        accountId: accountId
    })
}

attachment.getOwner = function(params) {
    var fileId = params.fileId;
    var accountId = params.user_id;
    return Owner.findOne({where:{accountId: accountId, fileId: fileId}})
        .then(function(owner){
            if(owner){
                return true;
            }else{
                return false;
            }
        })
}

/**
 * 获取自己上传的附件
 *
 * @param {Object} params
 * @param {String} params.key
 * @param {UUID} params.accountId
 */
attachment.getSelfAttachment = function(params) {
    var fileId = params.fileId;
    var accountId = params.accountId;
    return Owner.findOne({where: {fileId: fileId, accountId: accountId}})
    .then(function(owner) {
        if (!owner) {
            throw L.ERR.PERMISSION_DENY;
        }
        return API.attachments.getAttachment({id: fileId});
    })
}


/**
 * 创建附件记录
 * @param data
 * @returns {*}
 */
attachment.createAttachment = function(data){
    return checkParams(["md5key","content"], data)
        .then(function(){
            return attachmentModel.create(data);
        });
}

/**
 * 将上传到临时文件夹下的文件保存到数据库(暂时无用)
 * @param params
 * @param params.md5key  //temp目录下文件名称
 * @param params.userId  当前用户id
 * @param params.isPublic  文件是否公开
 * @returns {*|Promise}
 */
attachment.saveAttachmentFromTmp = function(params){
    return checkParams(["md5key"], params)
        .then(function(){
            var publicDir = config.upload.pubDir;
            var md5key = params.md5key;
            var userId = params.userId;
            var isPublic = params.isPublic || false;
            var filePath = config.upload.tmpDir+"/"+md5key;
            fs.exists(publicDir, function (exists) {
                if(!exists) {
                    fs.mkdir(publicDir);
                }
                fs.exists(filePath, function (exists) {
                    if(exists){
                        fs.readFile(filePath, function (err, data) {
                            if (err) {
                                throw {"ret": -1, "errMsg": err.message};
                            } else {
                                var md5 = crypto.createHash("md5");
                                var md5key = md5.update(data).digest("hex");
                                var attObj = {md5key: md5key,content: data, userId: userId, isPublic: isPublic,fileType:md5key.split(".")[1]};
                                return attachmentModel.findOne({where: {md5key: md5key,userId: userId}})
                                    .then(function(att){
                                        if(!att){
                                            return attachmentModel.create(attObj);
                                        }else{
                                            return att;
                                        }
                                    })
                                    .then(function(attachObj){
                                        if(isPublic){
                                            return fs.rename(filePath,publicDir+"/"+md5key, function(err){
                                                if(err){
                                                    throw err;
                                                }
                                                fs.exists(filePath, function (exists) {
                                                    if(exists){
                                                        fs.unlink(filePath);
                                                        console.log("删除临时文件");
                                                    }
                                                    return attachObj.md5key;
                                                });
                                            })
                                        }else{
                                            return fs.exists(filePath, function (exists) {
                                                if(exists){
                                                    fs.unlink(filePath);
                                                    console.log("删除临时文件");
                                                }
                                                return attachObj.md5key;
                                            });
                                        }
                                    })
                            }
                        });
                    }else{
                        throw {msg: "文件不存在"};
                    }
                });
            });

        });
}

/**
 * 删除附件记录
 * @param params
 * @returns {*}
 */
attachment.deleteAttachment = function(params){
    return attachmentModel.destroy({where: params});
}

/**
 * 得到全部附件记录
 * @param params
 * @returns {*}
 */
attachment.getAllAttachment = function(params){
    var options = {};
    options.where = params;
    return attachmentModel.findAll(options);
}

/**
 * 得到一条附件记录
 * @param params
 * @returns {*}
 */
/*attachment.getAttachment = function(params){
    var options = {};
    options.where = params;
    return attachmentModel.findOne(options);
}*/

/**
 * 通过md5key查询附件记录并组合has_id
 * @param params
 * @returns {*|Promise}
 */
attachment.getAttachmentJointHasId = function(params){
    var options = {};
    options.where = params;
    var has_id = [];
    return attachmentModel.findAll(options)
        .then(function(datas){
            if(datas && datas.length>0){
                for(var i=0;i<datas.length;i++){
                    has_id.push.apply(has_id, datas[i].hasId);
                }
            }
            return datas[0];
        })
        .then(function(result){
            result.hasId = has_id;
            return result;
        })
}

/**
 * 分页查询附件记录集合
 * @param params 查询条件
 * @param options options.perPage 每页条数 options.page当前页
 */
attachment.listAndPaginateAttachment = function(params, options){
    if (!options) {
        options = {};
    }

    var page, perPage, limit, offset;
    if (options.page && /^\d+$/.test(options.page)) {
        page = options.page;
    } else {
        page = 1;
    }
    if (options.perPage && /^\d+$/.test(options.perPage)) {
        perPage = options.perPage;
    } else {
        perPage = 6;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = params;
    return attachmentModel.findAndCountAll(options)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

/**
 * 查看未被引用附件
 * @param params
 * @param opts
 * @returns {*}
 */
attachment.getNoUseList = function(params, opts){
    var page = opts.page || 1;
    var perPage = opts.perPage || 10;
    return getUsedList()
        .then(function(data){
//            if(data && data.size()>0){
            params.where = {"md5key": {not: data}};
            return attachment.listAndPaginateAttachment(params, {page: page, perPage: perPage, orderBy: 'create_at desc'})
//            }
        })
        .then(function(paginate){
            return paginate;
        });
}

function getUsedList() {
    return Q([]);
}

function checkParams(checkArray, params){
    return new Promise(function(resolve, reject){
        ///检查参数是否存在
        for(var key in checkArray){
            var name = checkArray[key];
            if(!params[name] && params[name] !== false && params[name] !== 0){
                return reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            }
        }
        resolve(true);
    });
}

attachment.__initHttpApp = require('./upload');

module.exports = attachment;
