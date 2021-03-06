/**
 * Created by wyl on 16-11-11.
 */
'use strict';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import {Staff} from "_types/staff";
import { Notice, NoticeAccount, ESendType } from '_types/notice';
import { Models } from '_types';
import {FindResult} from "common/model/interface";
import {DB} from '@jingli/database';
import { FindOptions } from 'sequelize';

var JPush = require("jpush-sdk");
var API = require("@jingli/dnode-api");

const noticeCols = Notice['$fieldnames'];
const noticeAccountCols = NoticeAccount['$fieldnames'];

export class NoticeModule{
    /**
     * 创建通知通告
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["title","content","description", "sendType", "msg"], noticeCols)
    async createNotice (params: Notice) : Promise<Notice>{
        const { description } = params
        delete params.description
        var notice = Notice.create({...params, description: params.msg || description});
        result = await notice.save();
        var result:Notice;
        var link = '#/notice/detail?noticeId='+result.id;
        if(params.sendType == ESendType.ONE_ACCOUNT){
            
            var noticeAccount = NoticeAccount.create();
            noticeAccount.noticeId = result.id;
            noticeAccount.accountId = params.staffId;
            await noticeAccount.save();
            let staff = await Models.staff.get(params.staffId);
            var jpushId = await API.auth.getJpushIdByAccount({accountId: staff.accountId});
            if(result.content.startsWith("skipLink@")) {
                link = result.content.substring(9);
            }
            if(jpushId){
                await API.jpush.pushAppMessage({content: description, title: result.title, link, jpushId});
            }
            
        }else if(params.sendType == ESendType.MORE_ACCOUNT){
            
            var accountIds: string[] = JSON.parse(params.toUsers);
            var jpushIds: string[] = [];
            await Promise.all(accountIds.map(async function(item){
                var noticeAccount = NoticeAccount.create();
                noticeAccount.noticeId = result.id;
                noticeAccount.accountId = item;
                await noticeAccount.save();

                var jId = await API.auth.getJpushIdByAccount({accountId: item});
                // jId 为数组 可能是一个或多个
                if(jId){
                    jpushIds = jpushIds.concat(jId);
                }
            }))

            await API.jpush.pushAppMessage({content: description, title: result.title, link, jpushId: jpushIds});

        }else if(params.sendType == ESendType.ALL_ACCOUNT){
            var jpushId = JPush.ALL;
            await API.jpush.pushAppMessage({content: description, title: result.title, link, jpushId});
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
    async deleteNotice(params: {id: string}) : Promise<any>{
        var id = params.id;
        var ah_delete = await Models.notice.get(id);

        var noticeAccounts = await Models.noticeAccount.find({where: {noticeId: ah_delete.id}});
        if(noticeAccounts && noticeAccounts.length > 0){
            await Promise.all(noticeAccounts.map(async (item) => {
                await item.destroy()
            }))
        }
        await ah_delete.destroy();
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
    async updateNotice(params: Notice) : Promise<Notice>{
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
    async getNotice(params: {id: string, companyId?: string}) : Promise<Notice>{
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
    async getNotices(params: FindOptions<Notice>): Promise<FindResult>{
        params.order = params.order || [['createdAt', 'desc']];
        let paginate = await Models.notice.find(params);
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
    async statisticNoticeByType(): Promise<any>{
        var staff = await Staff.getCurrent();
        var sql1 = `select b.type, count(b.id) from notice.notice_accounts a right join notice.notices b " +
            "on a.notice_id = b.id where (a.account_id='${staff.id}' or b.send_type = ${ESendType.ALL_ACCOUNT}) " +
            "and a.is_read <> true and a.deleted_at is null group by b.type`;

        var unReadCountInfo = await DB.query(sql1);
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
    async createNoticeAccount (params: NoticeAccount) : Promise<NoticeAccount>{
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
    async deleteNoticeAccount(params: {id: string}) : Promise<any>{
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
    async updateNoticeAccount(params: NoticeAccount) : Promise<NoticeAccount>{
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
    async getNoticeAccount(params: {id: string}) : Promise<NoticeAccount>{
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
    async getNoticeAccounts(params: FindOptions<NoticeAccount>): Promise<FindResult>{
        await Staff.getCurrent();
        let paginate = await Models.noticeAccount.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /****************************************NoticeAccount end************************************************/
}

export default new NoticeModule();