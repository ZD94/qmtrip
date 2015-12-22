/**
 * Created by wlh on 15/12/14.
 */

/**
 * @module API
 */

var API = require("../../common/api");
var Q = require("q");

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
        params.type = type;
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
        params.type = type;
        API.checkcode.getPicCheckCode(params, callback);
    },
    /**
     * @method isMatchPicCheckCode
     *
     * 判断验证码是否正确
     *
     * @param {Object} params
     * @param {String} params.ticket 凭证
     * @param {String} params.code 验证码
     * @param {Function} [callback] 回调函数 {code: 0, msg: "Ok"}, {code: -1, msg: "验证码已失效"}
     * @return {Promise} {code: 0, msg: "Ok"}, {code: -1, msg: "验证码已失效"}
     * @example
     * ```
     *  API.checkcode.isMatchPicCheckCode({ticket: "TICKET", code: "CODE"}, function(err, result) {
     *      if (err) {
     *          alert(err);
     *      } else {
     *          if (result.code) {
     *              alert(result.msg);  //显示错误
     *          } else {
     *              console.info("正确");
     *          }
     *      }
     *  })
     * ```
     */
    isMatchPicCheckCode: function(params, callback) {
        var fn = Q.denodeify(API.checkcode.isMatchPicCheckCode);
        return fn(params, callback);
    },
    /**
     * @method isMatchMsgCheckCode
     *
     * 是否匹配短信验证码
     *
     * @param {Object} params   参数
     * @param {String} params.ticket 凭证
     * @param {String} params.code 验证码
     * @param {Function} [callback] 可选回调函数 {code: 0, msg: "OK"}, {code: -1, msg: "已失效或者不存在"}
     * @return {Promise} {code: 0, msg: "OK"}, {code: -1, msg: "已失效或者不存在"}
     * @example
     * ```
     * API.checkcode.isMatchMsgCheckCode({ticket: "TICKET", code: "CODE"}, function(err, result) {
     *  if (err) {
     *      console.info(err);  //有错误,抛出错误
     *      return;
     *  }
     *
     *  if (result.code) {
     *      console.info(result.msg);   //失效或者不存在
     *  } else {
     *      console.info("验证码有效");
     *  }
     * })
     * ```
     */
    isMatchMsgCheckCode: function(params, callback) {
        var fn = Q.denodeify(API.checkcode.isMatchMsgCheckCode);
        return fn(params, callback);
    }
}

module.exports = checkcode;