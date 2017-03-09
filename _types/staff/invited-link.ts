
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';
import { Staff } from './staff';

export enum EInvitedLinkStatus {
    ACTIVE = 1,
    FORBIDDEN = 0
};

@Table(Models.invitedLink, "staff.")
export class InvitedLink extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): InvitedLink { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }
    set staff(val: Staff) {}

    @Field({type: Types.DATE})
    get expiresTime(): Date { return null; }
    set expiresTime(val: Date) {}

    @Field({type: Types.INTEGER, defaultValue: EInvitedLinkStatus.ACTIVE})
    get status(): EInvitedLinkStatus {return EInvitedLinkStatus.ACTIVE}
    set status(status: EInvitedLinkStatus){}

    @Field({type: Types.STRING})
    get goInvitedLink(): string { return ''; }
    set goInvitedLink(val: string) {}

    @Field({type:Types.STRING})
    get linkToken(): string { return null; }
    set linkToken(linkToken: string){}

}

