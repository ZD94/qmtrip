/**
 * Created by wlh on 16/1/23.
 */

/**
 * @class wechat
 */
var service = {};
var API = require("common/api");
var utils = require("common/utils");
var Q = require("q");

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
 * @return {Promise} 图像md5后的key
 */
service.mediaId2key = function(params) {
    var accountId = this.accountId;
    var mediaId = params.mediaId;
    var type = params.type;
    var md5key;
    var buffers;
    return Q()
    .then(function() {
        if (!mediaId) {
            throw {code: -1, msg: "缺少mediaId"}
        }
    })
    .then(function() {
        return API.wechat.downloadMedia({mediaId: mediaId})
    })
    .then(function(content) {
        buffers = new String(content, 'base64');
        md5key = utils.md5(buffers);
        return API.attachment.getAttachment({md5key: md5key, userId: accountId})
    })
    .then(function(attachement) {
        if (attachement && attachement.id) {
            return attachement;
        }

        return Q()
        .then(function() {
            if (type && type == 'invoice') {
                return API.staff.getInvoiceViewer({accountId: accountId})
                    .then(function(viewUsers) {
                        var hasId = viewUsers;
                        hasId.push(accountId);
                        return hasId;
                    })
            } else {
                return [accountId];
            }
        })
        .then(function(hasId) {
            hasId = JSON.stringify(hasId);
            return API.attachment.createAttachment({md5key: md5key, content: buffers, hasId: hasId, userId: accountId})
        })
    })
    .then(function(attachement) {
        return attachement.md5key;
    })
}

module.exports = service;