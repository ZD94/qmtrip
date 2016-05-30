import { regApiType } from 'common/api/helper';
import {Models, isBrowser} from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Table, Create, Field, Reference, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';

@Table(Models.department, "department.")
export class Department extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Department { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get code(): string {return null}
    set code(code: string){}

    @Field({type: Types.STRING(50)})
    get name(): string {return null}
    set name(name: string){}

    @Field({type: Types.BOOLEAN})
    get isDefault(): boolean {return false}
    set isDefault(isDefault: boolean){}

    @Reference({type: Types.UUID})
    getParent(id?:string): Promise<Department> {
        return Models.department.get(id);
    }

    getChildUnit(): Promise<Department[]> {
        let query  = {where: {parentId: this.id}}
        return Models.department.find(query);
    }

    getStaffs(): Promise<Staff[]> {
        let query  = {where: {companyId: this.company.id, departmentId: this.id}}
        return Models.staff.find(query);
    }

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {} 
}