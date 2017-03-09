import {Models} from '_types';
import {Staff, EStaffStatus} from '_types/staff';
import { Company } from '_types/company';
import {Table, Create, Field, Reference, ResolveRef, RemoteCall, LocalCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';
import _ = require("lodash");
import {PaginateInterface} from "common/model/interface";
let db = require("common/model").DB;

let API = require("common/api");

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

    @RemoteCall()
    async getStaffs(options?: any): Promise<PaginateInterface<Staff>> {
        let staffs =  await API.department.getStaffs({id: this.id,options: options});

        return staffs;
    }

    @RemoteCall()
    async getAllStaffNum(): Promise<number>{
        if(!this.isLocal){
            API.require('department');
            await API.onload();
        }
        return API.department.getAllStaffNum({departmentId: this.id});
        
    }

    @RemoteCall()
    getChildDepartments(): Promise<Department[]> {
        return Models.department.find({where : {parentId: this.id, companyId: this.company.id}, order: [['createdAt', 'desc']]});
    }

    async getChildDeptStaffNum(): Promise<any> {
        let self = this;

        // console.log(this.id , this.company.id)
        let pagers = await Models.department.find({where : {parentId: this.id, companyId: self['companyId']}, order: [['createdAt', 'desc']]});

        let childDepartments = [];
        childDepartments.push.apply(childDepartments, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            childDepartments.push.apply(childDepartments, nextPager);
        }

        let ps = childDepartments.map( async (d) => {
            d['staffNum'] = await d.getStaffNum();
            return d;
        });

        let departments = await Promise.all(ps);
        return departments;
    }

    @RemoteCall()
    async getAllChildren() :Promise<Array<Department>>{
        let self = this;
        let pager = await Models.department.find({ where: {parentId: self.id, companyId: self['companyId']}});
        let children = [];
        let allChildren = [];
        do {
            if (pager) {
                pager.forEach( (d) => {
                    children.push(d);
                });
                pager = await pager.nextPage();
            }
        } while(pager && pager.hasNextPage());
        //查找children所有的子元素
        for(let i, ii=children.length; i<ii; i++) {
            allChildren = _.concat(allChildren, await children[i].getAllChildren());
        }
        return allChildren;
    }

    //获取当前部门以及所有子部门下的总人数
    @RemoteCall()
    async getStaffNum(): Promise<number> {
        let self = this;
        let total = 0;
        let sql = `
         select count(1) as total from (
            select distinct staff_id from department.staff_departments as SD
            where SD.department_id in 
                (
                    with RECURSIVE d as 
                    ( 
                    select d1.id from department.departments as d1 where id = '${self.id}' AND deleted_at is null
                    union all  
                    select d2.id from department.departments as d2
                    inner join d on d.id = d2.parent_id
                    where d2.deleted_at is null
                    ) select id from d
                ) AND SD.deleted_at is null
        ) as R;
        `
        let ret = await db.query(sql);
        return ret[0][0]['total'] as number;
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