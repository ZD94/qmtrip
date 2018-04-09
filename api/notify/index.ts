/**
 * Created by wlh on 16/7/13.
 */

'use strict';
import _ = require('lodash');
import Logger from '@jingli/logger';
const logger = new Logger('qm:notify');
import {Models} from "_types";
import {ESendType, ENoticeType} from "_types/notice/notice";
let moment = require("moment");
require('moment-timezone');

const config = require('@jingli/config');
let API = require('@jingli/dnode-api');

const path = require("path");
const fs = require("fs");

export interface NotifyToAddress{
    openId?: string;
    mobile?: string;
    email?: string;
    accountId?: string;
}

export interface ISubmitNotifyParam{
    userId?: string;
    email?: string;
    mobile?: string;
    key: string;
    values?: any;
}

async function tryReadFile(filename: string): Promise<string>{
    let content: string = '';
    try{
        content = await fs.readFileAsync(filename);
    }catch(e){
        if(e.code != 'ENOENT')
            throw e;
    }
    return content;
}

let common_imports = {
    moment,
    Math,
    String,
    Number,
    Boolean,
    Array
};

class NotifyTemplate{
    sms: Function|undefined;
    wechat: Function|undefined;
    email: {
        title?: Function;
        html?: Function;
        text?: Function;
    };
    appmessage: {
        title?: Function;
        html?: Function;
        text?: Function;
        msg?: Function;
    };
    constructor(public name: string, sms_text: string, wechat_json: string, email_title: string, email_html: string, email_text: string, appmessage_title: string, appmessage_html: string, appmessage_text: string, appmessage_msg: string){
        if(sms_text)
            this.sms = _.template(sms_text, {imports: common_imports});
        if(wechat_json){
            let templateId = config.notify.templates[name];
            if(templateId)
                this.wechat = _.template(wechat_json, {imports: common_imports});
        }
        if(email_title){
            this.email = {};
            this.email.title = _.template(email_title, {imports: common_imports});
            if(email_html)
                this.email.html = _.template(email_html, {imports: common_imports});
            if(email_text)
                this.email.text = _.template(email_text, {imports: common_imports});
        }
        if(appmessage_title){
            this.appmessage = {};
            this.appmessage.title = _.template(appmessage_title, {imports: common_imports});
            if(appmessage_html)
                this.appmessage.html = _.template(appmessage_html, {imports: common_imports});
            if(appmessage_text)
                this.appmessage.text = _.template(appmessage_text, {imports: common_imports});
            if(appmessage_msg)
                this.appmessage.msg = _.template(appmessage_msg, {imports: common_imports});
        }
    }

    async send(to: NotifyToAddress, data: any){
        await Promise.all([
            this.sendSms(to, data),
            this.sendWechat(to, data),
            this.sendEmail(to, data),
            this.saveNotice(to, data)
        ]);
    }

    async sendSms(to: NotifyToAddress, data: any){
        if(!to.mobile)
            return;
        if(!this.sms)
            return;
        try {
            let content = this.sms(data);

            await API.sms.sendMsg({
                content: content,
                mobile: to.mobile
            });
            logger.info('成功发送短信:', to.mobile, content);
        } catch(err) {
            logger.error(err);
        }
    }
    async sendWechat(to: NotifyToAddress, data: any){
        if(!config.notify.sendWechat)
            return;
        if(!to.openId)
            return;
        if(!this.wechat)
            return;
        try{
            let content = this.wechat(data);
            let json = JSON.parse(content);
            if (!data.templateId) return;
            await API.wechat.sendTplMsg({
                openid: to.openId,
                data: json.data,
                topColor: json.topColor,
                url: json.url,
                templateId: json.template_id,
            });
            logger.info('成功发送微信通知:', to.openId, this.name);
        } catch(err) {
            logger.error(err);
        }

    }

    async sendEmail(to: NotifyToAddress, data: any) {
        if(!to.email)
            return;
        if(!this.email)
            return;
        try {
            let subject = this.email.title ? this.email.title(data) : '';
            let context = Object.create(data);
            context.include = function(incname: string){
                return includes[incname](context);
            };
            let content = this.email.html ? this.email.html(context) : '';

            content = includes['email_frame.html']({content: content});
            let attachments = data.attachments || [];

            /*redisClient.simplePublish("checkcode:msg", content)
             .catch((err)=>{
             logger.error('simplePublish error:', err);
             });*/
            if(!config.notify.sendEmail)
                return;
            await API.mail.sendEmail({
                toEmails: to.email,
                content: content,
                subject: subject,
                attachments: attachments,
            });
            logger.info('成功发送邮件:', to.email, this.name);
        } catch(err) {
            logger.error(err);
        }
    }

