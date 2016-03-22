/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var fs = require("fs");
var crypto = require("crypto");
var config = require('config');
var utils = require("common/utils");
var sequelize = require("common/model").importModel("./models");
var Owner = sequelize.models.Owner;
var L = require("../../common/language");
var API = require("../../common/api");
var md5 = require("common/utils").md5;

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
 * @param {String} params.fileId
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


attachment.__initHttpApp = require('./upload');

module.exports = attachment;
