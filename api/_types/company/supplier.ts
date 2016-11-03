'use strict';

import { Models } from 'api/_types';
import { Types, Values } from 'common/model';
import {Table, Create, Field, Reference, ResolveRef} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Company } from 'api/_types/company';

@Table(Models.supplier, 'company.')
export class Supplier extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Supplier { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    // 供应商名称
    @Field({type: Types.STRING})
    get name(): string { return null; }
    set name(val: string) {}

    // 交通预定链接
    @Field({type: Types.STRING})
    get trafficBookLink(): string { return null; }
    set trafficBookLink(val: string) {}

    // 酒店预定链接
    @Field({type: Types.STRING})
    get hotelBookLink(): string { return null; }
    set hotelBookLink(val: string) {}

    // 供应商logo
    @Field({type: Types.STRING})
    get logo(): string { return null; }
    set logo(val: string) {}

    // 是否使用
    @Field({type: Types.BOOLEAN})
    get isInUse(): boolean { return true; }
    set isInUse(val: boolean) {}

    // 拉取关联订单使用的供应商key
    @Field({type: Types.STRING})
    get supplierKey(): string { return null; }
    set supplierKey(val: string) {}

    //所属企业
    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}
}
