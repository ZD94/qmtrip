/**
 * Created by wlh on 16/7/13.
 */

'use strict';
import _ = require('lodash');
import Logger = require('common/logger');
const logger = new Logger('qm:notify');
import redisClient = require("common/redis-client");
import {Models} from "_types";
import {ESendType, ENoticeType} from "_types/notice/notice";

const config = require('@jingli/config');
let API = require('common/api');

const path = require("path");
const fs = require("fs");

export interface NotifyToAddress{
    openId?: string;
    mobile?: string;
    email?: string;
    accountId?: string;
}

export interface ISubmitNotifyParam{
    accountId?: string;
    email?: string;
    key: string;
    values: any;
}

async function tryReadFile(filename): Promise<string>{
    let content: string = undefined;
    try{
        content = await fs.readFileAsync(filename);
    }catch(e){
        if(e.code != 'ENOENT')
            throw e;
    }
    return content;
}

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
    };
    constructor(public name, sms_text, wechat_json, email_title, email_html, email_text, appmessage_title, appmessage_html, appmessage_text){
        if(sms_text)
            this.sms = _.template(sms_text);
        if(wechat_json){
            let templateId = config.notify.templates[name];
            if(templateId)
                this.wechat = _.template(wechat_json);
        }
        if(email_title){
            this.email = {};
            this.email.title = _.template(email_title);
            if(email_html)
                this.email.html = _.template(email_html);
            if(email_text)
                this.email.text = _.template(email_text);
        }
        if(appmessage_title){
            this.appmessage = {};
            this.appmessage.title = _.template(appmessage_title);
            if(appmessage_html)
                this.appmessage.html = _.template(appmessage_html);
            if(appmessage_text)
                this.appmessage.text = _.template(appmessage_text);
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
        let content = this.sms(data);

        await API.sms.sendMsg({
            content: content,
            mobile: to.mobile
        });
        logger.info('成功发送短信:', to.mobile, content);
    }
    async sendWechat(to: NotifyToAddress, data: any){
        if(!config.notify.sendWechat)
            return;
        if(!to.openId)
            return;
        if(!this.wechat)
            return;
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
    }

    async sendEmail(to: NotifyToAddress, data: any) {
        if(!to.email)
            return;
        if(!this.email)
            return;
        let subject = this.email.title(data);
        let context = Object.create(data);
        context.include = function(incname){
            return includes[incname](context);
        };
        let content = this.email.html(context);

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
    }

    async saveNotice(to: NotifyToAddress, data: any) {
        if(!to.accountId)
            return;

        if(!this.appmessage)
            return;
        if(!this.appmessage.title || !this.appmessage.text)
            return;
        let content;
        let title = this.appmessage.title(data);
        let description = this.appmessage.text(data);
        if(this.appmessage.html){
            let context = Object.create(data);
            context.include = function(incname){
                return includes[incname](context);
            };
            content = this.appmessage.html(context);
        }
        await API.notice.createNotice({title: title, content: content, description: description, staffId: to.accountId, sendType: ESendType.ONE_ACCOUNT, type: data.noticeType || ENoticeType.SYSTEM_NOTICE});
        logger.info('成功发送通知:', data.account.name, this.name);
    }
}

async function loadTemplate(name, dir) {
    let loadqueue = [
        tryReadFile(path.join(dir, 'email.title')),
        tryReadFile(path.join(dir, 'email.html')),
        tryReadFile(path.join(dir, 'email.txt')),
        tryReadFile(path.join(dir, 'appmessage.title')),
        tryReadFile(path.join(dir, 'appmessage.html')),
        tryReadFile(path.join(dir, 'appmessage.txt')),
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
        sms_text,
        wechat_json,
    ] = await Promise.all(loadqueue);
    return new NotifyTemplate(name, sms_text, wechat_json, email_title, email_html, email_text, appmessage_title, appmessage_html, appmessage_text);
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
    await Promise.all(dirs.map(async function(tplname){
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
    await Promise.all(dirs.map(async function(incname){
        let content = await tryReadFile(path.join(__dirname, 'includes', incname));
        ret[incname] = _.template(content);
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
    let {accountId, key, values, email} = params;
    let values_clone =  _.cloneDeep(values);
    let openId = await API.auth.getOpenIdByAccount({accountId: accountId});
    let account: any = {};
    let departmentNames;
    if(!accountId){
        account = {email: email};
    }else{
        account = await Models.staff.get(accountId);
        if(!account){
            account = await Models.agency.get(accountId);
        }else{
            departmentNames = await account.getDepartmentsStr();
            account["departmentNames"] = departmentNames;
        }
    }

    if (openId) {
        values_clone.templateId = config.notify.templates[key];
    }
    let tpl = templates[key];
    if(!tpl)
        return false;
    values_clone.account = account;
    await tpl.send({ mobile: account.mobile, openId: openId, email: account.email, accountId: accountId }, values_clone);
    return true;
}
//added by jack, to send notice to designated phone number or email account
export async function notifyDesignatedAccount(params:{email?:string,mobile?:string,key:string,values:any}){
      let email=params.email;
      let mobile=params.mobile;
      let values=params.values;
      let key=params.key;

      let values_clone =  _.cloneDeep(values);
      let tpl=templates[key];
      await tpl.send({mobile:mobile,email: email},values_clone);
      return true;
}
