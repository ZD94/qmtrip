'use strict';

import { Models } from 'api/_types';
import { Types, Values } from 'common/model';
import {Table, Create, Field, Reference, ResolveRef} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Supplier } from 'api/_types/company';
import { Staff } from 'api/_types/staff';

@Table(Models.staffSupplierInfo, 'staff.')
export class StaffSupplierInfo extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): StaffSupplierInfo { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    // 用户供应商网站登录信息
    @Field({ type: Types.JSONB})
    get loginInfo() : any { return null};
    set loginInfo(val: any) {}

    // 是否经过验证
    @Field({type: Types.BOOLEAN})
    get isVerified(): boolean { return true; }
    set isVerified(val: boolean) {}

    //所属员工
    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }
    set staff(val: Staff) {}

    //所属供应商
    @ResolveRef({type: Types.UUID}, Models.supplier)
    get supplier(): Supplier { return null; }
    set supplier(val: Supplier) {}
}
