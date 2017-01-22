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

    async getStaffs(options?: any): Promise<any[]> {
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};

        let pagers = await Models.staffDepartment.find({where: {departmentId: this.id}, order: [['createdAt', 'desc']]});

        let departmentStaffs = [];
        departmentStaffs.push.apply(departmentStaffs, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            departmentStaffs.push.apply(departmentStaffs, nextPager);
            // pagers = nextPager;
        }

        let ids =  await Promise.all(departmentStaffs.map(function(t){
            return t.staffId;
        }));

        options.where.staffStatus = EStaffStatus.ON_JOB;
        options.where.companyId = this.company.id;
        options.where.id = {$in: ids};
        if(!options.order){
            options.order = [['createdAt', 'desc']];
        }
        let staffs = await Models.staff.find(options);
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
        let pagers = await Models.department.find({where : {parentId: this.id, companyId: this.company.id}, order: [['createdAt', 'desc']]});

        let childDepartments = [];
        childDepartments.push.apply(childDepartments, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            childDepartments.push.apply(childDepartments, nextPager);
            // pagers = nextPager;
        }

        let departments =  await Promise.all(childDepartments.map(async function(d){
            let dStaffs = await d.getStaffs();
            if(dStaffs && dStaffs.length > 0){
                d["staffNum"] = dStaffs.length;
            }
            return d;
        }))
        return departments;
    }
    
    async getOneDepartmentStructure(): Promise<any> {
        let department = await Models.department.get(this.id);
        let departmentStructure = new Array();
        let m = new Array();
        let pagers = await Models.department.find({where: {companyId: this.company.id}, order: [['created_at','desc']]});

        let departments = [];
        departments.push.apply(departments, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            departments.push.apply(departments, nextPager);
            // pagers = nextPager;
        }

        for (let i = 0; i < departments.length; i++) {
            let t = departments[i];
            t["childDepartments"] = new Array();
            m.push(t);
        }

        dg(department, m);
        departmentStructure.push(department);

        return departmentStructure;
    }

}

//p为父菜单节点。o为菜单列表
function dg(p, o) {
    for (var i = 0; i < o.length; i++) {
        var t = o[i];
        if (t.parent && t.parent.id == p.id) {
            if(!p.childDepartments){
                p.childDepartments = [];
            }
            p.childDepartments.push(t);
            dg(t, o);
        }
    }
}