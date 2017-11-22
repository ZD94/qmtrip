/**
 * Created by wlh on 15/12/9.
 */
"use strict";

// var sequelize = require("common/model").importModel("./models");
// var Models = sequelize.models;
import {DB} from "@jingli/database"
import {EmailLog, EmailSubmit, EmailQueue} from "../../_types/mail"
import {Models} from "_types";
var scheduler = require("common/scheduler");
var validate = require("common/validate");
var nodemailer = require("nodemailer")
import L from '@jingli/language';
import C = require("@jingli/config");
var format = require("js-format");
var uuid = require("node-uuid");
var shortUrlService = require("../shorturl");
import _ = require("lodash");
import {EmailAttachment} from "./_interface";
import Logger from '@jingli/logger';
var logger = new Logger('mail');
var templates = require("./templates.json");
var path = require("path");

function timerSendMail() {
    scheduler("*/10 * * * * *", "sendEmail", function() {
        (async () => {
            //查询队列中10条待发送邮件
            let emails = await Models.emailQueue.find({where: {}, order: [["createdAt", "desc"]], limit: 10, logging:false});
            //发送邮件
            var promises = emails.map(async function(email){
                var toUsr = email.toUser;
                try{
                    //查询邮件主题内容
                    let submits = await Models.emailSubmit.find({where: {id: email["emailSubmitId"]}});
                    let submit = submits[0];
                    var subject = submit.subject;
                    var content = submit.content;
                    var isHtml = submit.isHtml;
                    var attachments = submit.attachment;
                    let result =  await _sendEmail(toUsr, subject, content, isHtml, attachments);
                    await _recordEmailLog(email.id, 1, result["response"]);
                }catch(err){
                    var errorMsg = '未知错误:'+err;
                    if (/550/.test(err.response)) {
                        errorMsg = "邮箱不存在:"+err.response;
                    }
                    await _recordEmailLog(email.id, -1, errorMsg);
                }
            });
            return Promise.all(promises);
        })().catch((err) => {
            logger.error(err.stack?err.stack:err);
        })
    });
}

//启动定时器
timerSendMail();

/**
 * 记录邮件日志
 *
 * @param id
 * @param status
 * @param error
 * @returns {*}
 * @private
 */
async function _recordEmailLog(id, status, error) {
    if (!error && status == 1) {
        error = 'ok';
    }

    return DB.transaction(async function(t) {
        try{
            let emails = await Models.emailQueue.find({where: {id: id}});
            let email = emails[0];
            if (!email) {
                return;
            }

            var emailLog = {id: email.id, emailQueueId: email["emailQueueId"],
                toUser: email.toUser, status: status, sendTime: email.sendTime, errorMsg: error};

            let emailLogObj = EmailLog.Create(emailLog);
            let update = await Promise.all([
                // Models.emailQueue.destroy({where: {id: id}}),
                email.destroy(),
                emailLogObj.save()
            ]);
            return update;
        }catch(err){
            throw err;
        }
    });
}

/**
 * 发送邮件
 *
 * @param {String} toUser
 * @param {String} subject
 * @param {String} content
 * @param {Boolean} isHtml
 * @private
 */
function _sendEmail(toUser, subject, content, isHtml, attachments) {
    if (!toUser) {
        throw L.ERR.EMAIL_EMPTY;
    }

    var template = content;
    var html = template;
    var opts: any = {to: toUser, subject: subject, content: subject, attachments: attachments};
    if (!isHtml) {
        opts.text = html;
        opts.html = '';
    } else {
        opts.html = html;
        opts.text = '';
    }
    return send(opts);
}


