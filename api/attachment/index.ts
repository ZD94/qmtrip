/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var Owner = sequelize.models.Owner;
var API = require("@jingli/dnode-api");
var config = require('@jingli/config');
import Logger from '@jingli/logger';
let logger = new Logger("attachment");
import '@jingli/fs-promisify';
import * as fs from 'fs';
import * as path from 'path';
var utils = require("common/utils");
import {Models} from "_types/index";
import {Attachment, RelateFile} from "_types/attachment";
import {md5} from "common/utils";
import {Staff} from "_types/staff/staff";


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

function signFileId(fileid: string, expirttime: number) {
    let key = 'wojiushibugaosuni';
    let str = fileid + expirttime + key;
    return md5(str);
}

class ApiAttachment {

    /**
     * @method saveAttachment
     *
     * 保存附件信息
     *
     * @param {Object} params
     * @param {String} params.content   附件是base64字符串
     * @param {boolean} params.isPublic  是否公共 true 是 false否
     * @param {String} params.contentType http contentType 详情见http://tool.oschina.net/commons
     * @return {Promise} "32位唯一串"
     */
    static async saveAttachment(params): Promise<any> {
        var content = params.content;
        var isPublic = params.isPublic || false;
        var contentType = params.contentType;
        var id:string;
        let staff = await Staff.getCurrent();
        let staffId = null;
        if(staff) staffId = staff.id;

        if (!content) {
            throw {code: -1, msg: "附件信息不能为空"};
        }

        if (!contentType) {
            throw {code: -1, msg: "contentType不能为空"};
        }

        content = new Buffer(content, 'base64');
        id = utils.md5(content);
        var attachment = await Models.attachment.get(id);
        if (!attachment) {
            attachment = Attachment.create({id: id, content: content, contentType: contentType, staffId: staffId});
            attachment = await attachment.save();
        }
        var file = RelateFile.create({isPublic: isPublic, key: id});
        file = await file.save();
        let expireTime = Date.now() + 24 * 60 * 60 * 1000;
        let sign = signFileId(file.id, expireTime)
        return {
            fileId: file.id,
            sign: sign,
            expireTime: expireTime,
        }
    }

    /**
     * @methdo removeFile 删除文件表和附件记录
     * @param params
     * @param params.id uuid
     * @returns {*|Boolean|Promise.<undefined>|Promise.<Integer>}
     */
    static async removeFileAndAttach(params): Promise<boolean> {
        if (!params) {
            params = {};
        }

        var id = params.id;
        var file = await Models.relateFile.get(id);
        let [relateFile, attachment] = await Promise.all([
            Models.relateFile.get(file.id),
            Models.attachment.get(file.key)
        ])
        await relateFile.destroy();
        await attachment.destroy();
        return true;
    }

    /**
     * @method getAttachment 通过fileId获取附件
     *
     * @param {Object} params
     * @param {String} params.id 文件ID
     * @return {Promise} 附件信息 {id: "ID", content: "内容", "isPublic": "true|false"}
     */
    static async getAttachment(params): Promise<any> {
        if (!params) {
            params = {};
        }
        var id = params.id;
        var width = params.width || 600;
        var height = params.height || 600;

        var file = await Models.relateFile.get(id)
        if(!file)
            throw {code:-1, msg:"文件不存在"};

        var attachment = await Models.attachment.get(file.key)
        if (!attachment || !attachment.content) {
            return {};
        }
        // var content = attachment.content.toString("base64");
        var contentBuffer = new Buffer(attachment.content);
        var content = contentBuffer.toString("base64");
        return {id: attachment.id, content: content, isPublic: file.isPublic, contentType: attachment.contentType};
    }

    /**
     * 绑定拥有者
     *
     * @param {Object} params
     * @param {String} params.fileId
     * @param {UUID} params.accountId
     */
    static bindOwner(params: {fileId: string, accountId: string}) {
        var fileId = params.fileId;
        var accountId = params.accountId;
        return Owner.create({
            fileId: fileId,
            accountId: accountId
        })
    }

    static getOwner(params: {fileId: string, user_id: string}) {
        var fileId = params.fileId;
        var accountId = params.user_id;
        return Owner.findOne({where:{accountId: accountId, fileId: fileId}})
            .then(function(owner: object){
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
    static async getSelfAttachment(params: {fileId: string}) {
        var fileId = params.fileId;
        /*let staff = await Staff.getCurrent();
        let attachments = await Models.attachment.find({where: {id: fileId, staffId: staff.id}});
        let attachment = null;
        if(attachments && attachments.length){
            attachment = await API.attachment.getAttachment({id: fileId});
        }*/

        let attachment = await API.attachment.getAttachment({id: fileId});

        return attachment;
    }

    static async getFileCache(params: {id: string, isPublic: boolean}) {
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
                var attachment = await Models.attachment.get(id);
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
