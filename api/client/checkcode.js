/**
 * Created by wlh on 15/12/14.
 */

/**
 * @module API
 * @type {API|exports|module.exports}
 */
var API = require("../../common/api");

/**
 * @class checkcode 验证码
 * @type {{__public: boolean, getMsgCheckCode: module.exports.getMsgCheckCode, getPicCheckCode: module.exports.getPicCheckCode}}
 */
var checkcode = {
    /**
     * @property __public 是否公共模块
     * @type {Boolean}
     */
    __public: true,
    /**
     * @method getMsgCheckCode
     *
     * 获取短信验证码
     *
     * @param {Object} params
     * @param {String} params.mobile 手机号
     * @param {String} [params.ip] ip地址
     * @param {Function} callback
     * @example
     * ```
     *   API.checkcode.getMsgCheckCode({mobile: "15501149644"}, function(err, result) {
     *      if (err) {
     *          alert(err);
     *          return false;
     *      }
     *
     *      console.info(result);
     *      console.info(result.data.ticket);   //凭证
     *   })
     * ```
     */
    getMsgCheckCode: function(params, callback) {
        var type = 1;
        params.type = 1;
        API.checkcode.getMsgCheckCode(params, callback);
    },
    /**
     * @method getPicCheckCode
     *
     * 获取图形验证码
     *
     * @param {Object} params 参数
     * @param {Function} callback
     * @example
     * ```
     *  API.checkcode.getPicCheckCode({}, function(err, result) {
     *      if (err) {
     *          return alert(err);
     *      }
     *
     *      console.info(result);
     *      console.info(result.data.ticket);   //凭证
     *      console.info(result.data.capture);  //验证码图像
     *  })
     * ```
     */
    getPicCheckCode: function(params, callback) {
        var type = 1;
        params.type = 0;
        API.checkcode.getPicCheckCode(params, callback);
    },
}

module.exports = checkcode;