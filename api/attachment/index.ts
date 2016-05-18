/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var Owner = sequelize.models.Owner;
var L = require("common/language");
var API = require("common/api");

class ApiAttachment {
    /**
     * 绑定拥有者
     *
     * @param {Object} params
     * @param {String} params.fileId
     * @param {UUID} params.accountId
     */
    static bindOwner(params) {
        var fileId = params.fileId;
        var accountId = params.accountId;
        return Owner.create({
            fileId: fileId,
            accountId: accountId
        })
    }

    static getOwner(params) {
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
    static getSelfAttachment(params) {
        var fileId = params.fileId;
        var accountId = params.accountId;
        return Owner.findOne({where: {fileId: fileId, accountId: accountId}})
            .then(function(owner) {
                if (!owner) {
                    throw L.ERR.PERMISSION_DENY();
                }
                return API.attachments.getAttachment({id: fileId});
            })
    }


    static __initHttpApp = require('./upload');
}

export= ApiAttachment;
