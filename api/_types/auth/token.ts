
import { Table, Field } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';


@Table(Models.token, "auth.")
export class Token extends ModelObject{
    @Field({type: Types.UUID})
    get id() { return Values.UUIDV1(); };
    set id(id: string) {}

    @Field({type: Types.UUID})
    get accountId() {return null};
    set accountId(accountId: string){}

    @Field({type: Types.STRING})
    get token() { return null};
    set token(token: string) {}

    @Field({type: Types.DATE})
    get refreshAt(): Date { return null};
    set refreshAt(refreshDate: Date) {}

    @Field({type: Types.DATE})
    get expireAt(): Date { return null;}
    set expireAt(expireAt: Date) {}

    @Field({type: Types.STRING})
    get os() { return null;}
    set os(os: string) {}
}
