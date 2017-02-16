/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var Owner = sequelize.models.Owner;
import L from 'common/language';
var API = require("common/api");
var config = require('config');
let Logger = require('common/logger');
let logger = new Logger("attachment");
import * as fs from 'fs';
import * as path from 'path';


async function fs_exists(file): Promise<boolean>{
    try{
        await fs.statAsync(file);
        return true;
    }catch(e){
        if(e.code != 'ENOENT')
            throw e;
        return false;
    }
}

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
    static async getSelfAttachment(params) {
        var fileId = params.fileId;
        var accountId = params.accountId;
        // var owner = await Owner.findOne({where: {fileId: fileId, accountId: accountId}});
        // if (!owner) {
        //     throw L.ERR.PERMISSION_DENY();
        // }
        var attachment = await API.attachments.getAttachment({id: fileId, isZoom:'off'});

        // var filepath = path.join('tmp', attachment.id);
        // fs.writeFile(filepath, attachment.content, {encoding: "binary"});

        return attachment;
    }

    static async getFileCache(params) {
        try{
            var id = params.id;
            var isPublic = params.isPublic;
            var cachePath = config.upload.privateDir;
            if(isPublic)
                cachePath = config.upload.publicDir;
            if(!id) {
                return null;
            }
            var contentType = 'image/png';
            var filepath = path.join(cachePath, id);

            var cache_exist = await fs_exists(filepath);
            if(!cache_exist){
                var attachment = await API.attachments.getAttachment({id: id});
                if(!attachment) {
                    return null;
                }
                if(attachment.isPublic !== isPublic)
                    return null;
                contentType = attachment.contentType;

                var dir_exist = await fs_exists(cachePath);
                if(!dir_exist){
                    await fs.mkdirAsync(cachePath, '755');
                }
                var content = new Buffer(attachment.content, "base64");
                await fs.writeFileAsync(filepath+'.type', contentType, 'utf8');
                await fs.writeFileAsync(filepath, content, {encoding: "binary"});
            }else{
                try{
                    contentType = await fs.readFileAsync(filepath+'.type', 'utf8');
                } catch(e) {}
            }
            return {file:filepath, type:contentType};
        }catch(e){
            logger.error(e.stack||e);
            return null;
        }
    }

    static __initHttpApp = require('./upload');
}

export= ApiAttachment;
