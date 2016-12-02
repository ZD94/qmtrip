/**
 * Created by wyl on 16-11-11.
 */
'use strict';
import {requireParams, clientExport} from 'common/api/helper';
import {conditionDecorator, condition} from "../_decorator";
import {Staff} from "api/_types/staff";
import { Notice, NoticeAccount, ESendType } from 'api/_types/notice';
import { Models } from 'api/_types';
import {FindResult} from "common/model/interface";
let sequelize = require("common/model").DB;

var JPush = require("jpush-sdk");
var API = require("common/api");

const noticeCols = Notice['$fieldnames'];
const noticeAccountCols = NoticeAccount['$fieldnames'];

class NoticeModule{
    /**
     * 创建通知通告
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["title","content","description", "sendType"], noticeCols)
    static async createNotice (params) : Promise<Notice>{
        var notice = Notice.create(params);
        result = await notice.save();
        var result:Notice;
        var link = '#/notice/detail?noticeId='+result.id;
        if(params.sendType == ESendType.ONE_ACCOUNT){
            
            var noticeAccount = NoticeAccount.create();
            noticeAccount.noticeId = result.id;
            noticeAccount.accountId = params.staffId;
            await noticeAccount.save();
            var jpushId = await API.auth.getJpushIdByAccount({accountId: params.staffId});
            if(result.content.startsWith("skipLink@")) {
                link = result.content.substring(9);
            }
            if(jpushId){
                await API.jpush.pushAppMessage({content: result.description, title: result.title, link: link, jpushId: jpushId});
            }
            
        }else if(params.sendType == ESendType.MORE_ACCOUNT){
            
            var accountIds = params.toUsers;
            accountIds = JSON.parse(accountIds);
            var jpushIds = [];
            await Promise.all(accountIds.map(async function(item){
                var noticeAccount = NoticeAccount.create();
                noticeAccount.noticeId = result.id;
                noticeAccount.accountId = item;
                await noticeAccount.save();

                var jId = await API.auth.getJpushIdByAccount({accountId: item});
                if(jId){
                    jpushIds = jpushIds.concat(jId);
                }
            }))

            await API.jpush.pushAppMessage({content: result.description, title: result.title, link: link, jpushId: jpushIds});

        }else if(params.sendType == ESendType.ALL_ACCOUNT){
            // var jpushId = JPush.ALL;
            // await API.jpush.pushAppMessage({content: result.description, title: result.title, link: link, jpushId: jpushId});
        }
        return result;
    }


    /**
     * 删除通知通告
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteNotice(params) : Promise<any>{
        var id = params.id;
        var ah_delete = await Models.notice.get(id);

        await ah_delete.destroy();
        var noticeAccounts = await Models.noticeAccount.find({where: {noticeId: ah_delete.id}});
        if(noticeAccounts && noticeAccounts.length > 0){
            await Promise.all(noticeAccounts.map(async (item) => {
                await item.destroy()
            }))
        }
        return true;
    }


    /**
     * 更新通知通告
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], noticeCols)
    static async updateNotice(params) : Promise<Notice>{
        var id = params.id;

        var ah = await Models.notice.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询通知通告
     * @param {String} params.id
     * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getNotice(params: {id: string, companyId?: string}) : Promise<Notice>{
        let id = params.id;
        var ah = await Models.notice.get(id);

        return ah;
    };


    /**
     * 根据属性查找通知通告
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getNotices(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();

        var options: any = {
            // where:  _.pick(params, Object.keys(DBM.Notice.attributes))
            where: params.where
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [['createdAt', 'desc']];
        if(params.$or) {
            options.where.$or = params.$or;
        }
        let paginate = await Models.notice.find(options);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /**
     * 根据属性查找通知通告
     * @param params
     * @returns {*}
     */
    @clientExport
    static async statisticNoticeByType(): Promise<any>{
        var staff = await Staff.getCurrent();
        var sql1 = `select b.type, count(b.id) from notice.notice_accounts a right join notice.notices b " +
            "on a.notice_id = b.id where (a.account_id='${staff.id}' or b.send_type = ${ESendType.ALL_ACCOUNT}) " +
            "and a.is_read <> true and a.deleted_at is null group by b.type`;

        var unReadCountInfo = await sequelize.query(sql1);
        console.info(unReadCountInfo);
        console.info("================");
        return unReadCountInfo;

    }

/****************************************NoticeAccount begin************************************************/

    /**
     * 创建用户读取通知记录
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["accountId","noticeId",], noticeAccountCols)
    static async createNoticeAccount (params) : Promise<NoticeAccount>{
        var noticeAccount = NoticeAccount.create(params);
        var already = await Models.noticeAccount.find({where: {noticeId: params.noticeId, accountId: params.accountId}});
        if(already && already.length>0){
            return already[0];
        }
        var result = await noticeAccount.save();
        return result;
    }


    /**
     * 删除用户读取通知记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteNoticeAccount(params) : Promise<any>{
        var id = params.id;
        var ah_delete = await Models.noticeAccount.get(id);
        var notice = await Models.notice.get(ah_delete.noticeId);
        if(notice && notice.sendType == ESendType.ONE_ACCOUNT){
            await notice.destroy();
        }

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新用户读取通知记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], noticeAccountCols)
    static async updateNoticeAccount(params) : Promise<NoticeAccount>{
        console.info("==========进来没？？？？？？？")
        console.info(params)
        var id = params.id;

        var ah = await Models.noticeAccount.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询用户读取通知记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getNoticeAccount(params: {id: string}) : Promise<NoticeAccount>{
        let id = params.id;
        var ah = await Models.noticeAccount.get(id);

        return ah;
    };


    /**
     * 根据属性查找用户读取通知记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getNoticeAccounts(params): Promise<FindResult>{
        var staff = await Staff.getCurrent();
        let paginate = await Models.noticeAccount.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /****************************************NoticeAccount end************************************************/
}

export = NoticeModule;