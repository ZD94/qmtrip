/**
 * Created by wyl on 16-11-11.
 */
'use strict';
import {requireParams, clientExport} from 'common/api/helper';
import {conditionDecorator, condition} from "../_decorator";
import {Staff} from "api/_types/staff";
import { Notice } from 'api/_types/notice';
import { Models } from 'api/_types';
import {FindResult} from "common/model/interface";

var API = require("common/api");

const noticeCols = Notice['$fieldnames'];

class NoticeModule{
    /**
     * 创建通知通告
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["theme","content","link","staffId"], noticeCols)
    @conditionDecorator([
        {if: condition.isSameCompany("0.staffId")}
    ])
    static async createNotice (params) : Promise<Notice>{
        var notice = Notice.create(params);
        return notice.save();
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

        if(staff){
            options.where.staffId = staff.id;//只允许查询员工自己的通知通告
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
    @requireParams(["optins", "staffId", "link"])
    static async recordNotice(params): Promise<Notice>{
        //得到通知内容
        var {content, theme} = await API.notify.getSubmitNotifyContent(params.optins);
        var notice = Notice.create();
        notice.theme = theme;
        notice.content = content;
        notice.staff = await Models.staff.get(params.staffId);
        notice.link = params.link;
        return notice.save();
    }

}

export = NoticeModule;