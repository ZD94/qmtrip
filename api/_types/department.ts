let uuid = require("node-uuid");
import { regApiType } from 'common/api/helper';
import { Models } from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { ModelObject, Table, Field, Types, ResolveRef, Reference } from 'common/model';
import { Create } from 'common/model.client';

@Table(Models.department, "department.")
@regApiType('API.')
export class Department extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(): Department { return null; }

    @Field({type: Types.UUID, defaultValue: uuid['v1']})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get code(): string {return null}
    set code(code: string){}

    @Field({type: Types.STRING(50)})
    get name(): string {return null}
    set name(name: string){}

    @Field({type: Types.BOOLEAN})
    get isDefault(): boolean {return null}
    set isDefault(isDefault: boolean){}

    @Reference({type: Types.UUID})
    getParent(id?:string): Promise<Department> {
        return Models.department.get(id);
    }

    getChildUnit(): Promise<Department[]> {
        return Models.department.find({parentId: this.id});
    }

    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({departmentId: this.id});
    }

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
}