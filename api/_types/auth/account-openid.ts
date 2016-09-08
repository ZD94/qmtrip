
import { Table, Create, Field } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';



@Table(Models.accountOpenid, "auth.")
export class AccountOpenid extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): AccountOpenid { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get accountId() {return null};
    set accountId(accountId: string){}

    @Field({type: Types.STRING})
    get appId() {return null};
    set appId(appId: string){}

    @Field({type: Types.STRING})
    get openId() { return null};
    set openId(openId: string) {}
}
