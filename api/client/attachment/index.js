/**
 * Created by wlh on 16/1/26.
 */


var attachment = {};
var API = require("common/api");

/**
 * @method getSelfAttachment 获取自己的附件
 *
 * @param {String} params
 * @param {String} params.key
 */
attachment.getSelfAttachment = function(params) {
    var accountId = this.accountId;
    var key = params.key;

    return API.attachment.getSelfAttachment({
        accountId: accountId,
        key: key
    });
}

/**
 * @method previewSelfImg 预览自己的图片
 *
 * @param {Object} params
 * @param {String} params.key
 * @returns {String} 图形base64字符串
 */
attachment.previewSelfImg = function(params) {
    var accountId = this.accountId;
    var key = params.key;
    return API.attachment.getSelfAttachment({
        accountId: accountId,
        key: key
    })
    .then(function(attachment) {
        return 'data:image/jpg;base64,' + attachment.content;
    })
}

module.exports = attachment;