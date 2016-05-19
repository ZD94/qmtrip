/**
 * Created by wlh on 16/1/23.
 */

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
 * @param {String} params.mediaId
 * @return {Promise} 附件fileId
 */
service.mediaId2key = function(params) {
    var self = this;
    var mediaId = params.mediaId;
    return Promise.resolve()
    .then(function() {
        if (!mediaId) {
            throw {code: -1, msg: "缺少mediaId"}
        }
    })
    .then(function() {
        return API.wechat.downloadMedia({mediaId: mediaId})
    })
    .then(function(content) {
        return API.attachments.saveAttachment({contentType: "image/png", content: content, isPublic: false});
    })
    .then(function(fileId) {
        return API.attachment.bindOwner({fileId: fileId, accountId: self.accountId})
        .then(function() {
            return fileId;
        });
    })
}

module.exports = service;