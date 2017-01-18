import {Models} from 'api/_types';
import {Staff, EStaffStatus} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import {Table, Create, Field, Reference, ResolveRef, RemoteCall, LocalCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';
import {RemoteInfo} from "dgram";

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

    @ResolveRef({type: Types.UUID}, Models.department)
    get parent(): Department { return null; }
    set parent(val: Department) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get manager(): Staff { return null; }
    set manager(val: Staff) {}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}

    async getStaffs(): Promise<any[]> {
        let departmentStaffs = await Models.staffDepartment.find({where: {departmentId: this.id}, order: [['createdAt', 'desc']]});

        let ids =  await Promise.all(departmentStaffs.map(function(t){
            return t.staffId;
        }));
        let staffs = await Models.staff.find({where : {id: {$in: ids}, companyId: this.company.id, staffStatus: EStaffStatus.ON_JOB}, order: [['createdAt', 'desc']]});
        let result =  await Promise.all(staffs.map(async function(s){
            let travelPolicy = await s.getTravelPolicy();
            s["travelPolicy"] = travelPolicy;
            return s;
        }))
        return result;
    }

    @RemoteCall()
    getChildDepartments(): Promise<Department[]> {
        return Models.department.find({where : {parentId: this.id, companyId: this.company.id}, order: [['createdAt', 'desc']]});
    }

    async getChildDeptStaffNum(): Promise<any> {
        let childDepartments = await Models.department.find({where : {parentId: this.id, companyId: this.company.id}, order: [['createdAt', 'desc']]});

        let departments =  await Promise.all(childDepartments.map(async function(d){
            let dStaffs = await d.getStaffs();
            if(dStaffs && dStaffs.length > 0){
                d["staffNum"] = dStaffs.length;
            }
            return d;
        }))
        return departments;
    }

}