/**
 * Created by wlh on 16/1/23.
 */
'use strict';
/**
 * @class wechat
 */
var service = {};
var API = require("common/api");
var utils = require("common/utils");

/**
 * @method getJSDKParams
 *
 * 获取微信公众号jsdk信息
 *
 * @param {Object} data
 * @param {String} data.url 当前网页网址 通过window.location.href 获取包含'#'号
 * @param {String} data.jsApiList 要使用的js api详情参考微信jssdk 文档
 * @return {Promise} config 如果成功返回微信配置信息  weixin.config(返回的配置信息);
 */
service.getJSDKParams = function(params) {
    return API.wechat.getJSDKParams(params);
}

/**
 * @method mediaId2key
 * 使用mediaId换取图像key
 *
 * @param {Object} params
 * @param {Array} params.mediaIds
 * @return {Promise} 附件fileId
 */
service.mediaId2key = function(params) {
    var self = this;
    var mediaIds = params.mediaIds;
    return Promise.resolve()
    .then(function() {
        if (!mediaIds) {
            throw {code: -1, msg: "缺少mediaIds"};
        }
    })
    .then(function() {
        if(Array.isArray(mediaIds) && mediaIds.length > 0){
            let ps = mediaIds.map(function(id){
                return oneMediaId2key(id, self.accountId);
            });
            return Promise.all(ps)
        }else{
            throw {code: -2, msg: "参数mediaIds格式不正确"};
        }
    })
}

function oneMediaId2key(id, accountId){
    return API.wechat.downloadMedia({mediaId: id})
        .then(function(content) {
            return API.attachments.saveAttachment({contentType: "image/png", content: content, isPublic: false});
        })
}

module.exports = service;