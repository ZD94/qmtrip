import { regApiType } from 'common/api/helper';
import { Models, ModelObject } from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

@Table("department.Department")
@regApiType('API.')
export class Department implements ModelObject{
    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

    @Field({type: Types.UUID})
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

    @ResolveRef({type: Types.UUID}, Models.company.get)
    get company(): Company { return null; }

    @Field({type: Types.DATE})
    get createAt(): Date {return null}
    set createAt(createAt: Date){}

    @Update(Models.department.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.department.destroy)
    destroy(): Promise<void> { return null; }
}