function send (options: {from: string, to: string, subject: string, text?: string, html?: string, attachments?: Array<EmailAttachment>}) {
    var from = options.from || '鲸力商旅 '+ C.mail.auth.user;
    var to = options.to;
    var subject = options.subject;
    var text = options.text || options.html;
    var html = options.html;
    let attachments: any = options.attachments;
    var transporter = nodemailer.createTransport(C.mail);

    if (typeof attachments == 'string') {
        attachments = JSON.parse(attachments);
    }

    attachments = attachments.map( (v) => {
        if (v.path) {
            v.path = path.join(process.cwd(), v.path);
        }
        return v;
    });

    var mailOptions = {
        from: from, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plaintext body
        html: html, // html body,
        attachments: attachments
    };

    return new Promise(function(resolve, reject){
        transporter.sendMail(mailOptions, function(err, resp) {
            if (err) {
                reject(err);
            } else {
                resolve(resp);
            }
        })
    });
}
export class Mail{
    /**
     * 提交发送邮件请求
     *
     * @param {Object} params
     * @param {String} params.toEmails 邮件接收人,如果多人使用逗号分隔
     * @param {String} params.templateName 邮件类型
     * @param {Object} params.values 邮件模板占位符中值
     */
    async sendMailRequest(params) {
        let {toEmails, templateName, values, content} = params;
        values.html_encode = html_encode;

        if (typeof values != 'object') {
            throw {code: -1, msg: "values must be object"};
        }

        if (!toEmails) {
            throw L.ERR.EMAIL_EMPTY;
        }

        if (!templateName) {
            throw {code: -1, msg: "邮件模板不存在"};
        }

        var emails = toEmails.split(/,/g);
        var checked = true;
        for(var i=0, ii=emails.length; i<ii; i++) {
            if(!validate.isEmail(emails[i])) {
                checked = false;
                break;
            }
        }

        if (!checked) {
            throw {code: -1, msg: "邮箱格式不正确"};
        }


        var template = templates["templates"][templateName];
        var footer = templates["footer"]["qm"];

        if (!template) {
            throw new Error(`{code: -1, msg: "模板邮件不存在"}`);
        }
        var subject;
        var html;

        try{
            var compiled = _.template(template.subject);
            subject = compiled(values);
            compiled = _.template(template.content);
            html = compiled(values);
        }catch(err) {
            throw err;
        }

        var reg = /(http:\/\/[a-zA-Z0-9#_\-\/\.&\?=:@]+)/g;
        var groups;
        var urls = [];
        var shortUrls = [];
        //找出所有需要转换的超链接
        do{
            groups = reg.exec(html);
            if (!groups) {
                break;
            } else {
                urls.push(groups[1]);
            }
        } while(true);

        //把链接全部转换成短链接
        for(var i=0, ll=urls.length; i<ll; i++) {
            var shortUrl = await shortUrlService.long2short({longurl: urls[i]});
            shortUrls.push(shortUrl);
        }

        //进行替换
        html = html.replace(reg, '%s');
        html = format(html, shortUrls);
        html += '<br/><br/>' + footer;

        var submit = {id: uuid.v1(), subject: subject, content: html, toUser: toEmails, isHtml: true};
        let submitObj = EmailSubmit.Create(submit);
        await submitObj.save();

        var promises = [];
        for(var i=0, ll: number =emails.length; i<ll; i++) {
            var queue = {id: uuid.v1(), emailQueueId: submit.id, toUser: emails[i], maxSendTimes: 1};
            let emailQueueObj = EmailQueue.Create(queue);
            promises.push(emailQueueObj)

        }

        await Promise.all(promises.map(async function(emailQueueObj){
            await emailQueueObj.save();
        }));
        return submitObj.id;
    }

    /**
     * @param {Object} params
     * @param {string} params.toEmails 邮件接收人,多个邮件逗号分隔
     * @param {string} params.subject 邮件标题
     * @param {string} params.content 邮件正文
     * @param {Array<any>} params.attachments 附件信息,格式为
     */
    async sendEmail(params: {toEmails: string, content: string, subject: string, attachments: any}) {
        let filenames = ['logo.png', 'logo_text.png', 'qrcode.png'];
        filenames.forEach( (filename) => {
            params.attachments.push({
                path: path.relative(process.cwd(), path.join(__dirname, `static/${filename}`)),
                filename: filename,
                cid: filename
            });
        });
        let {subject, toEmails, content, attachments} = params;
        let emails = toEmails.split(/,/);
        var submit = {id: uuid.v1(), subject: subject, content: content, toUser: toEmails, isHtml: true, attachment: JSON.stringify(attachments)};
        let submitObj = EmailSubmit.Create(submit);
        await submitObj.save();

        var promises = [];
        for(var i=0, ii=emails.length; i<ii; i++) {
            var queue = {id: uuid.v1(), emailSubmitId: submit.id, toUser: emails[i], maxSendTime: 1};
            let emailQueue = EmailQueue.Create(queue);
            promises.push(emailQueue);
        }

        await Promise.all(promises.map(async function(emailQueue){
            await emailQueue.save();
        }))
        return submitObj.id;
    }
}

const mail = new Mail();
export default mail;
function html_encode (str: string) {
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&/g, "&gt;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/ /g, "&nbsp;");
    s = s.replace(/\'/g, "&#39;");
    s = s.replace(/\"/g, "&quot;");
    s = s.replace(/\n/g, "<br>");
    return s;
}
