
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Staff } from 'api/_types/staff';

export enum ENoticeType {
    SYSTEM_NOTICE = 1,
    SELF_TRIP_NOTICE = 2,
    OTHER_TRIP_NOTICE = 3
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

    //所属员工
    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }
    set staff(val: Staff) {}

    @Field({type: Types.BOOLEAN, defaultValue: false})
    get isRead(): boolean { return false; }
    set isRead(val: boolean) {}

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

    @Field({type: Types.STRING})
    get fromWhere(): string { return ''; }
    set fromWhere(val: string) {}

    @Field({type: Types.INTEGER, defaultValue: ENoticeType.SYSTEM_NOTICE})
    get type(): ENoticeType { return ENoticeType.SYSTEM_NOTICE; }
    set type(val: ENoticeType) {}

}

