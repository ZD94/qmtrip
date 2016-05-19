/**
 * Created by yumiao on 16-5-17.
 */
'use strict';
import { regApiType } from 'common/api/helper';
import { ModelObject, Table, Create, Field, Types, ResolveRef, Reference } from 'common/model';
import { Models } from 'api/_types';

@Table(Models.seed, 'seeds.')
@regApiType('API.')
export class Seed extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Seed { return null; }

    @Field({type: Types.STRING})
    get type(): string { return ''; }
    set type(val: string) {}

    @Field({type: Types.INTEGER})
    get minNo(): number { return 0; }
    set minNo(val: number) {}

    @Field({type: Types.INTEGER})
    get maxNo(): number { return 0; }
    set maxNo(val: number) {}

    @Field({type: Types.INTEGER})
    get nowNo(): number { return 0; }
    set nowNo(val: number) {}

}