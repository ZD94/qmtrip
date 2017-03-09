
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef , RemoteCall} from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';
import { Staff } from '_types/staff';
import { NoticeAccount } from '_types/notice';
import moment = require("moment");

declare var API: any;

export enum ENoticeType {
    SYSTEM_NOTICE = 1,
    TRIP_APPROVE_NOTICE = 2,
    TRIP_APPLY_NOTICE = 3,
    ACTIVITY_NOTICE = 4
};
export enum ESendType {
    ONE_ACCOUNT = 1,
    MORE_ACCOUNT = 2,
    ALL_ACCOUNT = 3
};
@Table(Models.notice, "notice.")
export class Notice extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Notice { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING})
    get title(): string { return null; }
    set title(val: string) {}

    @Field({type: Types.TEXT})
    get content(): string { return null; }
    set content(val: string) {}

    @Field({type: Types.TEXT})
    get description(): string { return null; }
    set description(val: string) {}

    @Field({type: Types.STRING})
    get link(): string { return null; }
    set link(val: string) {}

    @Field({type: Types.INTEGER, defaultValue: ENoticeType.SYSTEM_NOTICE})
    get type(): ENoticeType { return ENoticeType.SYSTEM_NOTICE; }
    set type(val: ENoticeType) {}

    @Field({type: Types.INTEGER, defaultValue: ESendType.ONE_ACCOUNT})
    get sendType(): ESendType { return ESendType.ONE_ACCOUNT; }
    set sendType(val: ESendType) {}

    @Field({type: Types.STRING})
    get picture(): string { return null; }
    set picture(val: string) {}

    @Field({ type: Types.JSONB})
    get toUsers() : any { return null};
    set toUsers(val: any) {}
    
/************************预计无用字段****************************/
    @Field({type: Types.BOOLEAN, defaultValue: true})
    get isSend(): boolean { return true; }
    set isSend(val: boolean) {}

    @Field({type: Types.DATE})
    get sendTime(): Date { return null; }
    set sendTime(val: Date) {}
/************************预计无用字段****************************/

    @RemoteCall()
    async sendNotice(): Promise<Notice>{
        /*if(!this.isLocal){
            API.require('jpush');
            await API.onload();
        }*/
        var notice = await Models.notice.get(this.id);
        notice.isSend = true;
        notice.sendTime = moment().toDate();
        var result = await notice.save();
        // var jpushId = JPush.ALL;
        // await API.jpush.pushAppMessage({content: result.description, title: result.title, link: null, jpushId: jpushId});
        return result;
    }
    
    async staffDeleteNotice(): Promise<boolean>{
        var staff = await Staff.getCurrent();
        var noticeAccount = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: this.id}});
        if(noticeAccount && noticeAccount.length>0){
            await noticeAccount[0].destroy();
        }
        return true;
    }
    
    async setReadStatus(): Promise<NoticeAccount>{
        var staff = await Staff.getCurrent();
        var result: NoticeAccount;
        var noticeAccounts = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: this.id}});
        if(noticeAccounts && noticeAccounts.length>0 && !noticeAccounts[0].isRead){
            result = noticeAccounts[0];
            result.isRead = true;
            result.readTime = new Date();
            result = await result.save();
        }
        return result;
    }
}

