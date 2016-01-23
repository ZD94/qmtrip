/**
 * Created by wlh on 16/1/23.
 */


var service = {};
var API = require("common/api");

/**
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

module.exports = service;