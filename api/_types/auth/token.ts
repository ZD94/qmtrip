
import { Table, Field } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types } from 'common/model';


@Table(Models.token, "auth.")
export class Token extends ModelObject{
    @Field({type: Types.UUID})
    get id() { return null};
    set id(id: string) {}

    @Field({type: Types.UUID})
    get accountId() {return null};
    set accountId(accountId: string){}

    @Field({type: Types.STRING})
    get token() { return null};
    set token(token: string) {}

    @Field({type: Types.DATE})
    get refreshAt() { return null};
    set refreshAt(refreshDate) {}

    @Field({type: Types.DATE})
    get expireAt() { return null;}
    set expireAt(expireAt) {}

    @Field({type: Types.STRING})
    get os() { return null;}
    set os(os: string) {}
}
