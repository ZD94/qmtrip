
import { Table, Create, Field } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';

@Table(Models.moneyChange, 'company.')
export class MoneyChange extends ModelObject {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): MoneyChange { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get companyId(): string { return null; }
    set companyId(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): number { return 0; }
    set status(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get money(): number { return 0; }
    set money(val: number) {}

    @Field({type: Types.INTEGER})
    get channel(): number { return 0; }
    set channel(val: number) {}

    @Field({type: Types.UUID})
    get userId(): string { return null; }
    set userId(val: string) {}

    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}
}

