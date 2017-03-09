/**
 * Created by wangyali on 2016/11/28.
 */

import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';

@Table(Models.noticeAccount, "notice.")
export class NoticeAccount extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): NoticeAccount { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    //员工id
    @Field({type: Types.UUID})
    get accountId(): string { return null; }
    set accountId(val: string) {}

    //通知id
    @Field({type: Types.UUID})
    get noticeId(): string { return null; }
    set noticeId(val: string) {}

    //阅读状态
    @Field({type: Types.BOOLEAN, defaultValue: false})
    get isRead(): boolean { return false; }
    set isRead(val: boolean) {}

    //阅读时间
    @Field({type: Types.DATE})
    get readTime(): Date { return null; }
    set readTime(val: Date) {}

}

