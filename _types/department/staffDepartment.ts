/**
 * Created by wangyali on 2017/01/13.
 */

import { Types, Values } from 'common/model';
import { Table, Create, Field } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';

@Table(Models.staffDepartment, "department.")
export class StaffDepartment extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): StaffDepartment { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    //员工id
    @Field({type: Types.UUID})
    get staffId(): string { return null; }
    set staffId(val: string) {}

    //通知id
    @Field({type: Types.UUID})
    get departmentId(): string { return null; }
    set departmentId(val: string) {}

}

