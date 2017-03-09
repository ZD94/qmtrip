
import { Table, Field, TableIndex } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';


@Table(Models.token, "auth.")
@TableIndex(['accountId', 'type'])
export class Token extends ModelObject{
    @Field({type: Types.UUID})
    get id() { return Values.UUIDV1(); };
    set id(id: string) {}

    @Field({type: Types.UUID})
    get accountId() {return null};
    set accountId(accountId: string){}

    @Field({type: Types.STRING})
    get type() { return null;}
    set type(os: string) {}

    @Field({type: Types.STRING})
    get token() { return null};
    set token(token: string) {}

    @Field({type: Types.DATE})
    get expireAt(): Date { return null;}
    set expireAt(expireAt: Date) {}
}