    async saveNotice(to: NotifyToAddress, data: any) {

        if(!to.accountId)
            return;

        if(!this.appmessage)
            return;
        if(!this.appmessage.title || !this.appmessage.text)
            return;
        try {
            let content;
            let title = this.appmessage.title(data);
            let description = this.appmessage.text(data);
            const msg = this.appmessage.msg && this.appmessage.msg(data) || '';
            if(this.appmessage.html){
                let context = Object.create(data);
                context.include = function(incname: string){
                    return includes[incname](context);
                };
                content = this.appmessage.html(context);
            }
            await API.notice.createNotice({title, content, description, msg, staffId: to.accountId, sendType: ESendType.ONE_ACCOUNT, type: data.noticeType || ENoticeType.SYSTEM_NOTICE});
            logger.info('成功发送通知:', data.account.name, this.name);
        } catch(err) {
            logger.error(err);
        }
    }
}

async function loadTemplate(name: string, dir: string) {
    let loadqueue = [
        tryReadFile(path.join(dir, 'email.title')),
        tryReadFile(path.join(dir, 'email.html')),
        tryReadFile(path.join(dir, 'email.txt')),
        tryReadFile(path.join(dir, 'appmessage.title')),
        tryReadFile(path.join(dir, 'appmessage.html')),
        tryReadFile(path.join(dir, 'appmessage.txt')),
        tryReadFile(path.join(dir, 'appmessage.msg')),
        tryReadFile(path.join(dir, 'sms.txt')),
        tryReadFile(path.join(dir, 'wechat.json')),
    ];
    let [
        email_title,
        email_html,
        email_text,
        appmessage_title,
        appmessage_html,
        appmessage_text,
        appmessage_msg,
        sms_text,
        wechat_json,
    ] = await Promise.all(loadqueue);
    return new NotifyTemplate(name, sms_text, wechat_json, email_title, email_html, email_text, appmessage_title, appmessage_html, appmessage_text, appmessage_msg);
}
async function loadTemplates(): Promise<NotifyTemplateMap> {
    var dirs = [];
    try {
        dirs = await fs.readdirAsync(path.join(__dirname, 'templates'));
    } catch(e) {
        if(e.code != 'ENOENT')
            throw e;
    }
    let ret:NotifyTemplateMap = {};
    await Promise.all(dirs.map(async function(tplname: string){
        let tpl = await loadTemplate(tplname, path.join(__dirname, 'templates', tplname));
        ret[tplname] = tpl;
    }));
    return ret;
}

async function loadIncludes(): Promise<any>{
    var dirs = [];
    try {
        dirs = await fs.readdirAsync(path.join(__dirname, 'includes'));
    } catch(e) {
        if(e.code != 'ENOENT')
            throw e;
    }
    let ret = {};
    await Promise.all(dirs.map(async function(incname: string){
        let content = await tryReadFile(path.join(__dirname, 'includes', incname));
        ret[incname] = _.template(content, {imports: common_imports});
    }));
    return ret;
}

interface NotifyTemplateMap{
    [index: string]: NotifyTemplate;
}

let templates : NotifyTemplateMap = {};
let includes: any = {};

export async function __init() {
    templates = await loadTemplates();
    includes = await loadIncludes();
}

//通知模块
export async function submitNotify(params: ISubmitNotifyParam) : Promise<boolean> {
    let {userId, key, email, mobile, values} = params;
    console.info("key================", key);
    let _values: any = {};
    for(let k in values){
        _values[k] = values[k];
    }
    let account: any = {};
    let openId;
    if(!userId){
        account = {email, mobile};
    }else{
        account = await Models.staff.get(userId);
        if(!account){
            account = await Models.agency.get(userId);
        } else {
            let departmentNames;
            departmentNames = await account.getDepartmentsStr();
            account["departmentNames"] = departmentNames;
            openId = await API.auth.getOpenIdByAccount({accountId: account.accountId});
        }
    }

    if (openId) {
        _values.templateId = config.notify.templates[key];
    }

    let tpl = templates[key];
    if(!tpl)
        return false;
    _values.account = account;

    try {
        let path_require = './templates/' + key + '/transform';
        let transform = require(`${path_require}`);
        if(transform){
            _values = await transform(_values);
        }
    } catch(err) {
        console.info(err);
    }


    await tpl.send({ mobile: account.mobile, openId: openId, email: account.email, accountId: userId }, _values);
    return true;
}
