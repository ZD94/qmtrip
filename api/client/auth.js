/**
 * Created by wlh on 15/12/9.
 */

var Q = require("q");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var db = require("../../models").sequelize;
var uuid = require("node-uuid");
var authServer = require("../auth/index");
var auth = {};
var accounts = [];
var mail = require("../mail");

/**
 * 新建账号
 * @param {Object} data 参数
 * @param {String} data.email 邮箱
 * @param {String} data.pwd 密码
 * @param {Callback} callback 回调函数
 * @return {Promise} {code: 0, data:{accountId: 账号ID, email: "邮箱", status: "状态"}
 */
auth.newAccount = authServer.newAccount;

/**
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @param {Callback} callback 可选回调函数
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 */
auth.login = authServer.login;

/**
 * 认证登录凭证是否有效
 *
 * @param {UUID} userId
 * @param {UUID} tokenId
 * @param {Number} timestamp
 * @param {String} tokenSign
 * @param {Callback} callback
 * @return {Promise} {code:0, msg: "Ok"}
 */
auth.authentication = authServer.authentication;
/**
 * 绑定手机号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 操作人
 * @param {String} data.mobile 要绑定的手机号
 * @param {String} data.code 手机验证码
 * @param {String} data.pwd 登录密码
 * @param {Callback} callback
 * @return {Promise} {code: 0, msg: "ok};
 */
auth.bindMobile =authServer.bindMobile;

module.exports = auth;