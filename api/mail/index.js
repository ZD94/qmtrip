/**
 * Created by wlh on 15/12/9.
 */


var Q = require("q");
var nodemailer = require("nodemailer")
var L = require("../../common/language");
var C = require("../../config");
var format = require("js-format");
var Mail = {};

var TEMPLATE = {
    "ACTIVE_EMAIL": {subject: "全麦商旅激活邮件", html: "%s感谢您注册了全麦商旅,点击此处激活您的账号%s"},
    "INVITE_JOIN_EMAIL": {subject: "邀请激活邮件", html: "%s你好,%s邀请您加入企业:%s,点击此处设置您的密码%s"}
};

/**
 * 发送邮件
 *
 * @param {STRING} to 接收人
 * @param {STRING} category 邮件类型 ACTIVE_EMAIL
 * @param {ARRAY|STRING} values 占位符值
 * @param {Callback} callback
 */
Mail.sendEmail = function(to, category, values, callback) {
    var defer = Q.defer();
    if (!to) {
        defer.reject(L.ERR.EMAIL_EMPTY);
        return defer.promise.nodeify(callback);
    }

    var template = TEMPLATE[category]
    if (!template) {
        defer.reject({code: -1, msg: "邮件类型不存在"});
        return defer.promise.nodeify(callback);
    }

    var html = format(template.html, values);
    return send({to: to, subject: template.subject, html: html}).nodeify(callback);
}

function send (options, callback) {
    var from = options.from || '全麦商旅 '+ C.mail.auth.user;
    var to = options.to;
    var subject = options.subject;
    var text = options.text;
    var html = options.html;

    var transporter = nodemailer.createTransport(C.mail);

    var mailOptions = {
        from: from, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plaintext body
        html: html // html body
    };

    var defer = Q.defer();
    transporter.sendMail(mailOptions, function(err, resp) {
        if (err) {
            return defer.reject(err);
        }
        defer.resolve(resp);
    })
    return defer.promise.nodeify(callback);
}

module.exports = Mail;