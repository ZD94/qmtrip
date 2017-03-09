/**
 * Created by yumiao on 16-5-17.
 */
'use strict';
import { Models } from '_types';
import { Table, Create, Field } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Types } from 'common/model';

@Table(Models.seed, 'seeds.')
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